import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { CaseFile } from '../../entities';

import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [TypeOrmModule.forFeature([CaseFile]), IncidentsModule],
  controllers: [CasesController],
  providers: [CasesService],
})
export class CasesModule {}
