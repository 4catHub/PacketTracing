---
name: architecture-visualizer
description: Design or implement interactive visual explanations for system architecture, networking, protocols, infrastructure, runtime workflows, and distributed-system behavior in the PacketTracing React site. Do not use for algorithm execution visualizations.
---

# Architecture Visualizer

Create a technically accurate learning experience in which movement, state, and topology explain why a system behaves as it does.

## Start with repository context

Read [`../../../AGENTS.md`](../../../AGENTS.md). Then inspect the target content file, visualization, and one or two nearby components with a similar interaction model. Treat current source files as truth; do not blindly copy an older component or the forward-looking scene-system proposal.

When the task adds a topic, include all registration points described in `AGENTS.md`. When it only revises prose or an existing visualization, keep the edit scoped to that request.

## Model the system before drawing it

Identify:

- actors and responsibility boundaries;
- requests, responses, events, and persistent data;
- ordering, branching, retries, concurrency, and failure paths;
- protocol or payload details that distinguish this topic;
- the misconception the visualization must correct.

Turn this into a small sequence of meaningful state snapshots. Each beat should answer “what changed, who caused it, and what becomes possible next?” Prefer a comparison or unified canvas when spatial continuity matters; split scenes when one canvas would overload attention.

## Choose rendering by responsibility

- Use SVG for topology, shared coordinates, edges, paths, packets, and zoomable diagrams.
- Use HTML for controls, code, tables, inspectors, and accessible explanatory UI.
- If HTML nodes overlay SVG edges, derive both from the same model and convert node positions to responsive percentages.
- Use Framer Motion for state-linked entrances, emphasis, and transitions. Use GSAP only when a coordinated timeline or path sequence is materially easier to express and maintain.

Do not impose a fixed top-to-bottom layout, autoplay, camera motion, or “100% SVG” rule on every topic. Select them from the causal structure and existing page conventions.

## Interaction and motion

- Keep one dominant focus per beat; retain enough prior state to explain causality.
- Make traffic direction, payload type, cache hit/miss, ownership, and error state explicit with more than color alone.
- Show concrete protocol artifacts when they are central: headers, frames, tokens, certificates, queue entries, or compact payload excerpts.
- Keep playback controls compact. If autoplay is useful, make pause/replay clear, loop without timer leaks, and provide a calm reduced-motion result.
- Never move the page viewport as playback advances.
- Clean up timeouts, intervals, and timelines on unmount, reset, pause, and mode change.
- Add an `activeStep`-derived React key only to motion elements whose animation must restart from a new origin.

## Visual and content quality

Follow the existing theme tokens and detail-page typography. Verify light and dark contrast for backgrounds, labels, edges, inactive states, and active states. Avoid tiny essential labels and decorative motion that competes with the system flow.

Keep the visualization's state labels aligned with the `ContentItem` explanation. Use the shared overview, steps, examples, and related-content UI rather than repeating paragraphs inside the canvas.

## Verify

Run the visualizer typecheck. For a substantial implementation, run its build with the required `PORT` and `BASE_PATH`, remembering that prebuild regenerates sitemap files. Inspect the affected route at wide and narrow widths and in both themes when browser tooling is available. Exercise play, pause, reset, completion/looping, mode changes, and route unmount.
