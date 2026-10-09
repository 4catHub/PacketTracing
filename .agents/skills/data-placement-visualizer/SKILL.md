---
name: data-placement-visualizer
description: Design or implement PacketTracing visualizations centered on where data lives and how ownership changes across partitions, shards, replicas, caches, or storage nodes. Use for replication, sharding, partition maps, placement, rebalancing, and failover. Do not use when message order or algorithm execution is the primary learning object.
---

# Data Placement Visualizer

Make logical data identity, ownership, copies, and movement the dominant visual objects. The learner should be able to answer:

- Which partition owns this key?
- Where is the authoritative copy?
- Which replicas contain the same version?
- What moves when capacity or membership changes?
- What becomes unavailable, stale, or promoted during failure?

Do not force this material into a packet topology plus generic trace waterfall. Messages may support the explanation, but placement and ownership state must remain visually primary.

## Read repository context first

Read [`../../../AGENTS.md`](../../../AGENTS.md), the target content item, `src/pages/Detail.tsx`, the target visualization, and a nearby data-oriented visualization. Inspect current content and theme conventions before choosing a rendering model.

## Establish the placement model

Define the levels that exist in the topic:

```text
logical item or key
  -> partition / range / token
  -> primary owner
  -> replica set
  -> physical node or region
```

Not every topic needs every level. Keep only the levels required to explain the target misconception.

Record the invariants before drawing:

- whether each key has exactly one primary owner;
- replication factor and eligible replica locations;
- partition/range boundaries and routing epoch;
- version, LSN, term, or freshness semantics when relevant;
- legal transitional states such as `JOINING`, `COPYING`, `CATCHING_UP`, `ACTIVE`, and `DRAINING`;
- failover and fencing rules.

## Recommended composition

Use the smallest combination that explains the topic:

1. **Placement overview:** complete keyspace, partition map, owner nodes, and replica relationships.
2. **Focused data state:** selected key/range and every authoritative or replicated copy, including version/freshness.
3. **Transition view:** before → moving/catching up → after for rebalancing or failover.
4. **Compact status strip:** only metrics required to interpret the state, such as routing epoch, replication factor, lag, or owner status.

For Replication versus Sharding, show the distinction directly:

- Replication maps one logical item to multiple copies.
- Sharding maps disjoint subsets of the keyspace to different owners.
- A realistic combined view groups a Primary and its Replicas inside each Shard.

Use modes or synchronized panels only when simultaneous comparison adds value. Do not duplicate the Detail page's long-form explanation.

## Visual encoding

- Preserve item identity while it moves; a key or range must not appear to become unrelated data.
- Distinguish logical partitions from physical nodes through containment, bands, or separate aligned rows.
- Mark `PRIMARY`, `REPLICA`, `STALE`, `PROMOTED`, and migration states with text or shape as well as color.
- Show replication as copies of the same record/version, not merely arrows between database icons.
- Show sharding as mutually exclusive keyspace ownership. Make gaps and overlaps visible errors.
- During rebalancing, retain old and new owners until copy, catch-up, verification, and cutover are complete. Do not teleport data.
- During failover, show term/epoch change and fencing when they are essential to preventing split brain.
- Use SVG for rings, ranges, shared geometry, and movement paths; use HTML for controls, tables, inspectors, and status summaries.

Motion should explain copy progress, ownership transfer, lag, or promotion. Every beat must produce an immediately visible placement-state change; do not rely on changing only explanatory prose or a small status label. Keep the resulting snapshot readable between transitions.

## Playback and theme

- Start playback automatically on mount and loop the deterministic placement snapshots indefinitely.
- Keep the upper playback UI to one compact pause/resume control by default. Add reset, previous, or next only when manual stepping is essential to the learning task.
- Reduced-motion mode still advances through the same snapshots, but uses instant state changes instead of travel or entrance animation.
- Keep the canvas, panels, cards, inspectors, and control surfaces solid and achromatic in both themes. Do not use gradient backgrounds.
- Partitions, owner nodes, replica roles, records, and movement paths may use restrained semantic colors to preserve identity or clarify state. Keep their mapping stable across frames and pair color with text, shape, border style, icon, or motion.
- Make the loop boundary intentional: the final state may reset to the initial placement, but the reset must be legible and must not imply an illegal ownership transition.

## Interaction

Useful interactions include selecting a key, switching hash/range placement, and injecting a node join or failure. Add only controls that alter the learning model; automatic playback remains active unless the learner explicitly pauses it.

Keep deterministic snapshots for every step. A selected key must map to the same partition under the same placement version. If a membership change remaps it, show exactly why and when the routing version changes.

On narrow screens, stack aligned keyspace and node rows or use a stable compact projection. Preserve ownership relationships and concise labels rather than shrinking essential text.

## Validation

Validate placement data before rendering:

- unique node and partition IDs;
- valid owner and replica references;
- no unintended keyspace gaps or overlaps;
- exactly one primary per partition unless the topic explicitly demonstrates an invalid state;
- replicas distinct from their primary;
- monotonic epoch/term transitions;
- legal migration and failover state changes.

Invalid configuration must be visible in development instead of silently producing an incomplete map. Run the visualizer checks from `AGENTS.md`, inspect initial/intermediate/final states in both themes and widths, and exercise autoplay, the loop boundary, pause/resume, and every placement or failure control. Confirm that consecutive beats differ in the placement map itself, not only in supporting text.
