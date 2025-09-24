import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EntitiesService } from './entities.service';

@ApiTags('entities')
@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  // Entity relationship graph endpoints - updated

  @Get()
  @ApiOperation({ summary: 'Get all entities with optional filtering' })
  @ApiResponse({ status: 200, description: 'Entities retrieved successfully' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search entities by name' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  findAll(@Query() query: any) {
    return this.entitiesService.findAll(query);
  }

  @Get('relationships')
  @ApiOperation({ summary: 'Get entity relationships for graph visualization' })
  @ApiResponse({ status: 200, description: 'Entity relationships retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter incidents from this date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter incidents to this date' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity levels (comma-separated)' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by categories (comma-separated)' })
  @ApiQuery({ name: 'source', required: false, description: 'Filter by sources (comma-separated)' })
  getRelationships(@Query() query: any) {
    const filters = {
      startDate: query.startDate,
      endDate: query.endDate,
      severity: query.severity ? query.severity.split(',') : undefined,
      category: query.category ? query.category.split(',') : undefined,
      source: query.source ? query.source.split(',') : undefined
    };
    return this.entitiesService.getEntityRelationships(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific entity by ID' })
  @ApiResponse({ status: 200, description: 'Entity retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.entitiesService.findOne(id);
  }
}
