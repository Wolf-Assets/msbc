import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_DcaTcJfu.mjs';
import { $ as $$Layout } from '../chunks/Layout_DCrs8C6F.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useRef, useEffect } from 'react';
import { d as db, a as events } from '../chunks/index_D6rbc0Ls.mjs';
export { renderers } from '../renderers.mjs';

const MAPKIT_TOKEN = "eyJraWQiOiI0Vlg3REdCNTJZIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI2QzZRNkFRMlY4IiwiaWF0IjoxNzcwMjMyMzM2LCJleHAiOjE3NzA4ODMxOTl9._0y4DLnQVh19ENmOzr0qQwzmCXGHMFhC_unET5LEfjTB63XB_OXEgn0fy3jaQCzOND9q4dSk6EZtmA9v_rb5gQ";
function EventsTable({ initialEvents }) {
  const [events, setEvents] = useState(initialEvents);
  const [toast, setToast] = useState(null);
  const [sortColumn, setSortColumn] = useState("eventDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showMap, setShowMap] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };
  const formatDate = (dateString) => {
    const date = /* @__PURE__ */ new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "eventDate" ? "desc" : "desc");
    }
  };
  const addEvent = async () => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Event",
          eventDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          totalPrepared: 0,
          totalSold: 0,
          totalGiveaway: 0,
          totalRevenue: 0,
          totalCost: 0,
          netProfit: 0
        })
      });
      if (!response.ok) throw new Error("Failed to add");
      const newEvent = await response.json();
      window.location.href = `/events/${newEvent.id}`;
    } catch {
      showToast("Failed to add event", "error");
    }
  };
  const sortedEvents = [...events].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortColumn === "eventDate") {
      comparison = new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    } else {
      comparison = a[sortColumn] - b[sortColumn];
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const totals = {
    prepared: events.reduce((sum, e) => sum + e.totalPrepared, 0),
    sold: events.reduce((sum, e) => sum + e.totalSold, 0),
    giveaway: events.reduce((sum, e) => sum + e.totalGiveaway, 0),
    revenue: events.reduce((sum, e) => sum + e.totalRevenue, 0),
    cost: events.reduce((sum, e) => sum + e.totalCost, 0),
    fee: events.reduce((sum, e) => sum + (e.eventCost || 0), 0),
    profit: events.reduce((sum, e) => sum + e.netProfit, 0)
  };
  const eventsWithSales = events.filter((e) => e.totalSold > 0).length;
  const avgProfitPerEvent = eventsWithSales > 0 ? totals.profit / eventsWithSales : 0;
  const avgRevenuePerEvent = eventsWithSales > 0 ? totals.revenue / eventsWithSales : 0;
  const profitMargin = totals.revenue > 0 ? totals.profit / totals.revenue * 100 : 0;
  const sellThroughRate = totals.prepared > 0 ? totals.sold / totals.prepared * 100 : 0;
  const eventsWithLocations = events.filter((e) => e.location && e.location.trim() !== "");
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full bg-[#fafafc] rounded-3xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-8 pt-8 pb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Events" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Track your sales events and performance." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          eventsWithLocations.length > 0 && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowMap(true),
              className: "px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium text-sm hover:bg-gray-50 transition-all hover:shadow-md flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxs("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
                ] }),
                "Past Events"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: addEvent,
              className: "px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium text-sm hover:bg-pink-600 transition-all hover:shadow-lg hover:shadow-pink-200 flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }),
                "Add Event"
              ]
            }
          )
        ] })
      ] }),
      events.length > 0 && /* @__PURE__ */ jsx("div", { className: "px-8 pb-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsx(
          StatCard,
          {
            label: "Sell-through Rate",
            value: `${sellThroughRate.toFixed(1)}%`,
            sublabel: `${totals.sold.toLocaleString()} of ${totals.prepared.toLocaleString()} sold`,
            highlight: true
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            label: "Profit Margin",
            value: `${profitMargin.toFixed(1)}%`,
            sublabel: `${formatCurrency(totals.profit)} total profit`
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            label: "Avg. Revenue/Event",
            value: formatCurrency(avgRevenuePerEvent),
            sublabel: `${eventsWithSales} events with sales`
          }
        ),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            label: "Avg. Profit/Event",
            value: formatCurrency(avgProfitPerEvent),
            sublabel: "per event with sales"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "px-4 pb-4", children: [
        /* @__PURE__ */ jsxs("table", { className: "data-table", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx(SortableHeader, { label: "Event Name", column: "name", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-52" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Date", column: "eventDate", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-28" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Prepared", column: "totalPrepared", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-center" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Sold", column: "totalSold", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-14 text-center" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Giveaway", column: "totalGiveaway", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-center" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Revenue", column: "totalRevenue", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-24 text-right" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "COGS", column: "totalCost", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-right" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Fee", column: "eventCost", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-right" }),
            /* @__PURE__ */ jsx(SortableHeader, { label: "Profit", column: "netProfit", currentColumn: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-24 text-right" })
          ] }) }),
          /* @__PURE__ */ jsxs("tbody", { children: [
            sortedEvents.map((event) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "group cursor-pointer hover:bg-pink-50 transition-colors",
                onClick: () => window.location.href = `/events/${event.id}`,
                children: [
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center text-pink-600 font-medium text-sm", children: event.name }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center text-gray-600 text-sm whitespace-nowrap", children: formatDate(event.eventDate) }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm", children: event.totalPrepared }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm", children: event.totalSold }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-600 text-sm", children: event.totalGiveaway }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap", children: event.totalRevenue > 0 ? /* @__PURE__ */ jsx("span", { className: "text-gray-900 font-medium", children: formatCurrency(event.totalRevenue) }) : /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "—" }) }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap", children: event.totalCost > 0 ? /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: formatCurrency(event.totalCost) }) : /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "—" }) }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: event.eventCost > 0 ? "text-orange-600" : "text-gray-400", children: formatCurrency(event.eventCost || 0) }) }) }),
                  /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap", children: event.netProfit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-green-600 font-medium", children: formatCurrency(event.netProfit) }) : event.netProfit < 0 ? /* @__PURE__ */ jsx("span", { className: "text-red-500 font-medium", children: formatCurrency(event.netProfit) }) : /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "—" }) }) })
                ]
              },
              event.id
            )),
            events.length > 0 && /* @__PURE__ */ jsxs("tr", { className: "border-t-2 border-gray-200 bg-gray-50 font-medium", children: [
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center font-bold text-gray-900 text-sm", children: "Total" }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "px-4 py-3 min-h-[44px] flex items-center text-gray-400 text-sm", children: [
                events.length,
                " events"
              ] }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold", children: totals.prepared.toLocaleString() }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold", children: totals.sold.toLocaleString() }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-center text-gray-900 text-sm font-semibold", children: totals.giveaway.toLocaleString() }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold text-gray-900 whitespace-nowrap", children: formatCurrency(totals.revenue) }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold text-gray-900 whitespace-nowrap", children: formatCurrency(totals.cost) }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: `px-4 py-3 min-h-[44px] flex items-center justify-end text-sm font-semibold whitespace-nowrap ${totals.fee > 0 ? "text-orange-600" : "text-gray-400"}`, children: formatCurrency(totals.fee) }) }),
              /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "px-4 py-3 min-h-[44px] flex items-center justify-end text-sm whitespace-nowrap", children: totals.profit >= 0 ? /* @__PURE__ */ jsx("span", { className: "text-green-600 font-bold", children: formatCurrency(totals.profit) }) : /* @__PURE__ */ jsx("span", { className: "text-red-500 font-bold", children: formatCurrency(totals.profit) }) }) })
            ] })
          ] })
        ] }),
        events.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-gray-400", children: 'No events yet. Click "Add Event" to get started.' })
      ] })
    ] }),
    showMap && /* @__PURE__ */ jsx(
      EventsMapModal,
      {
        events: eventsWithLocations,
        onClose: () => {
          setShowMap(false);
          setSelectedEvent(null);
        },
        selectedEvent,
        onSelectEvent: setSelectedEvent,
        formatCurrency,
        formatDate
      }
    ),
    toast && /* @__PURE__ */ jsx("div", { className: `toast ${toast.type}`, children: toast.message })
  ] });
}
function EventsMapModal({
  events,
  onClose,
  selectedEvent,
  onSelectEvent,
  formatCurrency,
  formatDate
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userRegionRef = useRef(null);
  const isRestoringRegionRef = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [geocodedEvents, setGeocodedEvents] = useState(/* @__PURE__ */ new Map());
  const onSelectEventRef = useRef(onSelectEvent);
  onSelectEventRef.current = onSelectEvent;
  useEffect(() => {
    if (window.mapkit) {
      setMapLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      window.mapkit.init({
        authorizationCallback: (done) => {
          done(MAPKIT_TOKEN);
        }
      });
      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, []);
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current || mapRef.current) return;
    const map = new window.mapkit.Map(mapContainerRef.current, {
      showsCompass: "adaptive",
      showsScale: "adaptive",
      colorScheme: "light"
    });
    mapRef.current = map;
    map.addEventListener("region-change-end", () => {
      if (!isRestoringRegionRef.current) {
        userRegionRef.current = map.region;
      }
    });
    const geocoder = new window.mapkit.Geocoder();
    const newGeocodedEvents = /* @__PURE__ */ new Map();
    const annotations = [];
    const eventsToGeocode = events.filter((e) => e.location && e.location.trim() !== "");
    let completed = 0;
    if (eventsToGeocode.length === 0) return;
    eventsToGeocode.forEach((event) => {
      geocoder.lookup(event.location, (error, data) => {
        completed++;
        if (!error && data.results.length > 0) {
          const coordinate = data.results[0].coordinate;
          newGeocodedEvents.set(event.id, coordinate);
          const marker = new window.mapkit.MarkerAnnotation(coordinate, {
            title: event.name,
            subtitle: formatDate(event.eventDate),
            color: "#ec4899",
            glyphColor: "#ffffff"
          });
          marker.data = { eventId: event.id };
          marker.addEventListener("select", () => {
            const clickedEvent = events.find((e) => e.id === event.id);
            if (clickedEvent) {
              onSelectEventRef.current(clickedEvent);
              if (userRegionRef.current && mapRef.current) {
                isRestoringRegionRef.current = true;
                setTimeout(() => {
                  if (mapRef.current && userRegionRef.current) {
                    mapRef.current.region = userRegionRef.current;
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
        if (completed === eventsToGeocode.length && annotations.length > 0) {
          setGeocodedEvents(newGeocodedEvents);
          const coords = annotations.map((a) => a.coordinate);
          const lats = coords.map((c) => c.latitude);
          const lngs = coords.map((c) => c.longitude);
          const minLat = Math.min(...lats);
          const maxLat = Math.max(...lats);
          const minLng = Math.min(...lngs);
          const maxLng = Math.max(...lngs);
          const centerLat = (minLat + maxLat) / 2;
          const centerLng = (minLng + maxLng) / 2;
          const latSpan = Math.max((maxLat - minLat) * 1.5, 0.1);
          const lngSpan = Math.max((maxLng - minLng) * 1.5, 0.1);
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
  }, [mapLoaded]);
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (selectedEvent) {
          onSelectEvent(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, selectedEvent, onSelectEvent]);
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm", children: [
    /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 bg-white", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-6 py-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-gray-900", children: "Past Events Map" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            events.length,
            " locations"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "p-2 hover:bg-gray-100 rounded-full transition-colors",
            children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
          }
        )
      ] }) }),
      !mapReady && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-50 z-5", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Loading map..." })
      ] }) }),
      /* @__PURE__ */ jsx(
        "div",
        {
          ref: mapContainerRef,
          className: "w-full h-full transition-opacity duration-300",
          style: { opacity: mapReady ? 1 : 0 }
        }
      ),
      selectedEvent && /* @__PURE__ */ jsx("div", { className: "absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slideUp", children: /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900", children: selectedEvent.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: formatDate(selectedEvent.eventDate) })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => onSelectEvent(null),
              className: "p-1 hover:bg-gray-100 rounded-full transition-colors",
              children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) })
            }
          )
        ] }),
        selectedEvent.location && /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 mb-4 flex items-center gap-1", children: [
          /* @__PURE__ */ jsxs("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
          ] }),
          selectedEvent.location
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-gray-50 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 uppercase", children: "Sold" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-gray-900", children: selectedEvent.totalSold })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-pink-50 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-pink-400 uppercase", children: "Revenue" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-pink-600", children: formatCurrency(selectedEvent.totalRevenue) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-center p-3 bg-green-50 rounded-xl", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-green-400 uppercase", children: "Profit" }),
            /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-green-600", children: formatCurrency(selectedEvent.netProfit) })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: `/events/${selectedEvent.id}`,
            className: "block w-full text-center py-2.5 bg-pink-500 text-white rounded-xl font-medium text-sm hover:bg-pink-600 transition-colors",
            children: "View Full Details"
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
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
      ` })
  ] });
}
function StatCard({ label, value, sublabel, highlight }) {
  return /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-2xl border ${highlight ? "bg-pink-50 border-pink-100" : "bg-gray-50 border-gray-100"}`, children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wide font-medium", children: label }),
    /* @__PURE__ */ jsx("p", { className: `text-2xl font-bold mt-1 ${highlight ? "text-pink-600" : "text-gray-900"}`, children: value }),
    sublabel && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mt-1", children: sublabel })
  ] });
}
function SortableHeader({
  label,
  column,
  currentColumn,
  direction,
  onSort,
  className = ""
}) {
  const isActive = currentColumn === column;
  const isRight = className.includes("text-right");
  const isCenter = className.includes("text-center");
  return /* @__PURE__ */ jsx(
    "th",
    {
      className: `cursor-pointer select-none hover:bg-gray-50 transition-colors ${className}`,
      onClick: () => onSort(column),
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 ${isRight ? "justify-end" : isCenter ? "justify-center" : ""}`, children: [
        /* @__PURE__ */ jsx("span", { children: label }),
        isActive && /* @__PURE__ */ jsx(
          "svg",
          {
            className: `w-3 h-3 text-pink-500 transition-transform ${direction === "desc" ? "rotate-180" : ""}`,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 15l7-7 7 7" })
          }
        )
      ] })
    }
  );
}

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allEvents = await db.select().from(events).all();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Events | Mighty Sweets Baking Co." }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "EventsTable", EventsTable, { "client:load": true, "initialEvents": allEvents, "client:component-hydration": "load", "client:component-path": "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/EventsTable", "client:component-export": "default" })} ` })}`;
}, "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/events/index.astro", void 0);

const $$file = "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/events/index.astro";
const $$url = "/events";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
