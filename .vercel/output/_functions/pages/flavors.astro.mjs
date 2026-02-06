import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_DcaTcJfu.mjs';
import { $ as $$Layout } from '../chunks/Layout_DCrs8C6F.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect, useRef } from 'react';
import { d as db, f as flavors } from '../chunks/index_D6rbc0Ls.mjs';
export { renderers } from '../renderers.mjs';

function FlavorsTable({ initialFlavors }) {
  const [flavors, setFlavors] = useState(initialFlavors);
  const [toast, setToast] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };
  useEffect(() => {
    if (pendingDelete) {
      const timer = setTimeout(() => setPendingDelete(null), 3e3);
      return () => clearTimeout(timer);
    }
  }, [pendingDelete]);
  const updateFlavor = async (id, field, value) => {
    const numValue = field === "name" ? value : parseFloat(value) || 0;
    setFlavors(
      (prev) => prev.map((f) => f.id === id ? { ...f, [field]: numValue } : f)
    );
    try {
      const response = await fetch("/api/flavors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: numValue })
      });
      if (!response.ok) throw new Error("Failed to update");
      showToast("Saved");
    } catch {
      showToast("Failed to save", "error");
      setFlavors(initialFlavors);
    }
  };
  const addFlavor = async () => {
    try {
      const response = await fetch("/api/flavors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Flavor", unitPrice: 5, unitCost: null })
      });
      if (!response.ok) throw new Error("Failed to add");
      const newFlavor = await response.json();
      setFlavors((prev) => [...prev, newFlavor]);
      showToast("Added new flavor");
    } catch {
      showToast("Failed to add flavor", "error");
    }
  };
  const handleDeleteClick = async (id) => {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    try {
      const response = await fetch("/api/flavors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!response.ok) throw new Error("Failed to delete");
      setFlavors((prev) => prev.filter((f) => f.id !== id));
      setPendingDelete(null);
      showToast("Deleted");
    } catch {
      showToast("Failed to delete", "error");
      setPendingDelete(null);
    }
  };
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "w-full bg-[#fafafc] rounded-3xl overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-8 pt-8 pb-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Flavors" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Click any cell to edit. Changes save automatically." })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: addFlavor,
            className: "px-5 py-2.5 bg-pink-500 text-white rounded-full font-medium text-sm hover:bg-pink-600 transition-all hover:shadow-lg hover:shadow-pink-200 flex items-center gap-2",
            children: [
              /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 4v16m8-8H4" }) }),
              "Add Flavor"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-4 pb-4", children: [
        /* @__PURE__ */ jsxs("table", { className: "data-table", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "w-12 text-center", children: "#" }),
            /* @__PURE__ */ jsx("th", { children: "Flavor Name" }),
            /* @__PURE__ */ jsx("th", { className: "w-28", children: "Unit Price" }),
            /* @__PURE__ */ jsx("th", { className: "w-28", children: "Unit Cost" }),
            /* @__PURE__ */ jsx("th", { className: "w-24", children: "Margin" }),
            /* @__PURE__ */ jsx("th", { className: "w-14" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: flavors.map((flavor, index) => /* @__PURE__ */ jsxs("tr", { className: "group", children: [
            /* @__PURE__ */ jsx("td", { className: "text-center", children: /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-sm", children: index + 1 }) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
              EditableCell,
              {
                value: flavor.name,
                onSave: (value) => updateFlavor(flavor.id, "name", value),
                isEditing: editingCell?.id === flavor.id && editingCell?.field === "name",
                onEdit: () => setEditingCell({ id: flavor.id, field: "name" }),
                onBlur: () => setEditingCell(null)
              }
            ) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
              EditableCell,
              {
                value: `$${flavor.unitPrice.toFixed(2)}`,
                onSave: (value) => updateFlavor(flavor.id, "unitPrice", value.replace("$", "")),
                isEditing: editingCell?.id === flavor.id && editingCell?.field === "unitPrice",
                onEdit: () => setEditingCell({ id: flavor.id, field: "unitPrice" }),
                onBlur: () => setEditingCell(null),
                type: "currency"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
              EditableCell,
              {
                value: flavor.unitCost ? `$${flavor.unitCost.toFixed(2)}` : "—",
                onSave: (value) => updateFlavor(flavor.id, "unitCost", value.replace("$", "").replace("—", "")),
                isEditing: editingCell?.id === flavor.id && editingCell?.field === "unitCost",
                onEdit: () => setEditingCell({ id: flavor.id, field: "unitCost" }),
                onBlur: () => setEditingCell(null),
                type: "currency"
              }
            ) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "editable-cell text-sm", children: flavor.unitCost ? /* @__PURE__ */ jsxs("span", { className: "text-green-600 font-medium", children: [
              ((flavor.unitPrice - flavor.unitCost) / flavor.unitPrice * 100).toFixed(0),
              "%"
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-gray-300", children: "—" }) }) }),
            /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => handleDeleteClick(flavor.id),
                className: `p-2 transition-all min-w-[44px] ${pendingDelete === flavor.id ? "opacity-100 text-red-500 text-xs font-medium" : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"}`,
                title: pendingDelete === flavor.id ? "Click again to confirm" : "Delete",
                children: pendingDelete === flavor.id ? /* @__PURE__ */ jsx("span", { className: "animate-pulse", children: "delete" }) : /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) })
              }
            ) })
          ] }, flavor.id)) })
        ] }),
        flavors.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-gray-400", children: 'No flavors yet. Click "Add Flavor" to get started.' })
      ] })
    ] }),
    toast && /* @__PURE__ */ jsx("div", { className: `toast ${toast.type}`, children: toast.message })
  ] });
}
function EditableCell({ value, onSave, isEditing, onEdit, onBlur, type = "text" }) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  useEffect(() => {
    setEditValue(value);
  }, [value]);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(value);
      onBlur();
    }
  };
  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    onBlur();
  };
  if (isEditing) {
    return /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: type === "currency" ? "text" : "text",
        value: editValue,
        onChange: (e) => setEditValue(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        className: "editable-cell w-full bg-white border-0 focus:ring-2 focus:ring-pink-500 rounded-lg"
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      onClick: onEdit,
      className: "editable-cell cursor-text",
      children: value
    }
  );
}

const prerender = false;
const $$Flavors = createComponent(async ($$result, $$props, $$slots) => {
  const allFlavors = await db.select().from(flavors);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Flavors | Mighty Sweets Baking Co." }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "FlavorsTable", FlavorsTable, { "client:load": true, "initialFlavors": allFlavors, "client:component-hydration": "load", "client:component-path": "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/FlavorsTable", "client:component-export": "default" })} ` })}`;
}, "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/flavors.astro", void 0);

const $$file = "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/flavors.astro";
const $$url = "/flavors";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Flavors,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
