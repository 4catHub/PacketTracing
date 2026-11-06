import { contentData } from "../src/data/content";
import { VISUALIZER_REGISTRY } from "../src/visualizations/registry";
import { getContentReferences } from "../src/data/content/references";
import { presentLearningExercise } from "../src/lib/learning-exercises";

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
  if (!item.keyTakeaways?.length || (item.category !== "architecture" && (!item.learningObjectives?.length || !item.exercises?.length))) {
    errors.push(`Missing learning guidance or exercise: ${key}`);
  }
  const references = getContentReferences(item);
  if (item.category === "architecture") {
    if (item.steps?.length || item.exercises?.length || item.learningObjectives?.length || item.commonMistakes?.length) {
      errors.push("Architecture must not use steps, exercises, learning objectives or misconceptions: " + key);
    }
    if (!item.adoptionCases?.length) {
      errors.push("Architecture needs sourced adoption cases: " + key);
    }
    if (!references.length) {
      errors.push("Architecture needs public documentation references: " + key);
    }
    for (const [index, adoption] of (item.adoptionCases ?? []).entries()) {
      if (![adoption.region, adoption.organization, adoption.useCase, adoption.sourceTitle].every((field) => field.trim()) ||
          !/^https:\/\/[^\s]+$/.test(adoption.sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(adoption.verifiedAt)) {
        errors.push("Invalid architecture adoption case: " + key + " #" + (index + 1));
      }
    }
  }
  for (const reference of references) {
    if (!reference.title.trim() || !/^https:\/\/[^\s]+$/.test(reference.url)) {
      errors.push(`Invalid reference: ${key}`);
    }
  }
  for (const [index, exercise] of (item.exercises ?? []).entries()) {
    if (!exercise.question.trim() || exercise.options.length < 2 || exercise.options.some((option) => !option.trim()) ||
        !Number.isInteger(exercise.answerIndex) || exercise.answerIndex < 0 || exercise.answerIndex >= exercise.options.length || !exercise.explanation.trim()) {
      errors.push(`Invalid exercise: ${key} #${index + 1}`);
    }
  }
  for (const [index, exercise] of (item.exercises ?? []).entries()) {
    if (exercise.options.length < 2) continue;
    const displayed = presentLearningExercise(exercise, `${key}:${index}`);
    if (displayed.options.length !== exercise.options.length || displayed.options[displayed.answerIndex] !== exercise.options[exercise.answerIndex] ||
        displayed.options.some((option) => !exercise.options.includes(option))) {
      errors.push(`Question answer changed by presentation order: ${key} #${index + 1}`);
    }
  }
  const path = item.category === "workflow" ? "workflows" : item.category === "attack" ? "attacks" : item.category === "architecture" ? "architectures" : "algorithms";
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
    const category = path === "workflows" ? "workflow" : path === "attacks" ? "attack" : path === "architectures" ? "architecture" : "algorithm";
    if (!keys.has(`${category}:${slug}`)) errors.push(`Unlinked visualization: ${path}/${slug}`);
  }
}
if (errors.length) throw new Error(errors.join("\\n"));
console.log(`[Content audit] ${contentData.length} content items, ${relatedCount} related links, all registered`);
