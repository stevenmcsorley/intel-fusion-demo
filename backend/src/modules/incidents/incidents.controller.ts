import { Controller, Get, Post, Body, Query, Param, UseInterceptors } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  @Get()
  findAll(@Query() query: any) {
    return this.incidentsService.findAll(query);
  }

  @Post('semantic-search')
  async semanticSearch(@Body() body: {
    query: string;
    limit?: number;
    filters?: {
      categories?: string[];
      startDate?: string;
      endDate?: string;
      similarityThreshold?: number;
    }
  }) {
    // Generate proper embedding for the search query
    const embedding = await this.embeddingsService.generateEmbedding(body.query);

    if (!embedding) {
      throw new Error('Failed to generate embedding for search query');
    }

    return this.incidentsService.semanticSearch(
      body.query,
      embedding,
      body.limit,
      body.filters
    );
  }

  @Get(':id/similar')
  findSimilarIncidents(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.incidentsService.findSimilarIncidents(id, limit ? parseInt(limit) : undefined);
  }

  @Get('analytics/temporal')
  getTemporalAnalytics(@Query() query: any) {
    return this.incidentsService.getTemporalAnalytics(query);
  }

  @Get('analytics/threat-trends')
  getThreatTrends(@Query() query: any) {
    return this.incidentsService.getThreatTrends(query);
  }

  @Get('analytics/data-quality')
  getDataQualityMetrics(@Query() query: any) {
    return this.incidentsService.getDataQualityMetrics(query);
  }

  @Get('date-range')
  getDateRange() {
    return this.incidentsService.getDateRange();
  }
}
