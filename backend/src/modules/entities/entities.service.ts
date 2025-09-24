import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entity, Incident } from '../../entities';

@Injectable()
export class EntitiesService {
  constructor(
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  findOne(id: string): Promise<Entity> {
    return this.entityRepository.findOne({ where: { id } });
  }

  async findOrCreate(entityData: Partial<Entity>): Promise<Entity> {
    let entity = await this.entityRepository.findOne({ where: { name: entityData.name, type: entityData.type } });
    if (!entity) {
      entity = this.entityRepository.create(entityData);
      await this.entityRepository.save(entity);
    }
    return entity;
  }

  create(entityData: Partial<Entity>): Promise<Entity> {
    const entity = this.entityRepository.create(entityData);
    return this.entityRepository.save(entity);
  }

  async findAll(query?: any): Promise<Entity[]> {
    const queryBuilder = this.entityRepository.createQueryBuilder('entity');

    if (query?.type) {
      queryBuilder.andWhere('entity.type = :type', { type: query.type });
    }

    if (query?.search) {
      queryBuilder.andWhere('entity.name ILIKE :search', { search: `%${query.search}%` });
    }

    return queryBuilder
      .orderBy('entity.name', 'ASC')
      .limit(query?.limit || 100)
      .getMany();
  }

  async getEntityRelationships(filters?: any): Promise<any> {
    // Get incidents with their entities based on filters
    const incidentQuery = this.incidentRepository
      .createQueryBuilder('incident')
      .leftJoinAndSelect('incident.entities', 'entity');

    // Apply date filters if provided
    if (filters?.startDate) {
      incidentQuery.andWhere('incident.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters?.endDate) {
      incidentQuery.andWhere('incident.date <= :endDate', { endDate: filters.endDate });
    }

    // Apply severity filters
    if (filters?.severity?.length) {
      incidentQuery.andWhere('incident.severity IN (:...severities)', { severities: filters.severity });
    }

    // Apply category filters
    if (filters?.category?.length) {
      incidentQuery.andWhere('incident.category IN (:...categories)', { categories: filters.category });
    }

    // Apply source filters
    if (filters?.source?.length) {
      incidentQuery.andWhere('incident.source IN (:...sources)', { sources: filters.source });
    }

    const incidents = await incidentQuery.getMany();

    // Build nodes and edges from the data
    const nodes = new Map();
    const edges = [];
    const entityConnections = new Map();

    incidents.forEach(incident => {
      // Add incident as a node
      const incidentNodeId = `incident_${incident.id}`;
      if (!nodes.has(incidentNodeId)) {
        const severity = this.getSeverityFromCategory(incident.category);
        nodes.set(incidentNodeId, {
          id: incidentNodeId,
          label: incident.title || `Incident ${incident.id.substring(0, 8)}`,
          type: 'incident',
          data: {
            id: incident.id,
            title: incident.title,
            severity: severity,
            category: incident.category,
            date: incident.datetime,
            source: incident.source
          },
          size: this.getSizeByType('incident'),
          color: this.getColorBySeverity(severity)
        });
      }

      // Add entities and their connections to the incident
      if (incident.entities) {
        incident.entities.forEach(entity => {
          const entityNodeId = `entity_${entity.id}`;

          // Add entity as a node
          if (!nodes.has(entityNodeId)) {
            nodes.set(entityNodeId, {
              id: entityNodeId,
              label: entity.name,
              type: entity.type,
              data: {
                id: entity.id,
                name: entity.name,
                type: entity.type
              },
              size: this.getSizeByType(entity.type),
              color: this.getColorByEntityType(entity.type)
            });
          }

          // Add edge between incident and entity
          const edgeId = `${incidentNodeId}-${entityNodeId}`;
          edges.push({
            id: edgeId,
            source: incidentNodeId,
            target: entityNodeId,
            type: 'contains',
            weight: 1
          });

          // Track entity co-occurrences
          if (!entityConnections.has(entity.id)) {
            entityConnections.set(entity.id, new Set());
          }

          incident.entities.forEach(otherEntity => {
            if (entity.id !== otherEntity.id) {
              entityConnections.get(entity.id).add(otherEntity.id);
            }
          });
        });
      }
    });

    // Add entity-to-entity relationships based on co-occurrence
    entityConnections.forEach((connectedEntities, entityId) => {
      connectedEntities.forEach(connectedEntityId => {
        const sourceId = `entity_${entityId}`;
        const targetId = `entity_${connectedEntityId}`;
        const edgeId = `${sourceId}-${targetId}`;

        // Avoid duplicate edges
        if (!edges.find(e =>
          (e.source === sourceId && e.target === targetId) ||
          (e.source === targetId && e.target === sourceId)
        )) {
          edges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            type: 'co_occurs',
            weight: 0.5
          });
        }
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges,
      stats: {
        totalNodes: nodes.size,
        totalEdges: edges.length,
        incidentNodes: Array.from(nodes.values()).filter(n => n.type === 'incident').length,
        entityNodes: Array.from(nodes.values()).filter(n => n.type !== 'incident').length
      }
    };
  }

  private getSizeByType(type: string): number {
    const sizes = {
      incident: 20,
      person: 15,
      location: 18,
      organisation: 16,
      object: 12,
      temporal: 14,
      threat_category: 22
    };
    return sizes[type] || 12;
  }

  private getColorBySeverity(severity: string): string {
    const colors = {
      low: '#10B981',
      medium: '#F59E0B',
      high: '#F97316',
      critical: '#EF4444'
    };
    return colors[severity] || '#6B7280';
  }

  private getSeverityFromCategory(category: string): string {
    // Map incident categories to severity levels
    const categoryToSeverity = {
      'violent-crime': 'critical',
      'burglary': 'high',
      'robbery': 'high',
      'theft-from-the-person': 'medium',
      'vehicle-crime': 'medium',
      'anti-social-behaviour': 'low',
      'criminal-damage-arson': 'medium',
      'drugs': 'medium',
      'possession-of-weapons': 'high',
      'public-order': 'low',
      'shoplifting': 'low',
      'other-theft': 'low',
      'bicycle-theft': 'low',
      'other-crime': 'medium'
    };
    return categoryToSeverity[category] || 'medium';
  }

  private getColorByEntityType(type: string): string {
    const colors = {
      person: '#8B5CF6',
      location: '#06B6D4',
      organisation: '#F59E0B',
      object: '#84CC16',
      temporal: '#EC4899',
      threat_category: '#EF4444'
    };
    return colors[type] || '#6B7280';
  }
}