import { renderers } from './renderers.mjs';
import { c as createExports, s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_B95CE0ZE.mjs';
import { manifest } from './manifest_CSuo6zBD.mjs';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/event-items.astro.mjs');
const _page2 = () => import('./pages/api/events.astro.mjs');
const _page3 = () => import('./pages/api/flavors.astro.mjs');
const _page4 = () => import('./pages/events/_id_.astro.mjs');
const _page5 = () => import('./pages/events.astro.mjs');
const _page6 = () => import('./pages/flavors.astro.mjs');
const _page7 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.17.1_@types+node@25.2.0_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_rollup@4.57.1_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/event-items.ts", _page1],
    ["src/pages/api/events.ts", _page2],
    ["src/pages/api/flavors.ts", _page3],
    ["src/pages/events/[id].astro", _page4],
    ["src/pages/events/index.astro", _page5],
    ["src/pages/flavors.astro", _page6],
    ["src/pages/index.astro", _page7]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./noop-entrypoint.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "8df4c299-6984-452c-8bac-0df9f7376299",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) ;

export { __astrojsSsrVirtualEntry as default, pageMap };
