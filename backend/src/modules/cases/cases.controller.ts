import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from '../../dto/create-case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() createCaseDto: CreateCaseDto) {
    return this.casesService.create(createCaseDto);
  }
}