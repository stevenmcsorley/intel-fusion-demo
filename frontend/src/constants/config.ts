// Application configuration constants
export const CONFIG = {
  // Data fetching limits - optimized for performance
  DEFAULT_INCIDENT_LIMIT: 1000, // Reasonable limit for initial load
  DEFAULT_SEARCH_LIMIT: 100,   // Optimized for search performance

  // Pagination settings
  INCIDENTS_PER_PAGE: 500,
  MAX_LOAD_MORE_PAGES: 10,

  // Map configuration
  DEFAULT_MAP_ZOOM: 10,
  MAX_MAP_MARKERS: 1000, // Optimized for map performance

  // Geographic defaults (London center - can be overridden by data)
  DEFAULT_MAP_CENTER: {
    latitude: 51.5074,
    longitude: -0.1278,
  },

  // Date filtering
  DEFAULT_DATE_RANGE_MONTHS: 6, // Default to last 6 months

  // UI Performance
  CLUSTER_RADIUS: 0.002, // ~200m clustering radius

  // AI Search
  DEFAULT_SEMANTIC_SEARCH_LIMIT: 30,  // Increased for better AI results
  DEFAULT_SIMILAR_INCIDENTS_LIMIT: 15, // Increased for better similarity results

  // Analytics
  MAX_MONTHLY_DISPLAY: 24, // Show up to 24 months in charts
} as const;

export default CONFIG;