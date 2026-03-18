import React, { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useStore } from '../store';
import { apiGet } from '../config/api';
import {
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '../utils/cn';
import styles from './BusinessReports.module.css';
import CustomDateDropdown from '../components/CustomDateDropdown';
import DatePicker from '../components/DatePicker';

// Helper functions for default dates
const getDefaultStartDate = () => {
  const today = new Date();
  const oneMonthAgo = new Date(today);
  oneMonthAgo.setMonth(today.getMonth() - 1);
  return `${oneMonthAgo.getMonth() + 1}/${oneMonthAgo.getDate()}/${oneMonthAgo.getFullYear()}`;
};

const getDefaultEndDate = () => {
  const today = new Date();
  return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
};

// Helper function to calculate date ranges based on preset selection
const getDateRangeFromPreset = (preset: string) => {
  const today = new Date();
  let startDate = new Date(today);

  switch(preset) {
    case 'today':
      startDate = new Date(today);
      // For "today", both start and end dates should be today
      return {
        startDate: `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`,
        endDate: `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`
      };
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      // For "yesterday", both start and end dates should be yesterday
      return {
        startDate: `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`,
        endDate: `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`
      };
    case 'week':
      // Week to date: from the beginning of the week (Sunday) to today
      const dayOfWeek = today.getDay(); // Sunday is 0
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      break;
    case 'month':
      // Month to date: from the beginning of the month to today
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'year':
      // Year to date: from the beginning of the year to today
      startDate = new Date(today.getFullYear(), 0, 1);
      break;
    default:
      // Default to last 30 days
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
  }

  return {
    startDate: `${startDate.getMonth() + 1}/${startDate.getDate()}/${startDate.getFullYear()}`,
    endDate: `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`
  };
};

const BusinessReports: React.FC = () => {
  const { t, formatCurrency, formatNumber } = useI18n();
  const { currentStore } = useStore();
  const [activeView, setActiveView] = useState<'graph' | 'table'>('graph');
  const [datePreset, setDatePreset] = useState('year'); // Track the selected preset, default to year to date
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [chartData, setChartData] = useState<any[]>([]);
  const [snapshotData, setSnapshotData] = useState({
    totalOrderItems: "154,066",
    unitsOrdered: "174,714",
    orderedProductSales: "$19,701,989.13",
    avgUnitsPerOrder: "1.13",
    avgSalesPerOrder: "$127.88",
    timestamp: "12/30/2025, 11:32:21 PM PST"
  });
  const [loading, setLoading] = useState(false);

  // Load chart data from backend
  const loadChartData = async (start?: string, end?: string) => {
    if (!currentStore?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      
      const response = await apiGet(`/api/sales/chart-data/${currentStore.id}?${params.toString()}`);
      if (response.success && response.data && response.data.length > 0) {
        // Format the data for chart display
        const formattedData = response.data.map((item: any, index: number) => {
          const date = new Date(item.date);
          const monthName = date.toLocaleString('en-US', { month: 'short' });
          const year = date.getFullYear().toString().slice(2);
          
          // Show month label only on the 1st of each month
          const isFirstOfMonth = date.getDate() === 1;
          const displayName = isFirstOfMonth ? `${monthName} '${year}` : '';
          
          return {
            name: displayName,
            date: date.toLocaleDateString(),
            units: item.units || 0,
            sales: item.sales || 0,
            lastYearUnits: item.lastYearUnits || 0,
            lastYearSales: item.lastYearSales || 0,
          };
        });
        setChartData(formattedData);
      } else {
        // Fallback to generated data if no backend data
        generateFallbackChartData();
      }
    } catch (error) {
      console.error('Failed to load chart data:', error);
      // Fallback to generated data
      generateFallbackChartData();
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback chart data if API fails
  const generateFallbackChartData = () => {
    const data = [];
    
    // Generate daily data for 13 months to create dense chart like the image
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2026-01-31');
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthName = currentDate.toLocaleString('en-US', { month: 'short' });
      const year = currentDate.getFullYear().toString().slice(2);
      
      // Show month label only on the 1st of each month
      const isFirstOfMonth = currentDate.getDate() === 1;
      const displayName = isFirstOfMonth ? `${monthName} '${year}` : '';

      // Random "spiky" data with more variation to match the image
      const baseUnit = 500;
      const baseSales = 50000;
      const variance = 0.8; // Increased variance for more spiky appearance

      data.push({
        name: displayName,
        date: currentDate.toLocaleDateString(),
        units: Math.floor(baseUnit * (0.5 + Math.random() * variance * 2)),
        sales: Math.floor(baseSales * (0.5 + Math.random() * variance * 2)),
        lastYearUnits: Math.floor(baseUnit * 0.9 * (0.5 + Math.random() * variance * 2)),
        lastYearSales: Math.floor(baseSales * 0.9 * (0.5 + Math.random() * variance * 2)),
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setChartData(data);
  };

  // Handle date preset change
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const { startDate: newStartDate, endDate: newEndDate } = getDateRangeFromPreset(preset);
      setStartDate(newStartDate);
      setEndDate(newEndDate);
    }
  };

  // Load sales snapshot data from backend for specific date range
  const loadSnapshotData = async (start?: string, end?: string) => {
    if (!currentStore?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      
      const url = `/api/sales/snapshot/${currentStore.id}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiGet(url);
      
      if (response.success && response.data) {
        const data = response.data;
        setSnapshotData({
          totalOrderItems: new Intl.NumberFormat('en-US').format(data.total_order_items || 0),
          unitsOrdered: new Intl.NumberFormat('en-US').format(data.units_ordered || 0),
          orderedProductSales: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(data.ordered_product_sales || 0),
          avgUnitsPerOrder: (data.avg_units_per_order || 0).toFixed(2),
          avgSalesPerOrder: new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(data.avg_sales_per_order || 0),
          timestamp: new Date(data.snapshot_time || new Date()).toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })
        });
      } else {
        // Fallback to default values if API doesn't return expected data
        setSnapshotData({
          totalOrderItems: "0",
          unitsOrdered: "0",
          orderedProductSales: "$0.00",
          avgUnitsPerOrder: "0.00",
          avgSalesPerOrder: "$0.00",
          timestamp: new Date().toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })
        });
      }
    } catch (error) {
      console.error('Failed to load sales snapshot data:', error);
      // Set default values in case of error
      setSnapshotData({
        totalOrderItems: "0",
        unitsOrdered: "0",
        orderedProductSales: "$0.00",
        avgUnitsPerOrder: "0.00",
        avgSalesPerOrder: "$0.00",
        timestamp: new Date().toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        })
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle Apply button click
  const handleApplyFilters = async () => {
    if (!currentStore?.id) {
      console.error('No store selected');
      return;
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert(t('startDateCannotBeAfterEndDate'));
      return;
    }

    // Convert date format from MM/DD/YYYY to YYYY-MM-DD for API
    const formatDateForAPI = (dateStr: string) => {
      const [month, day, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    try {
      setLoading(true);
      const apiStartDate = formatDateForAPI(startDate);
      const apiEndDate = formatDateForAPI(endDate);

      console.log('Applying filters:', { startDate, endDate, apiStartDate, apiEndDate });

      // Update chart data for the selected date range
      await loadChartData(apiStartDate, apiEndDate);

      // Update snapshot data for the selected date range
      await loadSnapshotData(apiStartDate, apiEndDate);

      console.log('Filters applied successfully');
    } catch (error) {
      console.error('Failed to apply filters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display in compare legend
  const formatDateForDisplay = (dateStr: string) => {
    const [month, day, year] = dateStr.split('/');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  // Load initial data when component mounts or store changes
  useEffect(() => {
    // Set default date range based on the default preset ('year')
    const { startDate: defaultStartDate, endDate: defaultEndDate } = getDateRangeFromPreset(datePreset);
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    
    // Load initial chart data
    generateFallbackChartData();
    
    // Load initial snapshot data without date range
    loadSnapshotData();
  }, [currentStore, datePreset]);

  return (
    <div className={cn(styles.businessReports, styles.pageContainer)}>
      {/* HEADER SECTION */}
      <div className={styles.pageHeader}>
        <div className="flex items-center">
          <h1 className={styles.pageTitle}>{t('salesDashboardTitle')}</h1>
          <a href="#" className={styles.learnMoreLink}>Learn more</a>
        </div>
        <div className={styles.headerButtons}>
          <button className={styles.btnRefresh}>
            {t('refresh')}
          </button>
          <button className={styles.btnDownload}>
            {t('download')}
          </button>
        </div>
      </div>

      {/* BUSINESS PERFORMANCE INSIGHTS */}
      <div className={styles.insightsCard}>
        <div className={styles.insightsHeader}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#147C8F" xmlns="http://www.w3.org/2000/svg" className={styles.sparkleIcon}>
            {/* Big star - left-center */}
            <path d="M8 4L10 9.5L15.5 11L10 12.5L8 18L6 12.5L0.5 11L6 9.5L8 4Z" />
            {/* Small star - top-right */}
            <path d="M19 3L19.8 5.2L22 6L19.8 6.8L19 9L18.2 6.8L16 6L18.2 5.2L19 3Z" />
          </svg>
          <div>
            <h2 className={styles.insightsTitle}>{t('businessPerformanceInsights')}</h2>
            <p className={styles.insightsText}>{t('allCaughtUp')}</p>
          </div>
        </div>
        <div className={styles.feedbackSection}>
          <span className={styles.feedbackText}>Help improve this experience</span>
          <div className={styles.feedbackIcons}>
            <ThumbsUp className={styles.feedbackIcon} />
            <ThumbsDown className={styles.feedbackIcon} />
            <div className={styles.separator} />
            <Copy className={styles.feedbackIcon} />
          </div>
        </div>
      </div>

      {/* FILTER BAR SECTION */}
      <div className={styles.filtersContainer}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('date')}</label>
            <div className={styles.datePicker}>
              <div className={styles.presetDropdown}>
                <CustomDateDropdown value={datePreset} onChange={handleDatePresetChange} />
              </div>
              <div className={styles.dateInputsRow}>
                <DatePicker value={startDate} onChange={setStartDate} />
                <DatePicker value={endDate} onChange={setEndDate} />
              </div>
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('salesBreakdown')}</label>
            <select className={styles.filterSelect}>
              <option>{t('marketplaceTotal')}</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>{t('fulfillmentChannel')}</label>
            <select className={styles.filterSelect}>
              <option>{t('bothAmazonAndSeller')}</option>
            </select>
          </div>

          <button className={styles.btnApply} onClick={handleApplyFilters}>
            {t('apply')}
          </button>
        </div>
      </div>

      {/* SALES SNAPSHOT SECTION */}
      <div className={styles.snapshotSection}>
        <div className={styles.snapshotHeader}>
          <h2 className={styles.snapshotTitle}>{t('salesSnapshot')}</h2>
          <span className={styles.snapshotTimestamp}>{t('takenAt')} {snapshotData.timestamp}</span>
        </div>

        <div className={styles.metricsRow}>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{t('totalOrderItems')}</div>
            <div className={styles.metricValue}>{snapshotData.totalOrderItems}</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{t('unitsOrdered')}</div>
            <div className={styles.metricValue}>{snapshotData.unitsOrdered}</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{t('orderedProductSales')}</div>
            <div className={styles.metricValue}>{snapshotData.orderedProductSales}</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{t('avgUnitsOrderItem')}</div>
            <div className={styles.metricValue}>{snapshotData.avgUnitsPerOrder}</div>
          </div>
          <div className={styles.metricItem}>
            <div className={styles.metricLabel}>{t('avgSalesOrderItem')}</div>
            <div className={styles.metricValue}>{snapshotData.avgSalesPerOrder}</div>
          </div>
        </div>
      </div>

      {/* COMPARE SALES SECTION */}
      <div className={styles.compareSection}>
        <div className={styles.compareHeader}>
          <h2 className={styles.compareTitle}>{t('compareSales')}</h2>
          <div className={styles.viewToggle}>
            <button
              className={cn(styles.viewBtn, activeView === 'graph' && styles.active)}
              onClick={() => setActiveView('graph')}
            >
              {t('graphView')}
            </button>
            <button
              className={cn(styles.viewBtn, activeView === 'table' && styles.active)}
              onClick={() => setActiveView('table')}
            >
              {t('tableView')}
            </button>
          </div>
        </div>

        {activeView === 'graph' ? (
          <>
            <div className={styles.chartsContainer}>
              {/* Units Ordered Chart */}
              <div className={styles.chartWrapper}>
                <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-[#565959] font-normal uppercase tracking-wider">
                  {t('unitsOrdered')}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 25, right: 5, left: 15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} horizontal={true} stroke="#d0d0d0" strokeWidth={1} />
                    <XAxis
                      dataKey="name"
                      axisLine={true}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#565959' }}
                      interval="preserveStartEnd"
                      stroke="#e0e0e0"
                      angle={0}
                      textAnchor="middle"
                      tickFormatter={(value) => value || ''}
                    />
                    <YAxis
                      axisLine={true}
                      tickLine={true}
                      tick={{ fontSize: 10, fill: '#565959' }}
                      domain={[0, 'auto']}
                      stroke="#e0e0e0"
                      includeHidden={true}
                    />
                    <ReferenceLine y={0} stroke="#d0d0d0" strokeWidth={1} />
                    <Tooltip
                      formatter={(value: number) => [formatNumber(value), t('unitsOrdered')]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.date;
                        }
                        return label;
                      }}
                    />
                    <Line 
                      type="linear" 
                      dataKey="units" 
                      stroke="#008296" 
                      strokeWidth={0.8} 
                      dot={false} 
                      activeDot={{ r: 2 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 中间分割线 */}
              <div className={styles.chartDivider}></div>

              {/* Ordered Product Sales Chart */}
              <div className={styles.chartWrapper}>
                <div className="absolute left-[-35px] top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-[#565959] font-normal uppercase tracking-wider">
                  {t('orderedProductSales')}
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 25, right: 5, left: 25, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} horizontal={true} stroke="#d0d0d0" strokeWidth={1} />
                    <XAxis
                      dataKey="name"
                      axisLine={true}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#565959' }}
                      interval="preserveStartEnd"
                      stroke="#e0e0e0"
                      angle={0}
                      textAnchor="middle"
                      tickFormatter={(value) => value || ''}
                    />
                    <YAxis
                      axisLine={true}
                      tickLine={true}
                      tick={{ fontSize: 10, fill: '#565959' }}
                      tickFormatter={(value) => `${value / 1000}k`}
                      domain={[0, 'auto']}
                      stroke="#e0e0e0"
                      includeHidden={true}
                    />
                    <ReferenceLine y={0} stroke="#d0d0d0" strokeWidth={1} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), t('orderedProductSales')]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.date;
                        }
                        return label;
                      }}
                    />
                    <Line 
                      type="linear" 
                      dataKey="sales" 
                      stroke="#008296" 
                      strokeWidth={0.8} 
                      dot={false} 
                      activeDot={{ r: 2 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('unitsOrdered')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('orderedProductSales')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('compare')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {chartData.map((data, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(data.units)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(data.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.lastYearUnits ? formatNumber(data.lastYearUnits) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {chartData.length === 0 && (
              <div className="p-20 text-center text-[#565959]">
                {t('noDataAvailable')}
              </div>
            )}
          </div>
        )}

        {/* COMPARE LEGEND SECTION */}
        <div className={styles.compareLegend}>
          <div>
            <span className={styles.compareLabel}>{t('compare')}</span>
            <a href="#" className={styles.whatsThisLink}>{t('whatsThis')}</a>
          </div>
          <div className={styles.compareCheckbox}>
            <div className="w-4 h-4 border-2 border-[#007185] rounded-[2px] bg-[#007185] flex items-center justify-center mt-1">
              <Check size={12} className="text-white" />
            </div>
            <div>
              <span className={styles.checkboxLabel}>{t('selectedDateRange')}</span>
              <div className={styles.checkboxValues}>
                {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}<br />
                {snapshotData.unitsOrdered} Units<br />
                {snapshotData.orderedProductSales}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessReports;
