import { o as decodeKey } from './chunks/astro/server_DcaTcJfu.mjs';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_CNldfaxj.mjs';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/","cacheDir":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/node_modules/.astro/","outDir":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/dist/","srcDir":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/","publicDir":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/public/","buildClientDir":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/dist/client/","buildServerDir":"file:///Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/dist/server/","adapterName":"@astrojs/vercel","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/astro@5.17.1_@types+node@25.2.0_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_rollup@4.57.1_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/event-items","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/event-items\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"event-items","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/event-items.ts","pathname":"/api/event-items","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/events","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/events\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"events","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/events.ts","pathname":"/api/events","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/flavors","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/flavors\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"flavors","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/flavors.ts","pathname":"/api/flavors","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.DK2Pg4F5.css"},{"type":"external","src":"/_astro/_id_.IdxJyx6-.css"}],"routeData":{"route":"/events/[id]","isIndex":false,"type":"page","pattern":"^\\/events\\/([^/]+?)\\/?$","segments":[[{"content":"events","dynamic":false,"spread":false}],[{"content":"id","dynamic":true,"spread":false}]],"params":["id"],"component":"src/pages/events/[id].astro","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.DK2Pg4F5.css"}],"routeData":{"route":"/events","isIndex":true,"type":"page","pattern":"^\\/events\\/?$","segments":[[{"content":"events","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/events/index.astro","pathname":"/events","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.DK2Pg4F5.css"}],"routeData":{"route":"/flavors","isIndex":false,"type":"page","pattern":"^\\/flavors\\/?$","segments":[[{"content":"flavors","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/flavors.astro","pathname":"/flavors","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/_id_.DK2Pg4F5.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/events/[id].astro",{"propagation":"none","containsHead":true}],["/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/events/index.astro",{"propagation":"none","containsHead":true}],["/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/flavors.astro",{"propagation":"none","containsHead":true}],["/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/pages/index.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/api/event-items@_@ts":"pages/api/event-items.astro.mjs","\u0000@astro-page:src/pages/api/events@_@ts":"pages/api/events.astro.mjs","\u0000@astro-page:src/pages/api/flavors@_@ts":"pages/api/flavors.astro.mjs","\u0000@astro-page:src/pages/events/[id]@_@astro":"pages/events/_id_.astro.mjs","\u0000@astro-page:src/pages/events/index@_@astro":"pages/events.astro.mjs","\u0000@astro-page:src/pages/flavors@_@astro":"pages/flavors.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/.pnpm/astro@5.17.1_@types+node@25.2.0_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_rollup@4.57.1_typescript@5.9.3/node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/node_modules/.pnpm/react-quill-new@3.8.3_quill-delta@5.1.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-quill-new/dist/quill.snow.css":"_astro/_id_.cb94fbbb.D65jl4To.js","\u0000@astrojs-manifest":"manifest_CSuo6zBD.mjs","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/node_modules/.pnpm/astro@5.17.1_@types+node@25.2.0_@vercel+functions@2.2.13_jiti@2.6.1_lightningcss@1.30.2_rollup@4.57.1_typescript@5.9.3/node_modules/astro/dist/assets/services/sharp.js":"chunks/sharp_BFwgLjJf.mjs","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/EventDetail":"_astro/EventDetail.C6hadfI1.js","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/EventsTable":"_astro/EventsTable.Ba_AIni0.js","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/Dashboard":"_astro/Dashboard.OChTq25N.js","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/components/FlavorsTable":"_astro/FlavorsTable.DUhwTrOE.js","@astrojs/react/client.js":"_astro/client.DxGJByhr.js","/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/node_modules/.pnpm/react-quill-new@3.8.3_quill-delta@5.1.0_react-dom@19.2.4_react@19.2.4__react@19.2.4/node_modules/react-quill-new/lib/index.js":"_astro/index.CwkZFxZW.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/_astro/bricolage-grotesque-vietnamese-400-normal.B7Iv8-Rg.woff2","/_astro/bricolage-grotesque-latin-400-normal.A6LyuA6R.woff2","/_astro/bricolage-grotesque-latin-ext-500-normal.DIhLz7G7.woff2","/_astro/bricolage-grotesque-latin-ext-400-normal.D42HmrHD.woff2","/_astro/bricolage-grotesque-vietnamese-600-normal.Ipewt4hn.woff2","/_astro/bricolage-grotesque-vietnamese-700-normal.BLYPkJbo.woff2","/_astro/bricolage-grotesque-latin-700-normal.gtcctNPv.woff2","/_astro/bricolage-grotesque-latin-600-normal.nxTgbNFE.woff2","/_astro/bricolage-grotesque-latin-ext-600-normal.CN5JKkBm.woff2","/_astro/bricolage-grotesque-vietnamese-500-normal.FzY9NZwK.woff2","/_astro/bricolage-grotesque-latin-ext-700-normal.fBkt-7fi.woff2","/_astro/bricolage-grotesque-latin-500-normal.DEDBoLFO.woff2","/_astro/bricolage-grotesque-vietnamese-400-normal.Sle7MYWg.woff","/_astro/bricolage-grotesque-latin-ext-500-normal.B0ZDNVGf.woff","/_astro/bricolage-grotesque-latin-400-normal.D89K-qEP.woff","/_astro/bricolage-grotesque-latin-ext-400-normal.BH175q6o.woff","/_astro/bricolage-grotesque-latin-700-normal.DvJDmrLu.woff","/_astro/bricolage-grotesque-latin-600-normal.Bw0J83-2.woff","/_astro/bricolage-grotesque-latin-ext-600-normal.DF26P3Q7.woff","/_astro/bricolage-grotesque-latin-ext-700-normal.BXpPFNFj.woff","/_astro/bricolage-grotesque-vietnamese-600-normal.BppAn7jL.woff","/_astro/bricolage-grotesque-vietnamese-700-normal.CHrFuVHU.woff","/_astro/bricolage-grotesque-latin-500-normal.CV-uA8Lw.woff","/_astro/bricolage-grotesque-vietnamese-500-normal.CAK5R6Iy.woff","/_astro/_id_.DK2Pg4F5.css","/_astro/_id_.IdxJyx6-.css","/favicon.ico","/favicon.svg","/_astro/Dashboard.OChTq25N.js","/_astro/EventDetail.C6hadfI1.js","/_astro/EventsTable.Ba_AIni0.js","/_astro/FlavorsTable.DUhwTrOE.js","/_astro/client.DxGJByhr.js","/_astro/index.BrG1Lyua.js","/_astro/index.CwkZFxZW.js","/_astro/index.DsWSXZuR.js","/_astro/index.wJO33kLt.js","/_astro/jsx-runtime.D_zvdyIk.js"],"buildFormat":"directory","checkOrigin":true,"allowedDomains":[],"serverIslandNameMap":[],"key":"icS7feqmMBGAaP+G7M3RMfm9ItzEfcXRMtON6PFRiLk="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
