---
name: workflow-visualizer
description: Design and implement PacketTracing workflow visualizations using a focused-state main scene plus a per-step waterfall trace. Use for workflow topics unless a free-form architecture topology is explicitly more appropriate.
---

# Workflow Visualizer

Build workflow explanations around two layers:

1. **Focused State** for the main scene: keep the whole system topology stable and focus the current multi-actor interaction, state change, and payload path within that persistent context.
2. **Step Waterfall** directly below the main scene: show the internal execution slices, ordering, overlap, and relative cost for the active beat.

The shared Detail page already renders the visualization first and then the existing overview / detailed explanation sections. Do not duplicate those long-form sections inside the visualization.

## Read repository context first

Read [`../../../AGENTS.md`](../../../AGENTS.md), the target content item, `src/pages/Detail.tsx`, the target visualization, and one nearby visualization with a similar interaction model.

Use the current repository as truth. Existing visualizations may predate this skill.

## Default composition

Use this vertical order inside the visualization component:

1. compact playback bar;
2. one-line active-step caption when it helps;
3. full-width Focused State canvas;
4. full-width active-step Waterfall panel.

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

## Focused State rules

The main canvas should answer: **“What interaction or state change is happening in the system right now?”**

Focused State means **persistent system context + focused interaction**, not “show one actor at a time.”

- Establish one stable system topology for the topic. All important actors remain visible in the same positions across steps.
- A step activates one or more participating actors with `activeActorIds`; do not model the beat around a single `focusActorId`.
- Keep non-participating actors visible but visually recessed. They provide orientation and make it obvious where the active interaction sits in the whole system.
- Emphasize the active relationship, not merely an active node: brighten participating actors, activate the relevant edges, label the request/response/event, and animate payload movement when it explains causality.
- Preserve topology coordinates across playback. Step changes may alter emphasis, state, labels, and active paths, but must not rearrange nodes, zoom, pan, or move the camera.
- Multiple active actors are normal. DNS referral, handshakes, replication, queues, fan-out, retries, and request/response pairs should show all participants needed to understand the beat simultaneously.
- For alternating exchanges such as SYN → SYN-ACK → ACK, keep both endpoints visible and animate the ordered transitions on the same stable scene.
- Topic-specific topology coordinates are allowed and often desirable when they encode stable system relationships. They are not camera keyframes and must not change per step.
- Do not replace the system scene with actor cards, a grid/matrix of equal tiles, or a single enlarged node.
- Use SVG when stable nodes, edges, packets, or paths need a shared coordinate system. HTML remains appropriate for controls and the Waterfall.
- Keep labels readable at narrow widths. Simplify labels before hiding system context.
- Respect reduced motion: active actors, active edges, direction, and labels must still communicate the complete current state without animation.

For comparisons, preserve both compared systems when simultaneous visibility is necessary to understand the causal difference. Otherwise use one stable topology whose active paths make the difference explicit.

## Step Waterfall rules

The waterfall is not limited to literal measured latency. It represents the active step's internal execution sequence.

Each row should identify one meaningful sub-operation, for example:

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
- Respect `prefers-reduced-motion`: a reduced-motion user must still see the current state and transition meaning.
- Clean up timers on pause, reset, unmount, and step changes.

## Reusable implementation

Prefer the shared primitives in:

- `artifacts/visualizer/src/visualizations/workflow-visualization.ts`
- `artifacts/visualizer/src/visualizations/WorkflowFocusedViz.tsx`

A topic visualization should mainly define semantic actors, stable normalized topology coordinates, baseline topology links, and per-step interaction data, then pass them to the shared renderer. Coordinates describe persistent system relationships only; never use them as per-step camera keyframes. Break out into a custom visualization only when the topic's causal model cannot be represented clearly by this pattern.

## Validation

Run:

```bash
pnpm --filter @workspace/visualizer typecheck
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/visualizer build
```

For substantial UI changes, also inspect the route at desktop and narrow widths in light and dark mode. Exercise reset, previous, play/pause, next, loop completion, and unmount behavior.
