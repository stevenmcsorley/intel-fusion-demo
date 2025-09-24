import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl, FullscreenControl } from 'react-map-gl';
import { getIncidents } from '../services/api';
import IntelligenceSidebar from '../components/IntelligenceSidebar';
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

const MapDashboard: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [mapViewport, setMapViewport] = useState({
    longitude: CONFIG.DEFAULT_MAP_CENTER.longitude,
    latitude: CONFIG.DEFAULT_MAP_CENTER.latitude,
    zoom: CONFIG.DEFAULT_MAP_ZOOM
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<any>({
    categories: [],
    startDate: null,
    endDate: null,
    searchQuery: ''
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mapControls, setMapControls] = useState({
    mapStyle: 'dark',
    showClusters: false,
    showHeatmap: false,
    showLabels: false
  });

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  // Calculate map center from incident data
  const calculateMapCenter = useCallback((incidentData: Incident[]) => {
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
  }, []);

  // Fetch incidents - load recent data by default
  useEffect(() => {
    const fetchIncidents = async () => {
      // If no filters are set and no data loaded yet, use recent 30 days
      let queryParams = {
        limit: CONFIG.DEFAULT_INCIDENT_LIMIT,
        categories: filters.categories.length > 0 ? filters.categories : undefined,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.searchQuery || undefined
      };

      // Load recent 30 days by default if no date filters
      if (!filters.startDate && !filters.endDate && !dataLoaded) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        queryParams.startDate = thirtyDaysAgo.toISOString().split('T')[0];
      }
      try {
        setLoading(true);
        const response = await getIncidents(queryParams);

        // Handle both old array format and new paginated format
        const incidentData = Array.isArray(response.data) ? response.data : response.data.incidents || [];
        setIncidents(incidentData);
        setError(null);
        setDataLoaded(true);

        // Update map viewport to center on the data
        const mapCenter = calculateMapCenter(incidentData);
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
        setIncidents([]); // Clear incidents on error
        setDataLoaded(true); // Prevent endless loading
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [filters, calculateMapCenter, dataLoaded]);

  const handleFiltersChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  const handleIncidentSelect = useCallback((incident: Incident) => {
    setSelectedIncident(incident);
    setMapViewport(prev => ({
      ...prev,
      longitude: incident.location.lng,
      latitude: incident.location.lat,
      zoom: Math.max(prev.zoom, 14)
    }));
  }, []);

  const handleMapControlsChange = useCallback((controls: any) => {
    setMapControls(controls);
  }, []);

  // Category colors
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
    'other-crime': '#85c1e9',
    'transport_disruption': '#ff8c42',
    'traffic_incident': '#e74c3c',
    'transport_anomaly': '#f39c12'
  };

  // Filter incidents for display (incidents are already filtered by API)
  const displayIncidents = useMemo(() => {
    // incidents array is already filtered by the API based on filters
    // Just limit for map performance
    return incidents.slice(0, CONFIG.MAX_MAP_MARKERS);
  }, [incidents]);

  // Calculate actual displayed count for better UX
  const displayedCount = displayIncidents.length;
  const totalFilteredCount = incidents.length;

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      {/* Intelligence Sidebar */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'w-0' : 'w-96'} flex-shrink-0`}>
        {!sidebarCollapsed && (
          <IntelligenceSidebar
            onFiltersChange={handleFiltersChange}
            onIncidentSelect={handleIncidentSelect}
            onMapControlsChange={handleMapControlsChange}
          />
        )}
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative">
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-purple-900/30">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-sm">Live Data Feed</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Quick Stats */}
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <div className="text-white font-bold">{totalFilteredCount.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs">
                    {(filters.categories.length > 0 || filters.startDate || filters.endDate) ? 'Filtered' : 'Total'} Incidents
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{displayedCount.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs">On Map</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-bold">{new Set(incidents.map(i => i.category)).size}</div>
                  <div className="text-slate-400 text-xs">Categories</div>
                </div>
                {(filters.categories.length > 0 || filters.startDate || filters.endDate) && (
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">●</div>
                    <div className="text-yellow-400 text-xs">Filtered</div>
                  </div>
                )}
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400 text-xs">API</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-blue-400 text-xs">AI</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-purple-400 text-xs">Vector DB</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="absolute inset-0 pt-20">
          {loading && (
            <div className="absolute inset-0 bg-gray-950/50 flex items-center justify-center z-20">
              <div className="bg-gray-900 rounded-lg p-6 flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                <span className="text-white">Loading intelligence data...</span>
              </div>
            </div>
          )}

          {mapboxToken ? (
            <Map
              mapboxAccessToken={mapboxToken}
              initialViewState={{
                longitude: mapViewport.longitude,
                latitude: mapViewport.latitude,
                zoom: mapViewport.zoom
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={
                mapControls.mapStyle === 'satellite'
                  ? "mapbox://styles/mapbox/satellite-v9"
                  : "mapbox://styles/mapbox/dark-v11"
              }
              onMove={(evt) => setMapViewport(evt.viewState)}
            >
              {/* Map Controls */}
              <NavigationControl position="top-right" />
              <ScaleControl position="bottom-left" />
              <FullscreenControl position="top-right" />

              {/* Incident Markers */}
              {displayIncidents.map((incident) => (
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
                    className="w-3 h-3 rounded-full cursor-pointer border-2 border-white shadow-lg hover:scale-150 transition-all duration-200"
                    style={{
                      backgroundColor: categoryColors[incident.category] || '#ff6b6b',
                      boxShadow: `0 0 10px ${categoryColors[incident.category] || '#ff6b6b'}40`,
                    }}
                  />
                </Marker>
              ))}

              {/* Selected Incident Popup */}
              {selectedIncident && (
                <Popup
                  longitude={selectedIncident.location.lng}
                  latitude={selectedIncident.location.lat}
                  onClose={() => setSelectedIncident(null)}
                  closeButton={true}
                  closeOnClick={false}
                  maxWidth="400px"
                >
                  <div className="bg-gray-950 text-white p-4 rounded-lg border border-purple-900/40 min-w-72">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white shadow-lg"
                          style={{
                            backgroundColor: categoryColors[selectedIncident.category] || '#666',
                          }}
                        />
                        <span className="text-slate-300 text-sm font-medium capitalize">
                          {selectedIncident.category.replace(/-/g, ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">#{selectedIncident.id.slice(-6)}</span>
                    </div>

                    <h4 className="font-semibold text-white text-sm mb-2 line-clamp-2">
                      {selectedIncident.title}
                    </h4>

                    {selectedIncident.description && (
                      <p className="text-slate-300 text-sm mb-3 line-clamp-3">
                        {selectedIncident.description}
                      </p>
                    )}

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="text-slate-300">{selectedIncident.location.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Source:</span>
                        <span className="text-slate-300">{selectedIncident.source}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Date:</span>
                        <span className="text-slate-300">
                          {new Date(selectedIncident.datetime).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {selectedIncident.outcome_status && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Status:</span>
                          <span className="text-green-400 capitalize">
                            {selectedIncident.outcome_status.category.replace(/-/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-purple-900/40 flex space-x-2">
                      <button className="flex-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs transition-colors">
                        Similar Cases
                      </button>
                    </div>
                  </div>
                </Popup>
              )}
            </Map>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-900">
              <div className="text-slate-400 text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <div className="text-lg mb-2">Map Unavailable</div>
                <div className="text-sm">Mapbox token not configured</div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur-sm border-t border-purple-900/30 p-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-slate-400">
                Coordinates: {mapViewport.latitude.toFixed(4)}, {mapViewport.longitude.toFixed(4)}
              </span>
              <span className="text-slate-400">
                Zoom: {mapViewport.zoom.toFixed(1)}
              </span>
              <span className="text-slate-400">
                Showing {displayedCount.toLocaleString()} of {totalFilteredCount.toLocaleString()}
                {(filters.categories.length > 0 || filters.startDate || filters.endDate) ?
                  <span className="text-yellow-400"> filtered</span> : ''
                } incidents
              </span>
              {(filters.categories.length > 0 || filters.startDate || filters.endDate) && (
                <span className="text-yellow-400 text-xs">
                  Active filters:
                  {filters.categories.length > 0 && ` ${filters.categories.length} categories`}
                  {filters.startDate && ` from ${new Date(filters.startDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}`}
                  {filters.endDate && ` to ${new Date(filters.endDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}`}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-400">Intel Fusion Platform v2.4.1</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDashboard;