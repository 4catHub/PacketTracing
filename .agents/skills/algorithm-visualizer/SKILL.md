---
name: algorithm-visualizer
description: Design or implement step-by-step algorithm and data-structure visualizations in the PacketTracing React site, including sorting, graph traversal, shortest paths, dynamic programming, trees, caches, and scheduling. Do not use for general system architecture or protocol flows.
---

# Algorithm Visualizer

Create an interactive explanation that keeps the algorithm, displayed state, code highlight, and prose mathematically consistent.

## Start with repository context

Read [`../../../AGENTS.md`](../../../AGENTS.md). Inspect the target algorithm content and visualization plus a nearby component with the same family of state: array, graph, tree, table, queue, or scheduler. Existing implementations vary in age, so reuse useful components and conventions without inheriting their bugs or hardcoded layouts.

For a new topic, update every registration point described in `AGENTS.md`. Use the specific algorithm name rather than only a broad technique such as “dynamic programming.”

## Establish the algorithm contract

Before designing motion, write down:

- representative input and expected output;
- the invariant after each step;
- variables and data structures learners need to track;
- tie-breaking, duplicate, disconnected, empty, or boundary behavior relevant to the example;
- termination condition and time/space complexity.

Generate deterministic snapshots from the algorithm when practical. If snapshots are authored manually, verify every transition against an independent execution or hand trace. The final snapshot must match the stated result and complexity metadata.

## Map state to visuals

- Arrays and sorting: distinguish compared, selected/pivot, moved, and finalized values; preserve identity while values move.
- Graphs and trees: keep nodes and edges in one responsive coordinate model; distinguish frontier, current, visited/finalized, candidate edges, and chosen structure.
- Dynamic programming: show the target cell, every dependency used by the recurrence, the comparison, and the selected value.
- Queues, stacks, heaps, caches, and schedulers: show ordering and the exact operation that mutates the structure.
- Code panels and variable HUDs are useful only when their highlight/value changes on the same snapshot as the canvas.

Use SVG for edges, paths, or tightly coupled graph geometry and HTML for controls, code, tables, and accessible state panels. Responsive HTML nodes over SVG must use percentage positions derived from the same viewBox coordinates.

## Playback correctness

Keep playback state small and explicit, usually current snapshot, play/pause, speed, and optional mode. Derive visual states from the snapshot instead of maintaining parallel booleans that can drift.

- Cancel timers on pause, reset, unmount, and mode/input changes.
- Define what previous/next means at the initial and final snapshots.
- If replay or looping is enabled, make the transition back to the initial state intentional.
- Use step-derived keys only where a motion element must restart.
- Do not scroll the page as the algorithm advances.
- Provide a readable reduced-motion state and accessible labels for icon-only controls.

## Integrate content

Populate `complexity` when the model applies, and set `stable` only for sorting algorithms where the claim is meaningful. Keep `description`, `steps`, examples, code, variable names, and visualization terminology consistent. Validate every `related` reference.

Do not force every algorithm into the same two-column layout. Choose space according to the dominant learning object, then follow the shared detail shell and existing theme tokens.

## Verify

Run the algorithm on the displayed input or otherwise validate the snapshot sequence, then run the visualizer typecheck. For substantial changes, run the build with `PORT` and `BASE_PATH`; note that prebuild regenerates sitemap files. Inspect initial, intermediate, and final states at wide and narrow widths in both themes. Exercise manual navigation, autoplay if present, speed changes, reset, completion, and mode/input switches.
