import { useState, useEffect } from 'react';

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
  notes: string | null;
}

interface EventsTableProps {
  initialEvents: Event[];
}

type SortColumn = 'name' | 'eventDate' | 'totalPrepared' | 'totalSold' | 'totalGiveaway' | 'totalRevenue' | 'totalCost' | 'netProfit';

export default function EventsTable({ initialEvents }: EventsTableProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('eventDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Reset pending delete after 3 seconds
  useEffect(() => {
    if (pendingDelete) {
      const timer = setTimeout(() => setPendingDelete(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingDelete]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection(column === 'eventDate' ? 'desc' : 'desc');
    }
  };

  const addEvent = async () => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Event',
          eventDate: new Date().toISOString().split('T')[0],
          totalPrepared: 0,
          totalSold: 0,
          totalGiveaway: 0,
          totalRevenue: 0,
          totalCost: 0,
          netProfit: 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to add');

      const newEvent = await response.json();
      setEvents((prev) => [...prev, newEvent]);
      showToast('Added new event');
    } catch {
      showToast('Failed to add event', 'error');
    }
  };

  const handleDeleteClick = async (id: number) => {
    // First click: show confirmation state
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }

    // Second click: actually delete
    try {
      const response = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      setEvents((prev) => prev.filter((e) => e.id !== id));
      setPendingDelete(null);
      showToast('Deleted');
    } catch {
      showToast('Failed to delete', 'error');
      setPendingDelete(null);
    }
  };

  // Sort events by selected column
  const sortedEvents = [...events].sort((a, b) => {
    let comparison = 0;

    if (sortColumn === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === 'eventDate') {
      comparison = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    } else {
      comparison = a[sortColumn] - b[sortColumn];
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Calculate totals
  const totals = {
    prepared: events.reduce((sum, e) => sum + e.totalPrepared, 0),
    sold: events.reduce((sum, e) => sum + e.totalSold, 0),
    giveaway: events.reduce((sum, e) => sum + e.totalGiveaway, 0),
    revenue: events.reduce((sum, e) => sum + e.totalRevenue, 0),
    cost: events.reduce((sum, e) => sum + e.totalCost, 0),
    profit: events.reduce((sum, e) => sum + e.netProfit, 0),
  };

  // Calculate metrics
  const eventsWithSales = events.filter(e => e.totalSold > 0).length;
  const avgProfitPerEvent = eventsWithSales > 0 ? totals.profit / eventsWithSales : 0;
  const avgRevenuePerEvent = eventsWithSales > 0 ? totals.revenue / eventsWithSales : 0;
  const profitMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const sellThroughRate = totals.prepared > 0 ? (totals.sold / totals.prepared) * 100 : 0;

  return (
    <div>
      {/* Floating Card Container */}
      <div className="w-full bg-[#fafafc] rounded-3xl overflow-hidden">
        {/* Header inside card */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Events</h2>
            <p className="text-sm text-gray-400 mt-1">Track your sales events and performance.</p>
          </div>
          <button
            onClick={addEvent}
            className="px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium text-sm hover:bg-pink-600 transition-all hover:shadow-lg hover:shadow-pink-200 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        </div>

        {/* Stats Grid - Moved to top */}
        {events.length > 0 && (
          <div className="px-8 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Sell-through Rate"
                value={`${sellThroughRate.toFixed(1)}%`}
                sublabel={`${totals.sold.toLocaleString()} of ${totals.prepared.toLocaleString()} sold`}
                highlight
              />
              <StatCard
                label="Profit Margin"
                value={`${profitMargin.toFixed(1)}%`}
                sublabel={`${formatCurrency(totals.profit)} total profit`}
              />
              <StatCard
                label="Avg. Revenue/Event"
                value={formatCurrency(avgRevenuePerEvent)}
                sublabel={`${eventsWithSales} events with sales`}
              />
              <StatCard
                label="Avg. Profit/Event"
                value={formatCurrency(avgProfitPerEvent)}
                sublabel="per event with sales"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="px-4 pb-4">
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="Event Name" column="name" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-52" />
                <SortableHeader label="Date" column="eventDate" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-28" />
                <SortableHeader label="Prepared" column="totalPrepared" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                <SortableHeader label="Sold" column="totalSold" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-14 text-center" />
                <SortableHeader label="Giveaway" column="totalGiveaway" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                <SortableHeader label="Revenue" column="totalRevenue" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                <SortableHeader label="COGS" column="totalCost" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-right" />
                <SortableHeader label="Profit" column="netProfit" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event) => (
                <tr key={event.id} className="group">
                  <td>
                    <a
                      href={`/events/${event.id}`}
                      className="editable-cell text-pink-600 hover:text-pink-700 font-medium cursor-pointer"
                    >
                      {event.name}
                    </a>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-600 text-sm whitespace-nowrap">
                      {formatDate(event.eventDate)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-600 text-sm text-center justify-center">
                      {event.totalPrepared}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-600 text-sm text-center justify-center">
                      {event.totalSold}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-600 text-sm text-center justify-center">
                      {event.totalGiveaway}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end whitespace-nowrap">
                      {event.totalRevenue > 0 ? (
                        <span className="text-gray-900 font-medium">{formatCurrency(event.totalRevenue)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end whitespace-nowrap">
                      {event.totalCost > 0 ? (
                        <span className="text-gray-600">{formatCurrency(event.totalCost)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end whitespace-nowrap">
                      {event.netProfit > 0 ? (
                        <span className="text-green-600 font-medium">{formatCurrency(event.netProfit)}</span>
                      ) : event.netProfit < 0 ? (
                        <span className="text-red-500 font-medium">{formatCurrency(event.netProfit)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteClick(event.id)}
                      className={`p-2 transition-all ${
                        pendingDelete === event.id
                          ? 'opacity-100 text-red-500'
                          : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500'
                      }`}
                      title={pendingDelete === event.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <svg className={`w-4 h-4 ${pendingDelete === event.id ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              {events.length > 0 && (
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                  <td>
                    <span className="editable-cell font-bold text-gray-900">Total</span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-400 text-sm">
                      {events.length} events
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {totals.prepared.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {totals.sold.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {totals.giveaway.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(totals.revenue)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(totals.cost)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end whitespace-nowrap">
                      {totals.profit >= 0 ? (
                        <span className="text-green-600 font-bold">{formatCurrency(totals.profit)}</span>
                      ) : (
                        <span className="text-red-500 font-bold">{formatCurrency(totals.profit)}</span>
                      )}
                    </span>
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>

          {events.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No events yet. Click "Add Event" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, sublabel, highlight }: { label: string; value: string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border ${highlight ? 'bg-pink-50 border-pink-100' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-pink-600' : 'text-gray-900'}`}>{value}</p>
      {sublabel && <p className="text-sm text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}

// Sortable Header Component
function SortableHeader({
  label,
  column,
  currentColumn,
  direction,
  onSort,
  className = '',
}: {
  label: string;
  column: SortColumn;
  currentColumn: SortColumn;
  direction: 'asc' | 'desc';
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const isActive = currentColumn === column;
  const isRight = className.includes('text-right');
  const isCenter = className.includes('text-center');

  return (
    <th
      className={`cursor-pointer select-none hover:bg-gray-50 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1 ${isRight ? 'justify-end' : isCenter ? 'justify-center' : ''}`}>
        <span>{label}</span>
        {isActive && (
          <svg
            className={`w-3 h-3 text-pink-500 transition-transform ${direction === 'desc' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </div>
    </th>
  );
}
