/**
 * API-specific types for external data sources
 */

// UK Police API Types
export interface UKPoliceAPIResponse {
  category: string
  location_type: string
  location: {
    latitude: string
    longitude: string
    street: {
      id: number
      name: string
    }
  }
  context: string
  outcome_status?: {
    category: string
    date: string
  }
  persistent_id: string
  id: number
  location_subtype: string
  month: string
}

export interface UKPoliceCrimeCategory {
  url: string
  name: string
}

// TfL API Types
export interface TfLLineStatus {
  id: string
  name: string
  modeName: string
  disruptions: TfLDisruption[]
  created: string
  modified: string
  lineStatuses: {
    statusSeverity: number
    statusSeverityDescription: string
    reason: string
    created: string
    validityPeriods: {
      fromDate: string
      toDate: string
      isNow: boolean
    }[]
  }[]
}

export interface TfLDisruption {
  category: string
  type: string
  categoryDescription: string
  description: string
  summary: string
  additionalInfo: string
  created: string
  lastUpdate: string
}

export interface TfLAccidentStats {
  id: string
  lat: number
  lon: number
  location: string
  date: string
  severity: string
  borough: string
  casualties: number
}

// GDELT API Types
export interface GDELTEvent {
  globaleventid: string
  day: string
  monthyear: string
  year: string
  fractiondate: number
  actor1code: string
  actor1name: string
  actor1countrycode: string
  actor2code: string
  actor2name: string
  actor2countrycode: string
  isrootevent: number
  eventcode: string
  eventbasecode: string
  eventrootcode: string
  quadclass: number
  goldsteinscale: number
  nummentions: number
  numsources: number
  numarticles: number
  avgtone: number
  actor1geo_type: number
  actor1geo_fullname: string
  actor1geo_countrycode: string
  actor1geo_adm1code: string
  actor1geo_lat: number
  actor1geo_long: number
  actor2geo_type: number
  actor2geo_fullname: string
  actor2geo_countrycode: string
  actor2geo_adm1code: string
  actor2geo_lat: number
  actor2geo_long: number
  actiongeo_type: number
  actiongeo_fullname: string
  actiongeo_countrycode: string
  actiongeo_adm1code: string
  actiongeo_lat: number
  actiongeo_long: number
  dateadded: string
  sourceurl: string
}

// Generic API Response Types
export interface APIResponse<T> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface PaginatedAPIResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasNext: boolean
  hasPrev: boolean
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

// Request/Response types for our internal API
export interface CreateCaseFileRequest {
  title: string
  description?: string
  incidents: string[]
  entities: string[]
  tags: string[]
}

export interface UpdateCaseFileRequest {
  title?: string
  description?: string
  incidents?: string[]
  entities?: string[]
  tags?: string[]
  status?: "draft" | "active" | "closed"
}

export interface SimilaritySearchRequest {
  incidentId: string
  limit?: number
  threshold?: number
}

export interface SimilaritySearchResponse {
  incidents: {
    incident: any // Will be properly typed
    similarity: number
  }[]
  query: {
    incidentId: string
    threshold: number
  }
}