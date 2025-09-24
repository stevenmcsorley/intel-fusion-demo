import React, { useState, useEffect } from 'react';
import { semanticSearch, getIncidents } from '../services/api';
import CONFIG from '../constants/config';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  datetime: string;
  source: string;
  similarity_score?: number;
}

interface SearchPanelProps {
  onResultSelect: (incident: SearchResult) => void;
  onResultsUpdate: (results: SearchResult[]) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onResultSelect, onResultsUpdate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'semantic' | 'filter'>('semantic');
  const [suggestions] = useState([
    'drug related crimes near Westminster',
    'burglary incidents last month',
    'violent crime patterns',
    'anti-social behaviour hotspots',
    'vehicle theft trends',
    'robbery near transport hubs'
  ]);

  const performSemanticSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await semanticSearch(searchQuery, CONFIG.DEFAULT_SEMANTIC_SEARCH_LIMIT);
      const searchResults = response.data;
      setResults(searchResults);
      onResultsUpdate(searchResults);
    } catch (error) {
      console.error('Semantic search failed:', error);
      // Fallback to regular search
      await performFilterSearch(searchQuery);
    } finally {
      setLoading(false);
    }
  };

  const performFilterSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await getIncidents({
        limit: CONFIG.DEFAULT_SEARCH_LIMIT,
        search: searchQuery
      });
      const filterResults = response.data.filter((incident: SearchResult) =>
        incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        incident.location.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setResults(filterResults);
      onResultsUpdate(filterResults);
    } catch (error) {
      console.error('Filter search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchMode === 'semantic') {
      await performSemanticSearch(query);
    } else {
      await performFilterSearch(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    onResultsUpdate([]);
  };

  return (
    <div className="space-y-6">
      {/* AI Search Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-6 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <div className="w-6 h-6 text-white">🧠</div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Intelligence Search</h2>
                <p className="text-blue-100 text-sm">Natural language threat analysis & pattern discovery</p>
              </div>
            </div>
            <div className="flex bg-black/20 rounded-lg p-1">
              <button
                onClick={() => setSearchMode('semantic')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  searchMode === 'semantic'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                🧠 AI Search
              </button>
              <button
                onClick={() => setSearchMode('filter')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  searchMode === 'filter'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                🔍 Filter Search
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                searchMode === 'semantic'
                  ? "Ask anything: 'Show me violent crimes near schools' or 'Drug incidents last week'"
                  : "Filter by keywords, category, or location"
              }
              className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm rounded-xl text-gray-900 placeholder-gray-500 border-0 focus:ring-2 focus:ring-white/50 transition-all"
            />
            <div className="absolute right-2 top-2 flex space-x-2">
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  ❌
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? '🔄' : '🔍'}
              </button>
            </div>
          </div>

          {/* Search Suggestions */}
          {!query && (
            <div className="mt-4">
              <p className="text-white/80 text-sm mb-2">Try these intelligence queries:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Search Results</h3>
                <p className="text-slate-400">
                  Found {results.length} incidents
                  {searchMode === 'semantic' && ' using AI similarity'}
                </p>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                {searchMode === 'semantic' ? '🧠 AI Powered' : '🔍 Filtered'}
              </span>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2 p-4">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => onResultSelect(result)}
                  className="group relative overflow-hidden bg-slate-700/50 hover:bg-slate-600/70 border border-slate-600 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 rounded-full bg-blue-400 shadow-lg"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-white font-medium truncate">{result.title}</h4>
                          <p className="text-slate-400 text-sm capitalize">
                            {result.category.replace(/-/g, ' ')}
                          </p>
                        </div>
                      </div>
                      {searchMode === 'semantic' && result.similarity_score && (
                        <div className="flex-shrink-0">
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                            {(100 - result.similarity_score * 100).toFixed(0)}% match
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Location:</span>
                        <p className="text-slate-300 truncate">{result.location.address}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Source:</span>
                        <p className="text-slate-300">{result.source}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-slate-500">
                        {new Date(result.datetime).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to view on map →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {query && !loading && results.length === 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-white font-medium mb-2">No results found</h3>
          <p className="text-slate-400">
            Try adjusting your search query or switching to {searchMode === 'semantic' ? 'filter' : 'AI'} search mode
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPanel;