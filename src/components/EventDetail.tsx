import { useState, useRef, useEffect, useCallback } from 'react';
import type { ComponentType } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/style.css';

// Type definitions for Apple MapKit JS
interface MapKitCoordinate {
  latitude: number;
  longitude: number;
}

interface MapKitCoordinateRegion {
  center: MapKitCoordinate;
  span: MapKitCoordinateSpan;
}

interface MapKitCoordinateSpan {
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapKitGeocoderResult {
  coordinate: MapKitCoordinate;
  formattedAddress?: string;
}

interface MapKitGeocoderResponse {
  results: MapKitGeocoderResult[];
}

interface MapKitMap {
  region: MapKitCoordinateRegion;
  addAnnotation: (annotation: MapKitMarkerAnnotation) => void;
  destroy: () => void;
}

interface MapKitMarkerAnnotation {
  coordinate: MapKitCoordinate;
  color?: string;
  title?: string;
}

interface MapKitGeocoder {
  lookup: (
    query: string,
    callback: (error: Error | null, data: MapKitGeocoderResponse | null) => void
  ) => void;
}

interface MapKitInitOptions {
  authorizationCallback: (done: (token: string) => void) => void;
}

interface MapKitMapOptions {
  colorScheme?: string;
  showsCompass?: string;
  showsZoomControl?: boolean;
  showsMapTypeControl?: boolean;
}

interface MapKitStatic {
  init: (options: MapKitInitOptions) => void;
  Map: {
    new (container: HTMLElement, options?: MapKitMapOptions): MapKitMap;
    ColorSchemes: {
      Light: string;
      Dark: string;
    };
  };
  Geocoder: {
    new (): MapKitGeocoder;
  };
  MarkerAnnotation: {
    new (coordinate: MapKitCoordinate, options?: { color?: string; title?: string }): MapKitMarkerAnnotation;
  };
  CoordinateRegion: {
    new (center: MapKitCoordinate, span: MapKitCoordinateSpan): MapKitCoordinateRegion;
  };
  CoordinateSpan: {
    new (latitudeDelta: number, longitudeDelta: number): MapKitCoordinateSpan;
  };
  FeatureVisibility: {
    Hidden: string;
    Visible: string;
  };
}

// Extend Window interface to include mapkit
declare global {
  interface Window {
    mapkit?: MapKitStatic;
  }
}

// Type for React-Quill component props
interface QuillEditorProps {
  theme: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  modules: QuillModules;
  formats: string[];
  placeholder: string;
}

interface QuillModules {
  toolbar: (string | { list: string })[][];
}

// Type for dynamically loaded Quill component
type QuillComponentType = ComponentType<QuillEditorProps>;

// Apple MapKit JS Token (from environment variable)
const MAPKIT_TOKEN = import.meta.env.PUBLIC_MAPKIT_TOKEN;

interface Event {
  id: number;
  name: string;
  eventDate: string;
  location: string | null;
  eventCost: number;
  totalPrepared: number;
  totalSold: number;
  totalGiveaway: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  cashCollected: number;
  venmoCollected: number;
  otherCollected: number;
  notes: string | null;
}

interface EventItem {
  id: number;
  eventId: number;
  flavorName: string;
  prepared: number;
  remaining: number;
  giveaway: number;
  sold: number;
  revenue: number;
  unitCost: number | null;
  cogs: number;
  profit: number;
}

interface Flavor {
  id: number;
  name: string;
  unitPrice: number;
  unitCost: number | null;
}

interface EventDetailProps {
  eventId: number;
}

export default function EventDetail({ eventId }: EventDetailProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [items, setItems] = useState<EventItem[]>([]);
  const [availableFlavors, setAvailableFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch data on mount - events API returns items with event when fetching by ID
  useEffect(() => {
    Promise.all([
      fetch(`/api/events?id=${eventId}`).then(res => res.json()),
      fetch('/api/flavors').then(res => res.json()),
    ])
      .then(([eventData, flavorsData]) => {
        const { items: eventItems, ...eventOnly } = eventData;
        setEvent(eventOnly);
        setItems(eventItems || []);
        setAvailableFlavors(flavorsData);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [eventId]);
  const [editingDate, setEditingDate] = useState(false);
  const [showAddFlavor, setShowAddFlavor] = useState(false);
  const [addFlavorMode, setAddFlavorMode] = useState<'select' | 'custom'>('select');
  const [selectedFlavorId, setSelectedFlavorId] = useState<number | ''>('');
  const [customFlavorName, setCustomFlavorName] = useState('');
  const [newItemData, setNewItemData] = useState({
    prepared: 0,
    unitCost: '',
  });
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState(false);
  // Sorting state
  type SortColumn = 'id' | 'flavorName' | 'prepared' | 'remaining' | 'giveaway' | 'sold' | 'revenue' | 'unitCost' | 'cogs' | 'profit';
  const [sortColumn, setSortColumn] = useState<SortColumn>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  // Track which items use base cost vs custom cost (per item)
  const [useBaseCost, setUseBaseCost] = useState<Record<number, boolean>>({});

  // Initialize useBaseCost when items and flavors are loaded
  useEffect(() => {
    if (items.length > 0 && availableFlavors.length > 0) {
      const initial: Record<number, boolean> = {};
      items.forEach(item => {
        const matchingFlavor = availableFlavors.find(f => f.name === item.flavorName);
        initial[item.id] = matchingFlavor?.unitCost === item.unitCost;
      });
      setUseBaseCost(initial);
    }
  }, [items, availableFlavors]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // Reset pending delete after 3 seconds
  useEffect(() => {
    if (pendingDeleteEvent) {
      const timer = setTimeout(() => setPendingDeleteEvent(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [pendingDeleteEvent]);

  const handleDeleteEvent = async () => {
    // First click: show confirmation state
    if (!pendingDeleteEvent) {
      setPendingDeleteEvent(true);
      return;
    }

    // Second click: actually delete
    try {
      const response = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      // Redirect to events page
      window.location.href = '/events';
    } catch {
      showToast('Failed to delete event', 'error');
      setPendingDeleteEvent(false);
    }
  };

  // Get flavor ID for an item
  const getFlavorId = (flavorName: string): number => {
    const matchingFlavor = availableFlavors.find(f => f.name === flavorName);
    return matchingFlavor ? matchingFlavor.id : 9999; // Sort items without matching flavor to end
  };

  // Sorting function
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal: number | string;
    let bVal: number | string;

    if (sortColumn === 'id') {
      aVal = getFlavorId(a.flavorName);
      bVal = getFlavorId(b.flavorName);
    } else if (sortColumn === 'flavorName') {
      aVal = a.flavorName.toLowerCase();
      bVal = b.flavorName.toLowerCase();
    } else {
      aVal = a[sortColumn] ?? 0;
      bVal = b[sortColumn] ?? 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const resetAddFlavorForm = () => {
    setAddFlavorMode('select');
    setSelectedFlavorId('');
    setCustomFlavorName('');
    setNewItemData({ prepared: 0, unitCost: '' });
  };

  const handleAddFlavor = async () => {
    let flavorName = '';
    let unitCost: number | null = null;

    if (addFlavorMode === 'select' && selectedFlavorId) {
      const selectedFlavor = availableFlavors.find(f => f.id === selectedFlavorId);
      if (selectedFlavor) {
        flavorName = selectedFlavor.name;
        unitCost = newItemData.unitCost ? parseFloat(newItemData.unitCost) : selectedFlavor.unitCost;
      }
    } else if (addFlavorMode === 'custom' && customFlavorName.trim()) {
      flavorName = customFlavorName.trim();
      unitCost = newItemData.unitCost ? parseFloat(newItemData.unitCost) : null;
    }

    if (!flavorName) {
      showToast('Please select or enter a flavor name', 'error');
      return;
    }

    try {
      const response = await fetch('/api/event-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          flavorName,
          prepared: newItemData.prepared || 0,
          remaining: newItemData.prepared || 0,
          giveaway: 0,
          sold: 0,
          revenue: 0,
          unitCost,
          cogs: 0,
          profit: 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to add');

      const newItem = await response.json();
      setItems(prev => [...prev, newItem]);
      setShowAddFlavor(false);
      resetAddFlavorForm();
      showToast('Flavor added');

      // Refresh event totals
      const eventResponse = await fetch(`/api/events?id=${event.id}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
      }
    } catch {
      showToast('Failed to add flavor', 'error');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const updateEventDate = async (newDate: Date | null) => {
    if (!newDate) return;

    const dateStr = newDate.toISOString().split('T')[0];

    // Optimistic update
    setEvent((prev) => ({ ...prev, eventDate: dateStr }));
    setEditingDate(false);

    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, eventDate: dateStr }),
      });

      if (!response.ok) throw new Error('Failed to update');
      showToast('Date updated');
    } catch {
      showToast('Failed to update date', 'error');
      // Refetch event on error
      fetch(`/api/events?id=${eventId}`).then(res => res.json()).then(setEvent);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const updateEvent = async (field: string, value: string | number) => {
    // Optimistic update
    setEvent((prev) => ({ ...prev, [field]: value }));

    try {
      const response = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, [field]: value }),
      });

      if (!response.ok) throw new Error('Failed to update');
      showToast('Saved');
    } catch {
      showToast('Failed to save', 'error');
      // Refetch event on error
      fetch(`/api/events?id=${eventId}`).then(res => res.json()).then(setEvent);
    }
  };

  const updateItem = async (itemId: number, field: string, value: number | null) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Calculate derived values
    let updates: Partial<EventItem> = { [field]: value };

    // Get the values we need for calculations
    const prepared = field === 'prepared' ? (value as number) : item.prepared;
    const sold = field === 'sold' ? (value as number) : item.sold;
    const giveaway = field === 'giveaway' ? (value as number) : item.giveaway;
    const unitCost = field === 'unitCost' ? (value as number | null) : item.unitCost;

    // Calculate remaining = prepared - sold - giveaway
    const remaining = Math.max(0, prepared - sold - giveaway);
    updates.remaining = remaining;

    // Calculate revenue = sold * unitPrice (from flavor)
    const flavor = availableFlavors.find(f => f.name === item.flavorName);
    const unitPrice = flavor?.unitPrice || 5; // Default to $5 if not found
    const revenue = sold * unitPrice;
    updates.revenue = revenue;

    // Calculate COGS = sold * unitCost
    const cogs = unitCost ? sold * unitCost : 0;
    updates.cogs = cogs;

    // Calculate profit = revenue - cogs
    updates.profit = revenue - cogs;

    // Optimistic update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));

    try {
      const response = await fetch('/api/event-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, eventId: event.id, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Refresh event totals
      const eventResponse = await fetch(`/api/events?id=${event.id}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
      }
    } catch {
      showToast('Failed to save', 'error');
      // Refetch items on error
      fetch(`/api/event-items?eventId=${eventId}`).then(res => res.json()).then(setItems);
    }
  };

  const getBaseCost = (flavorName: string): number | null => {
    const flavor = availableFlavors.find(f => f.name === flavorName);
    return flavor?.unitCost || null;
  };

  const toggleBaseCost = async (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newUseBase = !useBaseCost[itemId];
    setUseBaseCost(prev => ({ ...prev, [itemId]: newUseBase }));

    if (newUseBase) {
      const baseCost = getBaseCost(item.flavorName);
      if (baseCost !== null) {
        await updateItem(itemId, 'unitCost', baseCost);
      }
    }
  };

  const deleteItem = async (itemId: number) => {
    // Optimistic update
    setItems(prev => prev.filter(i => i.id !== itemId));

    try {
      const response = await fetch('/api/event-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, eventId: event.id }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      showToast('Item deleted');

      // Refresh event totals
      const eventResponse = await fetch(`/api/events?id=${event.id}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
      }
    } catch {
      showToast('Failed to delete', 'error');
      // Refetch items on error
      fetch(`/api/event-items?eventId=${eventId}`).then(res => res.json()).then(setItems);
    }
  };

  // Loading state
  if (loading || !event) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculated metrics
  const sellThroughRate = event.totalPrepared > 0
    ? ((event.totalSold / event.totalPrepared) * 100).toFixed(1)
    : '0';

  const grossMargin = event.totalRevenue > 0
    ? ((event.netProfit / event.totalRevenue) * 100).toFixed(1)
    : '0';

  const avgPricePerUnit = event.totalSold > 0
    ? (event.totalRevenue / event.totalSold).toFixed(2)
    : '0.00';

  const revenueEfficiency = event.totalPrepared > 0
    ? (event.totalRevenue / event.totalPrepared).toFixed(2)
    : '0.00';


  return (
    <div className="space-y-6">
      {/* Back link */}
      <a
        href="/events"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </a>

      {/* 80/20 Layout */}
      <div className="flex gap-6">
        {/* Left side - 80% */}
        <div className="flex-[4]">
          {/* Event Header Card */}
          <div
            className="bg-white rounded-3xl overflow-hidden"
            style={{
              boxShadow: '0 8px 60px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-baseline gap-x-3">
            <EditableText
              value={event.name}
              onSave={(value) => updateEvent('name', value)}
              className="text-3xl font-bold text-gray-900"
            />
            <span className="text-2xl text-pink-400 shrink-0" style={{ fontFamily: 'Geist, system-ui, sans-serif' }}>@</span>
            <div className="relative shrink-0">
              <button
                onClick={() => setEditingDate(!editingDate)}
                className="text-2xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 -ml-2 rounded transition-colors whitespace-nowrap text-left"
              >
                {formatDate(event.eventDate)}
              </button>
              {editingDate && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setEditingDate(false)} />
                  <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
                    <DayPicker
                      mode="single"
                      selected={new Date(event.eventDate + 'T00:00:00')}
                      defaultMonth={new Date(event.eventDate + 'T00:00:00')}
                      onSelect={(date) => date && updateEventDate(date)}
                      className="!font-sans"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="ml-auto shrink-0 flex items-center gap-1">
              <span className="text-lg text-gray-400">Fee:</span>
              <EditableNumber
                value={event.eventCost}
                onSave={(value) => updateEvent('eventCost', value)}
                className="text-xl font-medium text-gray-600"
                isCurrency
              />
            </div>
          </div>
        </div>

        {/* Stats Grid - Calculated Metrics */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Sell-through"
              value={`${sellThroughRate}%`}
              sublabel={`${event.totalSold} of ${event.totalPrepared} sold`}
              highlight
            />
            <StatCard
              label="Gross Margin"
              value={`${grossMargin}%`}
              sublabel={`${formatCurrency(event.netProfit)} profit`}
            />
            <StatCard
              label="Avg. Price/Unit"
              value={`$${avgPricePerUnit}`}
              sublabel="actual sale price"
            />
            <StatCard
              label="Revenue/Prepared"
              value={`$${revenueEfficiency}`}
              sublabel="inventory efficiency"
            />
          </div>
        </div>

        {/* Details Section - inside same card */}
        <div className="px-4 pb-4">
          <div className="px-4 mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">Details</h3>
            <button
              onClick={() => setShowAddFlavor(true)}
              className="px-3 py-1.5 text-pink-600 hover:bg-pink-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Flavor
            </button>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No flavors added to this event yet.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <SortableHeader column="id" label="ID" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-12 text-center" />
                  <SortableHeader column="flavorName" label="Flavor" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} />
                  <SortableHeader column="prepared" label="Prepared" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                  <SortableHeader column="sold" label="Sold" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                  <SortableHeader column="giveaway" label="Giveaway" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                  <SortableHeader column="remaining" label="Left" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-center" />
                  <SortableHeader column="revenue" label="Revenue" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                  <th className="w-12 text-center">Base</th>
                  <SortableHeader column="unitCost" label="Cost" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-right" />
                  <SortableHeader column="cogs" label="COGS" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                  <SortableHeader column="profit" label="Profit" currentSort={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr key={item.id} className="group">
                    <td>
                      <span className="editable-cell text-gray-400 text-sm text-center justify-center">
                        {(() => {
                          const flavorId = getFlavorId(item.flavorName);
                          return flavorId !== 9999 ? flavorId : '—';
                        })()}
                      </span>
                    </td>
                    <td>
                      <span className="editable-cell font-medium text-gray-900">
                        {item.flavorName}
                      </span>
                    </td>
                    <td>
                      <EditableNumber
                        value={item.prepared}
                        onSave={(val) => updateItem(item.id, 'prepared', val)}
                        className="editable-cell text-gray-600 text-sm text-center justify-center"
                      />
                    </td>
                    <td>
                      <EditableNumber
                        value={item.sold}
                        onSave={(val) => updateItem(item.id, 'sold', val)}
                        className="editable-cell text-gray-600 text-sm text-center justify-center"
                      />
                    </td>
                    <td>
                      <EditableNumber
                        value={item.giveaway || 0}
                        onSave={(val) => updateItem(item.id, 'giveaway', val)}
                        className="editable-cell text-gray-600 text-sm text-center justify-center"
                      />
                    </td>
                    <td>
                      <span className="editable-cell text-gray-600 text-sm text-center justify-center">
                        {item.remaining}
                      </span>
                    </td>
                    <td>
                      <span className="editable-cell text-gray-600 text-sm text-right justify-end">
                        {item.revenue > 0 ? formatCurrency(item.revenue) : '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-center">
                        <button
                          onClick={() => toggleBaseCost(item.id)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            useBaseCost[item.id]
                              ? 'bg-pink-500 border-pink-500 text-white'
                              : 'border-gray-300 hover:border-pink-400'
                          }`}
                          title={useBaseCost[item.id] ? 'Using base cost' : 'Using custom cost'}
                        >
                          {useBaseCost[item.id] && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                    <td>
                      {useBaseCost[item.id] ? (
                        <span className="editable-cell text-sm text-right justify-end text-gray-600">
                          {item.unitCost ? formatCurrency(item.unitCost) : '—'}
                        </span>
                      ) : (
                        <EditableNumber
                          value={item.unitCost || 0}
                          onSave={(val) => updateItem(item.id, 'unitCost', val)}
                          isCurrency
                          className="editable-cell text-gray-600 text-sm text-right justify-end"
                        />
                      )}
                    </td>
                    <td>
                      <span className="editable-cell text-sm text-right justify-end text-gray-600">
                        {item.cogs > 0 ? formatCurrency(item.cogs) : '—'}
                      </span>
                    </td>
                    <td>
                      <span className="editable-cell text-sm text-right justify-end">
                        {item.profit > 0 ? (
                          <span className="text-green-600 font-medium">{formatCurrency(item.profit)}</span>
                        ) : item.profit < 0 ? (
                          <span className="text-red-500 font-medium">{formatCurrency(item.profit)}</span>
                        ) : (
                          '—'
                        )}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Delete item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                  <td></td>
                  <td>
                    <span className="editable-cell font-bold text-gray-900">Total</span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {items.reduce((sum, i) => sum + i.prepared, 0)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {items.reduce((sum, i) => sum + i.sold, 0)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {items.reduce((sum, i) => sum + (i.giveaway || 0), 0)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-gray-900 text-sm text-center justify-center font-semibold">
                      {items.reduce((sum, i) => sum + i.remaining, 0)}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end font-semibold text-gray-900">
                      {formatCurrency(items.reduce((sum, i) => sum + i.revenue, 0))}
                    </span>
                  </td>
                  <td></td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end text-gray-400">
                      —
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end font-semibold text-gray-900">
                      {formatCurrency(items.reduce((sum, i) => sum + i.cogs, 0))}
                    </span>
                  </td>
                  <td>
                    <span className="editable-cell text-sm text-right justify-end">
                      {(() => {
                        const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);
                        return totalProfit >= 0 ? (
                          <span className="text-green-600 font-bold">{formatCurrency(totalProfit)}</span>
                        ) : (
                          <span className="text-red-500 font-bold">{formatCurrency(totalProfit)}</span>
                        );
                      })()}
                    </span>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Notes Section */}
          <div className="px-4 mt-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Notes</h3>
            <NotesEditor
              content={event.notes || ''}
              onSave={(content) => updateEvent('notes', content)}
            />
          </div>

          {/* Delete Event */}
          <div className="px-4 mt-8 mb-4">
            <button
              onClick={handleDeleteEvent}
              className="text-red-500 text-sm hover:text-red-600 transition-colors"
            >
              {pendingDeleteEvent ? (
                <span className="animate-pulse">Confirm? Tap Again</span>
              ) : (
                'Delete This Event'
              )}
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Right side - 20% Sidebar */}
      <div className="flex-1 space-y-4">
        {/* Location Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Location</h3>
          </div>
          <div className="aspect-[4/3] bg-gray-100 relative">
            {event.location ? (
              <AppleMap location={event.location} eventName={event.name} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  No location set
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            <EditableText
              value={event.location || 'Click to add address'}
              onSave={(value) => updateEvent('location', value === 'Click to add address' ? '' : value)}
              className="text-sm text-gray-600"
              multiline
            />
            {event.location && (
              <button
                onClick={() => updateEvent('location', '')}
                className="text-xs text-red-400 hover:text-red-500 mt-2 transition-colors"
              >
                Remove Address
              </button>
            )}
          </div>
        </div>

        {/* Payment Methods Card */}
        <div
          className="bg-white rounded-2xl overflow-hidden"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Payments Collected</h3>
          </div>
          <div className="p-4 space-y-3">
            {/* Cash */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💵</span>
                <span className="text-sm font-medium text-gray-700">Cash</span>
              </div>
              <EditableText
                value={event.cashCollected ? formatCurrency(event.cashCollected) : '$0.00'}
                onSave={(value) => updateEvent('cashCollected', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                className="text-sm font-semibold text-gray-900"
                allowEmpty
              />
            </div>

            {/* Venmo */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <span className="text-sm font-medium text-gray-700">Venmo</span>
              </div>
              <EditableText
                value={event.venmoCollected ? formatCurrency(event.venmoCollected) : '$0.00'}
                onSave={(value) => updateEvent('venmoCollected', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                className="text-sm font-semibold text-gray-900"
                allowEmpty
              />
            </div>

            {/* Other */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">💳</span>
                <span className="text-sm font-medium text-gray-700">Other</span>
              </div>
              <EditableText
                value={event.otherCollected ? formatCurrency(event.otherCollected) : '$0.00'}
                onSave={(value) => updateEvent('otherCollected', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                className="text-sm font-semibold text-gray-900"
                allowEmpty
              />
            </div>

            {/* Total */}
            <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total Collected</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency((event.cashCollected || 0) + (event.venmoCollected || 0) + (event.otherCollected || 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Add Flavor Modal */}
      {showAddFlavor && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => { setShowAddFlavor(false); resetAddFlavorForm(); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Flavor to Event</h3>

              {/* Mode Toggle */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
                <button
                  onClick={() => setAddFlavorMode('select')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    addFlavorMode === 'select'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Select Existing
                </button>
                <button
                  onClick={() => setAddFlavorMode('custom')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    addFlavorMode === 'custom'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Custom (One-off)
                </button>
              </div>

              {addFlavorMode === 'select' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Flavor</label>
                  <select
                    value={selectedFlavorId}
                    onChange={(e) => setSelectedFlavorId(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    <option value="">Choose a flavor...</option>
                    {availableFlavors.map(flavor => (
                      <option key={flavor.id} value={flavor.id}>
                        {flavor.name} {flavor.unitCost ? `($${flavor.unitCost.toFixed(2)} cost)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Flavor Name</label>
                  <input
                    type="text"
                    value={customFlavorName}
                    onChange={(e) => setCustomFlavorName(e.target.value)}
                    placeholder="Enter flavor name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prepared Qty</label>
                  <input
                    type="number"
                    value={newItemData.prepared}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, prepared: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (optional)</label>
                  <input
                    type="text"
                    value={newItemData.unitCost}
                    onChange={(e) => setNewItemData(prev => ({ ...prev, unitCost: e.target.value }))}
                    placeholder={addFlavorMode === 'select' && selectedFlavorId ? 'Use default' : '$0.00'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAddFlavor(false); resetAddFlavorForm(); }}
                  className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFlavor}
                  className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors"
                >
                  Add Flavor
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, sublabel, highlight }: { label: string; value: string; sublabel?: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl ${highlight ? 'bg-pink-50' : 'bg-gray-50'}`}>
      <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-pink-600' : 'text-gray-900'}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-1">{sublabel}</p>}
    </div>
  );
}

// Editable Text Component
function EditableText({ value, onSave, className, allowEmpty = false, multiline = false }: { value: string; onSave: (value: string) => void; className?: string; allowEmpty?: boolean; multiline?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      if (multiline && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, multiline]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (editValue !== value) {
      if (allowEmpty || editValue.trim()) {
        onSave(editValue);
      } else {
        setEditValue(value);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          rows={3}
          className={`${className} bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg px-2 py-1 w-full resize-none`}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg px-2`}
      />
    );
  }

  return (
    <div onClick={() => setIsEditing(true)} className={`${className} cursor-text hover:bg-gray-50 rounded-lg px-2 -mx-2 whitespace-pre-wrap`}>
      {value}
    </div>
  );
}

// Apple Map Component
function AppleMap({ location, eventName }: { location: string; eventName: string }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapKitMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const mapkit = window.mapkit;
      if (!mapkit) {
        setError('MapKit not loaded');
        return;
      }

      // Initialize MapKit if not already done
      if (!mapkit.init) {
        setError('MapKit initialization failed');
        return;
      }

      // Check if already initialized
      try {
        mapkit.init({
          authorizationCallback: (done: (token: string) => void) => {
            done(MAPKIT_TOKEN);
          },
        });
      } catch {
        // Already initialized, continue
      }

      // Create the map
      const map = new mapkit.Map(mapContainerRef.current, {
        colorScheme: mapkit.Map.ColorSchemes.Light,
        showsCompass: mapkit.FeatureVisibility.Hidden,
        showsZoomControl: false,
        showsMapTypeControl: false,
      });
      mapRef.current = map;

      // Geocode the location
      const geocoder = new mapkit.Geocoder();
      geocoder.lookup(location, (geocodeError: Error | null, data: MapKitGeocoderResponse | null) => {
        if (geocodeError || !data?.results?.[0]) {
          setError('Location not found');
          return;
        }

        const place = data.results[0];
        const coordinate = place.coordinate;

        // Add a marker with event name as title
        const marker = new mapkit.MarkerAnnotation(coordinate, {
          color: '#ec4899',
          title: eventName,
        });
        map.addAnnotation(marker);

        // Center map on the location (zoomed out a bit)
        map.region = new mapkit.CoordinateRegion(
          coordinate,
          new mapkit.CoordinateSpan(0.05, 0.05)
        );

        setIsLoaded(true);
      });
    } catch {
      setError('Failed to initialize map');
    }
  }, [location, eventName]);

  useEffect(() => {
    // Load MapKit JS script if not already loaded
    if (!window.mapkit) {
      const script = document.createElement('script');
      script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => initMap();
      script.onerror = () => setError('Failed to load MapKit');
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [initMap]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-50">
        <div className="text-center px-4">
          <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse text-gray-400 text-sm">Loading map...</div>
        </div>
      )}
      <div ref={mapContainerRef} className="absolute inset-0" />
    </>
  );
}

// Editable Number Component for table cells
function EditableNumber({ value, onSave, isCurrency = false, className, inline = false }: { value: number; onSave: (value: number) => void; isCurrency?: boolean; className?: string; inline?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value.toString());
  }, [value]);

  const handleSave = () => {
    const numValue = parseFloat(editValue) || 0;
    if (numValue !== value) {
      onSave(numValue);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  const formatDisplay = (num: number) => {
    if (isCurrency) {
      return `$${num.toFixed(2)}`;
    }
    return num.toString();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step={isCurrency ? '0.01' : '1'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={inline
          ? "w-16 text-right text-sm bg-white border border-pink-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded px-1 py-0.5"
          : "w-full text-center text-sm bg-white border border-pink-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded px-1 py-0.5"
        }
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={className || "editable-cell text-gray-600 text-sm text-center justify-center cursor-text"}
    >
      {formatDisplay(value)}
    </span>
  );
}

// Rich Text Notes Editor Component using React-Quill
function NotesEditor({ content, onSave }: { content: string; onSave: (content: string) => void }) {
  const [value, setValue] = useState(content || '');
  const [QuillComponent, setQuillComponent] = useState<QuillComponentType | null>(null);
  const lastSavedContent = useRef(content);

  // Dynamically import React-Quill on client only
  useEffect(() => {
    let mounted = true;
    import('react-quill-new').then((mod) => {
      if (mounted) {
        // Import CSS
        import('react-quill-new/dist/quill.snow.css');
        setQuillComponent(() => mod.default as QuillComponentType);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Sync external content changes
  useEffect(() => {
    if (content !== lastSavedContent.current) {
      setValue(content || '');
      lastSavedContent.current = content;
    }
  }, [content]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const handleBlur = () => {
    // Only save if content actually changed
    if (value !== lastSavedContent.current) {
      lastSavedContent.current = value;
      onSave(value);
    }
  };

  const modules: QuillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
    ],
  };

  const formats: string[] = ['bold', 'italic', 'underline', 'list'];

  // Show placeholder while loading
  if (!QuillComponent) {
    return (
      <div className="notes-editor">
        <div className="border border-gray-200 rounded-xl bg-white min-h-[160px] p-4 text-gray-400 text-sm">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className="notes-editor">
      <QuillComponent
        theme="snow"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        modules={modules}
        formats={formats}
        placeholder="Add notes..."
      />
    </div>
  );
}

// Sortable Header Component
type SortColumn = 'id' | 'flavorName' | 'prepared' | 'remaining' | 'giveaway' | 'sold' | 'revenue' | 'unitCost' | 'cogs' | 'profit';

function SortableHeader({
  column,
  label,
  currentSort,
  direction,
  onSort,
  className = ''
}: {
  column: SortColumn;
  label: string;
  currentSort: SortColumn;
  direction: 'asc' | 'desc';
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const isActive = currentSort === column;

  return (
    <th
      className={`${className} cursor-pointer hover:bg-gray-50 transition-colors select-none`}
      onClick={() => onSort(column)}
    >
      <div className={`flex items-center gap-1 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : ''}`}>
        <span>{label}</span>
        <span className={`text-[10px] ${isActive ? 'text-pink-500' : 'text-gray-300'}`}>
          {isActive ? (direction === 'asc' ? '▲' : '▼') : '▲'}
        </span>
      </div>
    </th>
  );
}
