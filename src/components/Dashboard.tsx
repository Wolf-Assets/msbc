import { useState, useEffect } from 'react';
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

const CHART_PINK = '#ec4899';

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events and deliveries on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/events').then(res => res.json()),
      fetch('/api/deliveries').then(res => res.json()),
    ])
      .then(([eventsData, deliveriesData]) => {
        setEvents(eventsData);
        // Filter out archived deliveries
        setDeliveries((deliveriesData as Delivery[]).filter(d => !d.deletedAt));
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

  // Top events by revenue
  const topEventsByRevenue = [...eventsWithSales]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 6);

  // Profit margin by event (for line chart) - sorted by date
  const marginByEvent = eventsWithSales
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .map(e => ({
      name: e.name,
      fullName: e.name,
      margin: e.totalRevenue > 0 ? (e.netProfit / e.totalRevenue) * 100 : 0,
      date: new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

  // Fixed margin range for Y axis (60-80%)
  const minMargin = 60;
  const maxMargin = 80;

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
    avgRevenue: dayOfWeekData[day] ? dayOfWeekData[day].revenue / dayOfWeekData[day].count : 0,
    count: dayOfWeekData[day]?.count || 0,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
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
      <div className="grid grid-cols-4 gap-4 auto-rows-[140px]" style={{ gridTemplateRows: '100px repeat(auto-fill, 140px)' }}>

        {/* Total Revenue */}
        <div className="col-span-2 row-span-1 bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-pink-100 text-xs font-medium uppercase tracking-wide">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-pink-200 text-xs mt-1">From {eventsWithSales.length} events and {deliveriesWithRevenue.length} deliveries</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{formatCurrency(totalRevenue / (totalSources || 1))}</p>
            <p className="text-pink-200 text-xs">avg per source</p>
          </div>
        </div>

        {/* Total Profit */}
        <div className="col-span-1 row-span-1 bg-green-50 border border-green-100 rounded-3xl p-4 flex flex-col justify-center">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total Profit</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalProfit)}</p>
          <p className="text-xs text-green-500 mt-1">{formatCurrency(totalProfit / (totalSources || 1))} avg</p>
        </div>

        {/* Profit Margin */}
        <div className="col-span-1 row-span-1 bg-[#fafafc] border border-gray-100 rounded-3xl p-4 flex flex-col justify-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Profit Margin</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{profitMargin.toFixed(1)}%</p>
          <p className="text-xs text-gray-400 mt-1">overall</p>
        </div>

        {/* Monthly Trend - Area Chart */}
        <div className="col-span-2 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-3">Monthly Revenue Trend</p>
          <ResponsiveContainer width="100%" height={220} minWidth={100}>
            <AreaChart data={monthlyTrend} margin={{ top: 10, left: -20, right: -20 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_PINK} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={CHART_PINK} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} type="number" scale="linear" />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke={CHART_PINK} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Events by Revenue */}
        <div className="col-span-1 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-3">Top Events</p>
          <div className="space-y-2.5">
            {topEventsByRevenue.map((event, index) => (
              <div key={event.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate max-w-[180px]" title={event.name}>{event.name}</span>
                </div>
                <span className="text-sm font-medium text-pink-600">{formatCurrency(event.totalRevenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Venue Performance - Repeated Locations */}
        <div className="col-span-1 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-3">Repeat Venues</p>
          {venuePerformance.length > 0 ? (
            <div className="space-y-2.5">
              {venuePerformance.slice(0, 5).map((venue) => (
                <div key={venue.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-pink-100 text-pink-600">
                      {venue.visits}x
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-[200px]" title={venue.name}>{venue.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(venue.avgRevenue)}</p>
                    <p className="text-xs text-gray-400">avg</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">No repeat venues yet</p>
          )}
        </div>

        {/* Profit Margin by Event - Line Chart */}
        <div className="col-span-2 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-3">Profit Margin by Event</p>
          <ResponsiveContainer width="100%" height={220} minWidth={100}>
            <LineChart data={marginByEvent} margin={{ top: 10, left: -10, right: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={(props) => {
                  const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
                  // Split by spaces first, then chunk if words are too long
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
                domain={[60, 80]}
                ticks={[60, 65, 70, 75, 80]}
                tickFormatter={(v) => `${v}%`}
                type="number"
                scale="linear"
                allowDataOverflow={true}
              />
              <Tooltip
                formatter={(value) => [`${(value as number).toFixed(1)}%`, 'Margin']}
                labelFormatter={(label) => {
                  const event = marginByEvent.find(e => e.name === label);
                  return event ? `${event.fullName} (${event.date})` : label;
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

        {/* Revenue by Day of Week */}
        <div className="col-span-2 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5">
          <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mb-3">Revenue by Day of Week</p>
          <ResponsiveContainer width="100%" height={220} minWidth={100}>
            <BarChart data={revenueByDay} margin={{ left: -20, right: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} type="number" scale="linear" />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value as number),
                  name === 'avgRevenue' ? 'Avg Revenue' : 'Total Revenue'
                ]}
                labelFormatter={(label) => {
                  const day = revenueByDay.find(d => d.day === label);
                  return day ? `${label} (${day.count} source${day.count > 1 ? 's' : ''})` : label;
                }}
              />
              <Bar dataKey="avgRevenue" fill={CHART_PINK} radius={[4, 4, 0, 0]} name="avgRevenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>


      </div>
    </div>
  );
}
