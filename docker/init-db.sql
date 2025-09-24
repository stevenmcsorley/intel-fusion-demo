-- Initialize PostgreSQL database with required extensions

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create additional indexes and functions if needed
-- This will be populated as we develop the application

-- Log the successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Intel Fusion database initialized successfully with PostGIS and pgvector extensions';
END $$;
