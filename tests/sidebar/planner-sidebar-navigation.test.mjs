import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

register(new URL("../support/typescript-loader.mjs", import.meta.url));

const sidebarMenu = await import("../../components/sidebar/sidebar.menu.tsx");
const sidebarItemModule = await import("../../components/sidebar/sidebar.item.tsx");

function hrefs(markup) {
  return [...markup.matchAll(/<a[^>]+href="([^"]+)"/g)].map((match) => match[1]);
}

test("Discover renders Home, Explore, Community, and Help in landing-navigation order", () => {
  const DiscoverMenu = sidebarMenu.PlannerDiscoverMenu;
  const html = typeof DiscoverMenu === "function"
    ? renderToStaticMarkup(createElement(DiscoverMenu, {
      collapsed: false,
      pathName: "/planner/example",
      onNavigate() {},
    }))
    : "";

  assert.match(html, />Discover</);
  assert.deepEqual(hrefs(html), ["/", "/explore", "/community", "/help"]);
  assert.match(html, />Home</);
  assert.match(html, />Help</);
});

test("Trips renders Dashboard before saved-trip content", () => {
  const TripsMenu = sidebarMenu.SidebarTripsMenu;
  const html = typeof TripsMenu === "function"
    ? renderToStaticMarkup(createElement(
      TripsMenu,
      {
        collapsed: false,
        dashboardActive: false,
        onNavigate() {},
      },
      createElement("a", { href: "/planner/example" }, "Example trip"),
    ))
    : "";

  assert.match(html, />Trips</);
  assert.deepEqual(hrefs(html), ["/dashboard", "/planner/example"]);
  assert.ok(html.indexOf(">Dashboard<") < html.indexOf(">Example trip<"));
});

test("active sidebar links keep their selected surface without an edge marker or persistent focus outline", () => {
  const SidebarItem = sidebarItemModule.default;
  const html = typeof SidebarItem === "function"
    ? renderToStaticMarkup(createElement(SidebarItem, {
      title: "Explore",
      href: "/explore",
      isActive: true,
    }))
    : "";

  assert.match(html, /aria-current="page"/);
  assert.match(html, /data-active="true"/);
  assert.match(html, /bg-sidebar-accent\/90/);
  assert.doesNotMatch(html, /sidebar-active-indicator/);
  assert.match(html, /focus-visible:ring/);
  assert.doesNotMatch(html, /(?:^|\s)focus:ring/);
});
