import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private openai: OpenAI;
  private embeddingCache = new Map<string, number[]>();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured, using mock embeddings');
    }
  }

  /**
   * Generate embeddings for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return null;
    }

    // Check cache first
    const cacheKey = this.createCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    try {
      if (this.openai) {
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small', // Faster and cheaper than ada-002
          input: text.substring(0, 8191), // Max token limit
          encoding_format: 'float',
        });

        const embedding = response.data[0].embedding;

        // Cache the result
        this.embeddingCache.set(cacheKey, embedding);

        return embedding;
      } else {
        // Fallback to deterministic mock embeddings for development
        return this.generateMockEmbedding(text);
      }
    } catch (error) {
      this.logger.error(`Failed to generate embedding for text: ${error.message}`);
      return this.generateMockEmbedding(text);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const validTexts = texts.filter(text => text && text.trim().length > 0);

    if (validTexts.length === 0) {
      return [];
    }

    // Check cache for existing embeddings
    const results: number[][] = new Array(validTexts.length);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    validTexts.forEach((text, index) => {
      const cacheKey = this.createCacheKey(text);
      if (this.embeddingCache.has(cacheKey)) {
        results[index] = this.embeddingCache.get(cacheKey);
      } else {
        uncachedIndices.push(index);
        uncachedTexts.push(text.substring(0, 8191));
      }
    });

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      try {
        if (this.openai) {
          // Process in batches of 100 (API limit)
          const batchSize = 100;
          for (let i = 0; i < uncachedTexts.length; i += batchSize) {
            const batch = uncachedTexts.slice(i, i + batchSize);
            const batchIndices = uncachedIndices.slice(i, i + batchSize);

            const response = await this.openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: batch,
              encoding_format: 'float',
            });

            response.data.forEach((embeddingData, batchIndex) => {
              const originalIndex = batchIndices[batchIndex];
              const embedding = embeddingData.embedding;
              results[originalIndex] = embedding;

              // Cache the result
              const cacheKey = this.createCacheKey(validTexts[originalIndex]);
              this.embeddingCache.set(cacheKey, embedding);
            });
          }
        } else {
          // Fallback to mock embeddings
          uncachedIndices.forEach((index, i) => {
            results[index] = this.generateMockEmbedding(uncachedTexts[i]);
          });
        }
      } catch (error) {
        this.logger.error(`Failed to generate batch embeddings: ${error.message}`);
        // Fallback to mock embeddings
        uncachedIndices.forEach((index, i) => {
          results[index] = this.generateMockEmbedding(uncachedTexts[i]);
        });
      }
    }

    return results;
  }

  /**
   * Generate a deterministic mock embedding for development/testing
   */
  private generateMockEmbedding(text: string): number[] {
    // Create a deterministic embedding based on text content
    const hash = this.simpleHash(text);
    const embedding = new Array(384); // Using smaller dimension for faster processing

    for (let i = 0; i < embedding.length; i++) {
      // Use text hash to create deterministic but varied embeddings
      embedding[i] = Math.sin(hash * (i + 1)) * 0.5;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Create a cache key for text
   */
  private createCacheKey(text: string): string {
    return `emb_${this.simpleHash(text.toLowerCase().trim())}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clear embedding cache (useful for memory management)
   */
  clearCache(): void {
    this.embeddingCache.clear();
    this.logger.log('Embedding cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.embeddingCache.size,
      memoryUsage: this.embeddingCache.size * 384 * 8, // Approximate bytes
    };
  }
}