import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CaseFile } from '../../entities';
import { CreateCaseDto } from '../../dto/create-case.dto';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(CaseFile)
    private readonly caseFileRepository: Repository<CaseFile>,
    private readonly incidentsService: IncidentsService,
  ) {}

  async create(createCaseDto: CreateCaseDto): Promise<CaseFile> {
    const { incidentIds, ...caseFileData } = createCaseDto;
    const caseFile = this.caseFileRepository.create(caseFileData);

    if (incidentIds && incidentIds.length > 0) {
      const incidents = await this.incidentsService.findByIds(incidentIds);
      caseFile.incidents = incidents;
    }

    return this.caseFileRepository.save(caseFile);
  }
}