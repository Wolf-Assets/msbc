import { useState, useEffect, useRef } from 'react';

// MapKit types
declare global {
  interface Window {
    mapkit: {
      init: (options: { authorizationCallback: (done: (token: string) => void) => void }) => void;
      Map: new (container: HTMLElement, options?: { showsCompass?: string; showsScale?: string; colorScheme?: string }) => MapKitMap;
      Coordinate: new (latitude: number, longitude: number) => MapKitCoordinate;
      CoordinateRegion: new (center: MapKitCoordinate, span: MapKitCoordinateSpan) => MapKitCoordinateRegion;
      CoordinateSpan: new (latitudeDelta: number, longitudeDelta: number) => MapKitCoordinateSpan;
      MarkerAnnotation: new (coordinate: MapKitCoordinate, options?: { title?: string; subtitle?: string; color?: string; glyphColor?: string }) => MapKitAnnotation;
      Geocoder: new () => MapKitGeocoder;
    };
  }
}

interface MapKitMap {
  showItems: (items: MapKitAnnotation[], options?: { animate?: boolean; padding?: { top: number; right: number; bottom: number; left: number } }) => void;
  addAnnotation: (annotation: MapKitAnnotation) => void;
  removeAnnotations: (annotations: MapKitAnnotation[]) => void;
  annotations: MapKitAnnotation[];
  region: MapKitCoordinateRegion;
  destroy: () => void;
  addEventListener: (event: string, callback: () => void) => void;
}

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

interface MapKitAnnotation {
  coordinate: MapKitCoordinate;
  title?: string;
  subtitle?: string;
  data?: { eventId: number };
  addEventListener: (event: string, callback: () => void) => void;
}

interface MapKitGeocoder {
  lookup: (address: string, callback: (error: Error | null, data: { results: { coordinate: MapKitCoordinate }[] }) => void) => void;
}

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
  notes: string | null;
}

type SortColumn = 'name' | 'eventDate' | 'totalPrepared' | 'totalSold' | 'totalGiveaway' | 'totalRevenue' | 'totalCost' | 'netProfit' | 'eventCost';

const MAPKIT_TOKEN = import.meta.env.PUBLIC_MAPKIT_TOKEN;

export default function EventsTable() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events on mount
  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('Failed to load events', 'error');
      });
  }, []);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('eventDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showMap, setShowMap] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
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
      // Redirect to the new event's detail page
      window.location.href = `/events/${newEvent.id}`;
    } catch {
      showToast('Failed to add event', 'error');
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
    fee: events.reduce((sum, e) => sum + (e.eventCost || 0), 0),
    profit: events.reduce((sum, e) => sum + e.netProfit, 0),
  };

  // Calculate metrics
  const eventsWithSales = events.filter(e => e.totalSold > 0).length;
  const avgProfitPerEvent = eventsWithSales > 0 ? totals.profit / eventsWithSales : 0;
  const avgRevenuePerEvent = eventsWithSales > 0 ? totals.revenue / eventsWithSales : 0;
  const profitMargin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
  const sellThroughRate = totals.prepared > 0 ? (totals.sold / totals.prepared) * 100 : 0;

  // Get events with locations for the map
  const eventsWithLocations = events.filter(e => e.location && e.location.trim() !== '');

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
            <h2 className="text-2xl font-bold text-gray-900">Events</h2>
            <p className="text-sm text-gray-400 mt-1">Track your sales events and performance.</p>
          </div>
          <div className="flex items-center gap-3">
            {eventsWithLocations.length > 0 && (
              <button
                onClick={() => setShowMap(true)}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-all hover:shadow-md flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Past Events
              </button>
            )}
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
                <SortableHeader label="Fee" column="eventCost" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-20 text-right" />
                <SortableHeader label="Profit" column="netProfit" currentColumn={sortColumn} direction={sortDirection} onSort={handleSort} className="w-24 text-right" />
              </tr>
            </thead>
            <tbody>
              {sortedEvents.map((event) => (
                <tr
                  key={event.id}
                  className="group cursor-pointer hover:bg-pink-50 transition-colors"
                  onClick={() => window.location.href = `/events/${event.id}`}
                >
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-pink-600 font-medium text-sm">
                      {event.name}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-gray-600 text-sm whitespace-nowrap">
                      {formatDate(event.eventDate)}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm">
                      {event.totalPrepared}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm">
                      {event.totalSold}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm">
                      {event.totalGiveaway}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {event.totalRevenue > 0 ? (
                        <span className="text-gray-900 font-medium">{formatCurrency(event.totalRevenue)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {event.totalCost > 0 ? (
                        <span className="text-gray-600">{formatCurrency(event.totalCost)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      <span className={event.eventCost > 0 ? "text-orange-600" : "text-gray-400"}>{formatCurrency(event.eventCost || 0)}</span>
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap">
                      {event.netProfit > 0 ? (
                        <span className="text-green-600 font-medium">{formatCurrency(event.netProfit)}</span>
                      ) : event.netProfit < 0 ? (
                        <span className="text-red-500 font-medium">{formatCurrency(event.netProfit)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              {events.length > 0 && (
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center font-bold text-gray-900 text-sm">Total</span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center text-gray-400 text-sm">
                      {events.length} events
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold">
                      {totals.prepared.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold">
                      {totals.sold.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold">
                      {totals.giveaway.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(totals.revenue)}
                    </span>
                  </td>
                  <td>
                    <span className="px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {formatCurrency(totals.cost)}
                    </span>
                  </td>
                  <td>
                    <span className={`px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold whitespace-nowrap ${totals.fee > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {formatCurrency(totals.fee)}
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

          {events.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No events yet. Click "Add Event" to get started.
            </div>
          )}
        </div>
      </div>

      {/* Map Modal */}
      {showMap && (
        <EventsMapModal
          events={eventsWithLocations}
          onClose={() => {
            setShowMap(false);
            setSelectedEvent(null);
          }}
          selectedEvent={selectedEvent}
          onSelectEvent={setSelectedEvent}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

// Full-screen Map Modal Component
function EventsMapModal({
  events,
  onClose,
  selectedEvent,
  onSelectEvent,
  formatCurrency,
  formatDate,
}: {
  events: Event[];
  onClose: () => void;
  selectedEvent: Event | null;
  onSelectEvent: (event: Event | null) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapKitMap | null>(null);
  const userRegionRef = useRef<MapKitCoordinateRegion | null>(null);
  const isRestoringRegionRef = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [geocodedEvents, setGeocodedEvents] = useState<Map<number, MapKitCoordinate>>(new Map());

  // Use ref for callback to avoid useEffect dependency issues
  const onSelectEventRef = useRef(onSelectEvent);
  onSelectEventRef.current = onSelectEvent;

  // Load MapKit JS
  useEffect(() => {
    if (window.mapkit) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.mapkit.init({
        authorizationCallback: (done: (token: string) => void) => {
          done(MAPKIT_TOKEN);
        },
      });
      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map and add markers
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;

    const map = new window.mapkit.Map(mapContainerRef.current, {
      showsCompass: 'adaptive',
      showsScale: 'adaptive',
      colorScheme: 'light',
    });
    mapRef.current = map;

    // Track user's region changes (for preserving zoom when clicking pins)
    map.addEventListener('region-change-end', () => {
      // Don't update if we're in the middle of restoring from a pin click
      if (!isRestoringRegionRef.current) {
        userRegionRef.current = map.region;
      }
    });

    // Geocode all event locations and add markers
    const geocoder = new window.mapkit.Geocoder();
    const newGeocodedEvents = new Map<number, MapKitCoordinate>();
    const annotations: MapKitAnnotation[] = [];

    // Only count events that have locations
    const eventsToGeocode = events.filter(e => e.location && e.location.trim() !== '');
    let completed = 0;

    if (eventsToGeocode.length === 0) return;

    eventsToGeocode.forEach((event) => {
      geocoder.lookup(event.location!, (error, data) => {
        completed++;

        if (!error && data.results.length > 0) {
          const coordinate = data.results[0].coordinate;
          newGeocodedEvents.set(event.id, coordinate);

          const marker = new window.mapkit.MarkerAnnotation(coordinate, {
            title: event.name,
            subtitle: formatDate(event.eventDate),
            color: '#ec4899',
            glyphColor: '#ffffff',
          });

          // Store event data on marker
          (marker as MapKitAnnotation & { data: { eventId: number } }).data = { eventId: event.id };

          // Add click handler - use ref to avoid stale closure
          marker.addEventListener('select', () => {
            const clickedEvent = events.find(e => e.id === event.id);
            if (clickedEvent) {
              onSelectEventRef.current(clickedEvent);
              // Restore the user's current region to prevent MapKit from zooming/centering
              if (userRegionRef.current && mapRef.current) {
                isRestoringRegionRef.current = true;
                setTimeout(() => {
                  if (mapRef.current && userRegionRef.current) {
                    mapRef.current.region = userRegionRef.current;
                    // Clear flag after region change completes
                    setTimeout(() => {
                      isRestoringRegionRef.current = false;
                    }, 100);
                  }
                }, 10);
              }
            }
          });

          annotations.push(marker);
          map.addAnnotation(marker);
        }

        // After all geocoding is done, fit map to show all markers
        if (completed === eventsToGeocode.length && annotations.length > 0) {
          setGeocodedEvents(newGeocodedEvents);

          // Calculate bounding box of all coordinates
          const coords = annotations.map(a => a.coordinate);
          const lats = coords.map(c => c.latitude);
          const lngs = coords.map(c => c.longitude);

          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);

          // Calculate center and span
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const latSpan = Math.max((maxLat - minLat) * 1.5, 0.1); // Add padding, min 0.1
          const lngSpan = Math.max((maxLng - minLng) * 1.5, 0.1);

          // Set the region to fit all markers
          const region = new window.mapkit.CoordinateRegion(
            new window.mapkit.Coordinate(centerLat, centerLng),
            new window.mapkit.CoordinateSpan(latSpan, lngSpan)
          );
          map.region = region;
          userRegionRef.current = region;
          setMapReady(true);
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedEvent) {
          onSelectEvent(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, selectedEvent, onSelectEvent]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      {/* Full screen map container */}
      <div className="absolute inset-0 bg-white">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Past Events Map</h2>
              <p className="text-sm text-gray-500">{events.length} locations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-5">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map - hidden until ready */}
        <div
          ref={mapContainerRef}
          className="w-full h-full transition-opacity duration-300"
          style={{ opacity: mapReady ? 1 : 0 }}
        />

        {/* Event Detail Card */}
        {selectedEvent && (
          <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slideUp">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedEvent.name}</h3>
                  <p className="text-sm text-gray-500">{formatDate(selectedEvent.eventDate)}</p>
                </div>
                <button
                  onClick={() => onSelectEvent(null)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedEvent.location && (
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedEvent.location}
                </p>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 uppercase">Sold</p>
                  <p className="text-lg font-bold text-gray-900">{selectedEvent.totalSold}</p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-xl">
                  <p className="text-xs text-pink-400 uppercase">Revenue</p>
                  <p className="text-lg font-bold text-pink-600">{formatCurrency(selectedEvent.totalRevenue)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-xs text-green-400 uppercase">Profit</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(selectedEvent.netProfit)}</p>
                </div>
              </div>

              <a
                href={`/events/${selectedEvent.id}`}
                className="block w-full text-center py-2.5 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors"
              >
                View Full Details
              </a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
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
