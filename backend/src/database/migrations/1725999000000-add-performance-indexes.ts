import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1725999000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1725999000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes for common query patterns
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_datetime"
      ON "incidents" ("datetime" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_category"
      ON "incidents" ("category");
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_source"
      ON "incidents" ("source");
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_datetime_category"
      ON "incidents" ("datetime" DESC, "category");
    `);

    // Improve location-based queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_location_gin"
      ON "incidents" USING gin ("location");
    `);

    // Add index for outcome status queries
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_outcome_status"
      ON "incidents" USING gin ("outcome_status");
    `);

    // Add partial index for incidents with vectors (for semantic search)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_incidents_title_vector_not_null"
      ON "incidents" ("id")
      WHERE "title_vector" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_title_vector_not_null"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_outcome_status"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_location_gin"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_datetime_category"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_source"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_category"`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "idx_incidents_datetime"`);
  }
}