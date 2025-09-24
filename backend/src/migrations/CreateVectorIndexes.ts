import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVectorIndexes1703000000000 implements MigrationInterface {
  name = 'CreateVectorIndexes1703000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure pgvector extension is installed
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // Create HNSW indexes for fast vector similarity search
    // HNSW (Hierarchical Navigable Small World) is the most efficient for similarity search

    // Index for title vectors
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_title_vector_hnsw
      ON incidents
      USING hnsw (title_vector vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);

    // Index for description vectors
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_description_vector_hnsw
      ON incidents
      USING hnsw (description_vector vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);

    // Create IVFFlat indexes as backup for larger datasets
    // IVFFlat is better for very large datasets (millions of vectors)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_title_vector_ivfflat
      ON incidents
      USING ivfflat (title_vector vector_cosine_ops)
      WITH (lists = 100)
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_description_vector_ivfflat
      ON incidents
      USING ivfflat (description_vector vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Create partial indexes for non-null vectors only
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_title_vector_partial
      ON incidents (title_vector)
      WHERE title_vector IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_description_vector_partial
      ON incidents (description_vector)
      WHERE description_vector IS NOT NULL
    `);

    // Composite indexes for filtered vector searches
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_category_title_vector
      ON incidents (category, title_vector)
      WHERE title_vector IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incidents_datetime_title_vector
      ON incidents (datetime, title_vector)
      WHERE title_vector IS NOT NULL
    `);

    // Update table statistics for query planner
    await queryRunner.query(`ANALYZE incidents`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_datetime_title_vector`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_category_title_vector`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_description_vector_partial`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_title_vector_partial`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_description_vector_ivfflat`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_title_vector_ivfflat`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_description_vector_hnsw`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_incidents_title_vector_hnsw`);
  }
}