import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Between, SelectQueryBuilder } from 'typeorm';
import { Incident } from '../../entities';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async findAll(query: any): Promise<{ incidents: Incident[], total: number, page: number, totalPages: number }> {
    const qb: SelectQueryBuilder<Incident> = this.incidentRepository.createQueryBuilder('incident');

    // Pagination parameters
    const page = query.page ? parseInt(query.page) : 1;
    const limit = query.limit ? parseInt(query.limit) : 1000;
    const offset = (page - 1) * limit;

    // Apply pagination
    qb.skip(offset).take(limit);

    // Set default date range: yesterday to tomorrow if not specified
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const startDate = query.startDate ? new Date(query.startDate) : yesterday;
    const endDate = query.endDate ? new Date(query.endDate) : tomorrow;

    // Always apply date range filters
    qb.andWhere('incident.datetime >= :startDate', {
      startDate: startDate.toISOString()
    });
    qb.andWhere('incident.datetime <= :endDate', {
      endDate: endDate.toISOString()
    });

    // Apply category filters
    if (query.categories && Array.isArray(query.categories)) {
      qb.andWhere('incident.category IN (:...categories)', {
        categories: query.categories
      });
    }

    // Apply bounds filter for map viewport
    if (query.bounds) {
      const bounds = typeof query.bounds === 'string' ? JSON.parse(query.bounds) : query.bounds;
      if (bounds.north && bounds.south && bounds.east && bounds.west) {
        qb.andWhere("(incident.location->>'lat')::float BETWEEN :south AND :north", {
          south: parseFloat(bounds.south),
          north: parseFloat(bounds.north)
        });
        qb.andWhere("(incident.location->>'lng')::float BETWEEN :west AND :east", {
          west: parseFloat(bounds.west),
          east: parseFloat(bounds.east)
        });
      }
    }

    // Apply text search filter
    if (query.search) {
      qb.andWhere(
        '(LOWER(incident.title) LIKE LOWER(:search) OR LOWER(incident.description) LIKE LOWER(:search) OR LOWER(incident.category) LIKE LOWER(:search))',
        { search: `%${query.search}%` }
      );
    }

    // Apply type filter
    if (query.type) {
      if (Array.isArray(query.type)) {
        qb.andWhere('incident.type IN (:...types)', { types: query.type });
      } else {
        qb.andWhere('incident.type = :type', { type: query.type });
      }
    }

    // Require explicit filters: if no type or category filters, return empty
    const hasTypeFilter = query.type && (Array.isArray(query.type) ? query.type.length > 0 : true);
    const hasCategoryFilter = query.categories && Array.isArray(query.categories) && query.categories.length > 0;
    const hasSearchFilter = query.search && query.search.trim().length > 0;

    if (!hasTypeFilter && !hasCategoryFilter && !hasSearchFilter) {
      // Return empty result when no explicit filters are applied
      return {
        incidents: [],
        total: 0,
        page,
        totalPages: 0
      };
    }

    // Order by datetime desc for latest incidents
    qb.orderBy('incident.datetime', 'DESC');

    // Get total count for pagination (clone query for count)
    const countQb = qb.clone();
    const total = await countQb.getCount();

    // Execute main query with pagination
    const incidents = await qb.getMany();
    const totalPages = Math.ceil(total / limit);

    return {
      incidents,
      total,
      page,
      totalPages
    };
  }

  async create(incidentData: Partial<Incident>): Promise<Incident> {
    const incident = this.incidentRepository.create(incidentData);
    return this.incidentRepository.save(incident);
  }

  async findByIds(ids: string[]): Promise<Incident[]> {
    return this.incidentRepository.find({ where: { id: In(ids) } });
  }

  async semanticSearch(
    query: string,
    embedding: number[],
    limit: number = 20,
    filters?: {
      categories?: string[];
      startDate?: string;
      endDate?: string;
      similarityThreshold?: number;
    }
  ): Promise<any[]> {
    const vectorString = `[${embedding.join(',')}]`;
    const similarityThreshold = filters?.similarityThreshold || 0.8;

    // Build the query with filters for better performance
    const qb = this.incidentRepository
      .createQueryBuilder('incident')
      .select([
        'incident.*',
        `(incident.title_vector <=> '${vectorString}') as similarity_score`
      ])
      .where('incident.title_vector IS NOT NULL')
      .andWhere(`(incident.title_vector <=> '${vectorString}') < :threshold`, {
        threshold: similarityThreshold
      });

    // Apply category filters
    if (filters?.categories && filters.categories.length > 0) {
      qb.andWhere('incident.category IN (:...categories)', {
        categories: filters.categories
      });
    }

    // Apply date range filters with defaults (yesterday to tomorrow)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const startDate = filters?.startDate ? new Date(filters.startDate) : yesterday;
    const endDate = filters?.endDate ? new Date(filters.endDate) : tomorrow;

    qb.andWhere('incident.datetime >= :startDate', {
      startDate: startDate.toISOString()
    });
    qb.andWhere('incident.datetime <= :endDate', {
      endDate: endDate.toISOString()
    });

    // Order by similarity and limit results
    const results = await qb
      .orderBy(`(incident.title_vector <=> '${vectorString}')`, 'ASC')
      .limit(limit)
      .getRawMany();

    return results.map(result => ({
      ...result,
      similarity_score: parseFloat(result.similarity_score)
    }));
  }

  async findSimilarIncidents(incidentId: string, limit: number = 10): Promise<any[]> {
    // Find similar incidents using vector similarity
    const incident = await this.incidentRepository.findOne({ where: { id: incidentId } });

    if (!incident?.title_vector) {
      return [];
    }

    const vectorString = `[${incident.title_vector.join(',')}]`;

    const results = await this.incidentRepository
      .createQueryBuilder('incident')
      .select([
        'incident.*',
        `(incident.title_vector <=> '${vectorString}') as similarity_score`
      ])
      .where('incident.title_vector IS NOT NULL')
      .andWhere('incident.id != :incidentId', { incidentId })
      .orderBy(`(incident.title_vector <=> '${vectorString}')`, 'ASC')
      .limit(limit)
      .getRawMany();

    return results.map(result => ({
      ...result,
      similarity_score: parseFloat(result.similarity_score)
    }));
  }

  async getTemporalAnalytics(query: any): Promise<any> {
    const qb = this.incidentRepository.createQueryBuilder('incident');

    // Set default date range: yesterday to tomorrow if not specified
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const startDate = query.startDate ? new Date(query.startDate) : yesterday;
    const endDate = query.endDate ? new Date(query.endDate) : tomorrow;

    // Always apply date range filters
    qb.andWhere('incident.datetime >= :startDate', {
      startDate: startDate.toISOString()
    });
    qb.andWhere('incident.datetime <= :endDate', {
      endDate: endDate.toISOString()
    });

    // Apply filters to analytics
    if (query.categories && Array.isArray(query.categories) && query.categories.length > 0) {
      qb.andWhere('incident.category IN (:...categories)', {
        categories: query.categories
      });
    }

    // Group by month and count incidents
    const monthlyTrends = await qb
      .select([
        "DATE_TRUNC('month', incident.datetime::timestamp) as month",
        "COUNT(*) as incident_count",
        "incident.category as category"
      ])
      .groupBy("DATE_TRUNC('month', incident.datetime::timestamp)")
      .addGroupBy("incident.category")
      .orderBy("DATE_TRUNC('month', incident.datetime::timestamp)", "ASC")
      .addOrderBy("incident_count", "DESC")
      .getRawMany();

    // Calculate monthly totals with same filters
    const qb2 = this.incidentRepository.createQueryBuilder('incident');

    // Apply same date range filters to monthly totals (using default range)
    qb2.andWhere('incident.datetime >= :startDate2', {
      startDate2: startDate.toISOString()
    });
    qb2.andWhere('incident.datetime <= :endDate2', {
      endDate2: endDate.toISOString()
    });

    // Apply same category filters to monthly totals
    if (query.categories && Array.isArray(query.categories) && query.categories.length > 0) {
      qb2.andWhere('incident.category IN (:...categories)', {
        categories: query.categories
      });
    }

    const monthlyTotals = await qb2
      .select([
        "DATE_TRUNC('month', incident.datetime::timestamp) as month",
        "COUNT(*) as total_incidents"
      ])
      .groupBy("DATE_TRUNC('month', incident.datetime::timestamp)")
      .orderBy("DATE_TRUNC('month', incident.datetime::timestamp)", "ASC")
      .getRawMany();

    return {
      monthly_trends: monthlyTrends,
      monthly_totals: monthlyTotals,
      analysis_period: {
        start: monthlyTotals[0]?.month || null,
        end: monthlyTotals[monthlyTotals.length - 1]?.month || null,
        total_months: monthlyTotals.length
      }
    };
  }

  async getThreatTrends(query: any): Promise<any> {
    const qb = this.incidentRepository.createQueryBuilder('incident');

    // Apply filters to threat analysis
    if (query.categories && Array.isArray(query.categories) && query.categories.length > 0) {
      qb.andWhere('incident.category IN (:...categories)', {
        categories: query.categories
      });
    }

    if (query.startDate) {
      qb.andWhere('incident.datetime >= :startDate', {
        startDate: new Date(query.startDate).toISOString()
      });
    }

    if (query.endDate) {
      qb.andWhere('incident.datetime <= :endDate', {
        endDate: new Date(query.endDate).toISOString()
      });
    }

    // Threat category analysis
    const threatAnalysis = await qb
      .select([
        "incident.category as threat_type",
        "COUNT(*) as incident_count",
        "COUNT(CASE WHEN incident.outcome_status IS NOT NULL THEN 1 END) as resolved_count",
        "(COUNT(CASE WHEN incident.outcome_status IS NOT NULL THEN 1 END)::float / COUNT(*) * 100) as resolution_rate"
      ])
      .groupBy("incident.category")
      .orderBy("incident_count", "DESC")
      .getRawMany();

    // Geographic distribution with same filters
    const qb2 = this.incidentRepository.createQueryBuilder('incident');

    // Apply same filters to geographic distribution
    if (query.categories && Array.isArray(query.categories) && query.categories.length > 0) {
      qb2.andWhere('incident.category IN (:...categories)', {
        categories: query.categories
      });
    }

    if (query.startDate) {
      qb2.andWhere('incident.datetime >= :startDate', {
        startDate: new Date(query.startDate).toISOString()
      });
    }

    if (query.endDate) {
      qb2.andWhere('incident.datetime <= :endDate', {
        endDate: new Date(query.endDate).toISOString()
      });
    }

    const geographicDistribution = await qb2
      .select([
        "ROUND((incident.location->>'lat')::numeric, 2) as lat_zone",
        "ROUND((incident.location->>'lng')::numeric, 2) as lng_zone",
        "COUNT(*) as incident_density"
      ])
      .groupBy("lat_zone")
      .addGroupBy("lng_zone")
      .having("COUNT(*) > 2") // Lower threshold for filtered data
      .orderBy("incident_density", "DESC")
      .limit(20)
      .getRawMany();

    return {
      threat_analysis: threatAnalysis,
      geographic_hotspots: geographicDistribution,
      summary: {
        total_threat_types: threatAnalysis.length,
        avg_resolution_rate: threatAnalysis.reduce((acc, curr) => acc + parseFloat(curr.resolution_rate || 0), 0) / threatAnalysis.length
      }
    };
  }

  async getDateRange(): Promise<any> {
    const result = await this.incidentRepository
      .createQueryBuilder('incident')
      .select([
        'MIN(incident.datetime) as min_date',
        'MAX(incident.datetime) as max_date',
        'COUNT(*) as total_records'
      ])
      .getRawOne();

    const monthlyDistribution = await this.incidentRepository
      .createQueryBuilder('incident')
      .select([
        "DATE_TRUNC('month', incident.datetime::timestamp) as month",
        "COUNT(*) as count"
      ])
      .groupBy("DATE_TRUNC('month', incident.datetime::timestamp)")
      .orderBy("month", "ASC")
      .getRawMany();

    return {
      date_range: {
        earliest: result.min_date,
        latest: result.max_date,
        total_records: parseInt(result.total_records)
      },
      monthly_distribution: monthlyDistribution,
      suggested_defaults: {
        start_date: (() => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          return yesterday.toISOString();
        })(),
        end_date: (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(23, 59, 59, 999);
          return tomorrow.toISOString();
        })()
      }
    };
  }

  async getDataQualityMetrics(query: any): Promise<any> {
    const qb = this.incidentRepository.createQueryBuilder('incident');

    // Total dataset metrics
    const totalIncidents = await qb.getCount();

    // Data completeness analysis
    const dataCompletenessMetrics = await qb
      .select([
        "COUNT(*) as total_records",
        "COUNT(incident.location) as location_complete",
        "COUNT(incident.category) as category_complete",
        "COUNT(incident.datetime) as datetime_complete",
        "COUNT(incident.outcome_status) as outcome_complete",
        "COUNT(incident.persistent_id) as persistent_id_complete",
        "COUNT(incident.description) as description_complete"
      ])
      .getRawOne();

    // Calculate completion rates
    const completionRates = {
      location: (dataCompletenessMetrics.location_complete / dataCompletenessMetrics.total_records * 100).toFixed(2),
      category: (dataCompletenessMetrics.category_complete / dataCompletenessMetrics.total_records * 100).toFixed(2),
      datetime: (dataCompletenessMetrics.datetime_complete / dataCompletenessMetrics.total_records * 100).toFixed(2),
      outcome_status: (dataCompletenessMetrics.outcome_complete / dataCompletenessMetrics.total_records * 100).toFixed(2),
      persistent_id: (dataCompletenessMetrics.persistent_id_complete / dataCompletenessMetrics.total_records * 100).toFixed(2),
      description: (dataCompletenessMetrics.description_complete / dataCompletenessMetrics.total_records * 100).toFixed(2)
    };

    // Source distribution analysis - create new query builder
    const qbSource = this.incidentRepository.createQueryBuilder('incident');
    const sourceDistribution = await qbSource
      .select([
        "incident.source as data_source",
        "COUNT(*) as record_count",
        "(COUNT(*)::float / (SELECT COUNT(*) FROM incidents) * 100) as percentage"
      ])
      .groupBy("incident.source")
      .orderBy("record_count", "DESC")
      .getRawMany();

    // Temporal coverage analysis - create new query builder
    const qbTemporal = this.incidentRepository.createQueryBuilder('incident');
    const temporalCoverage = await qbTemporal
      .select([
        "DATE_TRUNC('month', incident.datetime::timestamp) as month",
        "COUNT(*) as incident_count"
      ])
      .groupBy("DATE_TRUNC('month', incident.datetime::timestamp)")
      .orderBy("DATE_TRUNC('month', incident.datetime::timestamp)", "ASC")
      .getRawMany();

    // Geographic coverage metrics - create new query builder
    const qbGeographic = this.incidentRepository.createQueryBuilder('incident');
    const geographicCoverage = await qbGeographic
      .select([
        "COUNT(DISTINCT ROUND((incident.location->>'lat')::numeric, 3)) as unique_lat_points",
        "COUNT(DISTINCT ROUND((incident.location->>'lng')::numeric, 3)) as unique_lng_points",
        "MIN((incident.location->>'lat')::numeric) as min_latitude",
        "MAX((incident.location->>'lat')::numeric) as max_latitude",
        "MIN((incident.location->>'lng')::numeric) as min_longitude",
        "MAX((incident.location->>'lng')::numeric) as max_longitude"
      ])
      .getRawOne();

    // Data quality assessment
    const overallQualityScore = (
      parseFloat(completionRates.location) * 0.25 +
      parseFloat(completionRates.category) * 0.25 +
      parseFloat(completionRates.datetime) * 0.20 +
      parseFloat(completionRates.outcome_status) * 0.15 +
      parseFloat(completionRates.persistent_id) * 0.10 +
      parseFloat(completionRates.description) * 0.05
    ).toFixed(2);

    return {
      dataset_summary: {
        total_records: totalIncidents,
        quality_score: overallQualityScore,
        assessment_date: new Date().toISOString()
      },
      data_completeness: {
        completion_rates: completionRates,
        missing_data_analysis: {
          high_priority_missing: parseFloat(completionRates.location) < 95 || parseFloat(completionRates.category) < 95,
          outcome_tracking_coverage: parseFloat(completionRates.outcome_status),
          description_coverage: parseFloat(completionRates.description)
        }
      },
      source_distribution: sourceDistribution,
      temporal_coverage: {
        coverage_months: temporalCoverage.length,
        monthly_distribution: temporalCoverage,
        coverage_span: {
          earliest: temporalCoverage[0]?.month || null,
          latest: temporalCoverage[temporalCoverage.length - 1]?.month || null
        }
      },
      geographic_coverage: {
        coordinate_diversity: {
          unique_latitude_points: parseInt(geographicCoverage.unique_lat_points),
          unique_longitude_points: parseInt(geographicCoverage.unique_lng_points)
        },
        bounding_box: {
          north: parseFloat(geographicCoverage.max_latitude),
          south: parseFloat(geographicCoverage.min_latitude),
          east: parseFloat(geographicCoverage.max_longitude),
          west: parseFloat(geographicCoverage.min_longitude)
        }
      },
      professional_insights: {
        intelligence_standard: parseFloat(overallQualityScore) >= 90 ? 'Enterprise Grade' :
                              parseFloat(overallQualityScore) >= 80 ? 'Professional Grade' :
                              parseFloat(overallQualityScore) >= 70 ? 'Standard Grade' : 'Needs Improvement',
        recommendations: this.generateQualityRecommendations(completionRates, parseFloat(overallQualityScore))
      }
    };
  }

  private generateQualityRecommendations(completionRates: any, qualityScore: number): string[] {
    const recommendations = [];

    if (parseFloat(completionRates.location) < 95) {
      recommendations.push('Enhance geographic data validation protocols');
    }
    if (parseFloat(completionRates.outcome_status) < 50) {
      recommendations.push('Implement comprehensive case resolution tracking');
    }
    if (parseFloat(completionRates.persistent_id) < 80) {
      recommendations.push('Strengthen incident identification systems');
    }
    if (qualityScore < 85) {
      recommendations.push('Review data ingestion processes for quality improvement');
    }

    if (recommendations.length === 0) {
      recommendations.push('Data quality meets enterprise intelligence standards');
    }

    return recommendations;
  }
}
