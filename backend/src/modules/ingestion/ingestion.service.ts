import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { UkPoliceService } from '../../services/uk-police.service';
import { TflService } from '../../services/tfl.service';
import { GdeltService } from '../../services/gdelt.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectQueue('ingestion') private ingestionQueue: Queue,
    private readonly ukPoliceService: UkPoliceService,
    private readonly tflService: TflService,
    private readonly gdeltService: GdeltService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    // Disable automatic police data ingestion - only run TfL updates
    // Police data is updated monthly, not hourly, so no need for constant polling
    const autoIngestionEnabled = process.env.ENABLE_AUTO_INGESTION === 'true';

    if (!autoIngestionEnabled) {
      this.logger.log('Automatic police data ingestion disabled. Use manual ingestion endpoints for data updates.');
      // Still run TfL updates since transport data changes frequently
      this.logger.log('Running TfL transport data update...');
      await this.ingestionQueue.add('ingest-tfl');
      return;
    }

    this.logger.log('Running full scheduled ingestion...');
    await this.ingestionQueue.add('ingest-all');
  }

  @Cron('*/5 * * * *') // Every 5 minutes
  async handleTflFrequentUpdate() {
    // Only run frequent TFL updates if police ingestion is disabled
    const autoIngestionEnabled = process.env.ENABLE_AUTO_INGESTION === 'true';

    if (!autoIngestionEnabled) {
      this.logger.log('Running frequent TfL transport update (5min interval)...');
      await this.ingestionQueue.add('ingest-tfl');
    }
  }
}
