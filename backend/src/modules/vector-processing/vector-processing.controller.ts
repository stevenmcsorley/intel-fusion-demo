import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { VectorProcessingService } from './vector-processing.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Controller('vector-processing')
export class VectorProcessingController {
  constructor(
    private readonly vectorProcessingService: VectorProcessingService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Process all missing embeddings in batches
   */
  @Post('process-missing')
  async processMissingEmbeddings() {
    return this.vectorProcessingService.processAllMissingEmbeddings();
  }

  /**
   * Rebuild all embeddings (useful for model upgrades)
   */
  @Post('rebuild-all')
  async rebuildAllEmbeddings() {
    return this.vectorProcessingService.rebuildAllEmbeddings();
  }

  /**
   * Get embedding statistics
   */
  @Get('stats')
  async getEmbeddingStats() {
    const [embeddingStats, cacheStats] = await Promise.all([
      this.vectorProcessingService.getEmbeddingStats(),
      this.embeddingsService.getCacheStats(),
    ]);

    return {
      embedding_coverage: embeddingStats,
      cache_performance: cacheStats,
    };
  }

  /**
   * Process embeddings for specific incident
   */
  @Post('process-incident')
  async processIncidentEmbeddings(@Body() body: { incidentId: string }) {
    await this.vectorProcessingService.updateIncidentEmbeddings(body.incidentId);
    return { success: true, message: `Embeddings updated for incident ${body.incidentId}` };
  }

  /**
   * Clear embedding cache
   */
  @Post('clear-cache')
  async clearEmbeddingCache() {
    this.embeddingsService.clearCache();
    return { success: true, message: 'Embedding cache cleared' };
  }

  /**
   * Cleanup orphaned embeddings
   */
  @Post('cleanup-orphaned')
  async cleanupOrphanedEmbeddings() {
    const cleaned = await this.vectorProcessingService.cleanupOrphanedEmbeddings();
    return { success: true, cleaned_count: cleaned };
  }

  /**
   * Test embedding generation for a sample text
   */
  @Post('test-embedding')
  async testEmbedding(@Body() body: { text: string }) {
    const startTime = Date.now();
    const embedding = await this.embeddingsService.generateEmbedding(body.text);
    const duration = Date.now() - startTime;

    return {
      success: true,
      embedding_dimension: embedding?.length || 0,
      generation_time_ms: duration,
      has_embedding: !!embedding,
    };
  }

  /**
   * Batch test embedding generation
   */
  @Post('test-batch-embedding')
  async testBatchEmbedding(@Body() body: { texts: string[] }) {
    const startTime = Date.now();
    const embeddings = await this.embeddingsService.generateBatchEmbeddings(body.texts);
    const duration = Date.now() - startTime;

    return {
      success: true,
      input_count: body.texts.length,
      output_count: embeddings.length,
      generation_time_ms: duration,
      avg_time_per_embedding: duration / embeddings.length,
    };
  }
}