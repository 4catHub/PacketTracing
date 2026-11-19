import fs from "node:fs";
import path from "node:path";
import { allPublicPaths, getSeo } from "../src/lib/seo";
import { CONTENT_CATEGORIES } from "../src/data/content/categories";

const dir = path.resolve(import.meta.dirname, "../dist/public");
const routes = allPublicPaths();
let count = 0;
for (const route of routes) {
  const seo = getSeo(route);
  const pathname = route === "/" ? "index.html" : `${route.slice(1)}/index.html`;
  const html = fs.readFileSync(path.join(dir, pathname), "utf8");
  if (!html.includes('lang="ko"') || !html.includes('data-ssg="true"') || !html.includes("<h1")) {
    throw new Error(`SSG markup missing: ${route}`);
  }
  if (!html.includes(`<link rel="canonical" href="${seo.canonical}"`)) {
    throw new Error(`Canonical mismatch: ${route}`);
  }
  if (!html.includes('name="description"') || !html.includes('name="robots"')) {
    throw new Error(`Meta missing: ${route}`);
  }
  if (seo.ogType === "article") {
    if (!html.includes('data-testid="description-section"') || !html.includes('data-testid="visualization-panel"') || !html.includes('data-testid="reference-section"')) {
      throw new Error(`Detail body missing: ${route}`);
    }
    if (route.startsWith(`/${CONTENT_CATEGORIES.architecture.path}/`)) {
      if (!html.includes('data-testid="adoption-section"') || html.includes('data-testid="learning-check"')) {
        throw new Error(`Architecture must show adoption, not quiz: ${route}`);
      }
    } else if (!html.includes('data-testid="learning-check"')) {
      throw new Error(`Learning check missing: ${route}`);
    }
  }
  count++;
}
const ads = fs.readFileSync(path.join(dir, "ads.txt"), "utf8").trim();
if (ads !== "google.com, pub-7964524110042064, DIRECT, f08c47fec0942fa0") {
  throw new Error("ads.txt must match the AdSense publisher configured in index.html");
}
const sitemap = fs.readFileSync(path.join(dir, "sitemap.xml"), "utf8");
for (const route of routes) if (!sitemap.includes(`<loc>https://4d4cat.com${route}</loc>`)) {
  throw new Error(`Missing sitemap route: ${route}`);
}
if (!fs.readFileSync(path.join(dir, "404.html"), "utf8").includes('content="noindex, follow"')) {
  throw new Error("404 must be noindex");
}
console.log(`[SSG validation] ${count} routes checked`);
