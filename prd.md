# Analyst Fusion Dashboard (Palantir-lite) — London Crime Demo

## 1. Overview

We are building a demo application that mimics an intelligence fusion dashboard similar to high-end systems like Palantir Gotham, Foundry, or FBI/NCA fusion centers. The system ingests multiple open/public data sources, extracts entities, links them, and visualises relationships over maps, graphs, and timelines.

**The goal is to demonstrate how analysts could fuse disparate data into a single investigative environment.**

### Core Capabilities:
- Ingest & unify data from disparate feeds (crime reports, transport incidents, news, etc.)
- Extract and link entities (people, places, organisations, objects) using NLP
- Explore incidents visually via interactive maps, timelines, and graph networks
- Search semantically using vector similarity + keyword search
- Build "cases" linking multiple events for export and sharing
- Detect anomalies and patterns across different data sources

**Target demo:** London crime analysis using only public, legal datasets.

---

## 2. Core Data Sources

### UK Police API (Street Crime Data)
- **Base URL:** https://data.police.uk/docs/
- **Key Endpoints:** 
  - `/crimes-street/all-crime?lat={lat}&lng={lng}&date=YYYY-MM`
  - Categories, outcomes, stop & search data
- **Data Granularity:** 
  - Location: lat/lng coordinates
  - Categories: burglary, robbery, drugs, violence, etc.
  - Outcomes: investigation ongoing, suspect charged, no further action, etc.
- **Fields:** `id`, `category`, `location`, `date`, `outcome_status`, `context`

### TfL API (Transport for London Incidents/Disruptions)
- **Base URL:** https://api.tfl.gov.uk/
- **Key Endpoints:**
  - `/Line/Mode/{modes}/Status` → line disruptions
  - `/AccidentStats/{year}` → road collision data
- **Data Granularity:** 
  - Timestamp, location, severity level
  - Affected lines/roads, disruption duration
- **Fields:** `id`, `datetime`, `location`, `mode`, `severity`, `description`, `affected_routes`

### GDELT News API (Global Database of Events, Language & Tone)
- **Base URL:** https://blog.gdeltproject.org/gdelt-2-0-our-global-world-in-realtime/
- **Purpose:** Event/news queries with location context
- **Use Case:** Correlating incident "bursts" with news context (e.g., gang activity, protests, major events)
- **Data Scope:** Worldwide events restricted to UK/London for demo
- **Fields:** `date`, `location`, `actor1`, `actor2`, `eventCode`, `headline`, `tone`, `themes`

---

## 3. Data Ingestion & Normalisation

### Ingestion Layer
- **Message Queue:** Kafka (or Redis Streams for lightweight demo) to ingest crime, TfL, and GDELT feeds
- **Data Storage:** PostgreSQL for raw and processed data
- **Streaming Processing:** Node.js or Python workers consuming message streams

### Normalisation & Enrichment Pipeline
1. **Entity Extraction:** 
   - Use spaCy/HuggingFace transformers for NLP processing
   - Extract: people, places, organisations, incident types
   - Assign unique entity IDs (e.g., "Location_1234", "Person_567")

2. **Geo-normalisation:** 
   - Convert all location data to PostGIS format for mapping
   - Standardise address formats and coordinates

3. **Vector Embeddings:**
   - Generate semantic embeddings using SentenceTransformers
   - Store in pgvector for similarity search capabilities

---

## 4. Core User Workflows

- **Crime Explorer:** Query incidents by area/date, filter by category, view on interactive map
- **Entity Linking:** Select incident → show linked entities (e.g., "Camden Market", "Met Police", "Knife Robbery")
- **Timeline Analysis:** Cluster incidents around key dates (e.g., spikes in burglary during holidays)
- **Vector Search:** "Find incidents similar to this robbery" → show others with similar modus operandi
- **Case Builder:** Analyst saves a bundle of incidents, entities, and timeline into a case file for sharing/export
- **Anomaly Detection:** Highlight unusual patterns or spikes in specific categories/locations

---

## 5. Backend APIs (TypeScript with Strong Typing)

### Key Types

**Incident**
```ts
interface Incident {
  id: string;
  type: "crime" | "tfl" | "news";
  title: string;
  description?: string;
  category?: string;
  source: string;
  location: { lat: number; lng: number; address?: string };
  datetime: string;
  entities: EntityRef[];
}
```

**Entity**
```ts
interface Entity {
  id: string;
  type: "person" | "location" | "organisation" | "object";
  name: string;
  linkedIncidents: string[];
}
```

**TimelineCluster**
```ts
interface TimelineCluster {
  date: string;
  incidents: Incident[];
}
```

### Example Endpoints

```
GET /incidents?lat,lng,radius,dateRange
GET /entities/{id}
GET /timeline?entityId=xyz
POST /cases
```

### API Endpoints

```typescript
// Core incident queries
GET /incidents?lat,lng,radius,dateRange → returns filtered incidents
GET /entities/{id} → entity details + linked incidents  
GET /timeline?entityId=xyz → time-sequenced incidents for entity
POST /cases → save a "case file" with selected incidents

// Advanced search
POST /search/similar {incidentId} → vector similarity search
GET /search/entities?query=string → entity search
POST /search/graph → graph traversal queries
```

### Performance & Caching
- **Frontend:** TanStack Query for request batching & cache invalidation
- **Backend:** ETags support for efficient refetching  
- **API Design:** REST + GraphQL hybrid for flexibility
- **Deduplication:** Smart caching layer to prevent redundant API calls

---

## 6. Frontend UX

**Framework:** React + TypeScript + TanStack Query + D3/Cytoscape.js + Mapbox

### Key Views:

1. **Dashboard Home**
   - Map of London with crime hotspots (heatmap visualization)
   - Timeline of recent incidents by category
   - Quick search bar (search entity, location, category)
   - Key metrics and statistics overview

2. **Incident Explorer** 
   - Filterable list + interactive map with clustering
   - Advanced filters: crime type, date range, area, severity
   - Click incident → open details with entity links and related events
   - Side-by-side list and map view

3. **Entity Graph**
   - Interactive network visualization: entities connected via incidents
   - Hover to expand neighbourhood connections
   - Filter by entity type, relationship strength
   - Export graph as image or data

4. **Timeline View**
   - Clustered events across time with zoom capabilities
   - Multi-layer timeline showing different data sources
   - Pattern detection and anomaly highlighting

5. **Case Builder**
   - Drag/drop incidents from other views
   - Build comprehensive case files with timeline
   - Add annotations and analyst notes
   - Export to JSON/CSV/PDF formats

---

## 7. Advanced Features

### Vector Search
- **Implementation:** Embed incident descriptions using sentence-transformers
- **Storage:** pgvector or Milvus for high-performance similarity search
- **Endpoint:** `POST /search/similar {incidentId}` 
- **Use Case:** "Find incidents similar to this robbery" → surface similar modus operandi

### Graph Queries
- **Complex Traversals:** "Show all robberies within 500m of Camden Market linked to gang-related news"
- **Relationship Analysis:** Multi-hop entity connections across data sources
- **Pattern Detection:** Identify recurring networks and suspicious clusters

### Anomaly Detection (Stretch Goal)
- **Statistical Models:** Detect unusual spikes in category/location combinations
- **Real-time Alerts:** Flag anomalies to analysts via dashboard notifications
- **Historical Baselines:** Compare current patterns against historical norms

---

## 8. Security & Authentication

### Authentication & Authorization
- **SSO Provider:** Keycloak with OpenID Connect (OIDC)
- **User Roles:** 
  - **Analyst:** Query data, create cases, export reports
  - **Admin:** User management, system configuration, audit access
- **Session Management:** JWT tokens with refresh capability

### Privacy & Compliance
- **Data Sources:** Public datasets only (UK Police API, TfL, GDELT)
- **Audit Trail:** All API calls and user actions logged for compliance
- **Data Privacy:** Differential privacy for any aggregated data exports
- **GDPR Compliance:** Data retention policies and user data rights

---

## 9. Technical Stack (Dockerised)

All services containerised; orchestrated with Docker Compose (dev) and Kubernetes (prod-ready).

### Core Services

- **Frontend:** React + Vite (Node.js 20 build → served via Nginx)
- **API Backend:** Node.js 20 + TypeScript (NestJS or Fastify)
- **Auth:** Keycloak 21 (Quarkus distribution)
- **Streaming:** Redpanda (Kafka-compatible)
- **Database (Relational + Vectors + GIS):** PostgreSQL 15 + pgvector + PostGIS
- **Graph Database:** Neo4j 5
- **Search Engine:** OpenSearch 2.x
- **Object Store:** MinIO (S3-compatible)
- **Embedding / NLP Service:** FastAPI + Hugging Face sentence-transformers
- **Cache:** Redis 7

### Observability
- **Prometheus** (metrics collection)
- **Grafana** (dashboards and visualization)
- **Loki** (centralized logging)

---

## 10. Demo Workflow (London Use-Case)

### Sample Investigation Scenario:

1. **Initial Query:** Analyst searches for crimes in Camden area (June 2025)
2. **Data Fusion:** Dashboard shows:
   - Robbery incidents from UK Police API
   - TfL accidents and disruptions nearby
   - GDELT news headlines: "Gang activity reported near Camden Market"
3. **Entity Analysis:** Entity graph reveals multiple robberies linked to same tube station
4. **Pattern Recognition:** Timeline shows incident clustering around specific dates/times
5. **Case Building:** Analyst creates case file with 8 linked incidents across data sources
6. **Intelligence Product:** Export comprehensive case report to share with colleagues

### Key Demo Value Points:
- **Multi-source correlation:** Shows power of fusing disparate data streams
- **Entity relationship mapping:** Reveals hidden connections between incidents  
- **Temporal analysis:** Identifies patterns invisible in single data sources
- **Actionable intelligence:** Produces exportable case files for operational use