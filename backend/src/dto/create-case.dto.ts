import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  title: string;

  @IsString()
  notes: string;

  @IsArray()
  @IsOptional()
  incidentIds?: string[];
}
