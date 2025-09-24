import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { IngestionService } from './ingestion.service'
import { IngestionProcessor } from './ingestion.processor'
import { IngestionController } from './ingestion.controller'
import { IncidentsModule } from '../incidents/incidents.module'
import { EntitiesModule } from '../entities/entities.module'

import { UkPoliceService } from '../../services/uk-police.service';
import { TflService } from '../../services/tfl.service';
import { GdeltService } from '../../services/gdelt.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ingestion'
    }),
    IncidentsModule,
    EntitiesModule
  ],
  controllers: [IngestionController],
  providers: [IngestionService, IngestionProcessor, UkPoliceService, TflService, GdeltService],
  exports: [IngestionService]
})
export class IngestionModule {}