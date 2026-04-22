import { useState, useEffect, type ReactNode } from 'react';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  BarChart,
  Bar,
  ComposedChart,
} from 'recharts';

interface Event {
  id: number;
  name: string;
  eventDate: string;
  totalPrepared: number;
  totalSold: number;
  totalGiveaway: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
}

interface Delivery {
  id: number;
  storeName: string;
  datePrepared: string;
  dropoffDate: string | null;
  totalPrepared: number;
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  deletedAt: string | null;
}

interface MonthlyTrendPoint {
  month: string;
  revenue: number;
  profit: number;
  count: number;
}

interface AggregatedEntry {
  name: string;
  totalRevenue: number;
  totalProfit: number;
  avgRevenue: number;
  avgProfit: number;
  count: number;
}

interface MarginEntry {
  name: string;
  fullName: string;
  margin: number;
  count?: number;
}

interface DayOfWeekEntry {
  day: string;
  revenue: number;
  profit: number;
  avgRevenue: number;
  avgProfit: number;
  count: number;
}

interface VenuePerformanceEntry {
  name: string;
  visits: number;
  totalRevenue: number;
  avgRevenue: number;
  avgProfit: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

const CHART_PINK = '#ec4899';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [revenueView, setRevenueView] = useState<'monthly' | 'daily'>('monthly');
  const [eventsAgg, setEventsAgg] = useState<'total' | 'average'>('total');
  const [eventsMetric, setEventsMetric] = useState<'revenue' | 'profit'>('revenue');
  const [storesAgg, setStoresAgg] = useState<'total' | 'average'>('total');
  const [storesMetric, setStoresMetric] = useState<'revenue' | 'profit'>('revenue');

  // Fetch events and deliveries on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/events').then((res: Response) => res.json() as Promise<Event[]>),
      fetch('/api/deliveries').then((res: Response) => res.json() as Promise<Delivery[]>),
    ])
      .then(([eventsData, deliveriesData]: [Event[], Delivery[]]) => {
        setEvents(eventsData);
        // Filter out archived deliveries
        setDeliveries(deliveriesData.filter((d: Delivery) => !d.deletedAt));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  // Filter events with actual sales (for some metrics)
  const eventsWithSales = events.filter(e => e.totalSold > 0);
  const deliveriesWithRevenue = deliveries.filter(d => d.totalRevenue > 0);

  // Calculate aggregate stats (events + deliveries combined)
  const eventRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
  const deliveryRevenue = deliveries.reduce((sum, d) => sum + d.totalRevenue, 0);
  const totalRevenue = eventRevenue + deliveryRevenue;

  const eventProfit = events.reduce((sum, e) => sum + e.netProfit, 0);
  const deliveryProfit = deliveries.reduce((sum, d) => sum + d.grossProfit, 0);
  const totalProfit = eventProfit + deliveryProfit;

  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const totalSources = eventsWithSales.length + deliveriesWithRevenue.length;

  // Monthly revenue trend — combine events + deliveries (deliveries use dropoffDate)
  const allMonthKeys = new Set<string>();

  const addToMonthly = (acc: Record<string, { revenue: number; profit: number; count: number }>, dateStr: string, revenue: number, profit: number) => {
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    const month = date.toLocaleDateString('en-US', { month: 'short' }) + " '" + date.getFullYear().toString().slice(-2);
    allMonthKeys.add(month);
    if (!acc[month]) acc[month] = { revenue: 0, profit: 0, count: 0 };
    acc[month].revenue += revenue;
    acc[month].profit += profit;
    acc[month].count += 1;
    return acc;
  };

  const monthlyData: Record<string, { revenue: number; profit: number; count: number }> = {};
  eventsWithSales.forEach(e => addToMonthly(monthlyData, e.eventDate, e.totalRevenue, e.netProfit));
  deliveriesWithRevenue.forEach(d => addToMonthly(monthlyData, d.dropoffDate || d.datePrepared, d.totalRevenue, d.grossProfit));

  // Build month order from actual data, sorted chronologically
  const monthOrder = [...allMonthKeys].sort((a, b) => {
    const parse = (m: string) => {
      const [mon, yr] = m.split(" '");
      return new Date(`${mon} 1, 20${yr}`).getTime();
    };
    return parse(a) - parse(b);
  });

  const monthlyTrend = monthOrder.map(month => ({
    month,
    revenue: monthlyData[month]?.revenue || 0,
    profit: monthlyData[month]?.profit || 0,
    count: monthlyData[month]?.count || 0,
  }));

  // Aggregated events by venue name
  const aggregatedEvents = Object.entries(
    eventsWithSales.reduce<Record<string, { totalRevenue: number; totalProfit: number; count: number }>>((acc, e) => {
      if (!acc[e.name]) acc[e.name] = { totalRevenue: 0, totalProfit: 0, count: 0 };
      acc[e.name].totalRevenue += e.totalRevenue;
      acc[e.name].totalProfit += e.netProfit;
      acc[e.name].count += 1;
      return acc;
    }, {})
  ).map(([name, data]) => ({
    name,
    totalRevenue: data.totalRevenue,
    totalProfit: data.totalProfit,
    avgRevenue: data.count > 0 ? data.totalRevenue / data.count : 0,
    avgProfit: data.count > 0 ? data.totalProfit / data.count : 0,
    count: data.count,
  }));

  const getEventValue = (e: typeof aggregatedEvents[0]) => {
    if (eventsAgg === 'total') return eventsMetric === 'revenue' ? e.totalRevenue : e.totalProfit;
    return eventsMetric === 'revenue' ? e.avgRevenue : e.avgProfit;
  };
  const sortedEvents = [...aggregatedEvents].sort((a, b) => getEventValue(b) - getEventValue(a)).slice(0, 5);

  // Aggregated deliveries/stores by store name
  const aggregatedStores = Object.entries(
    deliveriesWithRevenue.reduce<Record<string, { totalRevenue: number; totalProfit: number; count: number }>>((acc, d) => {
      if (!acc[d.storeName]) acc[d.storeName] = { totalRevenue: 0, totalProfit: 0, count: 0 };
      acc[d.storeName].totalRevenue += d.totalRevenue;
      acc[d.storeName].totalProfit += d.grossProfit;
      acc[d.storeName].count += 1;
      return acc;
    }, {})
  ).map(([name, data]) => ({
    name,
    totalRevenue: data.totalRevenue,
    totalProfit: data.totalProfit,
    avgRevenue: data.count > 0 ? data.totalRevenue / data.count : 0,
    avgProfit: data.count > 0 ? data.totalProfit / data.count : 0,
    count: data.count,
  }));

  const getStoreValue = (s: typeof aggregatedStores[0]) => {
    if (storesAgg === 'total') return storesMetric === 'revenue' ? s.totalRevenue : s.totalProfit;
    return storesMetric === 'revenue' ? s.avgRevenue : s.avgProfit;
  };
  const sortedStores = [...aggregatedStores].sort((a, b) => getStoreValue(b) - getStoreValue(a)).slice(0, 5);

  // Profit margin by event (for line chart) - sorted by date
  const marginByEvent = Object.entries(
    eventsWithSales.reduce<Record<string, { totalRevenue: number; totalProfit: number; count: number }>>((acc, e) => {
      if (!acc[e.name]) acc[e.name] = { totalRevenue: 0, totalProfit: 0, count: 0 };
      acc[e.name].totalRevenue += e.totalRevenue;
      acc[e.name].totalProfit += e.netProfit;
      acc[e.name].count += 1;
      return acc;
    }, {})
  ).map(([name, data]) => ({
    name,
    fullName: name,
    margin: data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0,
    count: data.count,
  })).sort((a, b) => a.margin - b.margin);

  // Profit margin by store - aggregated
  const marginByStore = Object.entries(
    deliveriesWithRevenue.reduce<Record<string, { totalRevenue: number; totalProfit: number }>>((acc, d) => {
      if (!acc[d.storeName]) acc[d.storeName] = { totalRevenue: 0, totalProfit: 0 };
      acc[d.storeName].totalRevenue += d.totalRevenue;
      acc[d.storeName].totalProfit += d.grossProfit;
      return acc;
    }, {})
  ).map(([name, data]) => ({
    name,
    fullName: name,
    margin: data.totalRevenue > 0 ? (data.totalProfit / data.totalRevenue) * 100 : 0,
  })).sort((a, b) => a.margin - b.margin);

  // Compute Y axis range from actual data
  const allMargins = [...marginByEvent.map(e => e.margin), ...marginByStore.map(s => s.margin)];
  const minMargin = allMargins.length > 0 ? Math.min(...allMargins) - 3 : 0;
  const maxMargin = allMargins.length > 0 ? Math.max(...allMargins) + 3 : 100;

  // Venue performance - aggregate by venue name (count ALL events, including zero revenue)
  const venueData = events.reduce<Record<string, { visits: number; totalRevenue: number; totalProfit: number }>>((acc, e) => {
    const venueName = e.name;
    if (!acc[venueName]) {
      acc[venueName] = { visits: 0, totalRevenue: 0, totalProfit: 0 };
    }
    acc[venueName].visits += 1;
    acc[venueName].totalRevenue += e.totalRevenue;
    acc[venueName].totalProfit += e.netProfit;
    return acc;
  }, {});

  const venuePerformance = Object.entries(venueData)
    .map(([name, data]) => ({
      name,
      visits: data.visits,
      totalRevenue: data.totalRevenue,
      avgRevenue: data.visits > 0 ? data.totalRevenue / data.visits : 0,
      avgProfit: data.visits > 0 ? data.totalProfit / data.visits : 0,
    }))
    .filter(v => v.visits > 1) // Only show repeated venues
    .sort((a, b) => b.visits - a.visits);

  // Revenue by day of week (events + deliveries, deliveries use dropoff date)
  const dayOfWeekData: Record<string, { revenue: number; profit: number; count: number }> = {};
  const addToDay = (dateStr: string, revenue: number, profit: number) => {
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    if (!dayOfWeekData[dayName]) dayOfWeekData[dayName] = { revenue: 0, profit: 0, count: 0 };
    dayOfWeekData[dayName].revenue += revenue;
    dayOfWeekData[dayName].profit += profit;
    dayOfWeekData[dayName].count += 1;
  };
  eventsWithSales.forEach(e => addToDay(e.eventDate, e.totalRevenue, e.netProfit));
  deliveriesWithRevenue.forEach(d => addToDay(d.dropoffDate || d.datePrepared, d.totalRevenue, d.grossProfit));

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const revenueByDay = dayOrder.map(day => ({
    day,
    revenue: dayOfWeekData[day]?.revenue || 0,
    profit: dayOfWeekData[day]?.profit || 0,
    avgRevenue: dayOfWeekData[day] ? dayOfWeekData[day].revenue / dayOfWeekData[day].count : 0,
    avgProfit: dayOfWeekData[day] ? dayOfWeekData[day].profit / dayOfWeekData[day].count : 0,
    count: dayOfWeekData[day]?.count || 0,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name === 'Margin' || entry.name === 'margin'
                ? `${entry.value.toFixed(1)}%`
                : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">Overview of your business performance</p>
      </div>

      {/* Bento Grid */}
      <div className="space-y-4">

      {/* Row 1 - Stats */}
      <div className="grid grid-cols-12 gap-4" style={{ height: '120px' }}>

        {/* Total Revenue */}
        <div className="col-span-6 row-span-1 bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-pink-100 text-sm font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-pink-200 text-sm font-medium mt-1">From {eventsWithSales.length} events and {deliveriesWithRevenue.length} deliveries</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCurrency(totalRevenue / (totalSources || 1))}</p>
            <p className="text-pink-200 text-sm font-medium">avg per source</p>
          </div>
        </div>

        {/* Total Profit */}
        <div className="col-span-3 row-span-1 bg-green-50 border border-green-100 rounded-3xl p-4 flex flex-col justify-center">
          <p className="text-sm text-green-600 font-medium uppercase tracking-wide">Total Profit</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalProfit)}</p>
          <p className="text-sm font-medium text-green-500 mt-1">{formatCurrency(totalProfit / (totalSources || 1))} avg</p>
        </div>

        {/* Profit Margin */}
        <div className="col-span-3 row-span-1 bg-[#fafafc] border border-gray-100 rounded-3xl p-4 flex flex-col justify-center">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">Profit Margin</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{profitMargin.toFixed(1)}%</p>
          <p className="text-sm font-medium text-gray-400 mt-1">overall</p>
        </div>
      </div>

      {/* Row 2 - Charts & Lists */}
      <div className="flex gap-4" style={{ height: '280px' }}>

        {/* Revenue Chart - Monthly / By Day toggle */}
        <div className="bg-[#fafafc] border border-gray-100 rounded-3xl p-5" style={{ width: '40%' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">
              {revenueView === 'monthly' ? 'Monthly Revenue & Profit' : 'Daily Revenue & Profit'}
            </p>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setRevenueView('monthly')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  revenueView === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setRevenueView('daily')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  revenueView === 'daily'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                By Day
              </button>
            </div>
          </div>
          {revenueView === 'monthly' ? (
            <ResponsiveContainer width="100%" height={220} minWidth={100}>
              <AreaChart data={monthlyTrend} margin={{ top: 10, left: -20, right: 20 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_PINK} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_PINK} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} type="number" scale="linear" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={CHART_PINK} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
                <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={220} minWidth={100}>
              <BarChart data={revenueByDay} margin={{ left: -20, right: -20 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" xAxisId="revenue" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} allowDuplicatedCategory={false} />
                <XAxis dataKey="day" xAxisId="profit" hide height={0} />
                <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} type="number" scale="linear" />
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) => [
                    formatCurrency(value as number),
                    name === 'avgRevenue' ? 'Revenue' : 'Profit'
                  ]}
                  labelFormatter={(label: ReactNode) => {
                    const labelStr = String(label);
                    const day = revenueByDay.find((d: DayOfWeekEntry) => d.day === labelStr);
                    return day ? `${labelStr} (${day.count} source${day.count > 1 ? 's' : ''})` : labelStr;
                  }}
                />
                <Bar dataKey="avgRevenue" fill={CHART_PINK} radius={[4, 4, 0, 0]} name="avgRevenue" xAxisId="revenue" />
                <Bar dataKey="avgProfit" fill="#22c55e" radius={[4, 4, 0, 0]} name="avgProfit" xAxisId="profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Events */}
        <div className="bg-[#fafafc] border border-gray-100 rounded-3xl p-5 flex flex-col" style={{ width: '30%' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">Top Events</p>
            <div className="flex gap-1">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setEventsAgg('total')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    eventsAgg === 'total'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => setEventsAgg('average')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    eventsAgg === 'average'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Average
                </button>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setEventsMetric('revenue')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    eventsMetric === 'revenue'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setEventsMetric('profit')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    eventsMetric === 'profit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Profit
                </button>
              </div>
            </div>
          </div>
          <div className="space-y-3.5 mt-auto">
            {sortedEvents.map((event, index) => (
              <div key={event.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? (eventsMetric === 'profit' ? 'bg-green-500 text-white' : 'bg-pink-500 text-white') : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-[15px] text-gray-700 truncate max-w-[200px]" title={event.name}>{event.name}</span>
                </div>
                <span className={`text-[15px] font-medium ${eventsMetric === 'profit' ? 'text-green-600' : 'text-pink-600'}`}>
                  {formatCurrency(getEventValue(event))}
                </span>
              </div>
            ))}
          </div>
        </div>


        {/* Top Stores */}
        <div className="bg-[#fafafc] border border-gray-100 rounded-3xl p-5 flex flex-col" style={{ width: '30%' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400 font-medium uppercase tracking-wide">Top Stores</p>
            <div className="flex gap-1">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setStoresAgg('total')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    storesAgg === 'total'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Total
                </button>
                <button
                  onClick={() => setStoresAgg('average')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    storesAgg === 'average'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Average
                </button>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setStoresMetric('revenue')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    storesMetric === 'revenue'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setStoresMetric('profit')}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-all ${
                    storesMetric === 'profit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  Profit
                </button>
              </div>
            </div>
          </div>
          {sortedStores.length > 0 ? (
            <div className="space-y-3.5 mt-auto">
              {sortedStores.map((store, index) => (
                <div key={store.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? (storesMetric === 'profit' ? 'bg-green-500 text-white' : 'bg-pink-500 text-white') : 'bg-gray-100 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-[15px] text-gray-700 truncate max-w-[200px]" title={store.name}>{store.name}</span>
                  </div>
                  <span className={`text-[15px] font-medium ${storesMetric === 'profit' ? 'text-green-600' : 'text-pink-600'}`}>
                    {formatCurrency(getStoreValue(store))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">No store data yet</p>
          )}
        </div>

      </div>

      {/* Row 3 - Profit Margins */}
      <div className="flex gap-4" style={{ height: '320px' }}>
        {/* Profit Margin by Event - Line Chart */}
        <div className="bg-[#fafafc] border border-gray-100 rounded-3xl px-5 pt-4 pb-2" style={{ width: '50%' }}>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-1">Profit Margin by Event</p>
          <ResponsiveContainer width="100%" height={270} minWidth={100}>
            <LineChart data={marginByEvent} margin={{ top: 10, left: -10, right: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={(props) => {
                  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
                  const words = payload.value.split(' ');
                  const lines: string[] = [];
                  let currentLine = '';
                  for (const word of words) {
                    if (currentLine.length + word.length > 10) {
                      if (currentLine) lines.push(currentLine.trim());
                      currentLine = word + ' ';
                    } else {
                      currentLine += word + ' ';
                    }
                  }
                  if (currentLine.trim()) lines.push(currentLine.trim());
                  return (
                    <text x={x} y={y} textAnchor="middle" fill="#374151" fontSize={11}>
                      {lines.map((line, i) => (
                        <tspan key={i} x={x} dy={i === 0 ? 14 : 13}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
                interval={0}
                height={70}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                domain={[minMargin, maxMargin]}
                tickFormatter={(v: number) => `${v}%`}
                type="number"
                scale="linear"
                allowDataOverflow={true}
              />
              <Tooltip
                formatter={(value: number | string | undefined) => [`${(value as number).toFixed(1)}%`, 'Margin']}
                labelFormatter={(label: ReactNode) => {
                  const labelStr = String(label);
                  const event = marginByEvent.find((e: MarginEntry) => e.name === labelStr);
                  return event ? `${event.fullName} (${event.count}x)` : labelStr;
                }}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke={CHART_PINK}
                strokeWidth={2}
                dot={{ fill: CHART_PINK, r: 4 }}
                activeDot={{ r: 6 }}
                name="Margin"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Profit Margin by Store - Line Chart */}
        <div className="bg-[#fafafc] border border-gray-100 rounded-3xl px-5 pt-4 pb-2" style={{ width: '50%' }}>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-1">Profit Margin by Store</p>
          <ResponsiveContainer width="100%" height={270} minWidth={100}>
            <LineChart data={marginByStore} margin={{ top: 10, left: -10, right: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={(props) => {
                  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
                  const words = payload.value.split(' ');
                  const lines: string[] = [];
                  let currentLine = '';
                  for (const word of words) {
                    if (currentLine.length + word.length > 10) {
                      if (currentLine) lines.push(currentLine.trim());
                      currentLine = word + ' ';
                    } else {
                      currentLine += word + ' ';
                    }
                  }
                  if (currentLine.trim()) lines.push(currentLine.trim());
                  return (
                    <text x={x} y={y} textAnchor="middle" fill="#374151" fontSize={11}>
                      {lines.map((line, i) => (
                        <tspan key={i} x={x} dy={i === 0 ? 14 : 13}>
                          {line}
                        </tspan>
                      ))}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
                interval={0}
                height={70}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#374151' }}
                axisLine={false}
                tickLine={false}
                domain={[minMargin, maxMargin]}
                tickFormatter={(v: number) => `${v}%`}
                type="number"
                scale="linear"
                allowDataOverflow={true}
              />
              <Tooltip
                formatter={(value: number | string | undefined) => [`${(value as number).toFixed(1)}%`, 'Margin']}
              />
              <Line
                type="monotone"
                dataKey="margin"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6 }}
                name="Margin"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>
    </div>
  );
}
