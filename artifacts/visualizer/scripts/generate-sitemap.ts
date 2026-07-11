import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { contentData } from "../src/data/content";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get correct deployment domain
const getDomain = (): string => {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  // Fallback for Replit environment
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app`;
  }
  return "https://packet-tracing.replit.app";
};

const domain = getDomain();
const today = new Date().toISOString().split("T")[0];

// Static pages
const paths = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/category/workflows", changefreq: "weekly", priority: "0.8" },
  { loc: "/category/algorithms", changefreq: "weekly", priority: "0.8" },
];

// Add dynamic visualization pages from contentData
contentData.forEach((item) => {
  const categoryPath = item.category === "workflow" ? "workflows" : "algorithms";
  paths.push({
    loc: `/${categoryPath}/${item.slug}`,
    changefreq: "weekly",
    priority: "0.7",
  });
});

// Generate Sitemap XML structure
const xmlUrls = paths
  .map((p) => {
    return `  <url>
    <loc>${domain}${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  })
  .join("\n");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${xmlUrls}
</urlset>
`;

// Save to public/sitemap.xml and update robots.txt
const publicDir = path.resolve(__dirname, "../public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const sitemapPath = path.join(publicDir, "sitemap.xml");
const robotsPath = path.join(publicDir, "robots.txt");

const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;

try {
  // Write sitemap.xml
  fs.writeFileSync(sitemapPath, sitemapXml, "utf8");
  console.log(`[Sitemap Generator] Sitemap successfully generated at: ${sitemapPath}`);
  
  // Write/Overwrite robots.txt to point to the dynamic sitemap URL
  fs.writeFileSync(robotsPath, robotsTxt, "utf8");
  console.log(`[Sitemap Generator] robots.txt successfully updated at: ${robotsPath}`);
  
  console.log(`[Sitemap Generator] Base URL: ${domain}`);
  console.log(`[Sitemap Generator] Total URLs: ${paths.length}`);
} catch (error) {
  console.error("[Sitemap Generator] Failed to write sitemap.xml or robots.txt", error);
  process.exit(1);
}
