import fs from "node:fs";
import path from "node:path";
import { contentData } from "../src/data/content";

const expectedOrigin = "https://4d4cat.com";
const appUrl = process.env.APP_URL ?? (process.env.NODE_ENV === "production" ? undefined : expectedOrigin);
if (!appUrl || appUrl !== expectedOrigin) {
  throw new Error("APP_URL must be https://4d4cat.com. Refusing to publish alternate canonicals.");
}
const routes = ["/", "/category/workflows", "/category/algorithms", "/about", "/contact", "/privacy",
  ...contentData.map((item) => `/${item.category === "workflow" ? "workflows" : "algorithms"}/${item.slug}`)];
if (new Set(routes).size !== routes.length) throw new Error("Duplicate sitemap route");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${appUrl}${r}</loc></url>`).join("\n")}
</urlset>
`;
const publicPath = path.resolve(import.meta.dirname, "../public");
fs.mkdirSync(publicPath, { recursive: true });
fs.writeFileSync(path.join(publicPath, "sitemap.xml"), xml, "utf8");
console.log(`[Sitemap] ${routes.length} URLs for ${appUrl}`);
