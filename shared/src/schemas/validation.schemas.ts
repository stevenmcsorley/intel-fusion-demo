/**
 * Zod validation schemas for runtime type checking
 */

import { z } from "zod"

// Location Schema
export const LocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional()
})

// Entity Reference Schema
export const EntityRefSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["person", "location", "organisation", "object"]),
  name: z.string().min(1),
  confidence: z.number().min(0).max(1).optional()
})

// Incident Schema
export const IncidentSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["crime", "tfl", "news"]),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  source: z.string().min(1),
  location: LocationSchema,
  datetime: z.string().datetime(),
  entities: z.array(EntityRefSchema),
  metadata: z.record(z.unknown()).optional()
})

// Entity Schema
export const EntitySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["person", "location", "organisation", "object"]),
  name: z.string().min(1),
  linkedIncidents: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

// Case File Schema
export const CaseFileSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  incidents: z.array(z.string()),
  entities: z.array(z.string()),
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string()),
  status: z.enum(["draft", "active", "closed"])
})

// Search Query Schema
export const SearchQuerySchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    types: z.array(z.enum(["crime", "tfl", "news"])).optional(),
    categories: z.array(z.string()).optional(),
    dateRange: z.object({
      start: z.string().datetime(),
      end: z.string().datetime()
    }).optional(),
    location: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      radius: z.number().positive()
    }).optional(),
    entities: z.array(z.string()).optional()
  }),
  limit: z.number().positive().max(1000).default(50),
  offset: z.number().nonnegative().default(0)
})

// API Request Schemas
export const CreateCaseFileRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  incidents: z.array(z.string()).min(1),
  entities: z.array(z.string()),
  tags: z.array(z.string().min(1)).max(20)
})

export const UpdateCaseFileRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  incidents: z.array(z.string()).optional(),
  entities: z.array(z.string()).optional(),
  tags: z.array(z.string().min(1)).max(20).optional(),
  status: z.enum(["draft", "active", "closed"]).optional()
})

export const SimilaritySearchRequestSchema = z.object({
  incidentId: z.string().min(1),
  limit: z.number().positive().max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7)
})

// Graph Query Schema
export const GraphQuerySchema = z.object({
  entityId: z.string().min(1),
  depth: z.number().positive().max(5).default(2),
  types: z.array(z.enum(["person", "location", "organisation", "object"])).optional(),
  incidentTypes: z.array(z.enum(["crime", "tfl", "news"])).optional()
})

// UK Police API Response Schema
export const UKPoliceAPIResponseSchema = z.object({
  category: z.string(),
  location_type: z.string(),
  location: z.object({
    latitude: z.string(),
    longitude: z.string(),
    street: z.object({
      id: z.number(),
      name: z.string()
    })
  }),
  context: z.string(),
  outcome_status: z.object({
    category: z.string(),
    date: z.string()
  }).optional(),
  persistent_id: z.string(),
  id: z.number(),
  location_subtype: z.string(),
  month: z.string()
})

// Validation helper functions
export const validateIncident = (data: unknown) => IncidentSchema.parse(data)
export const validateEntity = (data: unknown) => EntitySchema.parse(data)
export const validateCaseFile = (data: unknown) => CaseFileSchema.parse(data)
export const validateSearchQuery = (data: unknown) => SearchQuerySchema.parse(data)
export const validateCreateCaseFileRequest = (data: unknown) => CreateCaseFileRequestSchema.parse(data)
export const validateGraphQuery = (data: unknown) => GraphQuerySchema.parse(data)

// Type inference from schemas
export type ValidatedIncident = z.infer<typeof IncidentSchema>
export type ValidatedEntity = z.infer<typeof EntitySchema>
export type ValidatedCaseFile = z.infer<typeof CaseFileSchema>
export type ValidatedSearchQuery = z.infer<typeof SearchQuerySchema>
export type ValidatedCreateCaseFileRequest = z.infer<typeof CreateCaseFileRequestSchema>
export type ValidatedGraphQuery = z.infer<typeof GraphQuerySchema>