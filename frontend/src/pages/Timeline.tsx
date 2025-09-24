import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react';
import { getIncidents, getDateRange } from '../services/api';

interface Incident {
  id: string;
  title: string;
  description?: string;
  category: string;
  source: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  datetime: string;
  outcome_status?: {
    category: string;
    date: string;
  };
}

interface TimelineEvent {
  id: string;
  title: string;
  datetime: Date;
  category: string;
  source: string;
  location: string;
  severity: string;
  incidents: Incident[];
}

interface FilterState {
  startDate: string;
  endDate: string;
  category: string[];
  source: string[];
  severity: string[];
  search: string;
}

const Timeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [dateRange, setDateRange] = useState<{ min: string; max: string } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    startDate: '',
    endDate: '',
    category: [],
    source: [],
    severity: [],
    search: ''
  });

  const [visualization, setVisualization] = useState({
    zoom: 1,
    showFilters: false,
    timeRange: 'day', // hour, day, week, month
    grouping: 'location' // location, category, source
  });

  useEffect(() => {
    initializeDateRange();
  }, []);

  useEffect(() => {
    if (dateRange) {
      loadTimelineData();
    }
  }, [dateRange, filters]);

  useEffect(() => {
    filterEvents();
  }, [events, filters]);

  const initializeDateRange = async () => {
    try {
      const response = await getDateRange();
      const range = response.data;

      // Check if range has valid min and max values
      if (range && range.min && range.max) {
        setDateRange(range);
        setFilters(prev => ({
          ...prev,
          startDate: range.min.split('T')[0],
          endDate: range.max.split('T')[0]
        }));
      } else {
        throw new Error('Invalid date range data received');
      }
    } catch (error) {
      console.error('Failed to get date range:', error);
      // Set default range
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setDateRange({
        min: oneMonthAgo.toISOString(),
        max: now.toISOString()
      });
      setFilters(prev => ({
        ...prev,
        startDate: oneMonthAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      }));
    }
  };

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 1000
      };

      const response = await getIncidents(params);
      const incidents = Array.isArray(response.data.data) ? response.data.data :
                       Array.isArray(response.data) ? response.data : [];

      // Group incidents into timeline events
      const timelineEvents = groupIncidentsIntoEvents(incidents);
      setEvents(timelineEvents);
    } catch (error) {
      console.error('Failed to load timeline data:', error);
      setError('Failed to load timeline data');
    } finally {
      setLoading(false);
    }
  };

  const groupIncidentsIntoEvents = (incidents: Incident[]): TimelineEvent[] => {
    const grouped = new Map<string, TimelineEvent>();

    incidents.forEach(incident => {
      const date = new Date(incident.datetime);
      const severity = getSeverityFromCategory(incident.category);

      // Create grouping key based on selected grouping method and time range
      let groupKey = '';
      switch (visualization.grouping) {
        case 'location':
          groupKey = `${getTimeKey(date)}-${incident.location.address || 'Unknown Location'}`;
          break;
        case 'category':
          groupKey = `${getTimeKey(date)}-${incident.category}`;
          break;
        case 'source':
          groupKey = `${getTimeKey(date)}-${incident.source}`;
          break;
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          id: groupKey,
          title: getEventTitle(incident, visualization.grouping),
          datetime: date,
          category: incident.category,
          source: incident.source,
          location: incident.location.address || 'Unknown Location',
          severity: severity,
          incidents: []
        });
      }

      grouped.get(groupKey)!.incidents.push(incident);
    });

    // Sort events by datetime and update titles with incident counts
    return Array.from(grouped.values())
      .map(event => ({
        ...event,
        title: `${event.title} (${event.incidents.length} incident${event.incidents.length > 1 ? 's' : ''})`
      }))
      .sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  };

  const getTimeKey = (date: Date): string => {
    switch (visualization.timeRange) {
      case 'hour':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      case 'day':
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
      case 'month':
        return `${date.getFullYear()}-${date.getMonth()}`;
      default:
        return date.toDateString();
    }
  };

  const getEventTitle = (incident: Incident, grouping: string): string => {
    switch (grouping) {
      case 'location':
        return incident.location.address || 'Unknown Location';
      case 'category':
        return incident.category.replace(/-/g, ' ').toUpperCase();
      case 'source':
        return incident.source;
      default:
        return incident.title;
    }
  };

  const getSeverityFromCategory = (category: string): string => {
    const severityMap: Record<string, string> = {
      'violent-crime': 'critical',
      'burglary': 'high',
      'robbery': 'high',
      'theft-from-the-person': 'medium',
      'vehicle-crime': 'medium',
      'anti-social-behaviour': 'low',
      'criminal-damage-arson': 'medium',
      'drugs': 'medium',
      'possession-of-weapons': 'high',
      'public-order': 'low',
      'shoplifting': 'low',
      'other-theft': 'low',
      'bicycle-theft': 'low',
      'other-crime': 'medium'
    };
    return severityMap[category] || 'medium';
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter(event =>
        filters.category.includes(event.category)
      );
    }

    // Apply source filter
    if (filters.source.length > 0) {
      filtered = filtered.filter(event =>
        filters.source.includes(event.source)
      );
    }

    // Apply severity filter
    if (filters.severity.length > 0) {
      filtered = filtered.filter(event =>
        filters.severity.includes(event.severity)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'category' | 'source' | 'severity', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const getUniqueValues = (field: 'category' | 'source' | 'severity'): string[] => {
    const values = events.map(event => {
      if (field === 'severity') return event.severity;
      return event[field];
    });
    return [...new Set(values)].filter(Boolean).sort();
  };

  const getSeverityColor = (severity: string): string => {
    const colors = {
      low: 'bg-green-900/20 text-green-400 border-green-800/30',
      medium: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
      high: 'bg-orange-900/20 text-orange-400 border-orange-800/30',
      critical: 'bg-red-900/20 text-red-400 border-red-800/30'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Timeline Analysis</h1>
              <p className="text-slate-400">Clustered events across time with zoom capabilities</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVisualization(prev => ({ ...prev, showFilters: !prev.showFilters }))}
                className="flex items-center gap-2 px-4 py-2 bg-purple-900/20 text-purple-400 rounded-lg border border-purple-800/30 hover:bg-purple-900/30 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {visualization.showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={loadTimelineData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 text-blue-400 rounded-lg border border-blue-800/30 hover:bg-blue-900/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
              <div className="text-2xl font-bold text-white">{filteredEvents.length}</div>
              <div className="text-sm text-slate-400">Timeline Events</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
              <div className="text-2xl font-bold text-white">
                {filteredEvents.reduce((sum, event) => sum + event.incidents.length, 0)}
              </div>
              <div className="text-sm text-slate-400">Total Incidents</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
              <div className="text-2xl font-bold text-white">
                {getUniqueValues('category').length}
              </div>
              <div className="text-sm text-slate-400">Categories</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800/50">
              <div className="text-2xl font-bold text-white">
                {Math.round((filteredEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length / filteredEvents.length) * 100) || 0}%
              </div>
              <div className="text-sm text-slate-400">High/Critical</div>
            </div>
          </div>

          {/* Filters Panel */}
          {visualization.showFilters && (
            <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-800/30 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Search Events
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Search by title, location, or category..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Time Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Time Grouping
                  </label>
                  <select
                    value={visualization.timeRange}
                    onChange={(e) => setVisualization(prev => ({ ...prev, timeRange: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="hour">Hourly</option>
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>

                {/* Event Grouping */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Event Grouping
                  </label>
                  <select
                    value={visualization.grouping}
                    onChange={(e) => setVisualization(prev => ({ ...prev, grouping: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="location">By Location</option>
                    <option value="category">By Category</option>
                    <option value="source">By Source</option>
                  </select>
                </div>

                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Categories
                  </label>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {getUniqueValues('category').map(category => (
                      <button
                        key={category}
                        onClick={() => toggleArrayFilter('category', category)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          filters.category.includes(category)
                            ? 'bg-purple-900/30 text-purple-300 border-purple-800/50'
                            : 'bg-gray-800 text-slate-400 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {category.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Severity
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['low', 'medium', 'high', 'critical'].map(severity => (
                      <button
                        key={severity}
                        onClick={() => toggleArrayFilter('severity', severity)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          filters.severity.includes(severity)
                            ? getSeverityColor(severity)
                            : 'bg-gray-800 text-slate-400 border-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {severity.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-2" />
              <p className="text-slate-400">Loading timeline data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2">
              <div className="bg-gray-900/30 rounded-lg border border-gray-800/30 p-4">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Timeline ({filteredEvents.length} events)
                </h2>

                <div className="space-y-4 max-h-96 overflow-y-auto" ref={timelineRef}>
                  {filteredEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className={`relative border-l-4 pl-6 pb-4 cursor-pointer transition-all ${
                        selectedEvent?.id === event.id
                          ? 'border-purple-500 bg-purple-900/10'
                          : getSeverityColor(event.severity).includes('green') ? 'border-green-500'
                          : getSeverityColor(event.severity).includes('yellow') ? 'border-yellow-500'
                          : getSeverityColor(event.severity).includes('orange') ? 'border-orange-500'
                          : 'border-red-500'
                      } hover:bg-gray-800/30`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="absolute -left-2 top-2 w-4 h-4 rounded-full bg-gray-950 border-2 border-current"></div>

                      <div className="mb-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-white line-clamp-2">{event.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded border ml-2 ${getSeverityColor(event.severity)}`}>
                            {event.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{formatDateTime(event.datetime)}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                        <span>{event.category.replace(/-/g, ' ')}</span>
                        <span>{event.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div>
              <div className="bg-gray-900/30 rounded-lg border border-gray-800/30 p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Event Details</h2>

                {selectedEvent ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-white mb-2">{selectedEvent.title}</h3>
                      <p className="text-sm text-slate-400">{formatDateTime(selectedEvent.datetime)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Severity</div>
                        <span className={`inline-block px-2 py-1 text-xs rounded border ${getSeverityColor(selectedEvent.severity)}`}>
                          {selectedEvent.severity.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-slate-400">Category</div>
                        <div className="text-white">{selectedEvent.category.replace(/-/g, ' ')}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Source</div>
                        <div className="text-white">{selectedEvent.source}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Location</div>
                        <div className="text-white">{selectedEvent.location}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-2">Related Incidents ({selectedEvent.incidents.length})</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedEvent.incidents.map(incident => (
                          <div key={incident.id} className="bg-gray-800/50 rounded p-2 border border-gray-700/50">
                            <div className="text-sm text-white">{incident.title}</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(incident.datetime).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400">Select an event from the timeline to view details</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;