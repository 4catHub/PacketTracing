# PacketTracing agent context

## Product

PacketTracing is a Korean interactive learning site for two kinds of topics:

- `workflow`: system design, networking, protocols, infrastructure, and runtime flows
- `algorithm`: sorting, graph traversal, dynamic programming, data structures, and scheduling

Each detail page combines an animated React visualization with structured explanatory content. The visualization should make state changes and causality visible; the prose supplies terminology, steps, examples, complexity, and related topics.

For a fuller architectural explanation, read [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md).

## Primary application

Most product work belongs in `artifacts/visualizer`, a React 19 + TypeScript + Vite 7 application using Tailwind CSS 4, wouter, Framer Motion, and occasional GSAP.

The visible content pipeline is:

```text
src/data/content/{workflows,algorithms}/*.ts
  -> src/data/content.ts (contentData catalog)
  -> Home / Category / Detail routing
  -> src/visualizations/registry.ts (slug -> lazy component)
  -> src/visualizations/*Viz.tsx
```

The Express API, database, generated API clients, and mockup sandbox are workspace scaffolding. The visualizer currently reads its catalog locally and does not call the API. Do not involve those packages unless the requested feature needs them.

## Sources of truth

- Content schema: `artifacts/visualizer/src/data/content/content-types.ts`
- Catalog and display order: `artifacts/visualizer/src/data/content.ts`
- Lazy visualization bindings: `artifacts/visualizer/src/visualizations/registry.ts`
- Routes and theme shell: `artifacts/visualizer/src/App.tsx`
- Shared detail composition: `artifacts/visualizer/src/pages/Detail.tsx`
- Markdown overview rendering: `artifacts/visualizer/src/components/overviews/UniversalOverview.tsx`
- Theme tokens and global CSS: `artifacts/visualizer/src/index.css`
- Sitemap generation: `artifacts/visualizer/scripts/generate-sitemap.ts`

Inspect these files instead of relying on an older visualization's conventions. Existing visualizations were built at different times and do not all represent the desired current pattern.

## Adding or changing a topic

Treat a topic as one integrated change:

1. Add or update its typed `ContentItem` in the correct content directory. `examples` is required; `steps`, `complexity`, and `related` are conditional.
2. Export and register it in `src/data/content.ts`. Array order controls catalog order.
3. Add or update the default-exported visualization component.
4. Bind its plural category path and slug in `VISUALIZER_REGISTRY` with `lazy(() => import(...))`.
5. Check that every `related` target exists and that routes use `/workflows/:slug` or `/algorithms/:slug`.

Do not duplicate long explanatory callouts inside a visualization when the shared overview and steps sections already communicate them. Keep labels that are necessary to interpret the active state.

## Visualization conventions

- Start from the concept's causal model: actors or values, transitions, branching, concurrency, invariants, and completion state.
- Use motion to explain a transition, not as decoration. Keep one dominant focus per beat.
- Use SVG when paths, edges, packets, or nodes must share one coordinate system. Use normal HTML for controls, code, tables, and HUDs. If HTML overlays SVG, derive positions responsively from the same coordinate model.
- Prefer deterministic step snapshots over scattered visual-state booleans. Clean up timers on pause, reset, unmount, and mode changes.
- Remount a Framer Motion element with an `activeStep`-derived key only when its entrance/path animation must restart; it is not a blanket requirement.
- Use theme tokens, `currentColor`, CSS variables, or paired light/dark styles. Preserve semantic color meaning and add shape, text, or motion cues when color alone is insufficient.
- Avoid viewport movement during playback. Route changes already scroll to the top in `App.tsx`.
- Keep controls compact and accessible. Autoplay and looping are design choices, not universal requirements; if enabled, pause/replay and reduced-motion behavior must remain understandable.
- Reuse the existing typography and `max-w-5xl` detail-page shell unless the task explicitly changes the design system.

Use `.agents/skills/architecture-visualizer` for workflow/system topics and `.agents/skills/algorithm-visualizer` for algorithm topics.

## Validation

Use pnpm; the root preinstall rejects npm and Yarn.

```bash
pnpm --filter @workspace/visualizer typecheck
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/visualizer build
pnpm run typecheck
```

The visualizer build runs the sitemap generator first and rewrites `public/sitemap.xml` and `public/robots.txt`. Review those generated changes rather than overwriting unrelated user edits. For UI work, also inspect the affected route at desktop and narrow widths in both themes when browser tooling is available.

## Repository hygiene

- Preserve unrelated changes in this frequently dirty worktree.
- Do not edit generated `dist/`, `tsconfig.tsbuildinfo`, or dependencies under `node_modules/`.
- `attached_assets/Visualization-Workflow-Architecture.md` is a forward-looking scene-system proposal, not a description of the current implementation. Adopt it only when the user asks for that refactor.
