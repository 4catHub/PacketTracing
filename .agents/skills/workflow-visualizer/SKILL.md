---
name: workflow-visualizer
description: Design and implement PacketTracing workflow visualizations with a persistent packet topology, focused per-step highlighting, and a synchronized trace waterfall. Use for workflow topics unless a free-form architecture topology is explicitly more appropriate.
---

# Workflow Visualizer

Build workflow explanations around three synchronized views:

1. **Topology Overview** for the opening frame: establish every important actor and structural link before step playback begins.
2. **Packet Topology + Focused State** for the main scene: preserve that whole topology while strongly emphasizing the current multi-actor interaction, state change, and payload path.
3. **Trace Waterfall** directly below the main scene: synchronize the active path with execution ownership, nesting, ordering, overlap, waiting, status, and bottlenecks.

These are not selectable visual styles. They form one coherent workflow visualization: overview first, then focused packet movement on the persistent topology, with the active step's trace underneath.

The shared Detail page already renders the visualization first and then the existing overview / detailed explanation sections. Do not duplicate those long-form sections inside the visualization.

## Read repository context first

Read [`../../../AGENTS.md`](../../../AGENTS.md), the target content item, `src/pages/Detail.tsx`, the target visualization, and one nearby visualization with a similar interaction model.

Use the current repository as truth. Existing visualizations may predate this skill.

## Default composition

Use this vertical order inside the visualization component:

1. compact playback bar;
2. full-width Packet Topology canvas with the visualization title and active-step caption;
3. full-width synchronized Trace Waterfall panel.

The initial playback frame must show the complete topology without selecting a single actor or path. It should explain that subsequent frames retain the same layout and highlight one interaction at a time. Count this as an overview frame in the playback UI, such as `전체`, rather than mislabeling it as workflow step 1.

After the visualization returns, the shared Detail page continues with the existing overview, steps, examples, and related content. Do not add a second overview inside the visualization.

### Minimal playback bar

Match the compact control density already used by the project:

- reset;
- previous;
- play / pause;
- next;
- thin progress bar;
- current step / total steps.

Do not add speed, mode, filters, legends, or extra counters unless the topic genuinely requires them.

## Packet Topology rules

The main canvas should look and behave like a system topology, not a collection of disconnected cards.

- Establish every important actor and baseline structural link in the opening frame.
- Keep topology positions stable for the full playback. Coordinates encode system relationships; they are not camera keyframes.
- Render the current request, response, event, or state propagation on top of the baseline topology as a clearly directed path.
- Animate a payload marker when motion communicates direction or causality. Distinguish request, response, event, and state payloads using shape or a short glyph as well as color.
- Label active paths with the protocol, message, event, or state being transferred. Do not animate an unexplained decorative dot.
- Keep inactive structural links visible but subordinate so the user can locate the active path within the whole system.
- Use SVG when actors, edges, packets, or paths need a shared coordinate system.
- On narrow screens, simplify labels or provide stable `compactX`/`compactY` coordinates before hiding actors or splitting the topology into unrelated panels. Compact coordinates are a second stable projection, not per-step camera movement.

## Focused State rules

The main canvas should answer: **“What interaction or state change is happening in the system right now?”**

Focused State means **persistent system context + focused interaction**, not “show one actor at a time.”

- Establish one stable system topology for the topic. All important actors remain visible in the same positions across steps.
- A step activates one or more participating actors with `activeActorIds`; do not model the beat around a single `focusActorId`.
- Keep non-participating actors visible but visually recessed. They provide orientation and make it obvious where the active interaction sits in the whole system.
- Emphasize the active relationship, not merely an active node: brighten participating actors, activate the relevant edges, label the request/response/event, and animate payload movement when it explains causality.
- Preserve topology coordinates across playback. Step changes may alter emphasis, state, labels, and active paths, but must not rearrange nodes, zoom, pan, crop away context, or move the camera.
- Multiple active actors are normal. DNS referral, handshakes, replication, queues, fan-out, retries, and request/response pairs should show all participants needed to understand the beat simultaneously.
- For alternating exchanges such as SYN → SYN-ACK → ACK, keep both endpoints visible and animate the ordered transitions on the same stable scene.
- Topic-specific topology coordinates are allowed and often desirable when they encode stable system relationships. They are not camera keyframes and must not change per step.
- Do not replace the system scene with actor cards, a grid/matrix of equal tiles, or a single enlarged node.
- Keep labels readable at narrow widths. Simplify labels before hiding system context.
- Respect reduced motion: active actors, active edges, direction, and labels must still communicate the complete current state without animation.

For comparisons, preserve both compared systems when simultaneous visibility is necessary to understand the causal difference. Otherwise use one stable topology whose active paths make the difference explicit.

## Trace Waterfall rules

The waterfall should read like a compact distributed trace, not a generic progress chart. It is not limited to literal measured latency; it may represent the active step's relative internal execution sequence.

Each row should identify one meaningful sub-operation and its owning actor or service, for example:

- parse request;
- verify signature;
- read cache;
- query database;
- publish event;
- serialize response.

Use relative horizontal positions to show:

- order;
- overlap/concurrency;
- waiting;
- dominant cost.

When the causal model needs them, encode trace semantics in the span data:

- `actorId` for execution ownership;
- `id` and `parentId` for parent/child nesting;
- `kind` to distinguish internal work, a network call, and waiting;
- `status` for success, warning, or error;
- `bottleneck` and a short `detail` when a span is the dominant or critical path.

Show the owner beside each operation, indent child spans, visually distinguish calls and waits, print a relative duration, and give bottlenecks a non-color-only cue such as a label and outline. Keep the time axis aligned across all rows in the active step. The main topology path and waterfall ownership should describe the same actors and operation.

If values are illustrative rather than measured, label the panel or data as relative/illustrative. Never imply benchmark precision that the source does not provide.

## Motion tone

Motion must explain the workflow first. Decorative personality is optional.

Use one of these tones:

- `restrained`: security incidents, outages, data loss, failures, production diagnostics, or expert performance analysis. No faces, bouncing mascots, celebratory effects, or comic reactions.
- `friendly`: ordinary educational workflow. Smooth packets, subtle acknowledgement, small state reactions, and restrained visual metaphor are allowed.
- `playful`: beginner-oriented or analogy-driven explanations where personification materially improves comprehension. Simple faces, stamps, doors, boxes, tickets, or small celebratory state reactions are allowed.
- `auto`: resolve to `restrained` for sensitive/critical subjects, `playful` for beginner + analogy topics, otherwise `friendly`.

### Educational-value test

Add a playful animation only when at least one condition is true:

1. it makes direction or ownership easier to follow;
2. it makes a state change memorable;
3. it converts an abstract artifact into a concrete mental model;
4. it distinguishes success, rejection, waiting, retry, or completion.

Do not add it when it is merely decorative, competes with the current focus, or makes a serious failure scenario feel trivial.

## Theme and accessibility

Light mode is the default product presentation. Dark mode must remain a first-class rendering, not an inversion afterthought.

- Use project theme classes/tokens or paired light/dark Tailwind classes.
- Preserve semantic colors between themes.
- Do not encode meaning with color alone; pair it with labels, position, line style, shape, or motion.
- Keep controls keyboard accessible and provide titles/labels where icons are ambiguous.
- Give icon-only controls explicit accessible names; a visual tooltip alone is insufficient.
- Respect `prefers-reduced-motion`: a reduced-motion user must still see the current state and transition meaning.
- Clean up timers on pause, reset, unmount, and step changes.

## Reusable implementation

Prefer the shared primitives in:

- `artifacts/visualizer/src/visualizations/workflow-visualization.ts`
- `artifacts/visualizer/src/visualizations/WorkflowFocusedViz.tsx`

A topic visualization should mainly define semantic actors, stable normalized topology coordinates, baseline topology links, and per-step interaction and trace data, then pass them to the shared renderer. Coordinates describe persistent system relationships only; never use them as per-step camera keyframes. Use the spec title in the rendered scene and provide an optional concise `overviewSummary` when the default overview caption is too generic.

Validate cross-references before rendering. Duplicate actor IDs, unknown topology/transition/active actor references, invalid span ranges, unknown span owners, and missing parent spans must produce a visible configuration error instead of silently dropping part of the workflow.

Break out into a custom visualization only when the topic's causal model cannot be represented clearly by this pattern. A custom implementation must preserve the same topology-overview, focused-context, and synchronized-trace outcomes unless the topic genuinely makes one of them irrelevant.

## Validation

Run:

```bash
pnpm --filter @workspace/visualizer typecheck
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/visualizer build
```

For substantial UI changes, also inspect the route at desktop and narrow widths in light and dark mode. Exercise reset, previous, play/pause, next, loop completion, and unmount behavior.
