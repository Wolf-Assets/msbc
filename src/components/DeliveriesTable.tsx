'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Delivery {
  id: number;
  storeName: string;
  datePrepared: string;
  dropoffDate: string | null;
  expirationDate: string | null;
  totalPrepared: number;
  totalCogs: number;
  totalRevenue: number;
  grossProfit: number;
  profitMargin: number;
  notes: string | null;
  deletedAt?: string | null;
}

type SortColumn = 'id' | 'storeName' | 'datePrepared' | 'dropoffDate' | 'totalPrepared' | 'totalRevenue' | 'totalCogs' | 'grossProfit';

export default function DeliveriesTable() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch deliveries (active or archived)
  const fetchDeliveries = (archived = false) => {
    setLoading(true);
    const url = archived ? '/api/deliveries?archived=true' : '/api/deliveries';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setDeliveries(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('Failed to load deliveries', 'error');
      });
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showArchived, setShowArchived] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const toggleArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    fetchDeliveries(next);
  };

  const restoreDelivery = async (id: number) => {
    try {
      const response = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, deletedAt: null }),
      });
      if (!response.ok) throw new Error('Failed to restore');
      setDeliveries(prev => prev.filter(d => d.id !== id));
      showToast('Delivery restored');
    } catch {
      showToast('Failed to restore delivery', 'error');
    }
  };

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
      setSortDirection(column === 'datePrepared' || column === 'dropoffDate' ? 'desc' : 'desc');
    }
  };

  const addDelivery = async () => {
    try {
      const response = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: 'New Delivery',
          datePrepared: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) throw new Error('Failed to add');

      const newDelivery = await response.json();
      // Redirect to the new delivery's detail page
      router.push(`/deliveries/${newDelivery.id}`);
    } catch {
      showToast('Failed to add delivery', 'error');
    }
  };

  // Sort deliveries by selected column
  const sortedDeliveries = [...deliveries].sort((a, b) => {
    let comparison = 0;

    if (sortColumn === 'id') {
      comparison = a.id - b.id;
    } else if (sortColumn === 'storeName') {
      comparison = a.storeName.localeCompare(b.storeName);
    } else if (sortColumn === 'datePrepared') {
      comparison = new Date(a.datePrepared).getTime() - new Date(b.datePrepared).getTime();
    } else if (sortColumn === 'dropoffDate') {
      const aDate = a.dropoffDate ? new Date(a.dropoffDate).getTime() : 0;
      const bDate = b.dropoffDate ? new Date(b.dropoffDate).getTime() : 0;
      comparison = aDate - bDate;
    } else {
      comparison = a[sortColumn] - b[sortColumn];
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Calculate totals
  const totals = {
    prepared: deliveries.reduce((sum, d) => sum + d.totalPrepared, 0),
    revenue: deliveries.reduce((sum, d) => sum + d.totalRevenue, 0),
    cogs: deliveries.reduce((sum, d) => sum + d.totalCogs, 0),
    profit: deliveries.reduce((sum, d) => sum + d.grossProfit, 0),
  };

  // Calculate metrics
  const deliveriesWithRevenue = deliveries.filter(d => d.totalRevenue > 0).length;
  const profitMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const avgRevenuePerDelivery = deliveriesWithRevenue > 0 ? totals.revenue / deliveriesWithRevenue : 0;
  const avgProfitPerDelivery = deliveriesWithRevenue > 0 ? totals.profit / deliveriesWithRevenue : 0;

  if (loading) {
    return (
      <div className="w-full bg-[#fafafc] rounded-3xl overflow-hidden p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Floating Card Container */}
      <div className="w-full bg-[#fafafc] rounded-3xl overflow-hidden">
        {/* Header inside card */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Deliveries</h2>
            <p className="text-sm text-gray-400 mt-1">Track your consignment store deliveries and performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleArchived}
              className={`px-5 py-2.5 border rounded-full font-medium text-sm transition-all hover:shadow-md flex items-center gap-2 ${
                showArchived
                  ? 'bg-gray-900 border-gray-900 text-white hover:bg-gray-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archived
            </button>
            <button
              onClick={addDelivery}
              className="px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium text-sm hover:bg-pink-600 transition-all hover:shadow-lg hover:shadow-pink-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Delivery
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {deliveries.length > 0 && (
          <div className="px-8 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Cookies"
                value={totals.prepared.toLocaleString()}
                sublabel={`across ${deliveries.length} deliveries`}
                highlight
              />
              <StatCard
                label="Profit Margin"
                value={`${profitMargin.toFixed(1)}%`}
                sublabel={`${formatCurrency(totals.profit)} total profit`}
              />
              <StatCard
                label="Avg. Revenue/Delivery"
                value={formatCurrency(avgRevenuePerDelivery)}
                sublabel={`${deliveriesWithRevenue} deliveries with revenue`}
              />
              <StatCard
                label="Avg. Profit/Delivery"
                value={formatCurrency(avgProfitPerDelivery)}
                sublabel="per delivery with revenue"
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="px-4 pb-4">
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="#" column="id" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-12 text-center" />
                <SortableHeader label="Store" column="storeName" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-52" />
                <SortableHeader label="Date Prepared" column="datePrepared" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-28" />
                <SortableHeader label="Dropoff Date" column="dropoffDate" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-28" />
                <SortableHeader label="Prepared" column="totalPrepared" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                <SortableHeader label="Revenue" column="totalRevenue" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                <SortableHeader label="COGS" column="totalCogs" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-right" />
                <SortableHeader label="Profit" column="grossProfit" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                {showArchived && <th className="w-20"><span className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase"></span></th>}
              </tr>
            </thead>
            <tbody>
              {sortedDeliveries.map((delivery) => (
                <tr
                  key={delivery.id}
                  className="group cursor-pointer hover:bg-pink-50 transition-colors"
                  onClick={() => router.push(`/deliveries/${delivery.id}`)}
                >
                  <td>
                    <span className="px-2 py-3 min-h-[44px] flex items-center justify-center text-gray-400 text-sm">
                      {delivery.id}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-pink-600 font-medium text-sm">
                      {delivery.storeName}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-gray-600 text-sm whitespace-nowrap">
                      {formatDate(delivery.datePrepared)}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-gray-600 text-sm whitespace-nowrap">
                      {delivery.dropoffDate ? formatDate(delivery.dropoffDate) : <span className="text-gray-300">--</span>}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm">
                      {delivery.totalPrepared}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {delivery.totalRevenue > 0 ? (
                        <span className="text-gray-900 font-medium">{formatCurrency(delivery.totalRevenue)}</span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {delivery.totalCogs > 0 ? (
                        <span className="text-gray-600">{formatCurrency(delivery.totalCogs)}</span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {delivery.grossProfit > 0 ? (
                        <span className="text-green-600 font-medium">{formatCurrency(delivery.grossProfit)}</span>
                      ) : delivery.grossProfit < 0 ? (
                        <span className="text-red-500 font-medium">{formatCurrency(delivery.grossProfit)}</span>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </span>
                  </td>
                  {showArchived && (
                    <td>
                      <span className="px-4 py-3 min-h-[44px] flex items-center justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); restoreDelivery(delivery.id); }}
                          className="text-xs font-medium text-pink-500 hover:text-pink-600"
                        >
                          Restore
                        </button>
                      </span>
                    </td>
                  )}
                </tr>
              ))}
              {/* Totals Row */}
              {deliveries.length > 0 && (
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                  <td></td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center font-bold text-gray-900 text-sm">Total</span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-gray-400 text-sm">
                      {deliveries.length} deliveries
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-gray-400 text-sm" />
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold">
                      {totals.prepared.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(totals.revenue)}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(totals.cogs)}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {totals.profit >= 0 ? (
                        <span className="text-green-600 font-bold">{formatCurrency(totals.profit)}</span>
                      ) : (
                        <span className="text-red-500 font-bold">{formatCurrency(totals.profit)}</span>
                      )}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {deliveries.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No deliveries yet. Click &quot;Add Delivery&quot; to get started.
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
