import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { Incident } from '../../entities';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident]),
    EmbeddingsModule
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
