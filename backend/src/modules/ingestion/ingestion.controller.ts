import { Controller, Post, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@ApiTags('ingestion')
@Controller('ingestion')
export class IngestionController {
  constructor(@InjectQueue('ingestion') private ingestionQueue: Queue) {}

  @Post('uk-police')
  @ApiOperation({ summary: 'Trigger UK Police API data ingestion' })
  @ApiResponse({ status: 201, description: 'Ingestion started successfully' })
  async triggerUKPoliceIngestion() {
    await this.ingestionQueue.add('uk-police');
    return { message: 'UK Police data ingestion started' };
  }

  @Post('tfl')
  @ApiOperation({ summary: 'Trigger TfL API data ingestion' })
  @ApiResponse({ status: 201, description: 'Ingestion started successfully' })
  async triggerTfLIngestion() {
    await this.ingestionQueue.add('tfl');
    return { message: 'TfL data ingestion started' };
  }

  @Post('gdelt')
  @ApiOperation({ summary: 'Trigger GDELT data ingestion' })
  @ApiResponse({ status: 201, description: 'Ingestion started successfully' })
  async triggerGDELTIngestion() {
    await this.ingestionQueue.add('gdelt');
    return { message: 'GDELT data ingestion started' };
  }

  @Post('all')
  @ApiOperation({ summary: 'Trigger all data source ingestion' })
  @ApiResponse({ status: 201, description: 'All ingestion processes started' })
  async triggerAllIngestion() {
    await this.ingestionQueue.add('ingest-all');
    return { message: 'All data ingestion processes started' };
  }

  @Get('status')
  @ApiOperation({ summary: 'Get ingestion queue status and statistics' })
  @ApiResponse({ status: 200, description: 'Ingestion status retrieved successfully' })
  async getIngestionStatus() {
    const waiting = await this.ingestionQueue.getWaiting();
    const active = await this.ingestionQueue.getActive();
    const completed = await this.ingestionQueue.getCompleted();
    const failed = await this.ingestionQueue.getFailed();

    return {
      queues: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length
      },
      jobs: {
        waiting: waiting.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          created: job.timestamp
        })),
        active: active.map(job => ({
          id: job.id,
          name: job.name,
          data: job.data,
          created: job.timestamp,
          progress: job.progress()
        })),
        recent_completed: completed.slice(-10).map(job => ({
          id: job.id,
          name: job.name,
          completed: job.finishedOn
        })),
        recent_failed: failed.slice(-10).map(job => ({
          id: job.id,
          name: job.name,
          failed: job.failedReason,
          error: job.stacktrace
        }))
      },
      settings: {
        auto_ingestion_enabled: process.env.ENABLE_AUTO_INGESTION === 'true'
      }
    };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get ingestion configuration' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getIngestionConfig() {
    return {
      auto_ingestion_enabled: process.env.ENABLE_AUTO_INGESTION === 'true',
      schedules: {
        full_ingestion: 'EVERY_HOUR',
        tfl_frequent: '*/5 * * * *', // Every 5 minutes
      },
      sources: {
        uk_police: {
          enabled: true,
          description: 'UK Police API - Crime and incident data',
          frequency: 'Monthly updates, on-demand ingestion'
        },
        tfl: {
          enabled: true,
          description: 'Transport for London - Real-time transport data',
          frequency: 'Every 5 minutes when auto-ingestion enabled'
        },
        gdelt: {
          enabled: true,
          description: 'GDELT - Global events and news analysis',
          frequency: 'On-demand'
        }
      }
    };
  }

  @Put('config')
  @ApiOperation({ summary: 'Update ingestion configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async updateIngestionConfig(@Body() config: any) {
    // Note: In production, this would update persistent configuration
    // For now, we'll return the current state
    return {
      message: 'Configuration update requested',
      note: 'Auto-ingestion setting is controlled by ENABLE_AUTO_INGESTION environment variable',
      current: {
        auto_ingestion_enabled: process.env.ENABLE_AUTO_INGESTION === 'true'
      }
    };
  }

  @Post('clear-failed')
  @ApiOperation({ summary: 'Clear failed jobs from queue' })
  @ApiResponse({ status: 200, description: 'Failed jobs cleared successfully' })
  async clearFailedJobs() {
    await this.ingestionQueue.clean(0, 'failed');
    return { message: 'Failed jobs cleared successfully' };
  }

  @Post('clear-completed')
  @ApiOperation({ summary: 'Clear completed jobs from queue' })
  @ApiResponse({ status: 200, description: 'Completed jobs cleared successfully' })
  async clearCompletedJobs() {
    await this.ingestionQueue.clean(0, 'completed');
    return { message: 'Completed jobs cleared successfully' };
  }
}
