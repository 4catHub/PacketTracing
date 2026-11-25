import fs from "node:fs";
import path from "node:path";
import { allPublicPaths, SITE_ORIGIN } from "../src/lib/seo";

const routes = allPublicPaths();
if (new Set(routes).size !== routes.length) throw new Error("Duplicate sitemap route");
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_ORIGIN}${r}</loc></url>`).join("\n")}
</urlset>
`;
const publicPath = path.resolve(import.meta.dirname, "../public");
fs.mkdirSync(publicPath, { recursive: true });
fs.writeFileSync(path.join(publicPath, "sitemap.xml"), xml, "utf8");
console.log(`[Sitemap] ${routes.length} URLs for ${SITE_ORIGIN}`);
