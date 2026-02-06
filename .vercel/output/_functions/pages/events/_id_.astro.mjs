import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro } from '../../chunks/astro/server_DcaTcJfu.mjs';
import { $ as $$Layout } from '../../chunks/Layout_DCrs8C6F.mjs';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useRef, useCallback } from 'react';
import { DayPicker } from 'react-day-picker';
/* empty css                                   */
import { d as db, a as events, e as eventItems, f as flavors } from '../../chunks/index_D6rbc0Ls.mjs';
import { eq } from 'drizzle-orm';
export { renderers } from '../../renderers.mjs';

const MAPKIT_TOKEN = "eyJraWQiOiI0Vlg3REdCNTJZIiwidHlwIjoiSldUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiI2QzZRNkFRMlY4IiwiaWF0IjoxNzcwMjMyMzM2LCJleHAiOjE3NzA4ODMxOTl9._0y4DLnQVh19ENmOzr0qQwzmCXGHMFhC_unET5LEfjTB63XB_OXEgn0fy3jaQCzOND9q4dSk6EZtmA9v_rb5gQ";
function EventDetail({ event: initialEvent, items: initialItems, availableFlavors }) {
  const [event, setEvent] = useState(initialEvent);
  const [items, setItems] = useState(initialItems);
  const [toast, setToast] = useState(null);
  const [editingDate, setEditingDate] = useState(false);
  const [showAddFlavor, setShowAddFlavor] = useState(false);
  const [addFlavorMode, setAddFlavorMode] = useState("select");
  const [selectedFlavorId, setSelectedFlavorId] = useState("");
  const [customFlavorName, setCustomFlavorName] = useState("");
  const [newItemData, setNewItemData] = useState({
    prepared: 0,
    unitCost: ""
  });
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState(false);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [useBaseCost, setUseBaseCost] = useState(() => {
    const initial = {};
    initialItems.forEach((item) => {
      const matchingFlavor = availableFlavors.find((f) => f.name === item.flavorName);
      initial[item.id] = matchingFlavor?.unitCost === item.unitCost;
    });
    return initial;
  });
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };
  useEffect(() => {
    if (pendingDeleteEvent) {
      const timer = setTimeout(() => setPendingDeleteEvent(false), 3e3);
      return () => clearTimeout(timer);
    }
  }, [pendingDeleteEvent]);
  const handleDeleteEvent = async () => {
    if (!pendingDeleteEvent) {
      setPendingDeleteEvent(true);
      return;
    }
    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id })
      });
      if (!response.ok) throw new Error("Failed to delete");
      window.location.href = "/events";
    } catch {
      showToast("Failed to delete event", "error");
      setPendingDeleteEvent(false);
    }
  };
  const getFlavorId = (flavorName) => {
    const matchingFlavor = availableFlavors.find((f) => f.name === flavorName);
    return matchingFlavor ? matchingFlavor.id : 9999;
  };
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };
  const sortedItems = [...items].sort((a, b) => {
    let aVal;
    let bVal;
    if (sortColumn === "id") {
      aVal = getFlavorId(a.flavorName);
      bVal = getFlavorId(b.flavorName);
    } else if (sortColumn === "flavorName") {
      aVal = a.flavorName.toLowerCase();
      bVal = b.flavorName.toLowerCase();
    } else {
      aVal = a[sortColumn] ?? 0;
      bVal = b[sortColumn] ?? 0;
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });
  const resetAddFlavorForm = () => {
    setAddFlavorMode("select");
    setSelectedFlavorId("");
    setCustomFlavorName("");
    setNewItemData({ prepared: 0, unitCost: "" });
  };
  const handleAddFlavor = async () => {
    let flavorName = "";
    let unitCost = null;
    if (addFlavorMode === "select" && selectedFlavorId) {
      const selectedFlavor = availableFlavors.find((f) => f.id === selectedFlavorId);
      if (selectedFlavor) {
        flavorName = selectedFlavor.name;
        unitCost = newItemData.unitCost ? parseFloat(newItemData.unitCost) : selectedFlavor.unitCost;
      }
    } else if (addFlavorMode === "custom" && customFlavorName.trim()) {
      flavorName = customFlavorName.trim();
      unitCost = newItemData.unitCost ? parseFloat(newItemData.unitCost) : null;
    }
    if (!flavorName) {
      showToast("Please select or enter a flavor name", "error");
      return;
    }
    try {
      const response = await fetch("/api/event-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
          profit: 0
        })
      });
      if (!response.ok) throw new Error("Failed to add");
      const newItem = await response.json();
      setItems((prev) => [...prev, newItem]);
      setShowAddFlavor(false);
      resetAddFlavorForm();
      showToast("Flavor added");
      const eventResponse = await fetch(`/api/events?id=${event.id}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
      }
    } catch {
      showToast("Failed to add flavor", "error");
    }
  };
  const formatDate = (dateString) => {
    const date = /* @__PURE__ */ new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };
  const updateEventDate = async (newDate) => {
    if (!newDate) return;
    const dateStr = newDate.toISOString().split("T")[0];
    setEvent((prev) => ({ ...prev, eventDate: dateStr }));
    setEditingDate(false);
    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, eventDate: dateStr })
      });
      if (!response.ok) throw new Error("Failed to update");
      showToast("Date updated");
    } catch {
      showToast("Failed to update date", "error");
      setEvent(initialEvent);
    }
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  };
  const updateEvent = async (field, value) => {
    setEvent((prev) => ({ ...prev, [field]: value }));
    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, [field]: value })
      });
      if (!response.ok) throw new Error("Failed to update");
      showToast("Saved");
    } catch {
      showToast("Failed to save", "error");
      setEvent(initialEvent);
    }
  };
  const updateItem = async (itemId, field, value) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    let updates = { [field]: value };
    const prepared = field === "prepared" ? value : item.prepared;
    const sold = field === "sold" ? value : item.sold;
    const giveaway = field === "giveaway" ? value : item.giveaway;
    const unitCost = field === "unitCost" ? value : item.unitCost;
    const remaining = Math.max(0, prepared - sold - giveaway);
    updates.remaining = remaining;
    const flavor = availableFlavors.find((f) => f.name === item.flavorName);
    const unitPrice = flavor?.unitPrice || 5;
    const revenue = sold * unitPrice;
    updates.revenue = revenue;
    const cogs = unitCost ? sold * unitCost : 0;
    updates.cogs = cogs;
    updates.profit = revenue - cogs;
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, ...updates } : i));
    try {
      const response = await fetch("/api/event-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, eventId: event.id, ...updates })
      });
      if (!response.ok) throw new Error("Failed to update");
      const eventResponse = await fetch(`/api/events?id=${event.id}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
      }
    } catch {
      showToast("Failed to save", "error");
      setItems(initialItems);
    }
  };
  const getBaseCost = (flavorName) => {
    const flavor = availableFlavors.find((f) => f.name === flavorName);
    return flavor?.unitCost || null;
  };
  const toggleBaseCost = async (itemId) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newUseBase = !useBaseCost[itemId];
    setUseBaseCost((prev) => ({ ...prev, [itemId]: newUseBase }));
    if (newUseBase) {
      const baseCost = getBaseCost(item.flavorName);
      if (baseCost !== null) {
        await updateItem(itemId, "unitCost", baseCost);
      }
    }
  };
  const deleteItem = async (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      const response = await fetch("/api/event-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, eventId: event.id })
      });
      if (!response.ok) throw new Error("Failed to delete");
      showToast("Item deleted");
      const eventResponse = await fetch(`/api/events?id=${event.id}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
      }
    } catch {
      showToast("Failed to delete", "error");
      setItems(initialItems);
    }
  };
  const sellThroughRate = event.totalPrepared > 0 ? (event.totalSold / event.totalPrepared * 100).toFixed(1) : "0";
  const grossMargin = event.totalRevenue > 0 ? (event.netProfit / event.totalRevenue * 100).toFixed(1) : "0";
  const avgPricePerUnit = event.totalSold > 0 ? (event.totalRevenue / event.totalSold).toFixed(2) : "0.00";
  const revenueEfficiency = event.totalPrepared > 0 ? (event.totalRevenue / event.totalPrepared).toFixed(2) : "0.00";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs(
      "a",
      {
        href: "/events",
        className: "inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 transition-colors text-sm font-medium",
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }),
          "Back to Events"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-[4]", children: /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-white rounded-3xl overflow-hidden",
          style: {
            boxShadow: "0 8px 60px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)"
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "px-8 pt-8 pb-6", children: /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-x-3", children: [
              /* @__PURE__ */ jsx(
                EditableText,
                {
                  value: event.name,
                  onSave: (value) => updateEvent("name", value),
                  className: "text-3xl font-bold text-gray-900"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-2xl text-pink-400 shrink-0", style: { fontFamily: "Geist, system-ui, sans-serif" }, children: "@" }),
              /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setEditingDate(!editingDate),
                    className: "text-2xl font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 -ml-2 rounded transition-colors whitespace-nowrap text-left",
                    children: formatDate(event.eventDate)
                  }
                ),
                editingDate && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-40", onClick: () => setEditingDate(false) }),
                  /* @__PURE__ */ jsx("div", { className: "absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4", children: /* @__PURE__ */ jsx(
                    DayPicker,
                    {
                      mode: "single",
                      selected: /* @__PURE__ */ new Date(event.eventDate + "T00:00:00"),
                      defaultMonth: /* @__PURE__ */ new Date(event.eventDate + "T00:00:00"),
                      onSelect: (date) => date && updateEventDate(date),
                      className: "!font-sans"
                    }
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "ml-auto shrink-0 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-lg text-gray-400", children: "Fee:" }),
                /* @__PURE__ */ jsx(
                  EditableNumber,
                  {
                    value: event.eventCost,
                    onSave: (value) => updateEvent("eventCost", value),
                    className: "text-xl font-medium text-gray-600",
                    isCurrency: true
                  }
                )
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "px-8 pb-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [
              /* @__PURE__ */ jsx(
                StatCard,
                {
                  label: "Sell-through",
                  value: `${sellThroughRate}%`,
                  sublabel: `${event.totalSold} of ${event.totalPrepared} sold`,
                  highlight: true
                }
              ),
              /* @__PURE__ */ jsx(
                StatCard,
                {
                  label: "Gross Margin",
                  value: `${grossMargin}%`,
                  sublabel: `${formatCurrency(event.netProfit)} profit`
                }
              ),
              /* @__PURE__ */ jsx(
                StatCard,
                {
                  label: "Avg. Price/Unit",
                  value: `$${avgPricePerUnit}`,
                  sublabel: "actual sale price"
                }
              ),
              /* @__PURE__ */ jsx(
                StatCard,
                {
                  label: "Revenue/Prepared",
                  value: `$${revenueEfficiency}`,
                  sublabel: "inventory efficiency"
                }
              )
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "px-4 pb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-4 mb-4 flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-gray-900", children: "Details" }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setShowAddFlavor(true),
                    className: "px-3 py-1.5 text-pink-600 hover:bg-pink-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }),
                      "Add Flavor"
                    ]
                  }
                )
              ] }),
              items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-gray-400", children: "No flavors added to this event yet." }) : /* @__PURE__ */ jsxs("table", { className: "data-table", children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
                  /* @__PURE__ */ jsx(SortableHeader, { column: "id", label: "ID", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-12 text-center" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "flavorName", label: "Flavor", currentSort: sortColumn, direction: sortDirection, onSort: handleSort }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "prepared", label: "Prepared", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-center" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "sold", label: "Sold", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-center" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "giveaway", label: "Giveaway", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-center" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "remaining", label: "Left", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-center" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "revenue", label: "Revenue", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-24 text-right" }),
                  /* @__PURE__ */ jsx("th", { className: "w-12 text-center", children: "Base" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "unitCost", label: "Cost", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-20 text-right" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "cogs", label: "COGS", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-24 text-right" }),
                  /* @__PURE__ */ jsx(SortableHeader, { column: "profit", label: "Profit", currentSort: sortColumn, direction: sortDirection, onSort: handleSort, className: "w-24 text-right" }),
                  /* @__PURE__ */ jsx("th", { className: "w-10" })
                ] }) }),
                /* @__PURE__ */ jsxs("tbody", { children: [
                  sortedItems.map((item) => /* @__PURE__ */ jsxs("tr", { className: "group", children: [
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-400 text-sm text-center justify-center", children: (() => {
                      const flavorId = getFlavorId(item.flavorName);
                      return flavorId !== 9999 ? flavorId : "—";
                    })() }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell font-medium text-gray-900", children: item.flavorName }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                      EditableNumber,
                      {
                        value: item.prepared,
                        onSave: (val) => updateItem(item.id, "prepared", val),
                        className: "editable-cell text-gray-600 text-sm text-center justify-center"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                      EditableNumber,
                      {
                        value: item.sold,
                        onSave: (val) => updateItem(item.id, "sold", val),
                        className: "editable-cell text-gray-600 text-sm text-center justify-center"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                      EditableNumber,
                      {
                        value: item.giveaway || 0,
                        onSave: (val) => updateItem(item.id, "giveaway", val),
                        className: "editable-cell text-gray-600 text-sm text-center justify-center"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-600 text-sm text-center justify-center", children: item.remaining }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-600 text-sm text-right justify-end", children: item.revenue > 0 ? formatCurrency(item.revenue) : "—" }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => toggleBaseCost(item.id),
                        className: `w-5 h-5 rounded border flex items-center justify-center transition-colors ${useBaseCost[item.id] ? "bg-pink-500 border-pink-500 text-white" : "border-gray-300 hover:border-pink-400"}`,
                        title: useBaseCost[item.id] ? "Using base cost" : "Using custom cost",
                        children: useBaseCost[item.id] && /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M5 13l4 4L19 7" }) })
                      }
                    ) }) }),
                    /* @__PURE__ */ jsx("td", { children: useBaseCost[item.id] ? /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end text-gray-600", children: item.unitCost ? formatCurrency(item.unitCost) : "—" }) : /* @__PURE__ */ jsx(
                      EditableNumber,
                      {
                        value: item.unitCost || 0,
                        onSave: (val) => updateItem(item.id, "unitCost", val),
                        isCurrency: true,
                        className: "editable-cell text-gray-600 text-sm text-right justify-end"
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end text-gray-600", children: item.cogs > 0 ? formatCurrency(item.cogs) : "—" }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end", children: item.profit > 0 ? /* @__PURE__ */ jsx("span", { className: "text-green-600 font-medium", children: formatCurrency(item.profit) }) : item.profit < 0 ? /* @__PURE__ */ jsx("span", { className: "text-red-500 font-medium", children: formatCurrency(item.profit) }) : "—" }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => deleteItem(item.id),
                        className: "opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all",
                        title: "Delete item",
                        children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
                      }
                    ) })
                  ] }, item.id)),
                  /* @__PURE__ */ jsxs("tr", { className: "border-t-2 border-gray-200 bg-gray-50 font-medium", children: [
                    /* @__PURE__ */ jsx("td", {}),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell font-bold text-gray-900", children: "Total" }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-900 text-sm text-center justify-center font-semibold", children: items.reduce((sum, i) => sum + i.prepared, 0) }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-900 text-sm text-center justify-center font-semibold", children: items.reduce((sum, i) => sum + i.sold, 0) }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-900 text-sm text-center justify-center font-semibold", children: items.reduce((sum, i) => sum + (i.giveaway || 0), 0) }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-gray-900 text-sm text-center justify-center font-semibold", children: items.reduce((sum, i) => sum + i.remaining, 0) }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end font-semibold text-gray-900", children: formatCurrency(items.reduce((sum, i) => sum + i.revenue, 0)) }) }),
                    /* @__PURE__ */ jsx("td", {}),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end text-gray-400", children: "—" }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end font-semibold text-gray-900", children: formatCurrency(items.reduce((sum, i) => sum + i.cogs, 0)) }) }),
                    /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm text-right justify-end", children: (() => {
                      const totalProfit = items.reduce((sum, i) => sum + i.profit, 0);
                      return totalProfit >= 0 ? /* @__PURE__ */ jsx("span", { className: "text-green-600 font-bold", children: formatCurrency(totalProfit) }) : /* @__PURE__ */ jsx("span", { className: "text-red-500 font-bold", children: formatCurrency(totalProfit) });
                    })() }) }),
                    /* @__PURE__ */ jsx("td", {})
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "px-4 mt-6", children: [
                /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-3", children: "Notes" }),
                /* @__PURE__ */ jsx(
                  NotesEditor,
                  {
                    content: event.notes || "",
                    onSave: (content) => updateEvent("notes", content)
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "px-4 mt-8 mb-4", children: /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleDeleteEvent,
                  className: "text-red-500 text-sm hover:text-red-600 transition-colors",
                  children: pendingDeleteEvent ? /* @__PURE__ */ jsx("span", { className: "animate-pulse", children: "Confirm? Tap Again" }) : "Delete This Event"
                }
              ) })
            ] })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white rounded-2xl overflow-hidden",
            style: {
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)"
            },
            children: [
              /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-gray-100", children: /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide", children: "Location" }) }),
              /* @__PURE__ */ jsx("div", { className: "aspect-[4/3] bg-gray-100 relative", children: event.location ? /* @__PURE__ */ jsx(AppleMap, { location: event.location, eventName: event.name }) : /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center text-gray-400 text-sm", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                /* @__PURE__ */ jsxs("svg", { className: "w-10 h-10 mx-auto text-gray-300 mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
                  /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
                ] }),
                "No location set"
              ] }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
                /* @__PURE__ */ jsx(
                  EditableText,
                  {
                    value: event.location || "Click to add address",
                    onSave: (value) => updateEvent("location", value === "Click to add address" ? "" : value),
                    className: "text-sm text-gray-600",
                    multiline: true
                  }
                ),
                event.location && /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => updateEvent("location", ""),
                    className: "text-xs text-red-400 hover:text-red-500 mt-2 transition-colors",
                    children: "Remove Address"
                  }
                )
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "bg-white rounded-2xl overflow-hidden",
            style: {
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)"
            },
            children: [
              /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-gray-100", children: /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-gray-500 uppercase tracking-wide", children: "Payments Collected" }) }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-lg", children: "💵" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Cash" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    EditableText,
                    {
                      value: event.cashCollected ? formatCurrency(event.cashCollected) : "$0.00",
                      onSave: (value) => updateEvent("cashCollected", parseFloat(value.replace(/[$,]/g, "")) || 0),
                      className: "text-sm font-semibold text-gray-900",
                      allowEmpty: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-lg", children: "📱" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Venmo" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    EditableText,
                    {
                      value: event.venmoCollected ? formatCurrency(event.venmoCollected) : "$0.00",
                      onSave: (value) => updateEvent("venmoCollected", parseFloat(value.replace(/[$,]/g, "")) || 0),
                      className: "text-sm font-semibold text-gray-900",
                      allowEmpty: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-lg", children: "💳" }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-700", children: "Other" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    EditableText,
                    {
                      value: event.otherCollected ? formatCurrency(event.otherCollected) : "$0.00",
                      onSave: (value) => updateEvent("otherCollected", parseFloat(value.replace(/[$,]/g, "")) || 0),
                      className: "text-sm font-semibold text-gray-900",
                      allowEmpty: true
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "pt-3 mt-3 border-t border-gray-100 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gray-900", children: "Total Collected" }),
                  /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-green-600", children: formatCurrency((event.cashCollected || 0) + (event.venmoCollected || 0) + (event.otherCollected || 0)) })
                ] })
              ] })
            ]
          }
        )
      ] })
    ] }),
    toast && /* @__PURE__ */ jsx("div", { className: `toast ${toast.type}`, children: toast.message }),
    showAddFlavor && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/50 z-50", onClick: () => {
        setShowAddFlavor(false);
        resetAddFlavorForm();
      } }),
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl shadow-2xl w-full max-w-md p-6", onClick: (e) => e.stopPropagation(), children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-gray-900 mb-4", children: "Add Flavor to Event" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-1 bg-gray-100 p-1 rounded-lg mb-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setAddFlavorMode("select"),
              className: `flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${addFlavorMode === "select" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
              children: "Select Existing"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setAddFlavorMode("custom"),
              className: `flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${addFlavorMode === "custom" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`,
              children: "Custom (One-off)"
            }
          )
        ] }),
        addFlavorMode === "select" ? /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Select Flavor" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: selectedFlavorId,
              onChange: (e) => setSelectedFlavorId(e.target.value ? parseInt(e.target.value) : ""),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "Choose a flavor..." }),
                availableFlavors.map((flavor) => /* @__PURE__ */ jsxs("option", { value: flavor.id, children: [
                  flavor.name,
                  " ",
                  flavor.unitCost ? `($${flavor.unitCost.toFixed(2)} cost)` : ""
                ] }, flavor.id))
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Custom Flavor Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: customFlavorName,
              onChange: (e) => setCustomFlavorName(e.target.value),
              placeholder: "Enter flavor name...",
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Prepared Qty" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                value: newItemData.prepared,
                onChange: (e) => setNewItemData((prev) => ({ ...prev, prepared: parseInt(e.target.value) || 0 })),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Unit Cost (optional)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: newItemData.unitCost,
                onChange: (e) => setNewItemData((prev) => ({ ...prev, unitCost: e.target.value })),
                placeholder: addFlavorMode === "select" && selectedFlavorId ? "Use default" : "$0.00",
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowAddFlavor(false);
                resetAddFlavorForm();
              },
              className: "flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleAddFlavor,
              className: "flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors",
              children: "Add Flavor"
            }
          )
        ] })
      ] }) })
    ] })
  ] });
}
function StatCard({ label, value, sublabel, highlight }) {
  return /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-2xl ${highlight ? "bg-pink-50" : "bg-gray-50"}`, children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wide font-medium", children: label }),
    /* @__PURE__ */ jsx("p", { className: `text-2xl font-bold mt-1 ${highlight ? "text-pink-600" : "text-gray-900"}`, children: value }),
    sublabel && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: sublabel })
  ] });
}
function EditableText({ value, onSave, className, allowEmpty = false, multiline = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
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
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      setIsEditing(false);
    }
  };
  if (isEditing) {
    if (multiline) {
      return /* @__PURE__ */ jsx(
        "textarea",
        {
          ref: textareaRef,
          value: editValue,
          onChange: (e) => setEditValue(e.target.value),
          onBlur: handleSave,
          onKeyDown: handleKeyDown,
          rows: 3,
          className: `${className} bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg px-2 py-1 w-full resize-none`
        }
      );
    }
    return /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "text",
        value: editValue,
        onChange: (e) => setEditValue(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        className: `${className} bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg px-2`
      }
    );
  }
  return /* @__PURE__ */ jsx("div", { onClick: () => setIsEditing(true), className: `${className} cursor-text hover:bg-gray-50 rounded-lg px-2 -mx-2 whitespace-pre-wrap`, children: value });
}
function AppleMap({ location, eventName }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapRef.current) return;
    try {
      const mapkit = window.mapkit;
      if (!mapkit) {
        setError("MapKit not loaded");
        return;
      }
      if (!mapkit.init) {
        setError("MapKit initialization failed");
        return;
      }
      try {
        mapkit.init({
          authorizationCallback: (done) => {
            done(MAPKIT_TOKEN);
          }
        });
      } catch {
      }
      const map = new mapkit.Map(mapContainerRef.current, {
        colorScheme: mapkit.Map.ColorSchemes.Light,
        showsCompass: mapkit.FeatureVisibility.Hidden,
        showsZoomControl: false,
        showsMapTypeControl: false
      });
      mapRef.current = map;
      const geocoder = new mapkit.Geocoder();
      geocoder.lookup(location, (geocodeError, data) => {
        if (geocodeError || !data?.results?.[0]) {
          setError("Location not found");
          return;
        }
        const place = data.results[0];
        const coordinate = place.coordinate;
        const marker = new mapkit.MarkerAnnotation(coordinate, {
          color: "#ec4899",
          title: eventName
        });
        map.addAnnotation(marker);
        map.region = new mapkit.CoordinateRegion(
          coordinate,
          new mapkit.CoordinateSpan(0.05, 0.05)
        );
        setIsLoaded(true);
      });
    } catch {
      setError("Failed to initialize map");
    }
  }, [location, eventName]);
  useEffect(() => {
    if (!window.mapkit) {
      const script = document.createElement("script");
      script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
      script.crossOrigin = "anonymous";
      script.onload = () => initMap();
      script.onerror = () => setError("Failed to load MapKit");
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
    return /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center text-gray-400 text-sm bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "text-center px-4", children: [
      /* @__PURE__ */ jsxs("svg", { className: "w-8 h-8 mx-auto text-gray-300 mb-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
        /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" }),
        /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs", children: error })
    ] }) });
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    !isLoaded && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-gray-100", children: /* @__PURE__ */ jsx("div", { className: "animate-pulse text-gray-400 text-sm", children: "Loading map..." }) }),
    /* @__PURE__ */ jsx("div", { ref: mapContainerRef, className: "absolute inset-0" })
  ] });
}
function EditableNumber({ value, onSave, isCurrency = false, className, inline = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef(null);
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
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };
  const formatDisplay = (num) => {
    if (isCurrency) {
      return `$${num.toFixed(2)}`;
    }
    return num.toString();
  };
  if (isEditing) {
    return /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "number",
        step: isCurrency ? "0.01" : "1",
        value: editValue,
        onChange: (e) => setEditValue(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        className: inline ? "w-16 text-right text-sm bg-white border border-pink-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded px-1 py-0.5" : "w-full text-center text-sm bg-white border border-pink-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 rounded px-1 py-0.5"
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "span",
    {
      onClick: () => setIsEditing(true),
      className: className || "editable-cell text-gray-600 text-sm text-center justify-center cursor-text",
      children: formatDisplay(value)
    }
  );
}
function NotesEditor({ content, onSave }) {
  const [value, setValue] = useState(content || "");
  const [QuillComponent, setQuillComponent] = useState(null);
  const lastSavedContent = useRef(content);
  useEffect(() => {
    let mounted = true;
    import('react-quill-new').then((mod) => {
      if (mounted) {
        Promise.resolve({                              });
        setQuillComponent(() => mod.default);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (content !== lastSavedContent.current) {
      setValue(content || "");
      lastSavedContent.current = content;
    }
  }, [content]);
  const handleChange = (newValue) => {
    setValue(newValue);
  };
  const handleBlur = () => {
    if (value !== lastSavedContent.current) {
      lastSavedContent.current = value;
      onSave(value);
    }
  };
  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }]
    ]
  };
  const formats = ["bold", "italic", "underline", "list"];
  if (!QuillComponent) {
    return /* @__PURE__ */ jsx("div", { className: "notes-editor", children: /* @__PURE__ */ jsx("div", { className: "border border-gray-200 rounded-xl bg-white min-h-[160px] p-4 text-gray-400 text-sm", children: "Loading editor..." }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "notes-editor", children: /* @__PURE__ */ jsx(
    QuillComponent,
    {
      theme: "snow",
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      modules,
      formats,
      placeholder: "Add notes..."
    }
  ) });
}
function SortableHeader({
  column,
  label,
  currentSort,
  direction,
  onSort,
  className = ""
}) {
  const isActive = currentSort === column;
  return /* @__PURE__ */ jsx(
    "th",
    {
      className: `${className} cursor-pointer hover:bg-gray-50 transition-colors select-none`,
      onClick: () => onSort(column),
      children: /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-1 ${className.includes("text-right") ? "justify-end" : className.includes("text-center") ? "justify-center" : ""}`, children: [
        /* @__PURE__ */ jsx("span", { children: label }),
        /* @__PURE__ */ jsx("span", { className: `text-[10px] ${isActive ? "text-pink-500" : "text-gray-300"}`, children: isActive ? direction === "asc" ? "▲" : "▼" : "▲" })
      ] })
    }
  );
}

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  if (!id) {
    return Astro2.redirect("/events");
  }
  const event = await db.select().from(events).where(eq(events.id, parseInt(id))).get();
  if (!event) {
    return Astro2.redirect("/events");
  }
  const items = await db.select().from(eventItems).where(eq(eventItems.eventId, parseInt(id))).all();
  const allFlavors = await db.select().from(flavors).all();
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `${event.name} | Mighty Sweets Baking Co.` }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "EventDetail", EventDetail, { "client:load": true, "event": event, "items": items, "availableFlavors": allFlavors, "client:component-hydration": "load", "client:component-path": "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/EventDetail", "client:component-export": "default" })} ` })}`;
}, "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/events/[id].astro", void 0);

const $$file = "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/events/[id].astro";
const $$url = "/events/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
