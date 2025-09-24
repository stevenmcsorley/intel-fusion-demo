import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Settings as SettingsIcon,
  Plus,
  Edit3,
  Save,
  X,
  Activity,
  Database,
  Globe,
  Shield
} from 'lucide-react';

interface IngestionConfig {
  id: string;
  name: string;
  type: 'uk_police' | 'tfl' | 'gdelt' | 'custom';
  enabled: boolean;
  description: string;
  frequency: string;
  url?: string;
  api_key?: string;
  schedule: string;
  last_run?: string;
  next_run?: string;
  total_runs: number;
  success_rate: number;
  avg_duration: number;
  data_points_collected: number;
}

interface IngestionStatus {
  queues: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  jobs: {
    waiting: any[];
    active: any[];
    recent_completed: any[];
    recent_failed: any[];
  };
  settings: {
    auto_ingestion_enabled: boolean;
  };
}

export const Settings = () => {
  const [ingestionConfigs, setIngestionConfigs] = useState<IngestionConfig[]>([]);
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingConfig, setEditingConfig] = useState<IngestionConfig | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Mock data - in production this would come from API
  const mockConfigs: IngestionConfig[] = [
    {
      id: 'uk-police-1',
      name: 'UK Police Crime Data',
      type: 'uk_police',
      enabled: true,
      description: 'Metropolitan Police crime and incident data for Greater London',
      frequency: 'Monthly',
      schedule: '0 0 1 * *', // First day of each month
      last_run: '2025-09-01T00:00:00Z',
      next_run: '2025-10-01T00:00:00Z',
      total_runs: 24,
      success_rate: 95.8,
      avg_duration: 1200, // seconds
      data_points_collected: 847320
    },
    {
      id: 'tfl-realtime-1',
      name: 'TfL Real-time Transport',
      type: 'tfl',
      enabled: true,
      description: 'Live transport disruptions, line status, and incident reports',
      frequency: 'Every 5 minutes',
      schedule: '*/5 * * * *',
      last_run: '2025-09-22T12:05:00Z',
      next_run: '2025-09-22T12:10:00Z',
      total_runs: 8760,
      success_rate: 99.2,
      avg_duration: 15, // seconds
      data_points_collected: 125680
    },
    {
      id: 'gdelt-news-1',
      name: 'GDELT Global Events',
      type: 'gdelt',
      enabled: false,
      description: 'Global news and events database for London-related incidents',
      frequency: 'Daily',
      schedule: '0 2 * * *', // 2 AM daily
      last_run: '2025-09-21T02:00:00Z',
      next_run: '2025-09-23T02:00:00Z',
      total_runs: 90,
      success_rate: 87.3,
      avg_duration: 480, // seconds
      data_points_collected: 45230
    }
  ];

  const fetchData = async () => {
    try {
      // Mock API call - replace with real API
      setIngestionConfigs(mockConfigs);

      const statusRes = await fetch('/api/v1/ingestion/status');
      const status = await statusRes.json();
      setIngestionStatus(status);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const triggerIngestion = async (configId: string) => {
    const config = ingestionConfigs.find(c => c.id === configId);
    if (!config) return;

    try {
      await fetch(`/api/v1/ingestion/${config.type}`, { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error(`Failed to trigger ${config.name}:`, error);
    }
  };

  const toggleConfig = (configId: string) => {
    setIngestionConfigs(configs =>
      configs.map(config =>
        config.id === configId
          ? { ...config, enabled: !config.enabled }
          : config
      )
    );
  };

  const deleteConfig = (configId: string) => {
    setIngestionConfigs(configs => configs.filter(c => c.id !== configId));
  };

  const saveConfig = (config: IngestionConfig) => {
    if (editingConfig) {
      setIngestionConfigs(configs =>
        configs.map(c => c.id === config.id ? config : c)
      );
    } else {
      setIngestionConfigs(configs => [...configs, { ...config, id: Date.now().toString() }]);
    }
    setEditingConfig(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-950 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-950 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ingestion Configuration Center</h1>
          <p className="text-slate-400 mt-2">Manage data sources, monitor performance, and configure ingestion pipelines</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 border border-purple-800/30 text-slate-400 rounded-lg hover:bg-gray-800/50 hover:text-purple-400 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500 text-purple-400 rounded-lg hover:bg-purple-600/30 hover:text-purple-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Source
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <SystemCard
          title="Active Sources"
          value={ingestionConfigs.filter(c => c.enabled).length}
          total={ingestionConfigs.length}
          icon={<Database className="w-6 h-6" />}
          color="blue"
        />
        <SystemCard
          title="Queue Status"
          value={ingestionStatus?.queues.active || 0}
          subtitle="Active Jobs"
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />
        <SystemCard
          title="Success Rate"
          value={`${(ingestionConfigs.reduce((acc, c) => acc + c.success_rate, 0) / ingestionConfigs.length).toFixed(1)}%`}
          subtitle="Average"
          icon={<CheckCircle className="w-6 h-6" />}
          color="emerald"
        />
        <SystemCard
          title="Data Points"
          value={ingestionConfigs.reduce((acc, c) => acc + c.data_points_collected, 0).toLocaleString()}
          subtitle="Total Collected"
          icon={<Globe className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Configured Sources */}
      <div className="bg-gray-900/30 border border-purple-800/30 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-purple-400" />
          Configured Data Sources
        </h2>

        <div className="space-y-4">
          {ingestionConfigs.map((config) => (
            <ConfigurationCard
              key={config.id}
              config={config}
              onToggle={() => toggleConfig(config.id)}
              onEdit={() => setEditingConfig(config)}
              onDelete={() => deleteConfig(config.id)}
              onTrigger={() => triggerIngestion(config.id)}
            />
          ))}
        </div>
      </div>

      {/* Queue Status */}
      {ingestionStatus && (
        <QueueStatusSection status={ingestionStatus} />
      )}

      {/* Add/Edit Modal */}
      {(showAddForm || editingConfig) && (
        <ConfigurationModal
          config={editingConfig}
          onSave={saveConfig}
          onCancel={() => {
            setEditingConfig(null);
            setShowAddForm(false);
          }}
        />
      )}
    </div>
  );
};

// System Card Component
interface SystemCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  total?: number;
  icon: React.ReactNode;
  color: string;
}

const SystemCard = ({ title, value, subtitle, total, icon, color }: SystemCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-900/20 text-blue-400 border-blue-800/30',
    green: 'bg-green-900/20 text-green-400 border-green-800/30',
    emerald: 'bg-emerald-900/20 text-emerald-400 border-emerald-800/30',
    purple: 'bg-purple-900/20 text-purple-400 border-purple-800/30'
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-slate-400">{title}</div>
        {icon}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {total && <span className="text-sm font-normal text-slate-400">/{total}</span>}
      </div>
      {subtitle && <div className="text-sm text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
};

// Configuration Card Component
interface ConfigurationCardProps {
  config: IngestionConfig;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTrigger: () => void;
}

const ConfigurationCard = ({ config, onToggle, onEdit, onDelete, onTrigger }: ConfigurationCardProps) => {
  const getTypeIcon = () => {
    switch (config.type) {
      case 'uk_police': return <Shield className="w-5 h-5" />;
      case 'tfl': return <Activity className="w-5 h-5" />;
      case 'gdelt': return <Globe className="w-5 h-5" />;
      default: return <Database className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    if (!config.enabled) return 'bg-gray-800/30 border-gray-700/50';
    return config.success_rate > 95 ? 'bg-green-900/20 border-green-800/30' :
           config.success_rate > 85 ? 'bg-yellow-900/20 border-yellow-800/30' :
           'bg-red-900/20 border-red-800/30';
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${config.enabled ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800/30 text-gray-500'}`}>
            {getTypeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">{config.name}</h3>
            <p className="text-slate-400 mt-1">{config.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span>Frequency: {config.frequency}</span>
              <span>•</span>
              <span>Total Runs: {config.total_runs}</span>
              <span>•</span>
              <span>Success Rate: {config.success_rate}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-purple-600' : 'bg-gray-700'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <div className="text-slate-500">Last Run</div>
          <div className="font-medium text-slate-300">
            {config.last_run ? new Date(config.last_run).toLocaleDateString() : 'Never'}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Next Run</div>
          <div className="font-medium text-slate-300">
            {config.next_run ? new Date(config.next_run).toLocaleDateString() : 'Not scheduled'}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Avg Duration</div>
          <div className="font-medium text-slate-300">{config.avg_duration}s</div>
        </div>
        <div>
          <div className="text-slate-500">Data Points</div>
          <div className="font-medium text-slate-300">{config.data_points_collected.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span className="text-sm text-slate-400">
            {config.enabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onTrigger}
            disabled={!config.enabled}
            className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 border border-purple-500 text-purple-400 rounded text-sm hover:bg-purple-600/30 disabled:opacity-50 transition-colors"
          >
            <Play className="w-3 h-3" />
            Trigger
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded text-sm hover:bg-gray-700/50 hover:text-slate-300 transition-colors"
          >
            <Edit3 className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1 bg-red-900/20 border border-red-800/30 text-red-400 rounded text-sm hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Queue Status Section
const QueueStatusSection = ({ status }: { status: IngestionStatus }) => (
  <div className="bg-gray-900/30 border border-purple-800/30 rounded-lg p-6">
    <h2 className="text-xl font-semibold text-white mb-6">Queue Status</h2>
    <div className="grid grid-cols-4 gap-4">
      <div className="text-center p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
        <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-blue-400">{status.queues.waiting}</div>
        <div className="text-sm text-slate-400">Waiting</div>
      </div>
      <div className="text-center p-4 bg-green-900/20 border border-green-800/30 rounded-lg">
        <Play className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-green-400">{status.queues.active}</div>
        <div className="text-sm text-slate-400">Active</div>
      </div>
      <div className="text-center p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <CheckCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-slate-400">{status.queues.completed}</div>
        <div className="text-sm text-slate-500">Completed</div>
      </div>
      <div className="text-center p-4 bg-red-900/20 border border-red-800/30 rounded-lg">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <div className="text-2xl font-bold text-red-400">{status.queues.failed}</div>
        <div className="text-sm text-slate-400">Failed</div>
      </div>
    </div>
  </div>
);

// Configuration Modal
interface ConfigurationModalProps {
  config?: IngestionConfig | null;
  onSave: (config: IngestionConfig) => void;
  onCancel: () => void;
}

const ConfigurationModal = ({ config, onSave, onCancel }: ConfigurationModalProps) => {
  const [formData, setFormData] = useState<Partial<IngestionConfig>>(
    config || {
      name: '',
      type: 'custom',
      enabled: true,
      description: '',
      frequency: 'Daily',
      schedule: '0 2 * * *',
      url: '',
      api_key: '',
      total_runs: 0,
      success_rate: 0,
      avg_duration: 0,
      data_points_collected: 0
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as IngestionConfig);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-purple-800/30 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {config ? 'Edit Configuration' : 'Add New Data Source'}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="uk_police">UK Police</option>
                <option value="tfl">Transport for London</option>
                <option value="gdelt">GDELT</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="Every 5 minutes">Every 5 minutes</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Cron Schedule</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                placeholder="0 2 * * *"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          </div>

          {formData.type === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">API URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
              className="w-4 h-4 text-purple-600 bg-gray-800/50 border-gray-700/50 rounded focus:ring-purple-500"
            />
            <label className="text-sm font-medium text-slate-300">Enable this data source</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-slate-400 rounded-lg hover:bg-gray-700/50 hover:text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};