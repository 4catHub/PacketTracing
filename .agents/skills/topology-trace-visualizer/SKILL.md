---
name: topology-trace-visualizer
description: Design or implement PacketTracing workflow visualizations with a persistent system topology, focused active paths, and a synchronized execution trace. Use when the main learning question is how one request, event, or state change travels across stable actors. Do not use when data placement or side-by-side sequence comparison is the primary concept.
---

# Topology Trace Visualizer

Explain one causal execution flow through three synchronized views:

1. **Topology Overview** establishes every important actor and structural link.
2. **Focused Path** keeps the topology stable while highlighting the current multi-actor interaction and payload direction.
3. **Execution Trace** shows ownership, nesting, ordering, overlap, waiting, failure, and bottlenecks for the same active interaction.

This pattern fits DNS resolution, handshakes, gateways, queue delivery, cache invalidation, retries, and request fan-out. Route data distribution and ownership changes to `data-placement-visualizer`; route aligned comparisons such as 2PC versus Saga to `comparison-sequence-visualizer`; use `architecture-visualizer` for a free-form structure without one dominant execution path.

## Read repository context first

Read [`../../../AGENTS.md`](../../../AGENTS.md), the target content item, `src/pages/Detail.tsx`, the target visualization, and one nearby visualization with a similar interaction model. Treat current source as truth.

## Default composition

Use this vertical order:

1. compact playback bar;
2. full-width topology canvas with title and active-step caption;
3. full-width synchronized execution trace.

The opening frame shows the complete topology without selecting one actor or path. Count it as `전체`, not workflow step 1. The shared Detail page supplies long-form overview, steps, examples, and related content; do not duplicate those sections inside the visualization.

Keep the playback bar limited to reset, previous, play/pause, next, thin progress, and current step/total unless the topic requires another control.

## Topology and focused-path rules

- Establish every important actor and baseline link in the opening frame.
- Keep actor coordinates stable for the entire playback. Step changes alter emphasis and state, not layout or camera position.
- Keep inactive actors and links visible but subordinate so the active path remains grounded in the full system.
- Use `activeActorIds` because one beat commonly involves multiple participants.
- Render requests, responses, events, and state propagation as directed, labeled paths. Pair color with a glyph, shape, line style, or text.
- Animate a payload marker only when its motion explains direction or causality.
- Use SVG when actors, edges, and packets share a coordinate system. Use stable compact coordinates at narrow widths before hiding context.
- For alternating exchanges, keep both endpoints visible and animate the ordered messages on the same scene.
- For fan-out, retries, and failures, show every participant required to understand the current causal beat.

The main canvas must answer: **What interaction or state change is happening now, and where does it sit in the whole system?**

## Execution-trace rules

Each row identifies a meaningful operation and its owner. Relative horizontal position communicates order, overlap, waiting, and dominant cost.

Use trace semantics when the concept requires them:

- `actorId` for ownership;
- `id` and `parentId` for nesting;
- `kind` for work, network call, or waiting;
- `status` for success, warning, or error;
- `bottleneck` and a short detail for the critical path.

The topology path and trace ownership must describe the same operation. Label illustrative durations as relative; do not imply measured precision.

## Motion, theme, and accessibility

Choose `restrained` motion for incidents, data loss, failures, and production diagnosis; `friendly` for ordinary teaching; `playful` only when analogy materially improves understanding.

- Use theme tokens or paired light/dark styles and preserve semantic color meaning.
- Never encode meaning with color alone.
- Give icon-only controls accessible names.
- In reduced motion, active actors, direction, labels, and final state must remain complete without animation.
- Clean up timers on pause, reset, completion, unmount, and mode change.

## Reusable implementation

Prefer:

- `artifacts/visualizer/src/visualizations/workflow-visualization.ts`
- `artifacts/visualizer/src/visualizations/WorkflowFocusedViz.tsx`

A topic visualization should mostly define actors, stable coordinates, baseline links, steps, transitions, and trace spans. Validate duplicate actor IDs, unknown references, invalid spans, unknown owners, and missing parents visibly rather than silently dropping data.

Use a custom renderer only when the causal model cannot be expressed clearly with the shared primitives. Preserve overview, focused context, and synchronized execution meaning when doing so.

## Validation

Run the visualizer typecheck and build commands from `AGENTS.md`. For substantial UI changes, inspect wide and narrow layouts in light and dark themes and exercise reset, previous, play/pause, next, completion, reduced motion, and route unmount.
