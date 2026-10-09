---
name: comparison-sequence-visualizer
description: Design or implement PacketTracing side-by-side sequence visualizations that compare two protocols, strategies, or failure-recovery models on an aligned timeline. Use when message order, participant state, waiting, locks, compensation, or outcome differences are the main lesson. Do not use for data placement maps or algorithm execution.
---

# Comparison Sequence Visualizer

Compare two approaches through aligned lifelines, messages, state intervals, and outcomes. The learner should see not only that the approaches differ, but exactly **when** and **why** their behavior diverges.

This pattern fits 2PC versus Saga, orchestration versus choreography, optimistic versus pessimistic coordination, and protocol variants whose message order and failure recovery must be compared. Use `topology-trace-visualizer` when one execution path is the lesson and simultaneous comparison is unnecessary.

## Read repository context first

Read [`../../../AGENTS.md`](../../../AGENTS.md), the target content item, `src/pages/Detail.tsx`, the target visualization, and a nearby comparison or protocol visualization. Treat current source and content terminology as authoritative.

## Define the comparison contract

Before drawing, identify:

- the shared business intent or input;
- participants and responsibility boundaries on each side;
- comparable decision points rather than merely equal step counts;
- messages, local work, waits, locks, and externally visible state;
- failure injection point and recovery behavior;
- final guarantees and unresolved states.

Use one shared scenario whenever possible. If the failure mechanisms cannot be aligned honestly, label the scenarios independently instead of implying a false one-to-one comparison.

## Default composition

1. minimal autoplay status with one pause/resume control and optional scenario control;
2. full-width sequence panels stacked as separate rows on a shared top-to-bottom time axis;
3. a concise comparison outcome row for the active beat.

Each side contains participant headers, vertical lifelines, directed message arrows, activation/work segments, and persistent state intervals. Preserve the same horizontal lane order and vertical time scale throughout playback.

For 2PC versus Saga, make these distinctions concrete:

- 2PC shows `PREPARE`, votes, durable decision, `COMMIT`/`ABORT`, and lock duration.
- Saga shows committed local transactions, intermediate visible states, failure, and reverse-order compensations.
- Compensation is a new semantic transaction, not a database rollback.
- Coordinator uncertainty/blocking and compensation retry/manual intervention remain visible until resolved.

Do not add a generic trace waterfall below a sequence diagram when it repeats the same timing information. Use a small state or outcome panel instead.

## Sequence and state encoding

- Time moves consistently from top to bottom.
- Every message has a source, destination, label, order, and kind such as command, response, event, or compensation.
- Use activation bars for owned execution, outlined or hatched intervals for waiting/locks, and explicit markers for failure and timeout.
- Show participant state next to its lifeline: for example `ACTIVE`, `PREPARED`, `LOCKED`, `COMMITTED`, `COMPENSATING`, or `CANCELLED`.
- Render state chips, message labels, lock intervals, and failure markers at a deliberately enlarged sequence scale (three visual steps above surrounding chrome by default) so the sequence is readable at a glance. Keep lifelines, arrow shafts and heads, and interval outlines two visual scales lighter than those nodes and data labels, so connectors explain relationships without competing with their endpoints. When changing size, keep the same coordinate system and anchors; enlarge nodes around their center rather than moving a source, destination, or time position.
- Preserve completed work in later frames so compensation and recovery have visible causes.
- Pair semantic color with arrow style, glyph, label, or shape.
- Animate message travel only when it clarifies order. Reduced-motion mode must show the same ordered state statically.

The active beat should answer: **Which messages have completed, what state is each participant in, and what can happen next?**

## Playback and theme

- Start the aligned comparison automatically and loop the active scenario indefinitely.
- Keep the upper playback UI to one compact pause/resume control by default. Do not expose reset, previous, or next unless precise manual stepping is essential to the comparison.
- Scenario changes restart that scenario at its first frame and continue autoplay. The loop boundary must preserve the shared time-anchor model.
- Reduced-motion mode still advances frames automatically, but replaces message travel and entrance animation with instant deterministic snapshots.
- Keep the shared canvas, both sequence panels, outcome cards, and controls solid and achromatic in both themes. Do not use gradient backgrounds.
- Lifelines, message arrows, state chips, locks, failures, and compensations may use restrained semantic colors when they improve comparison. Use the same mapping on both sides and pair color with solid/dashed lines, arrowheads, glyphs, labels, opacity, or fill pattern.

## Responsive comparison

Use one full-width sequence panel per row at every viewport width. Keep the same active beat, shared time marker, and explicit row order so learners can compare the panels vertically without reducing lifeline label size. At narrow widths, preserve a readable minimum lane width and allow horizontal scrolling inside each sequence panel rather than squeezing lifelines; do not change the scenario or active beat between rows. A repeated time marker may be used when it keeps the stacked panels comparable.

Keep participant labels concise. Put detailed payloads in an inspector or the shared prose rather than crowding arrows.

## Deterministic model and validation

Represent the visualization as deterministic scenarios and frames rather than independent booleans. Validate:

- unique participant and message IDs;
- valid source/destination references;
- monotonic message times within each scenario;
- legal participant state transitions;
- responses occurring after their requests;
- locks ending only after commit, abort, or explicit recovery;
- compensations targeting previously completed forward transactions and running in the declared order;
- final outcomes matching the content explanation.

Configuration errors must be visible during development. Clean up timers on pause, reset, scenario change, completion, and unmount.

## Validation

Run the visualizer checks from `AGENTS.md`. Inspect happy path and failure path at wide and narrow widths in both themes. Exercise autoplay, the loop boundary, pause/resume, scenario switching, reduced motion, and route unmount. Verify the two panels remain semantically aligned rather than merely visually symmetric.
