/**
 * Core domain types for the Intel Fusion Dashboard
 */

export type IncidentType = "crime" | "tfl" | "news"
export type EntityType = "person" | "location" | "organisation" | "object"
export type CrimeCategory = "burglary" | "robbery" | "drugs" | "violence" | "theft" | "antisocial" | "other"
export type OutcomeStatus = "investigation_ongoing" | "suspect_charged" | "no_further_action" | "court_case" | "fine" | "caution"

export interface Location {
  lat: number
  lng: number
  address?: string
}

export interface EntityRef {
  id: string
  type: EntityType
  name: string
  confidence?: number
}

export interface Incident {
  id: string
  type: IncidentType
  title: string
  description?: string
  category?: string
  source: string
  location: Location
  datetime: string
  entities: EntityRef[]
  metadata?: Record<string, unknown>
}

export interface Entity {
  id: string
  type: EntityType
  name: string
  linkedIncidents: string[]
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface TimelineCluster {
  date: string
  incidents: Incident[]
  count: number
}

export interface CaseFile {
  id: string
  title: string
  description?: string
  incidents: string[]
  entities: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
  status: "draft" | "active" | "closed"
}

export interface SearchQuery {
  query?: string
  filters: {
    types?: IncidentType[]
    categories?: string[]
    dateRange?: {
      start: string
      end: string
    }
    location?: {
      lat: number
      lng: number
      radius: number
    }
    entities?: string[]
  }
  limit: number
  offset: number
}

export interface SearchResult {
  incidents: Incident[]
  total: number
  aggregations: {
    byType: Record<IncidentType, number>
    byCategory: Record<string, number>
    byDate: Record<string, number>
  }
}

export interface GraphQuery {
  entityId: string
  depth: number
  types?: EntityType[]
  incidentTypes?: IncidentType[]
}

export interface GraphNode {
  id: string
  type: EntityType | IncidentType
  label: string
  properties: Record<string, unknown>
}

export interface GraphEdge {
  source: string
  target: string
  type: "linked_to" | "occurred_at" | "involves"
  weight: number
  properties: Record<string, unknown>
}

export interface GraphResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: {
    totalNodes: number
    totalEdges: number
    maxDepth: number
  }
}