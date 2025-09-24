import React, { useState, useEffect } from 'react';
import { getIncidents, getDateRange, getThreatTrends, getTemporalAnalytics, semanticSearch } from '../services/api';
import CONFIG from '../constants/config';

interface SidebarProps {
  onFiltersChange: (filters: any) => void;
  onIncidentSelect: (incident: any) => void;
  onMapControlsChange?: (controls: any) => void;
}

interface DateRangeData {
  date_range: {
    earliest: string;
    latest: string;
    total_records: number;
  };
  monthly_distribution: Array<{
    month: string;
    count: number;
  }>;
  suggested_defaults: {
    start_date: string;
    end_date: string;
  };
}

const IntelligenceSidebar: React.FC<SidebarProps> = ({ onFiltersChange, onIncidentSelect, onMapControlsChange }) => {
  const [expandedPanels, setExpandedPanels] = useState<Set<string>>(
    new Set(['search', 'filters', 'analytics'])
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ startDate: string | null; endDate: string | null }>({
    startDate: null,
    endDate: null
  });
  const [dateRangeData, setDateRangeData] = useState<DateRangeData | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [threatTrends, setThreatTrends] = useState<any>(null);
  const [mapControls, setMapControls] = useState({
    mapStyle: 'dark',
    showClusters: false,
    showHeatmap: false,
    showLabels: false
  });

  useEffect(() => {
    // Set default date range to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDateRange({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }, []);

  // Update analytics when filters change
  useEffect(() => {
    // Load analytics if we have date range (including default)
    if (!dateRange.startDate && !dateRange.endDate) {
      return;
    }

    const updateAnalytics = async () => {
      try {
        const filterParams = {
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        };

        const [analyticsRes, threatsRes] = await Promise.all([
          getTemporalAnalytics(filterParams),
          getThreatTrends(filterParams)
        ]);

        setAnalytics(analyticsRes.data);
        setThreatTrends(threatsRes.data);
      } catch (error) {
        console.error('Failed to update analytics:', error);
      }
    };

    // Update analytics if we have date range set
    updateAnalytics();
  }, [selectedCategories, dateRange, dateRangeData]);

  useEffect(() => {
    // Notify parent of filter changes
    onFiltersChange({
      categories: selectedCategories,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      searchQuery
    });
  }, [selectedCategories, dateRange, searchQuery, onFiltersChange]);

  const togglePanel = (panelId: string) => {
    const newExpanded = new Set(expandedPanels);
    if (newExpanded.has(panelId)) {
      newExpanded.delete(panelId);
    } else {
      newExpanded.add(panelId);
    }
    setExpandedPanels(newExpanded);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await semanticSearch(searchQuery, CONFIG.DEFAULT_SEMANTIC_SEARCH_LIMIT);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const categories = [
    'anti-social-behaviour', 'burglary', 'robbery', 'vehicle-crime',
    'violent-crime', 'other-theft', 'criminal-damage-arson', 'drugs',
    'public-order', 'other-crime', 'transport_disruption', 'traffic_incident',
    'transport_anomaly'
  ];

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

  return (
    <div className="w-96 h-full bg-gray-950 border-r border-purple-900/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-purple-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">IF</span>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Intel Fusion</h1>
            <p className="text-slate-400 text-xs">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Panel */}
        <div className="border-b border-purple-900/30">
          <button
            onClick={() => togglePanel('search')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-white font-medium">Intelligence Search</span>
            </div>
            <span className={`text-slate-400 transition-transform ${expandedPanels.has('search') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedPanels.has('search') && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search incidents..."
                  className="flex-1 px-3 py-2 bg-gray-900 border border-purple-800/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      onClick={() => onIncidentSelect(result)}
                      className="p-2 bg-gray-900 rounded cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      <div className="text-white text-sm font-medium truncate">{result.title}</div>
                      <div className="text-slate-400 text-xs">{result.category.replace(/-/g, ' ')}</div>
                      {result.similarity_score && (
                        <div className="text-green-400 text-xs">
                          {(100 - result.similarity_score * 100).toFixed(0)}% match
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters Panel */}
        <div className="border-b border-purple-900/30">
          <button
            onClick={() => togglePanel('filters')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              <span className="text-white font-medium">Filters & Controls</span>
            </div>
            <span className={`text-slate-400 transition-transform ${expandedPanels.has('filters') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedPanels.has('filters') && (
            <div className="px-4 pb-4 space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dateRange.startDate || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 bg-gray-900 border border-purple-800/50 rounded text-white text-sm"
                  />
                  <input
                    type="date"
                    value={dateRange.endDate || ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 bg-gray-900 border border-purple-800/50 rounded text-white text-sm"
                  />
                </div>
                {dateRangeData && (
                  <div className="mt-2 text-xs text-slate-400">
                    Available: {formatDate(dateRangeData.date_range.earliest)} - {formatDate(dateRangeData.date_range.latest)}
                  </div>
                )}
              </div>

              {/* Categories */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Threat Categories</label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, category]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== category));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-900 border-purple-800/50 rounded"
                      />
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColors[category] || '#666' }}
                        />
                        <span className="text-slate-300 text-sm capitalize">
                          {category.replace(/-/g, ' ')}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Panel */}
        <div className="border-b border-purple-900/30">
          <button
            onClick={() => togglePanel('analytics')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-white font-medium">Data Analytics</span>
            </div>
            <span className={`text-slate-400 transition-transform ${expandedPanels.has('analytics') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedPanels.has('analytics') && (
            <div className="px-4 pb-4 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-slate-400 text-xs">Total Records</div>
                  <div className="text-white font-bold">
                    {analytics?.monthly_totals.reduce((sum: number, month: any) => sum + parseInt(month.total_incidents), 0).toLocaleString() || '0'}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-slate-400 text-xs">
                    {(() => {
                      const monthCount = analytics?.monthly_totals.length || 0;
                      if (monthCount <= 1) return 'Time Period';
                      return monthCount > 6 ? 'Months' : 'Period';
                    })()}
                  </div>
                  <div className="text-white font-bold">
                    {(() => {
                      const monthCount = analytics?.monthly_totals.length || 0;
                      if (monthCount <= 1) {
                        const daysDiff = dateRange.startDate && dateRange.endDate ?
                          Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 :
                          0;
                        return `${daysDiff}d`;
                      }
                      return `${monthCount}mo`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Monthly Distribution Chart */}
              {analytics && analytics.monthly_totals && analytics.monthly_totals.length > 0 && (
                <div>
                  <div className="text-slate-300 text-sm font-medium mb-3">
                    Monthly Trend
                    {(selectedCategories.length > 0 || dateRange.startDate || dateRange.endDate) && (
                      <span className="text-yellow-400 text-xs ml-2">● Filtered</span>
                    )}
                  </div>
                  <div className="relative h-16 bg-gray-900 rounded-lg p-2">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#64748b" />
                          <stop offset="70%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const data = analytics.monthly_totals.slice(0, 24);
                        const maxCount = Math.max(...data.map((m: any) => parseInt(m.total_incidents)));
                        const minCount = Math.min(...data.map((m: any) => parseInt(m.total_incidents)));
                        const range = maxCount - minCount;

                        if (data.length < 2 || range === 0) return null;

                        // Create path for line
                        const linePoints = data.map((month: any, index: number) => {
                          const x = (index / (data.length - 1)) * 100;
                          const normalizedValue = range > 0 ? ((parseInt(month.total_incidents) - minCount) / range) : 0.5;
                          const y = 100 - (normalizedValue * 80 + 10); // 10% padding top/bottom
                          return `${x},${y}`;
                        }).join(' ');

                        // Create area path
                        const areaPoints = `0,100 ${linePoints} 100,100`;

                        return (
                          <g>
                            <polyline
                              points={areaPoints}
                              fill="url(#areaGradient)"
                              stroke="none"
                            />
                            <polyline
                              points={linePoints}
                              fill="none"
                              stroke="url(#lineGradient)"
                              strokeWidth="0.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {/* Data points */}
                            {data.map((month: any, index: number) => {
                              const x = (index / (data.length - 1)) * 100;
                              const normalizedValue = range > 0 ? ((parseInt(month.total_incidents) - minCount) / range) : 0.5;
                              const y = 100 - (normalizedValue * 80 + 10);
                              const isRecent = index >= data.length - 3;
                              return (
                                <circle
                                  key={month.month}
                                  cx={x}
                                  cy={y}
                                  r={isRecent ? "1.2" : "0.8"}
                                  fill={isRecent ? "#06b6d4" : "#64748b"}
                                  className="opacity-80"
                                >
                                  <title>{`${new Date(month.month).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}: ${parseInt(month.total_incidents).toLocaleString()}`}</title>
                                </circle>
                              );
                            })}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>{analytics.monthly_totals.length} months</span>
                    <span>{analytics.monthly_totals.reduce((sum: number, m: any) => sum + parseInt(m.total_incidents), 0).toLocaleString()} total</span>
                  </div>
                </div>
              )}

              {/* Threat Categories Overview */}
              {threatTrends && threatTrends.threat_analysis && threatTrends.threat_analysis.length > 0 && (
                <div>
                  <div className="text-slate-300 text-sm font-medium mb-3">
                    Threat Distribution
                    {(selectedCategories.length > 0 || dateRange.startDate || dateRange.endDate) && (
                      <span className="text-yellow-400 text-xs ml-2">● Filtered</span>
                    )}
                  </div>

                  {/* Top 5 threats as line chart */}
                  <div className="relative h-12 bg-gray-900 rounded-lg p-2 mb-3">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="threatGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="50%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const topThreats = threatTrends.threat_analysis.slice(0, 5);
                        if (topThreats.length < 2) return null;

                        const maxCount = Math.max(...topThreats.map((t: any) => parseInt(t.incident_count)));
                        const minCount = Math.min(...topThreats.map((t: any) => parseInt(t.incident_count)));
                        const range = maxCount - minCount;

                        if (range === 0) return null;

                        // Create line points
                        const linePoints = topThreats.map((threat: any, index: number) => {
                          const x = (index / (topThreats.length - 1)) * 100;
                          const normalizedValue = ((parseInt(threat.incident_count) - minCount) / range);
                          const y = 100 - (normalizedValue * 80 + 10);
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <g>
                            <polyline
                              points={linePoints}
                              fill="none"
                              stroke="url(#threatGradient)"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            {topThreats.map((threat: any, index: number) => {
                              const x = (index / (topThreats.length - 1)) * 100;
                              const normalizedValue = ((parseInt(threat.incident_count) - minCount) / range);
                              const y = 100 - (normalizedValue * 80 + 10);
                              return (
                                <circle
                                  key={threat.threat_type}
                                  cx={x}
                                  cy={y}
                                  r="1"
                                  fill={categoryColors[threat.threat_type] || '#666'}
                                  className="opacity-90"
                                >
                                  <title>{`${threat.threat_type.replace(/-/g, ' ')}: ${threat.incident_count}`}</title>
                                </circle>
                              );
                            })}
                          </g>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Compact threat list */}
                  <div className="space-y-1">
                    {threatTrends.threat_analysis.slice(0, 6).map((threat: any, index: number) => {
                      const total = threatTrends.threat_analysis.reduce((sum: number, t: any) => sum + parseInt(t.incident_count), 0);
                      const percentage = total > 0 ? (threat.incident_count / total * 100) : 0;
                      return (
                        <div key={threat.threat_type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: categoryColors[threat.threat_type] || '#666' }}
                            />
                            <span className="text-slate-300 text-xs capitalize truncate">
                              {threat.threat_type.replace(/-/g, ' ')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-white text-xs font-medium">{threat.incident_count}</span>
                            <span className="text-slate-500 text-xs ml-1">({percentage.toFixed(0)}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-2 text-xs text-slate-500 text-center">
                    {threatTrends.threat_analysis.length} categories total
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map Controls Panel */}
        <div className="border-b border-purple-900/30">
          <button
            onClick={() => togglePanel('mapcontrols')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-white font-medium">Map Controls</span>
            </div>
            <span className={`text-slate-400 transition-transform ${expandedPanels.has('mapcontrols') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedPanels.has('mapcontrols') && (
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const newControls = { ...mapControls, mapStyle: 'satellite' };
                    setMapControls(newControls);
                    onMapControlsChange?.(newControls);
                  }}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    mapControls.mapStyle === 'satellite'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => {
                    const newControls = { ...mapControls, mapStyle: 'dark' };
                    setMapControls(newControls);
                    onMapControlsChange?.(newControls);
                  }}
                  className={`px-3 py-2 rounded text-sm transition-colors ${
                    mapControls.mapStyle === 'dark'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}
                >
                  Streets
                </button>
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mapControls.showClusters}
                    onChange={(e) => {
                      const newControls = { ...mapControls, showClusters: e.target.checked };
                      setMapControls(newControls);
                      onMapControlsChange?.(newControls);
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-purple-800/50 rounded"
                  />
                  <span className="text-slate-300 text-sm">Show Clusters</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mapControls.showHeatmap}
                    onChange={(e) => {
                      const newControls = { ...mapControls, showHeatmap: e.target.checked };
                      setMapControls(newControls);
                      onMapControlsChange?.(newControls);
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-purple-800/50 rounded"
                  />
                  <span className="text-slate-300 text-sm">Show Heatmap</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={mapControls.showLabels}
                    onChange={(e) => {
                      const newControls = { ...mapControls, showLabels: e.target.checked };
                      setMapControls(newControls);
                      onMapControlsChange?.(newControls);
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-900 border-purple-800/50 rounded"
                  />
                  <span className="text-slate-300 text-sm">Show Labels</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* System Status Panel */}
        <div>
          <button
            onClick={() => togglePanel('status')}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-medium">System Status</span>
            </div>
            <span className={`text-slate-400 transition-transform ${expandedPanels.has('status') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {expandedPanels.has('status') && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Data Sources</span>
                <span className="text-green-400 text-sm">● Online</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">AI Processing</span>
                <span className="text-green-400 text-sm">● Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm">Last Update</span>
                <span className="text-slate-400 text-sm">2 min ago</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Platform Version 2.4.1
              </div>
            </div>
          )}
        </div>

        {/* Settings Section */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/settings'}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-900/50 transition-colors border border-purple-800/30 rounded-lg bg-gray-900/30"
          >
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <span className="text-white font-medium">Ingestion Settings</span>
                <p className="text-slate-400 text-xs">Configure data sources</p>
              </div>
            </div>
            <span className="text-slate-400 transition-transform">
              ▼
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceSidebar;