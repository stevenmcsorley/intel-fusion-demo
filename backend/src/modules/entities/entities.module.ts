import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { Entity, Incident } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Entity, Incident])],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
