import React, { useState, useEffect } from 'react';
import { getDateRange } from '../services/api';

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

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  className?: string;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ onDateRangeChange, className = '' }) => {
  const [dateRangeData, setDateRangeData] = useState<DateRangeData | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        setLoading(true);
        const response = await getDateRange();
        const data: DateRangeData = response.data;
        setDateRangeData(data);

        // Set default values to the suggested defaults (last 6 months)
        const defaultStart = data.suggested_defaults.start_date ?
          new Date(data.suggested_defaults.start_date).toISOString().split('T')[0] : '';
        const defaultEnd = data.suggested_defaults.end_date ?
          new Date(data.suggested_defaults.end_date).toISOString().split('T')[0] : '';

        setStartDate(defaultStart);
        setEndDate(defaultEnd);

        // Notify parent component of default values
        onDateRangeChange(
          defaultStart || null,
          defaultEnd || null
        );
      } catch (error) {
        console.error('Failed to fetch date range:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDateRange();
  }, []);

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    onDateRangeChange(value || null, endDate || null);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    onDateRangeChange(startDate || null, value || null);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    onDateRangeChange(null, null);
  };

  const setPresetRange = (months: number) => {
    if (!dateRangeData) return;

    const endDateObj = new Date(dateRangeData.date_range.latest);
    const startDateObj = new Date(endDateObj);
    startDateObj.setMonth(startDateObj.getMonth() - months);

    const newStartDate = startDateObj.toISOString().split('T')[0];
    const newEndDate = endDateObj.toISOString().split('T')[0];

    setStartDate(newStartDate);
    setEndDate(newEndDate);
    onDateRangeChange(newStartDate, newEndDate);
  };

  if (loading) {
    return (
      <div className={`bg-slate-700/50 border border-slate-600 rounded-lg p-4 ${className}`}>
        <div className="text-slate-400 text-sm">Loading date range...</div>
      </div>
    );
  }

  if (!dateRangeData) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 rounded-xl shadow-lg ${className}`}>
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <div className="w-4 h-4 text-blue-400">📅</div>
            </div>
            <div>
              <h3 className="text-white font-medium">Date Range Filter</h3>
              <p className="text-slate-400 text-sm">
                {startDate && endDate ?
                  `${formatDate(startDate)} - ${formatDate(endDate)}` :
                  'All dates'
                }
              </p>
            </div>
          </div>
          <div className={`text-slate-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* Data Range Info */}
            <div className="bg-slate-600/30 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-2">Available Data Range</div>
              <div className="text-sm text-slate-200">
                {formatDate(dateRangeData.date_range.earliest)} - {formatDate(dateRangeData.date_range.latest)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {dateRangeData.date_range.total_records.toLocaleString()} total records
              </div>
            </div>

            {/* Preset Ranges */}
            <div>
              <div className="text-xs text-slate-400 mb-2">Quick Select</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPresetRange(1)}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                >
                  Last Month
                </button>
                <button
                  onClick={() => setPresetRange(3)}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                >
                  Last 3 Months
                </button>
                <button
                  onClick={() => setPresetRange(6)}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => setPresetRange(12)}
                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-xs transition-colors"
                >
                  Last Year
                </button>
              </div>
            </div>

            {/* Custom Date Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  min={dateRangeData.date_range.earliest.split('T')[0]}
                  max={dateRangeData.date_range.latest.split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  min={dateRangeData.date_range.earliest.split('T')[0]}
                  max={dateRangeData.date_range.latest.split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Monthly Distribution Preview */}
            {dateRangeData.monthly_distribution.length > 0 && (
              <div>
                <div className="text-xs text-slate-400 mb-2">Monthly Distribution</div>
                <div className="grid grid-cols-6 gap-1">
                  {dateRangeData.monthly_distribution.slice(-12).map((month, index) => {
                    const isSelected = (!startDate || month.month >= startDate) &&
                                     (!endDate || month.month <= endDate);
                    return (
                      <div
                        key={month.month}
                        className={`h-8 rounded text-xs flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-500/30 text-blue-300'
                            : 'bg-slate-600/30 text-slate-500'
                        }`}
                        title={`${new Date(month.month).toLocaleDateString('en-GB', {
                          year: 'numeric',
                          month: 'short'
                        })}: ${month.count} incidents`}
                      >
                        {month.count}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear Button */}
            {(startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
              >
                Clear Date Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;