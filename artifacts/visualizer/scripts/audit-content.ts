import { contentData } from "../src/data/content";
import { VISUALIZER_REGISTRY } from "../src/visualizations/registry";

const keys = new Set<string>();
const errors: string[] = [];
let relatedCount = 0;
for (const item of contentData) {
  const key = `${item.category}:${item.slug}`;
  if (keys.has(key)) errors.push(`Duplicate content: ${key}`);
  keys.add(key);
  if (!item.title.trim() || !item.description.trim() || !item.examples.length) {
    errors.push(`Missing required explanatory content: ${key}`);
  }
  const path = item.category === "workflow" ? "workflows" : "algorithms";
  if (!VISUALIZER_REGISTRY[path]?.[item.slug]) errors.push(`No visualization: ${key}`);
}
for (const item of contentData) {
  for (const rel of item.related ?? []) {
    relatedCount++;
    if (!keys.has(`${rel.category}:${rel.slug}`)) {
      errors.push(`Broken related link: ${item.slug} -> ${rel.category}:${rel.slug}`);
    }
  }
}
for (const [path, components] of Object.entries(VISUALIZER_REGISTRY)) {
  for (const slug of Object.keys(components)) {
    const category = path === "workflows" ? "workflow" : "algorithm";
    if (!keys.has(`${category}:${slug}`)) errors.push(`Unlinked visualization: ${path}/${slug}`);
  }
}
if (errors.length) throw new Error(errors.join("\\n"));
console.log(`[Content audit] ${contentData.length} content items, ${relatedCount} related links, all registered`);
