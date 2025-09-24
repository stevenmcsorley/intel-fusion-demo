/**
 * Frontend/UI specific types
 */

import type { ReactNode } from "react"
import type { Incident, Entity, CaseFile, Location } from "./domain.types"

// Component Props Types
export interface BaseProps {
  className?: string
  children?: ReactNode
}

export interface MapProps extends BaseProps {
  incidents: Incident[]
  selectedIncident?: Incident | null
  onIncidentSelect: (incident: Incident) => void
  onLocationChange: (bounds: MapBounds) => void
  center: Location
  zoom: number
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface TimelineProps extends BaseProps {
  incidents: Incident[]
  selectedDate?: string | null
  onDateSelect: (date: string) => void
  dateRange: {
    start: string
    end: string
  }
}

export interface EntityGraphProps extends BaseProps {
  entities: Entity[]
  incidents: Incident[]
  selectedEntity?: Entity | null
  onEntitySelect: (entity: Entity) => void
  onIncidentSelect: (incident: Incident) => void
}

export interface SearchFormProps extends BaseProps {
  onSearch: (query: SearchFormData) => void
  isLoading: boolean
  initialValues?: Partial<SearchFormData>
}

export interface SearchFormData {
  query: string
  types: string[]
  categories: string[]
  dateRange: {
    start: string
    end: string
  }
  location?: {
    lat: number
    lng: number
    radius: number
  }
}

export interface CaseBuilderProps extends BaseProps {
  selectedIncidents: Incident[]
  selectedEntities: Entity[]
  onAddIncident: (incident: Incident) => void
  onRemoveIncident: (incidentId: string) => void
  onAddEntity: (entity: Entity) => void
  onRemoveEntity: (entityId: string) => void
  onSaveCase: (caseData: CreateCaseData) => void
}

export interface CreateCaseData {
  title: string
  description?: string
  tags: string[]
}

// Table/List Component Types
export interface IncidentListProps extends BaseProps {
  incidents: Incident[]
  selectedIncident?: Incident | null
  onIncidentSelect: (incident: Incident) => void
  onIncidentAction?: (action: string, incident: Incident) => void
  isLoading: boolean
}

export interface EntityListProps extends BaseProps {
  entities: Entity[]
  selectedEntity?: Entity | null
  onEntitySelect: (entity: Entity) => void
  onEntityAction?: (action: string, entity: Entity) => void
  isLoading: boolean
}

export interface CaseFileListProps extends BaseProps {
  cases: CaseFile[]
  selectedCase?: CaseFile | null
  onCaseSelect: (caseFile: CaseFile) => void
  onCaseAction?: (action: string, caseFile: CaseFile) => void
  isLoading: boolean
}

// Modal/Dialog Types
export interface ModalProps extends BaseProps {
  isOpen: boolean
  onClose: () => void
  title: string
  size?: "sm" | "md" | "lg" | "xl"
}

export interface ConfirmDialogProps extends ModalProps {
  message: string
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  variant?: "default" | "danger"
}

// Form Field Types
export type InputChange = React.ChangeEvent<HTMLInputElement>
export type TextareaChange = React.ChangeEvent<HTMLTextAreaElement>
export type SelectChange = React.ChangeEvent<HTMLSelectElement>
export type ButtonClick = React.MouseEvent<HTMLButtonElement>

// Dashboard State Types
export interface DashboardState {
  selectedIncidents: Incident[]
  selectedEntities: Entity[]
  selectedCase?: CaseFile | null
  filters: SearchFormData
  viewMode: "map" | "timeline" | "graph" | "list"
  isLoading: boolean
  error?: string | null
}

// Visualization Types
export interface HeatmapDataPoint {
  lat: number
  lng: number
  intensity: number
  data: Incident[]
}

export interface TimelineDataPoint {
  date: string
  count: number
  incidents: Incident[]
}

export interface GraphVisualizationData {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
}

export interface GraphNodeData {
  id: string
  label: string
  type: string
  size: number
  color: string
  data: Entity | Incident
}

export interface GraphEdgeData {
  source: string
  target: string
  type: string
  weight: number
  color: string
}

// Export Types
export interface ExportOptions {
  format: "json" | "csv" | "pdf"
  includeEntities: boolean
  includeTimeline: boolean
  includeMap: boolean
}

// Loading States
export interface LoadingState {
  incidents: boolean
  entities: boolean
  cases: boolean
  search: boolean
  export: boolean
}

// Error Types
export interface UIError {
  message: string
  code?: string
  details?: Record<string, unknown>
}