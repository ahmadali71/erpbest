import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  Package,
  Calendar,
  CheckSquare,
  Square,
  Search,
  Filter,
  Download,
  BarChart2,
  LineChart as LineChartIcon,
  Layers,
  Sparkles,
  Info,
  DollarSign,
  ShoppingCart,
  Percent,
  Award,
  ChevronDown,
  X,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useERP } from '../../context/ERPContext';
import { Product, SaleInvoice, SaleReturn } from '../../types/erp';

const PRODUCT_PALETTE = [
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
];

export type IntervalType = 'yearly' | 'monthly' | 'weekly' | 'daily';
export type MetricType = 'profit' | 'revenue' | 'quantity' | 'margin';
export type ChartStyle = 'line' | 'grouped_bar' | 'stacked_bar' | 'area';

interface ProductProfitGraphsProps {
  initialProductId?: string;
}

export const ProductProfitGraphs: React.FC<ProductProfitGraphsProps> = ({ initialProductId }) => {
  const { products, sales, returns, formatCurrency } = useERP();

  // State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    if (initialProductId && products.some(p => p.id === initialProductId)) {
      return [initialProductId];
    }
    // Default to top 3 products by sales profit or first 3 products
    const sorted = [...products].slice(0, 3).map(p => p.id);
    return sorted.length > 0 ? sorted : [];
  });

  const [interval, setInterval] = useState<IntervalType>('monthly');
  const [metric, setMetric] = useState<MetricType>('profit');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('line');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync if initialProductId changes
  useEffect(() => {
    if (initialProductId && products.some(p => p.id === initialProductId)) {
      if (!selectedProductIds.includes(initialProductId)) {
        setSelectedProductIds(prev => [initialProductId, ...prev.slice(0, 4)]);
      }
    }
  }, [initialProductId, products]);

  // Available years from sales
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const current = new Date().getFullYear();
    years.add(current);
    years.add(current - 1);
    sales.forEach(s => {
      const y = new Date(s.date).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [sales]);

  // Color map for products
  const productColorMap = useMemo(() => {
    const map = new Map<string, string>();
    selectedProductIds.forEach((id, idx) => {
      map.set(id, PRODUCT_PALETTE[idx % PRODUCT_PALETTE.length]);
    });
    return map;
  }, [selectedProductIds]);

  // Filtered product selection list
  const filteredProducts = useMemo(() => {
    if (!searchFilter.trim()) return products;
    const term = searchFilter.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [products, searchFilter]);

  // Quick selection helpers
  const handleSelectAll = () => {
    setSelectedProductIds(products.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedProductIds([]);
  };

  const handleSelectTopProfit = () => {
    // Rank products by overall profit
    const profitMap = new Map<string, number>();
    sales.forEach(s => {
      s.items.forEach(it => {
        profitMap.set(it.productId, (profitMap.get(it.productId) || 0) + (it.profit || 0));
      });
    });
    const top = [...products]
      .sort((a, b) => (profitMap.get(b.id) || 0) - (profitMap.get(a.id) || 0))
      .slice(0, 5)
      .map(p => p.id);
    setSelectedProductIds(top);
  };

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Helper to compute return deductions per product and period
  const returnItemsMap = useMemo(() => {
    const map: Array<{
      productId: string;
      quantity: number;
      amount: number;
      date: string;
    }> = [];
    returns.forEach(ret => {
      ret.items.forEach(item => {
        map.push({
          productId: item.productId,
          quantity: item.quantity,
          amount: item.totalRefund || item.total || 0,
          date: ret.date,
        });
      });
    });
    return map;
  }, [returns]);

  // Chart Data Computation based on interval
  const { chartData, periodLabels, summaryStats } = useMemo(() => {
    const now = new Date();
    let periods: Array<{ key: string; label: string; start: Date; end: Date }> = [];

    if (interval === 'yearly') {
      // Last 4-5 years
      const years = [...availableYears].slice(0, 5).reverse();
      periods = years.map(y => ({
        key: `${y}`,
        label: `${y}`,
        start: new Date(y, 0, 1, 0, 0, 0),
        end: new Date(y, 11, 31, 23, 59, 59),
      }));
    } else if (interval === 'monthly') {
      // 12 months for the selectedYear
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      periods = monthNames.map((name, mIdx) => ({
        key: `${selectedYear}-${mIdx}`,
        label: `${name} ${selectedYear}`,
        start: new Date(selectedYear, mIdx, 1, 0, 0, 0),
        end: new Date(selectedYear, mIdx + 1, 0, 23, 59, 59),
      }));
    } else if (interval === 'weekly') {
      // Last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const start = new Date(now);
        start.setDate(now.getDate() - (i + 1) * 7);
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);

        const startStr = `${start.getMonth() + 1}/${start.getDate()}`;
        const endStr = `${end.getMonth() + 1}/${end.getDate()}`;
        periods.push({
          key: `W-${i}`,
          label: `Wk ${8 - i} (${startStr}-${endStr})`,
          start,
          end,
        });
      }
    } else {
      // 'daily' - Last 14 days
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const endD = new Date(d);
        endD.setHours(23, 59, 59, 999);

        const monthName = d.toLocaleString('en-US', { month: 'short' });
        periods.push({
          key: d.toISOString().slice(0, 10),
          label: `${monthName} ${d.getDate()}`,
          start: d,
          end: endD,
        });
      }
    }

    // Selected product lookup
    const selectedProds = products.filter(p => selectedProductIds.includes(p.id));

    // Initialize per-product stats
    const productStatsMap = new Map<
      string,
      {
        id: string;
        name: string;
        sku: string;
        totalProfit: number;
        totalRevenue: number;
        totalQuantity: number;
        totalCost: number;
      }
    >();

    selectedProds.forEach(p => {
      productStatsMap.set(p.id, {
        id: p.id,
        name: p.name,
        sku: p.sku,
        totalProfit: 0,
        totalRevenue: 0,
        totalQuantity: 0,
        totalCost: 0,
      });
    });

    // Populate data for each period
    const data = periods.map(period => {
      const row: any = {
        periodKey: period.key,
        periodLabel: period.label,
      };

      let periodCombinedProfit = 0;
      let periodCombinedRevenue = 0;
      let periodCombinedQty = 0;

      // Filter sales in this period
      const periodSales = sales.filter(s => {
        const d = new Date(s.date);
        return d >= period.start && d <= period.end;
      });

      // Filter returns in this period
      const periodReturns = returnItemsMap.filter(r => {
        const d = new Date(r.date);
        return d >= period.start && d <= period.end;
      });

      selectedProds.forEach(prod => {
        let pRevenue = 0;
        let pProfit = 0;
        let pQty = 0;
        let pCost = 0;

        periodSales.forEach(sale => {
          sale.items.forEach(it => {
            if (it.productId === prod.id) {
              const itemTotal = it.total || it.quantity * it.unitSellingPrice;
              const itemCost = it.unitPurchasePrice * it.quantity;
              const itemProfit = it.profit !== undefined ? it.profit : itemTotal - itemCost;

              pRevenue += itemTotal;
              pCost += itemCost;
              pProfit += itemProfit;
              pQty += it.quantity;
            }
          });
        });

        // Deduct returns
        periodReturns.forEach(ret => {
          if (ret.productId === prod.id) {
            pRevenue -= ret.amount;
            pProfit -= (ret.amount - (prod.purchasePrice * ret.quantity));
            pQty -= ret.quantity;
          }
        });

        // Safe bounds
        pRevenue = Math.max(0, pRevenue);
        pQty = Math.max(0, pQty);

        // Update overall stats
        const stat = productStatsMap.get(prod.id);
        if (stat) {
          stat.totalRevenue += pRevenue;
          stat.totalProfit += pProfit;
          stat.totalQuantity += pQty;
          stat.totalCost += pCost;
        }

        periodCombinedProfit += pProfit;
        periodCombinedRevenue += pRevenue;
        periodCombinedQty += pQty;

        // Metric to plot
        let plotValue = 0;
        if (metric === 'profit') {
          plotValue = Math.round(pProfit * 100) / 100;
        } else if (metric === 'revenue') {
          plotValue = Math.round(pRevenue * 100) / 100;
        } else if (metric === 'quantity') {
          plotValue = pQty;
        } else if (metric === 'margin') {
          plotValue = pRevenue > 0 ? Math.round((pProfit / pRevenue) * 1000) / 10 : 0;
        }

        row[prod.id] = plotValue;
        row[`${prod.id}_profit`] = Math.round(pProfit * 100) / 100;
        row[`${prod.id}_revenue`] = Math.round(pRevenue * 100) / 100;
        row[`${prod.id}_qty`] = pQty;
      });

      row.combinedProfit = Math.round(periodCombinedProfit * 100) / 100;
      row.combinedRevenue = Math.round(periodCombinedRevenue * 100) / 100;
      row.combinedQty = periodCombinedQty;

      return row;
    });

    // Overall summary calculation
    let grandProfit = 0;
    let grandRevenue = 0;
    let grandQty = 0;
    let topProduct: { name: string; profit: number } | null = null;

    productStatsMap.forEach(stat => {
      grandProfit += stat.totalProfit;
      grandRevenue += stat.totalRevenue;
      grandQty += stat.totalQuantity;

      if (!topProduct || stat.totalProfit > topProduct.profit) {
        topProduct = { name: stat.name, profit: stat.totalProfit };
      }
    });

    const averageMargin = grandRevenue > 0 ? Math.round((grandProfit / grandRevenue) * 100) : 0;

    return {
      chartData: data,
      periodLabels: periods.map(p => p.label),
      summaryStats: {
        totalProfit: grandProfit,
        totalRevenue: grandRevenue,
        totalQty: grandQty,
        averageMargin,
        topProduct: topProduct as { name: string; profit: number } | null,
        productStats: Array.from(productStatsMap.values()),
      },
    };
  }, [
    interval,
    selectedYear,
    availableYears,
    sales,
    returnItemsMap,
    products,
    selectedProductIds,
    metric,
  ]);

  // Selected products details
  const selectedProducts = useMemo(() => {
    return products.filter(p => selectedProductIds.includes(p.id));
  }, [products, selectedProductIds]);

  // Export CSV of product profit comparison
  const exportProductProfitCSV = () => {
    const headers = [
      'Period',
      ...selectedProducts.map(p => `${p.name} (Profit $)`),
      ...selectedProducts.map(p => `${p.name} (Revenue $)`),
      ...selectedProducts.map(p => `${p.name} (Units)`),
      'Combined Profit ($)',
      'Combined Revenue ($)',
    ];

    const rows = chartData.map(row => [
      row.periodLabel,
      ...selectedProducts.map(p => row[`${p.id}_profit`] || 0),
      ...selectedProducts.map(p => row[`${p.id}_revenue`] || 0),
      ...selectedProducts.map(p => row[`${p.id}_qty`] || 0),
      row.combinedProfit,
      row.combinedRevenue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        ['Nexus ERP - Product Profit Analytics'],
        ['Interval', interval.toUpperCase()],
        ['Metric Displayed', metric.toUpperCase()],
        ['Export Date', new Date().toLocaleString()],
        [],
        headers,
        ...rows,
      ]
        .map(e => e.join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Product_Profit_Report_${interval}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const metricLabel =
    metric === 'profit'
      ? 'Profit ($)'
      : metric === 'revenue'
      ? 'Gross Revenue ($)'
      : metric === 'quantity'
      ? 'Units Sold (Qty)'
      : 'Profit Margin (%)';

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Product Profit Analytics & Comparison
              </h2>
              <p className="text-xs text-slate-400">
                Choose products manually to track and compare net profits across yearly, monthly, weekly, or daily timelines.
              </p>
            </div>
          </div>
        </div>

        {/* Interval & Metric Pickers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Interval Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['yearly', 'monthly', 'weekly', 'daily'] as IntervalType[]).map(val => (
              <button
                key={val}
                onClick={() => setInterval(val)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  interval === val
                    ? 'bg-white text-[var(--accent-color-dark)] shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Year Filter (when in monthly mode) */}
          {interval === 'monthly' && (
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>
                    Year: {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Metric Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'profit', label: 'Profit' },
                { id: 'revenue', label: 'Revenue' },
                { id: 'quantity', label: 'Units' },
                { id: 'margin', label: 'Margin %' },
              ] as Array<{ id: MetricType; label: string }>
            ).map(m => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  metric === m.id
                    ? 'bg-white text-emerald-700 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Chart Style Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setChartStyle('line')}
              className={`p-1.5 rounded-lg transition-all ${
                chartStyle === 'line'
                  ? 'bg-white text-[var(--accent-color)] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Multi-Line Chart"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartStyle('grouped_bar')}
              className={`p-1.5 rounded-lg transition-all ${
                chartStyle === 'grouped_bar'
                  ? 'bg-white text-[var(--accent-color)] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grouped Bar Chart"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartStyle('area')}
              className={`p-1.5 rounded-lg transition-all ${
                chartStyle === 'area'
                  ? 'bg-white text-[var(--accent-color)] shadow-xs'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Smooth Area Chart"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={exportProductProfitCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Export data to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Product Manual Selector Panel */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Selected Products ({selectedProductIds.length} of {products.length})
            </span>
            <span className="text-xs text-slate-400 font-normal">
              — each chosen product is plotted on its own distinct curve
            </span>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleSelectTopProfit}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Top 5 Profit</span>
            </button>
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Select All
            </button>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3 py-1 bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)] text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1"
            >
              <span>{isDropdownOpen ? 'Done Selecting' : '+ Pick Products'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Selected Products Badges */}
        <div className="flex flex-wrap items-center gap-2 min-h-[38px] p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
          {selectedProductIds.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-amber-600 font-medium py-1 px-2">
              <Info className="w-4 h-4 text-amber-500" />
              <span>No products selected. Please select at least one product below to view its profit graph.</span>
            </div>
          ) : (
            selectedProducts.map(prod => {
              const color = productColorMap.get(prod.id) || '#64748b';
              const stat = summaryStats.productStats.find(s => s.id === prod.id);
              return (
                <div
                  key={prod.id}
                  className="inline-flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-xl bg-white border shadow-xs text-xs font-medium text-slate-800 transition-all hover:shadow-sm"
                  style={{ borderColor: `${color}60` }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-semibold text-slate-900">{prod.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">({prod.sku})</span>
                  {stat && (
                    <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      +{formatCurrency(stat.totalProfit)}
                    </span>
                  )}
                  <button
                    onClick={() => handleToggleProduct(prod.id)}
                    className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full ml-0.5"
                    title="Remove from comparison"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Expandable Manual Product Selection Modal / Grid */}
        {isDropdownOpen && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category to select..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredProducts.map(prod => {
                const isSelected = selectedProductIds.includes(prod.id);
                const color = productColorMap.get(prod.id);
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleToggleProduct(prod.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-white border-[var(--accent-color)] shadow-xs ring-1 ring-[var(--accent-color)]'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[var(--accent-color)]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{prod.name}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                        <span className="font-mono">{prod.sku}</span>
                        <span className="text-slate-600 font-mono font-medium">
                          Sell: {formatCurrency(prod.sellingPrice)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards for Selected Products in this Timeframe */}
      {selectedProductIds.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Selected Products Profit
            </p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {formatCurrency(summaryStats.totalProfit)}
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">
              Across {selectedProductIds.length} chosen products ({interval})
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Gross Revenue Generated
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(summaryStats.totalRevenue)}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              From sales in this timeframe
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Average Profit Margin
            </p>
            <h3 className="text-2xl font-bold text-[var(--accent-color-dark)] mt-1">
              {summaryStats.averageMargin}%
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Net profit margin on sales
            </p>
          </div>

          <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-200/80 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Top Performer</span>
            </p>
            <h3 className="text-base font-bold text-slate-900 truncate mt-1">
              {summaryStats.topProduct?.name || 'N/A'}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">
              {summaryStats.topProduct ? `+${formatCurrency(summaryStats.topProduct.profit)} profit` : '--'}
            </p>
          </div>
        </div>
      )}

      {/* Main Interactive Recharts Graph */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl ring-1 ring-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>{metricLabel} Comparison by {interval.toUpperCase()}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {selectedProductIds.length === 0
                ? 'Select products above to display curves'
                : `Showing separate curves for ${selectedProductIds.length} products`}
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Interval: <span className="text-slate-800 capitalize font-bold">{interval}</span>
          </div>
        </div>

        {selectedProductIds.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No Products Selected</p>
            <p className="mt-1">Please select one or more products using "+ Pick Products" above.</p>
          </div>
        ) : (
          <div className="h-80 sm:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'line' ? (
                <LineChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="periodLabel"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={v => (metric === 'quantity' ? v : `$${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      const prod = products.find(p => p.id === name);
                      const displayName = prod ? prod.name : name;
                      const formatted =
                        metric === 'quantity'
                          ? `${value} units`
                          : metric === 'margin'
                          ? `${value}%`
                          : formatCurrency(Number(value));
                      return [formatted, displayName];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => {
                      const prod = products.find(p => p.id === value);
                      return prod ? prod.name : value;
                    }}
                  />
                  {selectedProducts.map(prod => {
                    const color = productColorMap.get(prod.id) || '#64748b';
                    return (
                      <Line
                        key={prod.id}
                        type="monotone"
                        dataKey={prod.id}
                        name={prod.id}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: color }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
                </LineChart>
              ) : chartStyle === 'grouped_bar' ? (
                <BarChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="periodLabel"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={v => (metric === 'quantity' ? v : `$${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      const prod = products.find(p => p.id === name);
                      const displayName = prod ? prod.name : name;
                      const formatted =
                        metric === 'quantity'
                          ? `${value} units`
                          : metric === 'margin'
                          ? `${value}%`
                          : formatCurrency(Number(value));
                      return [formatted, displayName];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => {
                      const prod = products.find(p => p.id === value);
                      return prod ? prod.name : value;
                    }}
                  />
                  {selectedProducts.map(prod => {
                    const color = productColorMap.get(prod.id) || '#64748b';
                    return (
                      <Bar
                        key={prod.id}
                        dataKey={prod.id}
                        name={prod.id}
                        fill={color}
                        radius={[4, 4, 0, 0]}
                      />
                    );
                  })}
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                  <defs>
                    {selectedProducts.map(prod => {
                      const color = productColorMap.get(prod.id) || '#64748b';
                      return (
                        <linearGradient
                          key={`grad-${prod.id}`}
                          id={`grad-${prod.id}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="periodLabel"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={v => (metric === 'quantity' ? v : `$${v}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => {
                      const prod = products.find(p => p.id === name);
                      const displayName = prod ? prod.name : name;
                      const formatted =
                        metric === 'quantity'
                          ? `${value} units`
                          : metric === 'margin'
                          ? `${value}%`
                          : formatCurrency(Number(value));
                      return [formatted, displayName];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                    formatter={(value) => {
                      const prod = products.find(p => p.id === value);
                      return prod ? prod.name : value;
                    }}
                  />
                  {selectedProducts.map(prod => {
                    const color = productColorMap.get(prod.id) || '#64748b';
                    return (
                      <Area
                        key={prod.id}
                        type="monotone"
                        dataKey={prod.id}
                        name={prod.id}
                        stroke={color}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#grad-${prod.id})`}
                      />
                    );
                  })}
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Granular Breakdown Table */}
      {selectedProductIds.length > 0 && (
        <div className="bg-white rounded-3xl ring-1 ring-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Granular Performance Matrix
              </h4>
              <p className="text-xs text-slate-400">
                Detailed units, revenue, and profit per period for each chosen product
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {chartData.length} Periods Recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-5 py-3 border-b border-slate-100">Period</th>
                  {selectedProducts.map(prod => {
                    const color = productColorMap.get(prod.id);
                    return (
                      <th
                        key={prod.id}
                        className="px-5 py-3 border-b border-slate-100 text-center"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-slate-900 font-bold truncate max-w-[140px]">
                            {prod.name}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 lowercase font-normal">
                          (units / rev / profit)
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-5 py-3 border-b border-slate-100 text-right font-bold text-slate-900">
                    Combined Profit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {chartData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-semibold text-slate-900 whitespace-nowrap">
                      {row.periodLabel}
                    </td>
                    {selectedProducts.map(prod => {
                      const pProfit = row[`${prod.id}_profit`] || 0;
                      const pRev = row[`${prod.id}_revenue`] || 0;
                      const pQty = row[`${prod.id}_qty`] || 0;
                      return (
                        <td key={prod.id} className="px-5 py-3 text-center whitespace-nowrap">
                          <div className="font-mono text-xs">
                            <span className="text-slate-500">{pQty}u</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span className="text-slate-700">{formatCurrency(pRev)}</span>
                            <span className="text-slate-300 mx-1">/</span>
                            <span
                              className={`font-bold ${
                                pProfit > 0
                                  ? 'text-emerald-600'
                                  : pProfit < 0
                                  ? 'text-red-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              {formatCurrency(pProfit)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {formatCurrency(row.combinedProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
