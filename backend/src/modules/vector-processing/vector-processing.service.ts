import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../../entities/incident.entity';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class VectorProcessingService {
  private readonly logger = new Logger(VectorProcessingService.name);

  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Process all incidents without embeddings in batches
   */
  async processAllMissingEmbeddings(): Promise<{ processed: number; errors: number }> {
    this.logger.log('Starting batch embedding processing for all missing embeddings');

    // Find incidents without embeddings
    const incidentsWithoutEmbeddings = await this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.title_vector IS NULL OR incident.description_vector IS NULL')
      .getMany();

    this.logger.log(`Found ${incidentsWithoutEmbeddings.length} incidents needing embeddings`);

    return this.processBatchEmbeddings(incidentsWithoutEmbeddings);
  }

  /**
   * Process embeddings for specific incidents in batches
   */
  async processBatchEmbeddings(incidents: Incident[]): Promise<{ processed: number; errors: number }> {
    if (incidents.length === 0) {
      return { processed: 0, errors: 0 };
    }

    const BATCH_SIZE = 50; // Process 50 incidents at a time
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < incidents.length; i += BATCH_SIZE) {
      const batch = incidents.slice(i, i + BATCH_SIZE);

      try {
        await this.processSingleBatch(batch);
        processed += batch.length;
        this.logger.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(incidents.length / BATCH_SIZE)} - ${processed}/${incidents.length} incidents`);
      } catch (error) {
        this.logger.error(`Failed to process batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
        errors += batch.length;
      }

      // Small delay to prevent overwhelming the API/database
      await this.sleep(100);
    }

    this.logger.log(`Batch processing completed: ${processed} processed, ${errors} errors`);
    return { processed, errors };
  }

  /**
   * Process a single batch of incidents
   */
  private async processSingleBatch(incidents: Incident[]): Promise<void> {
    // Separate incidents that need title vs description embeddings
    const needsTitleEmbedding = incidents.filter(inc => !inc.title_vector && inc.title);
    const needsDescriptionEmbedding = incidents.filter(inc => !inc.description_vector && inc.description);

    // Generate embeddings in batch
    const titleTexts = needsTitleEmbedding.map(inc => inc.title);
    const descriptionTexts = needsDescriptionEmbedding.map(inc => inc.description);

    const [titleEmbeddings, descriptionEmbeddings] = await Promise.all([
      titleTexts.length > 0 ? this.embeddingsService.generateBatchEmbeddings(titleTexts) : [],
      descriptionTexts.length > 0 ? this.embeddingsService.generateBatchEmbeddings(descriptionTexts) : [],
    ]);

    // Update incidents with embeddings
    const updates: Promise<any>[] = [];

    // Update title embeddings
    needsTitleEmbedding.forEach((incident, index) => {
      if (titleEmbeddings[index]) {
        updates.push(
          this.incidentRepository.update(
            { id: incident.id },
            { title_vector: titleEmbeddings[index] }
          )
        );
      }
    });

    // Update description embeddings
    needsDescriptionEmbedding.forEach((incident, index) => {
      if (descriptionEmbeddings[index]) {
        updates.push(
          this.incidentRepository.update(
            { id: incident.id },
            { description_vector: descriptionEmbeddings[index] }
          )
        );
      }
    });

    // Execute all updates
    await Promise.all(updates);
  }

  /**
   * Update embeddings for specific incident
   */
  async updateIncidentEmbeddings(incidentId: string): Promise<void> {
    const incident = await this.incidentRepository.findOne({ where: { id: incidentId } });

    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const updates: any = {};

    if (incident.title && !incident.title_vector) {
      const titleEmbedding = await this.embeddingsService.generateEmbedding(incident.title);
      if (titleEmbedding) {
        updates.title_vector = titleEmbedding;
      }
    }

    if (incident.description && !incident.description_vector) {
      const descriptionEmbedding = await this.embeddingsService.generateEmbedding(incident.description);
      if (descriptionEmbedding) {
        updates.description_vector = descriptionEmbedding;
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.incidentRepository.update({ id: incidentId }, updates);
      this.logger.log(`Updated embeddings for incident ${incidentId}`);
    }
  }

  /**
   * Get statistics about embedding coverage
   */
  async getEmbeddingStats(): Promise<{
    total: number;
    withTitleEmbedding: number;
    withDescriptionEmbedding: number;
    missingEmbeddings: number;
  }> {
    const [
      total,
      withTitleEmbedding,
      withDescriptionEmbedding,
      missingEmbeddings
    ] = await Promise.all([
      this.incidentRepository.count(),
      this.incidentRepository.count({ where: 'title_vector IS NOT NULL' } as any),
      this.incidentRepository.count({ where: 'description_vector IS NOT NULL' } as any),
      this.incidentRepository.count({ where: 'title_vector IS NULL OR description_vector IS NULL' } as any),
    ]);

    return {
      total,
      withTitleEmbedding,
      withDescriptionEmbedding,
      missingEmbeddings,
    };
  }

  /**
   * Clean up orphaned embeddings (incidents that were deleted but embeddings remain)
   */
  async cleanupOrphanedEmbeddings(): Promise<number> {
    // This would be implemented based on your specific cleanup needs
    // For now, just log that cleanup is available
    this.logger.log('Orphaned embedding cleanup available - implement based on specific needs');
    return 0;
  }

  /**
   * Utility sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Rebuild all embeddings (useful for model upgrades)
   */
  async rebuildAllEmbeddings(): Promise<{ processed: number; errors: number }> {
    this.logger.log('Starting complete embedding rebuild');

    // Clear all existing embeddings
    await this.incidentRepository.update({}, {
      title_vector: null,
      description_vector: null,
    });

    // Process all incidents
    const allIncidents = await this.incidentRepository.find();
    return this.processBatchEmbeddings(allIncidents);
  }
}