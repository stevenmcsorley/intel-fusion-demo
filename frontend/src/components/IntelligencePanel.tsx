import React, { useState, useEffect } from 'react';
import { getThreatTrends, getTemporalAnalytics, getDataQualityMetrics } from '../services/api';

interface ThreatTrend {
  threat_type: string;
  incident_count: number;
  resolved_count: number;
  resolution_rate: number;
}

interface TemporalData {
  monthly_trends: Array<{
    month: string;
    incident_count: number;
    category: string;
  }>;
  monthly_totals: Array<{
    month: string;
    total_incidents: number;
  }>;
}

const IntelligencePanel: React.FC = () => {
  const [threatTrends, setThreatTrends] = useState<{ threat_analysis: ThreatTrend[] } | null>(null);
  const [temporalData, setTemporalData] = useState<TemporalData | null>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'threats' | 'trends' | 'quality'>('threats');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [threatsRes, temporalRes, qualityRes] = await Promise.all([
          getThreatTrends(),
          getTemporalAnalytics(),
          getDataQualityMetrics()
        ]);

        setThreatTrends(threatsRes.data);
        setTemporalData(temporalRes.data);
        setDataQuality(qualityRes.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const getThreatLevelColor = (resolutionRate: number) => {
    if (resolutionRate >= 80) return 'from-green-500 to-emerald-600';
    if (resolutionRate >= 60) return 'from-yellow-500 to-amber-600';
    if (resolutionRate >= 40) return 'from-orange-500 to-red-600';
    return 'from-red-600 to-red-800';
  };

  const getThreatIcon = (threatType: string) => {
    const icons: { [key: string]: string } = {
      'anti-social-behaviour': '⚠️',
      'burglary': '🏠',
      'robbery': '💰',
      'vehicle-crime': '🚗',
      'violent-crime': '⚔️',
      'other-theft': '🎒',
      'criminal-damage-arson': '🔥',
      'drugs': '💊',
      'public-order': '👥',
      'other-crime': '🔍'
    };
    return icons[threatType] || '📊';
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="text-white text-lg">🧠 Processing intelligence data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intelligence Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <div className="w-6 h-6 text-white">🎯</div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Intelligence Center</h2>
                <p className="text-purple-100 text-sm">Advanced threat analysis & predictive insights</p>
              </div>
            </div>
            <div className="flex bg-black/20 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('threats')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  activeTab === 'threats'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Threat Matrix
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  activeTab === 'trends'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Temporal Trends
              </button>
              <button
                onClick={() => setActiveTab('quality')}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  activeTab === 'quality'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Data Quality
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Panel */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {activeTab === 'threats' && threatTrends && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Threat Assessment Matrix</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {threatTrends.threat_analysis.slice(0, 8).map((threat, index) => (
                <div
                  key={threat.threat_type}
                  className="group relative overflow-hidden bg-slate-700/50 border border-slate-600 rounded-xl p-4 hover:scale-105 transition-all duration-300"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${getThreatLevelColor(
                      threat.resolution_rate
                    )} opacity-5 group-hover:opacity-10 transition-opacity`}
                  ></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getThreatIcon(threat.threat_type)}</div>
                        <div>
                          <h4 className="text-white font-semibold capitalize">
                            {threat.threat_type.replace(/-/g, ' ')}
                          </h4>
                          <p className="text-slate-400 text-sm">Risk Assessment</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{threat.incident_count}</div>
                        <div className="text-xs text-slate-400">Incidents</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Resolution Rate</span>
                        <span className="text-white font-medium">{threat.resolution_rate.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${getThreatLevelColor(
                            threat.resolution_rate
                          )}`}
                          style={{ width: `${threat.resolution_rate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Resolved: {threat.resolved_count}</span>
                        <span>Open: {threat.incident_count - threat.resolved_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && temporalData && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Temporal Intelligence Patterns</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-4">Monthly Activity Trends</h4>
                <div className="space-y-3">
                  {temporalData.monthly_totals.slice(-6).map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">
                        {new Date(month.month).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-slate-600 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{
                              width: `${Math.min(
                                (month.total_incidents / Math.max(...temporalData.monthly_totals.map(m => m.total_incidents))) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-white font-medium text-sm w-12 text-right">
                          {month.total_incidents}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-4">Category Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(
                    temporalData.monthly_trends.reduce((acc, trend) => {
                      acc[trend.category] = (acc[trend.category] || 0) + trend.incident_count;
                      return acc;
                    }, {} as { [key: string]: number })
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">{getThreatIcon(category)}</div>
                          <span className="text-slate-300 text-sm capitalize">
                            {category.replace(/-/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-slate-600 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500"
                              style={{
                                width: `${Math.min(
                                  (count / Math.max(...Object.values(
                                    temporalData.monthly_trends.reduce((acc, trend) => {
                                      acc[trend.category] = (acc[trend.category] || 0) + trend.incident_count;
                                      return acc;
                                    }, {} as { [key: string]: number })
                                  ))) * 100,
                                  100
                                )}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-white font-medium text-sm w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && dataQuality && (
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-6">Data Quality Assessment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Score */}
              <div className="bg-slate-700/30 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {dataQuality.dataset_summary.quality_score}%
                </div>
                <div className="text-lg font-semibold text-slate-300 mb-2">
                  {dataQuality.professional_insights.intelligence_standard}
                </div>
                <div className="text-sm text-slate-400">Overall Quality Score</div>
              </div>

              {/* Completeness Metrics */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-4">Data Completeness</h4>
                <div className="space-y-3">
                  {Object.entries(dataQuality.data_completeness.completion_rates).map(([field, rate]) => (
                    <div key={field}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-300 capitalize">{field.replace(/_/g, ' ')}</span>
                        <span className="text-white font-medium">{rate}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(rate as string) >= 90
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                              : parseFloat(rate as string) >= 80
                              ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                              : 'bg-gradient-to-r from-red-500 to-red-600'
                          }`}
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-4">AI Recommendations</h4>
                <div className="space-y-2">
                  {dataQuality.professional_insights.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="text-green-400 mt-1">✓</div>
                      <div className="text-slate-300 text-sm">{rec}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligencePanel;