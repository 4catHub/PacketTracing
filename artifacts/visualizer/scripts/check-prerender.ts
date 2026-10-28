import fs from "node:fs";
import path from "node:path";
import { contentData } from "../src/data/content";

const dir = path.resolve(import.meta.dirname, "../dist/public");
const routes = ["/", "/category/workflows", "/category/attacks", "/category/algorithms", "/about", "/contact", "/privacy",
  ...contentData.map((item) => `/${item.category === "workflow" ? "workflows" : item.category === "attack" ? "attacks" : "algorithms"}/${item.slug}`)];
let count = 0;
for (const route of routes) {
  const pathname = route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
  const html = fs.readFileSync(path.join(dir, pathname), "utf8");
  if (!html.includes('lang="ko"') || !html.includes('data-ssg="true"') || !html.includes("<h1")) {
    throw new Error(`SSG markup missing: ${route}`);
  }
  if (!html.includes(`href="https://4d4cat.com${route}"`)) {
    throw new Error(`Canonical mismatch: ${route}`);
  }
  if (!html.includes('name="description"') || !html.includes('name="robots"')) {
    throw new Error(`Meta missing: ${route}`);
  }
  if (route.includes("/workflows/") || route.includes("/attacks/") || route.includes("/algorithms/")) {
    if (!html.includes('data-testid="description-section"') || !html.includes('data-testid="visualization-panel"') || !html.includes('data-testid="learning-check"')) {
      throw new Error(`Detail body missing: ${route}`);
    }
  }
  count++;
}
const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
for (const route of routes) if (!sitemap.includes(`<loc>https://4d4cat.com${route}</loc>`)) {
  throw new Error(`Missing sitemap route: ${route}`);
}
if (!fs.readFileSync(path.join(dir, "404.html"), "utf8").includes('content="noindex, follow"')) {
  throw new Error("404 must be noindex");
}
console.log(`[SSG validation] ${count} routes checked`);
