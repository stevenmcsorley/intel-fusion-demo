# Analyst Fusion Dashboard - London Crime Demo

A demo intelligence-analysis environment that mimics capabilities of high-end fusion systems like Palantir Gotham. This system ingests multiple public data sources, extracts entities, links them, and visualizes relationships over maps, graphs, and timelines.

![Dashboard](/dash.png "Dashboard")

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development environment**
   ```bash
   # Start all services with Docker
   npm run docker:dev
   
   # Or run locally (requires local PostgreSQL)
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/api/docs

## 🏗️ Architecture

### Stack
- **Frontend**: React + TypeScript + Vite + TanStack Query
- **Backend**: Node.js + TypeScript + NestJS
- **Database**: PostgreSQL + PostGIS + pgvector
- **Visualization**: Mapbox + Cytoscape.js + D3
- **Infrastructure**: Docker Compose

### Project Structure
```
intel-fusion-demo/
├── frontend/          # React frontend application
├── backend/           # NestJS API server  
├── shared/            # Shared TypeScript types and utilities
├── docker/            # Docker configuration files
├── docs/              # Additional documentation
├── prd.md             # Product Requirements Document
└── STYLE_GUIDE.md     # Development guidelines
```

## 📊 Data Sources & Ingestion

### Available Data Sources
- **UK Police API**: Street crime data for all London boroughs
- **Transport for London (TfL)**: Transport incidents and disruptions
- **GDELT**: Global news events and context

### Triggering Data Ingestion

#### 1. Police Data API Ingestion (All London Boroughs)

Ingest crime data from the UK Police API covering all 32 London boroughs + City of London:

```bash
# Trigger ingestion via API endpoint
curl -X POST http://localhost:3001/api/data/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "source": "police-api",
    "areas": "all-london-boroughs",
    "date_range": "last-12-months"
  }'
```

#### 2. Bulk Data Import

Import data from CSV files:

```bash
# Place CSV files in the data directory
mkdir -p data/import

# Trigger CSV import
curl -X POST http://localhost:3001/api/data/import \
  -H "Content-Type: application/json" \
  -d '{
    "source": "csv",
    "file_path": "/data/import/incidents.csv"
  }'
```

#### 3. Manual Database Seeding

For development and testing:

```bash
# Access the backend container
docker exec -it intel-fusion-backend bash

# Run seeding script
npm run seed:dev
```

### London Boroughs Coverage

The system targets all 33 London administrative areas:

**Inner London (13 Boroughs):**
Camden, Greenwich, Hackney, Hammersmith and Fulham, Islington, Kensington and Chelsea, Lambeth, Lewisham, Southwark, Tower Hamlets, Wandsworth, Westminster

**Outer London (20 Boroughs):**
Barking and Dagenham, Barnet, Bexley, Brent, Bromley, Croydon, Ealing, Enfield, Haringey, Harrow, Havering, Hillingdon, Hounslow, Kingston upon Thames, Merton, Newham, Redbridge, Richmond upon Thames, Sutton, Waltham Forest

**Special Areas:**
City of London Corporation

### Data Processing Pipeline

1. **Raw Data Ingestion** - Fetch from police.uk API or import CSV
2. **Data Validation** - Clean and validate incident records
3. **Geocoding** - Convert addresses to coordinates
4. **Vector Embedding** - Generate AI embeddings for semantic search
5. **Database Storage** - Store in PostgreSQL with vector indexing

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev                    # Start both frontend and backend
npm run dev:frontend          # Start frontend only
npm run dev:backend           # Start backend only

# Building
npm run build                 # Build all packages
npm run build:frontend        # Build frontend only
npm run build:backend         # Build backend only

# Testing
npm run test                  # Run all tests
npm run test:frontend         # Run frontend tests
npm run test:backend          # Run backend tests

# Quality
npm run typecheck             # TypeScript checking
npm run lint                  # ESLint checking
```

### Docker Development

```bash
# Start all services (recommended)
npm run docker:dev

# Services included:
# - PostgreSQL with PostGIS and pgvector
# - Redis for caching
# - Backend API
# - Frontend development server
```

## 🎯 Key Features

- **Multi-source Data Fusion**: Correlates crime, transport, and news data
- **Interactive Mapping**: Incident visualization with clustering and heatmaps
- **Entity Relationship Graph**: Network visualization of connected entities
- **Timeline Analysis**: Temporal pattern detection and clustering
- **Semantic Search**: Vector similarity search for incident matching
- **Case Building**: Export investigative case files with linked incidents

## 🔐 Security

- Uses only public datasets (UK Police API, TfL, GDELT)
- Keycloak authentication for demo purposes
- All API calls audited and logged
- GDPR compliant data handling

## 🧪 Testing

- Unit tests with Jest
- Component tests with React Testing Library
- API tests with Supertest
- E2E tests with Playwright

## 📚 Documentation

- [Product Requirements Document](./prd.md)
- [Development Style Guide](./STYLE_GUIDE.md)
- [API Documentation](http://localhost:3001/api/docs) (when running)

## 🤝 Contributing

1. Follow the [Style Guide](./STYLE_GUIDE.md)
2. Write tests for new features
3. Ensure all checks pass: `npm run typecheck && npm run lint && npm run test`
4. Create meaningful commit messages

## 📄 License

MIT License - See LICENSE file for details