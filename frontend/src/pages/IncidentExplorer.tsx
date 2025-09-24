import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getIncidents, semanticSearch, getDateRange } from '../services/api';

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  location: {
    latitude: number;
    longitude: number;
    street?: string;
    outcome_status?: string;
  };
  date: string;
  source: string;
  confidence_score?: number;
  entities?: string[];
}

interface FilterState {
  search: string;
  severity: string[];
  category: string[];
  dateFrom: string;
  dateTo: string;
  source: string[];
}

const IncidentExplorer: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ min: '', max: '', suggested_start: '', suggested_end: '' });

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: [],
    category: [],
    dateFrom: '',
    dateTo: '',
    source: []
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });

  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  const severityColorsDark = {
    low: 'bg-green-900/20 text-green-400 border-green-800/30',
    medium: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/30',
    high: 'bg-orange-900/20 text-orange-400 border-orange-800/30',
    critical: 'bg-red-900/20 text-red-400 border-red-800/30'
  };

  useEffect(() => {
    fetchDateRange();
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (filters.search.trim() && filters.search.length > 2) {
      performSemanticSearch();
    } else {
      fetchIncidents();
    }
  }, [filters, pagination.page]);

  const fetchDateRange = async () => {
    try {
      const response = await getDateRange();
      const range = response.data;
      setDateRange(range);

      if (!filters.dateFrom && !filters.dateTo) {
        setFilters(prev => ({
          ...prev,
          dateFrom: range.suggested_start || range.min,
          dateTo: range.suggested_end || range.max
        }));
      }
    } catch (error) {
      console.error('Failed to fetch date range:', error);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        startDate: filters.dateFrom,
        endDate: filters.dateTo,
        severity: filters.severity.length ? filters.severity.join(',') : undefined,
        category: filters.category.length ? filters.category.join(',') : undefined,
        source: filters.source.length ? filters.source.join(',') : undefined
      };

      const response = await getIncidents(params);
      const data = response.data;

      const incidents = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setIncidents(incidents);
      setFilteredIncidents(incidents);
      setPagination(prev => ({
        ...prev,
        total: data.total || incidents.length
      }));
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      setIncidents([]);
      setFilteredIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const performSemanticSearch = async () => {
    setLoading(true);
    try {
      const response = await semanticSearch(filters.search, pagination.limit);
      const data = response.data;

      const incidents = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setIncidents(incidents);
      setFilteredIncidents(incidents);
      setPagination(prev => ({
        ...prev,
        total: incidents.length
      }));
    } catch (error) {
      console.error('Failed to perform semantic search:', error);
      setIncidents([]);
      setFilteredIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleArrayFilter = (key: 'severity' | 'category' | 'source', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getUniqueValues = (field: string) => {
    if (!Array.isArray(incidents) || incidents.length === 0) return [];

    return [...new Set(incidents.map(incident => {
      if (field === 'severity') return incident.severity;
      if (field === 'category') return incident.category;
      if (field === 'source') return incident.source;
      return '';
    }).filter(Boolean))];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Incident Explorer</h1>
          <p className="text-slate-400">Search, filter, and analyze security incidents in real-time</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-900/30 border border-purple-800/30 rounded-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search incidents using natural language..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 hover:text-purple-400 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={fetchIncidents}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-purple-600/20 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-600/30 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="border-t border-gray-700/50 pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Severity Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
                  <div className="space-y-2">
                    {['low', 'medium', 'high', 'critical'].map(severity => (
                      <label key={severity} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.severity.includes(severity)}
                          onChange={() => toggleArrayFilter('severity', severity)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400 capitalize">{severity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {getUniqueValues('category').map(category => (
                      <label key={category} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.category.includes(category)}
                          onChange={() => toggleArrayFilter('category', category)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Source Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Source</label>
                  <div className="space-y-2">
                    {getUniqueValues('source').map(source => (
                      <label key={source} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.source.includes(source)}
                          onChange={() => toggleArrayFilter('source', source)}
                          className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-400">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-slate-400">
            {loading ? (
              <span>Loading incidents...</span>
            ) : (
              <span>
                Showing {Array.isArray(filteredIncidents) ? filteredIncidents.length : 0} of {pagination.total} incidents
                {filters.search && ` for "${filters.search}"`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 hover:text-purple-400 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Incidents List */}
        <div className="bg-gray-900/30 border border-purple-800/30 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : !Array.isArray(filteredIncidents) || filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <p>No incidents found matching your criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {Array.isArray(filteredIncidents) && filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-6 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{incident.title}</h3>
                      <p className="text-slate-400 mb-3">{truncateText(incident.description)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${severityColorsDark[incident.severity]}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <button className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(incident.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {incident.location.street || `${incident.location.latitude}, ${incident.location.longitude}`}
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {incident.category}
                    </div>
                    <div>
                      Source: {incident.source}
                    </div>
                    {incident.confidence_score && (
                      <div>
                        Confidence: {(incident.confidence_score * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-slate-400">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-purple-800/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedIncident.title}</h2>
                  <div className="flex items-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm border ${severityColorsDark[selectedIncident.severity]}`}>
                      {selectedIncident.severity.toUpperCase()}
                    </span>
                    <span className="text-slate-400">{selectedIncident.category}</span>
                    <span className="text-slate-400">{formatDate(selectedIncident.date)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <p className="text-slate-300 leading-relaxed">{selectedIncident.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Location</h3>
                    <div className="space-y-2 text-slate-300">
                      {selectedIncident.location.street && (
                        <p><strong>Address:</strong> {selectedIncident.location.street}</p>
                      )}
                      <p><strong>Coordinates:</strong> {selectedIncident.location.latitude}, {selectedIncident.location.longitude}</p>
                      {selectedIncident.location.outcome_status && (
                        <p><strong>Outcome:</strong> {selectedIncident.location.outcome_status}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Metadata</h3>
                    <div className="space-y-2 text-slate-300">
                      <p><strong>Source:</strong> {selectedIncident.source}</p>
                      <p><strong>ID:</strong> {selectedIncident.id}</p>
                      {selectedIncident.confidence_score && (
                        <p><strong>Confidence Score:</strong> {(selectedIncident.confidence_score * 100).toFixed(1)}%</p>
                      )}
                      {selectedIncident.entities && selectedIncident.entities.length > 0 && (
                        <div>
                          <strong>Entities:</strong>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedIncident.entities.map((entity, idx) => (
                              <span key={idx} className="px-2 py-1 bg-purple-900/20 text-purple-400 rounded text-sm">
                                {entity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentExplorer;
