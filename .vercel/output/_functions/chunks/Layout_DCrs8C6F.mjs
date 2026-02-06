import { e as createComponent, l as renderHead, g as addAttribute, n as renderSlot, r as renderTemplate, h as createAstro } from './astro/server_DcaTcJfu.mjs';
/* empty css                        */

const $$Astro = createAstro();
const $$Layout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "Mighty Sweets Baking Co." } = Astro2.props;
  const currentPath = Astro2.url.pathname;
  const isActive = (path) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="icon" type="image/png" href="https://mightysweetbakingco.com/wp-content/uploads/2025/07/logo-1.png"><title>${title}</title>${renderHead()}</head> <body data-astro-cid-sckkx6r4> <div class="min-h-screen" data-astro-cid-sckkx6r4> <!-- Header --> <header class="bg-white sticky top-0 z-50" data-astro-cid-sckkx6r4> <div class="max-w-[1600px] mx-auto px-4 lg:px-8 py-4 flex items-center justify-between" data-astro-cid-sckkx6r4> <div class="flex items-center gap-4" data-astro-cid-sckkx6r4> <img src="https://mightysweetbakingco.com/wp-content/uploads/2025/07/logo-1.png" alt="Mighty Sweets Baking Co." class="h-12 w-auto" data-astro-cid-sckkx6r4> <div data-astro-cid-sckkx6r4> <h1 class="text-xl font-bold text-gray-900" data-astro-cid-sckkx6r4>Mighty Sweets Baking Co.</h1> <p class="text-xs text-pink-500 font-medium" data-astro-cid-sckkx6r4>Inventory Manager</p> </div> </div> <nav class="flex gap-1" data-astro-cid-sckkx6r4> <a href="/"${addAttribute(["nav-link", { active: isActive("/") }], "class:list")} data-astro-cid-sckkx6r4>Home</a> <a href="/flavors"${addAttribute(["nav-link", { active: isActive("/flavors") }], "class:list")} data-astro-cid-sckkx6r4>Flavors</a> <a href="/events"${addAttribute(["nav-link", { active: isActive("/events") }], "class:list")} data-astro-cid-sckkx6r4>Events</a> </nav> </div> </header> <!-- Main Content --> <main class="max-w-[1600px] mx-auto px-4 lg:px-8 py-6" data-astro-cid-sckkx6r4> ${renderSlot($$result, $$slots["default"])} </main> </div>  </body> </html>`;
}, "/Users/sour/Documents/wolfassets.org/projects/mightysweetcookies/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
