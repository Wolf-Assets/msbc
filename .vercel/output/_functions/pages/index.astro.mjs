import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_DcaTcJfu.mjs';
import { $ as $$Layout } from '../chunks/Layout_DCrs8C6F.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Line, LineChart, BarChart, Bar } from 'recharts';
import { d as db, a as events, f as flavors } from '../chunks/index_D6rbc0Ls.mjs';
import { desc } from 'drizzle-orm';
export { renderers } from '../renderers.mjs';

const CHART_PINK = "#ec4899";
function Dashboard({ events, flavors }) {
  const eventsWithSales = events.filter((e) => e.totalSold > 0);
  const totalRevenue = events.reduce((sum, e) => sum + e.totalRevenue, 0);
  const totalProfit = events.reduce((sum, e) => sum + e.netProfit, 0);
  const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue * 100 : 0;
  const monthOrder = ["Aug '25", "Sep '25", "Oct '25", "Nov '25", "Dec '25", "Jan '26", "Feb '26"];
  const monthlyData = eventsWithSales.reduce((acc, e) => {
    const date = new Date(e.eventDate);
    const month = date.toLocaleDateString("en-US", { month: "short" }) + " '" + date.getFullYear().toString().slice(-2);
    if (!acc[month]) {
      acc[month] = { revenue: 0, profit: 0, events: 0 };
    }
    acc[month].revenue += e.totalRevenue;
    acc[month].profit += e.netProfit;
    acc[month].events += 1;
    return acc;
  }, {});
  const monthlyTrend = monthOrder.map((month) => ({
    month,
    revenue: monthlyData[month]?.revenue || 0,
    profit: monthlyData[month]?.profit || 0,
    events: monthlyData[month]?.events || 0
  }));
  const topEventsByRevenue = [...eventsWithSales].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 6);
  const marginByEvent = eventsWithSales.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).map((e) => ({
    name: e.name,
    fullName: e.name,
    margin: e.totalRevenue > 0 ? e.netProfit / e.totalRevenue * 100 : 0,
    date: new Date(e.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }));
  const venueData = events.reduce((acc, e) => {
    const venueName = e.name;
    if (!acc[venueName]) {
      acc[venueName] = { visits: 0, totalRevenue: 0, totalProfit: 0 };
    }
    acc[venueName].visits += 1;
    acc[venueName].totalRevenue += e.totalRevenue;
    acc[venueName].totalProfit += e.netProfit;
    return acc;
  }, {});
  const venuePerformance = Object.entries(venueData).map(([name, data]) => ({
    name,
    visits: data.visits,
    totalRevenue: data.totalRevenue,
    avgRevenue: data.visits > 0 ? data.totalRevenue / data.visits : 0,
    avgProfit: data.visits > 0 ? data.totalProfit / data.visits : 0
  })).filter((v) => v.visits > 1).sort((a, b) => b.visits - a.visits);
  const dayOfWeekData = eventsWithSales.reduce((acc, e) => {
    const date = /* @__PURE__ */ new Date(e.eventDate + "T00:00:00");
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    if (!acc[dayName]) {
      acc[dayName] = { revenue: 0, profit: 0, count: 0 };
    }
    acc[dayName].revenue += e.totalRevenue;
    acc[dayName].profit += e.netProfit;
    acc[dayName].count += 1;
    return acc;
  }, {});
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const revenueByDay = dayOrder.map((day) => ({
    day,
    revenue: dayOfWeekData[day]?.revenue || 0,
    avgRevenue: dayOfWeekData[day] ? dayOfWeekData[day].revenue / dayOfWeekData[day].count : 0,
    events: dayOfWeekData[day]?.count || 0
  }));
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(value);
  };
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return /* @__PURE__ */ jsxs("div", { className: "bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100 text-sm", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 mb-1", children: label }),
        payload.map((entry, index) => /* @__PURE__ */ jsxs("p", { style: { color: entry.color }, className: "text-sm", children: [
          entry.name,
          ": ",
          entry.name === "Margin" || entry.name === "margin" ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)
        ] }, index))
      ] });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Dashboard" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 mt-1", children: "Overview of your business performance" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-4 auto-rows-[140px]", style: { gridTemplateRows: "100px repeat(auto-fill, 140px)" }, children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 row-span-1 bg-gradient-to-br from-pink-500 to-pink-600 rounded-3xl p-5 text-white flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-pink-100 text-xs font-medium uppercase tracking-wide", children: "Total Revenue" }),
          /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold mt-1", children: formatCurrency(totalRevenue) }),
          /* @__PURE__ */ jsxs("p", { className: "text-pink-200 text-xs mt-1", children: [
            "From ",
            eventsWithSales.length,
            " events"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold", children: formatCurrency(totalRevenue / (eventsWithSales.length || 1)) }),
          /* @__PURE__ */ jsx("p", { className: "text-pink-200 text-xs", children: "avg per event" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 row-span-1 bg-green-50 border border-green-100 rounded-3xl p-4 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-green-600 font-medium uppercase tracking-wide", children: "Total Profit" }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-green-600 mt-1", children: formatCurrency(totalProfit) }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-green-500 mt-1", children: [
          formatCurrency(totalProfit / (eventsWithSales.length || 1)),
          " avg"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 row-span-1 bg-[#fafafc] border border-gray-100 rounded-3xl p-4 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 font-medium uppercase tracking-wide", children: "Profit Margin" }),
        /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold text-gray-900 mt-1", children: [
          profitMargin.toFixed(1),
          "%"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400 mt-1", children: "overall" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 font-medium uppercase tracking-wide mb-3", children: "Monthly Revenue Trend" }),
        /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 220, minWidth: 100, children: /* @__PURE__ */ jsxs(AreaChart, { data: monthlyTrend, margin: { top: 10, left: -20, right: -20 }, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "colorRevenue", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: CHART_PINK, stopOpacity: 0.3 }),
            /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: CHART_PINK, stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "month", tick: { fontSize: 11, fill: "#374151" }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 11, fill: "#374151" }, axisLine: false, tickLine: false, tickFormatter: (v) => `$${v}`, type: "number", scale: "linear" }),
          /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "revenue", stroke: CHART_PINK, strokeWidth: 2, fillOpacity: 1, fill: "url(#colorRevenue)", name: "Revenue" }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "profit", stroke: "#22c55e", strokeWidth: 2, dot: { fill: "#22c55e", r: 3 }, name: "Profit" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 font-medium uppercase tracking-wide mb-3", children: "Top Events" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: topEventsByRevenue.map((event, index) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: `w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-500"}`, children: index + 1 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 truncate max-w-[180px]", title: event.name, children: event.name })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-pink-600", children: formatCurrency(event.totalRevenue) })
        ] }, event.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-1 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 font-medium uppercase tracking-wide mb-3", children: "Repeat Venues" }),
        venuePerformance.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: venuePerformance.slice(0, 5).map((venue) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "w-6 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-pink-100 text-pink-600", children: [
              venue.visits,
              "x"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-700 truncate max-w-[200px]", title: venue.name, children: venue.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-900", children: formatCurrency(venue.avgRevenue) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-400", children: "avg" })
          ] })
        ] }, venue.name)) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 text-center mt-8", children: "No repeat venues yet" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 font-medium uppercase tracking-wide mb-3", children: "Profit Margin by Event" }),
        /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 220, minWidth: 100, children: /* @__PURE__ */ jsxs(LineChart, { data: marginByEvent, margin: { top: 10, left: -10, right: 25 }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
          /* @__PURE__ */ jsx(
            XAxis,
            {
              dataKey: "name",
              tick: ({ x, y, payload }) => {
                const words = payload.value.split(" ");
                const lines = [];
                let currentLine = "";
                for (const word of words) {
                  if (currentLine.length + word.length > 10) {
                    if (currentLine) lines.push(currentLine.trim());
                    currentLine = word + " ";
                  } else {
                    currentLine += word + " ";
                  }
                }
                if (currentLine.trim()) lines.push(currentLine.trim());
                return /* @__PURE__ */ jsx("text", { x, y, textAnchor: "middle", fill: "#374151", fontSize: 11, children: lines.map((line, i) => /* @__PURE__ */ jsx("tspan", { x, dy: i === 0 ? 14 : 13, children: line }, i)) });
              },
              axisLine: false,
              tickLine: false,
              interval: 0,
              height: 70
            }
          ),
          /* @__PURE__ */ jsx(
            YAxis,
            {
              tick: { fontSize: 10, fill: "#374151" },
              axisLine: false,
              tickLine: false,
              domain: [60, 80],
              ticks: [60, 65, 70, 75, 80],
              tickFormatter: (v) => `${v}%`,
              type: "number",
              scale: "linear",
              allowDataOverflow: true
            }
          ),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              formatter: (value) => [`${value.toFixed(1)}%`, "Margin"],
              labelFormatter: (label) => {
                const event = marginByEvent.find((e) => e.name === label);
                return event ? `${event.fullName} (${event.date})` : label;
              }
            }
          ),
          /* @__PURE__ */ jsx(
            Line,
            {
              type: "monotone",
              dataKey: "margin",
              stroke: CHART_PINK,
              strokeWidth: 2,
              dot: { fill: CHART_PINK, r: 4 },
              activeDot: { r: 6 },
              name: "Margin"
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 row-span-2 bg-[#fafafc] border border-gray-100 rounded-3xl p-5", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-400 font-medium uppercase tracking-wide mb-3", children: "Revenue by Day of Week" }),
        /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 220, minWidth: 100, children: /* @__PURE__ */ jsxs(BarChart, { data: revenueByDay, margin: { left: -20, right: -20 }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f0f0f0" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "day", tick: { fontSize: 11, fill: "#374151" }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10, fill: "#374151" }, axisLine: false, tickLine: false, tickFormatter: (v) => `$${v}`, type: "number", scale: "linear" }),
          /* @__PURE__ */ jsx(
            Tooltip,
            {
              formatter: (value, name) => [
                formatCurrency(value),
                name === "avgRevenue" ? "Avg Revenue" : "Total Revenue"
              ],
              labelFormatter: (label) => {
                const day = revenueByDay.find((d) => d.day === label);
                return day ? `${label} (${day.events} event${day.events > 1 ? "s" : ""})` : label;
              }
            }
          ),
          /* @__PURE__ */ jsx(Bar, { dataKey: "avgRevenue", fill: CHART_PINK, radius: [4, 4, 0, 0], name: "avgRevenue" })
        ] }) })
      ] })
    ] })
  ] });
}

const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const allEvents = await db.select().from(events).orderBy(desc(events.eventDate));
  const allFlavors = await db.select().from(flavors);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard | Mighty Sweets Baking Co." }, { "default": async ($$result2) => renderTemplate` ${renderComponent($$result2, "Dashboard", Dashboard, { "client:load": true, "events": allEvents, "flavors": allFlavors, "client:component-hydration": "load", "client:component-path": "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/Dashboard", "client:component-export": "default" })} ` })}`;
}, "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/index.astro", void 0);

const $$file = "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
