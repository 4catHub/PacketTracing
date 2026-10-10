import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";

const rootDir = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(rootDir, "dist/public");
const template = fs.readFileSync(path.join(outputDir, "index.html"), "utf8");
if (!template.includes("<!--ssg-outlet-->") || !template.includes("<!--seo-outlet-->")) {
  throw new Error("Expected Vite output to contain SSG and SEO placeholders.");
}
if (process.env.APP_URL !== "https://4d4cat.com") {
  throw new Error("APP_URL must be exactly https://4d4cat.com for production SSG.");
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const vite = await createServer({
  configFile: path.join(rootDir, "vite.config.ts"),
  root: rootDir,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});

try {
  const { renderPage } = await vite.ssrLoadModule("/src/entry-server.tsx") as {
    renderPage: (path: string) => string;
  };
  const { allPublicPaths, getSeo, getStructuredData } = await vite.ssrLoadModule("/src/lib/seo.ts") as {
    allPublicPaths: () => string[];
    getSeo: (path: string) => { title: string; description: string; robots: string; canonical?: string; ogType: string };
    getStructuredData: (path: string) => unknown[];
  };

  function makeHead(urlPath: string): string {
    const seo = getSeo(urlPath);
    const content = [
      `<title>${escapeHtml(seo.title)}</title>`,
      `<meta name="description" content="${escapeHtml(seo.description)}" />`,
      `<meta name="robots" content="${escapeHtml(seo.robots)}" />`,
      `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
      `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
      `<meta property="og:type" content="${escapeHtml(seo.ogType)}" />`,
      `<meta property="og:image" content="https://4d4cat.com/logo.png" />`,
      `<meta name="twitter:card" content="summary" />`,
      `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`,
    ];
    if (seo.canonical) {
      content.push(`<link rel="canonical" href="${escapeHtml(seo.canonical)}" />`);
      content.push(`<meta property="og:url" content="${escapeHtml(seo.canonical)}" />`);
    }
    const json = getStructuredData(urlPath);
    if (json.length) content.push(`<script type="application/ld+json" data-packetracing-jsonld="true">${JSON.stringify(json).replace(/</g, "\\u003c")}</script>`);
    return content.join("\n    ");
  }

  const pages = allPublicPaths();
  if (new Set(pages).size !== pages.length) throw new Error("Duplicate content routes");
  for (const route of pages) {
    const rendered = renderPage(route);
    if (!rendered.includes("<h1") || !rendered.includes("</h1>")) {
      throw new Error(`SSG rendered no page heading for ${route}`);
    }
    if (route.includes("/api-gateway") && !rendered.includes("Token Bucket")) {
      throw new Error("API Gateway explanatory content missing from initial HTML");
    }
    const html = template
      .replace("<!--seo-outlet-->", makeHead(route))
      .replace('<div id="root"><!--ssg-outlet--></div>', `<div id="root" data-ssg="true">${rendered}</div>`);
    if (html.includes("<!--ssg-outlet-->")) throw new Error(`Failed to inject SSR HTML for ${route}`);
    const destination = route === "/" ? path.join(outputDir, "index.html")
      : path.join(outputDir, route.slice(1), "index.html");
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, html, "utf8");
  }
  // A genuinely static 404 response: no AdSense or Analytics scripts on invalid pages.
  fs.writeFileSync(path.join(outputDir, "404.html"), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex, follow">
<title>페이지를 찾을 수 없습니다 | PackeTracing</title></head>
<body><main><h1>페이지를 찾을 수 없습니다</h1>
<p>요청하신 학습 페이지가 존재하지 않습니다.</p><a href="/">홈으로 이동</a></main></body></html>`, "utf8");
  console.log(`[SSG] Generated ${pages.length} pages plus 404.html`);
} finally {
  await vite.close();
}
