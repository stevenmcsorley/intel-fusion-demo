import React, { useEffect, useState, useMemo } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import { getIncidents } from '../services/api';
import SearchPanel from '../components/SearchPanel';
import IntelligencePanel from '../components/IntelligencePanel';
import DateRangeFilter from '../components/DateRangeFilter';
import CONFIG from '../constants/config';

interface Incident {
  id: string;
  type: string;
  title: string;
  description: string;
  category: string;
  source: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  datetime: string;
  outcome_status?: {
    category: string;
    date: string;
  };
  persistent_id?: string;
}

const Dashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [mapViewport, setMapViewport] = useState({
    longitude: CONFIG.DEFAULT_MAP_CENTER.longitude,
    latitude: CONFIG.DEFAULT_MAP_CENTER.latitude,
    zoom: CONFIG.DEFAULT_MAP_ZOOM
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Incident[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'search' | 'intelligence'>('overview');
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const handleSearchResults = (results: Incident[]) => {
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  const handleResultSelect = (incident: Incident) => {
    setSelectedIncident(incident);
    setMapViewport({
      longitude: incident.location.lng,
      latitude: incident.location.lat,
      zoom: 15
    });
  };

  const handleDateRangeChange = (startDate: string | null, endDate: string | null) => {
    setDateRange({ startDate, endDate });
  };

  const displayIncidents = showSearchResults ? searchResults : incidents;

  // Calculate map center from incident data
  const calculateMapCenter = (incidentData: Incident[]) => {
    if (incidentData.length === 0) return null;

    const validLocations = incidentData.filter(incident =>
      incident.location?.lat && incident.location?.lng
    );

    if (validLocations.length === 0) return null;

    const sumLat = validLocations.reduce((sum, incident) => sum + incident.location.lat, 0);
    const sumLng = validLocations.reduce((sum, incident) => sum + incident.location.lng, 0);

    return {
      latitude: sumLat / validLocations.length,
      longitude: sumLng / validLocations.length,
    };
  };

  useEffect(() => {
    // Only fetch data if we have filters applied (categories or date range)
    const hasFilters = selectedCategories.length > 0 || dateRange.startDate || dateRange.endDate;

    if (!hasFilters) {
      setLoading(false);
      setIncidents([]);
      return;
    }

    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await getIncidents({
          limit: CONFIG.DEFAULT_INCIDENT_LIMIT,
          page: 1,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
        setIncidents(response.data.incidents);
        setPagination({
          page: response.data.page,
          total: response.data.total,
          totalPages: response.data.totalPages
        });
        setError(null);

        // Update map viewport to center on the data
        const mapCenter = calculateMapCenter(response.data.incidents);
        if (mapCenter) {
          setMapViewport(prev => ({
            ...prev,
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
          }));
        }
      } catch (err) {
        setError('Failed to fetch incidents');
        console.error('Error fetching incidents:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [selectedCategories, dateRange]);

  const loadMoreIncidents = async () => {
    if (loadingMore || pagination.page >= pagination.totalPages) return;

    try {
      setLoadingMore(true);
      const response = await getIncidents({
        limit: CONFIG.DEFAULT_INCIDENT_LIMIT,
        page: pagination.page + 1,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      setIncidents(prev => [...prev, ...response.data.incidents]);
      setPagination(prev => ({
        ...prev,
        page: response.data.page
      }));
    } catch (err) {
      setError('Failed to load more incidents');
      console.error('Error loading more incidents:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const calculateBounds = (viewport: typeof mapViewport) => {
    // Calculate rough bounds based on viewport
    const latDelta = 0.01 * Math.pow(2, 12 - viewport.zoom);
    const lngDelta = 0.01 * Math.pow(2, 12 - viewport.zoom);
    return {
      north: viewport.latitude + latDelta,
      south: viewport.latitude - latDelta,
      east: viewport.longitude + lngDelta,
      west: viewport.longitude - lngDelta
    };
  };

  const categoryColors: { [key: string]: string } = {
    'anti-social-behaviour': '#ff6b6b',
    'burglary': '#4ecdc4',
    'robbery': '#45b7d1',
    'vehicle-crime': '#96ceb4',
    'violent-crime': '#ffeaa7',
    'other-theft': '#dda0dd',
    'criminal-damage-arson': '#98d8c8',
    'drugs': '#f7dc6f',
    'public-order': '#bb8fce',
    'other-crime': '#85c1e9'
  };

  // Simple clustering logic for incidents that are very close together
  const clusteredIncidents = useMemo(() => {
    if (incidents.length === 0) return [];

    const clusters: Array<{
      id: string;
      position: [number, number];
      incidents: Incident[];
      isCluster: boolean;
    }> = [];

    const processed = new Set<string>();
    const clusterRadius = CONFIG.CLUSTER_RADIUS;

    incidents.forEach(incident => {
      if (processed.has(incident.id)) return;

      const nearby = incidents.filter(other => {
        if (processed.has(other.id) || other.id === incident.id) return false;
        const distance = Math.sqrt(
          Math.pow(other.location.lat - incident.location.lat, 2) +
          Math.pow(other.location.lng - incident.location.lng, 2)
        );
        return distance < clusterRadius;
      });

      if (nearby.length > 0) {
        // Create cluster
        const allIncidents = [incident, ...nearby];
        const centerLat = allIncidents.reduce((sum, inc) => sum + inc.location.lat, 0) / allIncidents.length;
        const centerLng = allIncidents.reduce((sum, inc) => sum + inc.location.lng, 0) / allIncidents.length;

        clusters.push({
          id: `cluster-${incident.id}`,
          position: [centerLng, centerLat],
          incidents: allIncidents,
          isCluster: true
        });

        allIncidents.forEach(inc => processed.add(inc.id));
      } else {
        // Single incident
        clusters.push({
          id: incident.id,
          position: [incident.location.lng, incident.location.lat],
          incidents: [incident],
          isCluster: false
        });
        processed.add(incident.id);
      }
    });

    console.log('Clustered incidents:', clusters.length, 'from', incidents.length, 'incidents');
    return clusters;
  }, [incidents]);

  const availableCategories = useMemo(() => {
    return [...new Set(incidents.map(i => i.category))].sort();
  }, [incidents]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading intelligence data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  // Show empty state when no filters are applied
  const hasFilters = selectedCategories.length > 0 || dateRange.startDate || dateRange.endDate;
  if (!hasFilters && incidents.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                  Intel Fusion Platform
                </h1>
                <p className="text-blue-100 text-lg">
                  Enterprise Intelligence Collection & Analysis • Greater London Coverage
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">16,080+</div>
                  <div className="text-sm">Showing {pagination.total > 0 ? `of ${pagination.total.toLocaleString()}` : 'Records'}</div>
                </div>
                <div className="h-12 w-px bg-white/30"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">READY</div>
                  <div className="text-sm">System Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State Message */}
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="text-center bg-slate-800/50 rounded-xl p-12 border border-slate-700">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to Intel Fusion</h2>
              <p className="text-slate-300 text-lg mb-6">
                Select filters to start analyzing intelligence data from Greater London
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a2 2 0 012-2z" />
                  </svg>
                  Filter by Category
                </h3>
                <p className="text-slate-400 text-sm">
                  Choose from violent crime, theft, burglary, and 10+ other incident types
                </p>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-3 flex items-center">
                  <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Select Date Range
                </h3>
                <p className="text-slate-400 text-sm">
                  Analyze incidents from specific time periods for temporal analysis
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-sm mt-6">
              Apply filters using the controls above to load and visualize intelligence data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Intel Fusion Platform
              </h1>
              <p className="text-blue-100 text-lg">
                Enterprise Intelligence Collection & Analysis • Greater London Coverage
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-white/80">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{incidents.length.toLocaleString()}</div>
                <div className="text-sm">Showing {pagination.total > 0 ? `of ${pagination.total.toLocaleString()}` : 'Records'}</div>
              </div>
              <div className="h-12 w-px bg-white/30"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">LIVE</div>
                <div className="text-sm">System Status</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-black/20 rounded-xl p-1 w-fit">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'overview'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setViewMode('search')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'search'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              🧠 AI Search
            </button>
            <button
              onClick={() => setViewMode('intelligence')}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'intelligence'
                  ? 'bg-white text-blue-600 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              🎯 Intelligence
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* AI Search Panel */}
        {viewMode === 'search' && (
          <SearchPanel
            onResultSelect={handleResultSelect}
            onResultsUpdate={handleSearchResults}
          />
        )}

        {/* Intelligence Panel */}
        {viewMode === 'intelligence' && (
          <IntelligencePanel />
        )}

        {/* Overview Content */}
        {viewMode === 'overview' && (
          <>
            {/* Date Range Filter */}
            <DateRangeFilter
              onDateRangeChange={handleDateRangeChange}
              className="mb-6"
            />

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <div className="w-6 h-6 bg-blue-400 rounded-full"></div>
                </div>
                <span className="text-xs font-semibold text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                  TOTAL
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Intel Records</h3>
              <p className="text-3xl font-bold text-white mb-2">{incidents.length.toLocaleString()}</p>
              <div className="flex items-center text-green-400 text-sm">
                <span>+12.5%</span>
                <span className="ml-1 text-slate-500">vs last week</span>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <div className="w-6 h-6 bg-purple-400 rounded-full"></div>
                </div>
                <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
                  TYPES
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Threat Categories</h3>
              <p className="text-3xl font-bold text-white mb-2">
                {new Set(incidents.map(i => i.category)).size}
              </p>
              <div className="text-slate-400 text-sm">Across London</div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <div className="w-6 h-6 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-xs font-semibold text-green-400 bg-green-500/20 px-2 py-1 rounded-full">
                  SOURCES
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Data Sources</h3>
              <p className="text-3xl font-bold text-white mb-2">
                {new Set(incidents.map(i => i.source)).size}
              </p>
              <div className="text-slate-400 text-sm">APIs integrated</div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <div className="w-6 h-6 bg-orange-400 rounded-full"></div>
                </div>
                <span className="text-xs font-semibold text-orange-400 bg-orange-500/20 px-2 py-1 rounded-full">
                  TOP
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Case Resolution</h3>
              <p className="text-lg font-bold text-white mb-2">
                {incidents.length > 0 ?
                  `${((incidents.filter(i => i.outcome_status?.category).length / incidents.length) * 100).toFixed(1)}%`
                  : '0%'
                }
              </p>
              <div className="text-slate-400 text-sm">Cases resolved</div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
          <div className="relative">
            <div className="p-6 border-b border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Geospatial Intelligence Analysis</h2>
                  <p className="text-slate-400">Enterprise threat visualization • 24-month historical coverage</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span>Live Data</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                    {incidents.length} Incidents
                  </span>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400 mr-2">Filters:</span>
                {availableCategories.slice(0, 8).map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: categoryColors[category] || '#666' }}
                      />
                      <span className="capitalize">{category.replace(/-/g, ' ')}</span>
                    </div>
                  </button>
                ))}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="relative" style={{ height: '700px' }}>
              {mapboxToken ? (
                <Map
                  mapboxAccessToken={mapboxToken}
                  initialViewState={{
                    longitude: mapViewport.longitude,
                    latitude: mapViewport.latitude,
                    zoom: mapViewport.zoom
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  interactiveLayerIds={[]}
                >
                  {displayIncidents.slice(0, CONFIG.MAX_MAP_MARKERS).map((incident) => (
                    <Marker
                      key={incident.id}
                      longitude={incident.location.lng}
                      latitude={incident.location.lat}
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full cursor-pointer border border-white shadow-lg hover:scale-150 transition-transform"
                        style={{
                          backgroundColor: categoryColors[incident.category] || '#ff6b6b',
                        }}
                      />
                    </Marker>
                  ))}

                  {selectedIncident && (
                    <Popup
                      longitude={selectedIncident.location.lng}
                      latitude={selectedIncident.location.lat}
                      onClose={() => setSelectedIncident(null)}
                      closeButton={true}
                      closeOnClick={false}
                    >
                      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-2xl">
                        <h4 className="font-semibold text-white text-sm mb-2">{selectedIncident.title}</h4>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div
                              className="w-3 h-3 rounded-full mr-2"
                              style={{
                                backgroundColor: categoryColors[selectedIncident.category] || '#666',
                              }}
                            />
                            <span className="text-xs text-slate-300 capitalize">
                              {selectedIncident.category.replace(/-/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{selectedIncident.location.address}</p>
                          <p className="text-xs text-slate-500">{selectedIncident.source}</p>
                        </div>
                      </div>
                    </Popup>
                  )}
                </Map>
              ) : (
                <div className="flex items-center justify-center h-full bg-slate-800">
                  <div className="text-slate-400 text-center">
                    <div className="text-2xl mb-2">🗺️</div>
                    <div>Mapbox token not configured</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Incidents Table */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h2 className="text-2xl font-bold text-white">Intelligence Brief</h2>
                <p className="text-slate-400">Latest threat assessments and incident analysis</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Threat Classification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Case Resolution
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {displayIncidents.slice(0, 10).map((incident, index) => (
                    <tr key={incident.id} className="hover:bg-slate-700/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3 shadow-lg"
                            style={{
                              backgroundColor: categoryColors[incident.category] || '#666',
                              boxShadow: `0 0 10px ${categoryColors[incident.category] || '#666'}40`,
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-white capitalize">
                              {incident.category.replace(/-/g, ' ')}
                            </div>
                            <div className="text-xs text-slate-400">#{incident.id.slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{incident.location.address}</div>
                        <div className="text-xs text-slate-500">
                          {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                          {incident.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {new Date(incident.datetime).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          incident.outcome_status ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {incident.outcome_status ?
                            incident.outcome_status.category.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase()) :
                            'Under Investigation'
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {pagination.page < pagination.totalPages && (
              <div className="p-6 border-t border-slate-700 text-center">
                <button
                  onClick={loadMoreIncidents}
                  disabled={loadingMore}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors font-medium inline-flex items-center space-x-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Records</span>
                      <span className="text-blue-200">({pagination.total - incidents.length} remaining)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
