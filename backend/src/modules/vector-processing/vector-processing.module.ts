import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VectorProcessingController } from './vector-processing.controller';
import { VectorProcessingService } from './vector-processing.service';
import { Incident } from '../../entities/incident.entity';
import { EmbeddingsModule } from '../embeddings/embeddings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident]),
    EmbeddingsModule
  ],
  controllers: [VectorProcessingController],
  providers: [VectorProcessingService],
  exports: [VectorProcessingService],
})
export class VectorProcessingModule {}