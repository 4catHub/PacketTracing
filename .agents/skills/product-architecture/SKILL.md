---
name: product-architecture
description: Build PacketTracing Architecture articles for existing SaaS products, frameworks, platforms, and infrastructure with a complete relationship diagram, a curated component explorer, and an inspector. Use for category="architecture".
---

# PacketTracing · Architecture Explorer

Read the repository root AGENTS.md and the current content schema, registry, routing, and Detail page before editing.

## Scope

- Explain what the product provides, how its capabilities and public objects relate, and how developers use or extend them.
- Model publicly documented responsibilities, boundaries, and interfaces. Leave private deployment topology, databases, and implementation details outside the diagram unless a primary source documents them.
- Use the architecture category route. Keep chronological request traces in workflow articles and avoid creating subcategories without a request.

## Visualization layout

Place the complete diagram first, followed by two exploration areas. The shared Detail article starts immediately after the inspector.

### Architecture Map

- Show the complete in-scope structure in one stable diagram. Keep all major responsibilities and their links visible while the reader explores.
- Group modules by meaningful boundaries such as buyer surfaces, operational domains, and app integrations. Use distinct pictograms and suitable shapes for channels, applications, business capabilities, data objects, and interfaces. Give each node a readable name and short responsibility label.
- Draw explicit, labeled relationships such as query, object reference, extension, event delivery, or shared responsibility. Use arrowheads only where direction carries meaning. Provide a legend when line styles differ. A collection of disconnected cards or generic nodes alone is insufficient.
- Keep labels off unrelated edges and components. At narrow widths, reflow the same map or use compact edge labels with full accessible names while preserving endpoints and direction. Avoid horizontal clipping and keep the map readable in both themes.
- Selection may outline the matching module and its direct relationships. Keep the diagram and its positions stable across selections. Skip step numbers, playback sequences, previous/next controls, timelines, automatic scrolling, and alternative canvases.

### Architecture Explorer

- Below the map, collect the subset of components most useful to understand or apply the product. Use compact, keyboard-accessible component buttons with the same names and icons as the map.
- Give each button a short role label, visible focus, and a persistent selected state. Expose that state to assistive technology and associate the controls with the inspector.
- Keep all options visible and show a meaningful default selection.

### Component Inspector

- Below the explorer, update the inspector in place on selection. Briefly describe the selected component's role, its links or data objects, the relevant APIs or extension points, and implementation constraints where applicable.
- Keep focus on the component control, announce the updated content accessibly, and avoid automatic scrolling or transitioning through blank content.
- Put extended discussion, trade-offs, and worked examples in the shared article. Add a local scenario only if the request calls for it or the core model requires interaction. Keep such a scenario within the relevant inspector content.

## Motion and styling

- Use the site's existing typography, theme tokens, and solid neutral panels. Pair restrained semantic color with icons, shapes, text, or line weight.
- If motion helps, use a single subtle, repeating emphasis on a selected module or documented relationship. Motion must never imply a live system, actual traffic, or a step sequence.
- Provide pause and resume for looping motion and honor prefers-reduced-motion, including for inspector transitions. Keep all content and relationships readable when motion is paused or disabled.
- Use CSS or the existing Framer Motion setup. Avoid timers for decorative motion and clean up any necessary resources on unmount.

## Detail-page article contract

- Reuse the site's normal Detail page for breadcrumbs, title and tags, visualization, Markdown overview, key takeaways, practical applications, adoption cases, references, and related links.
- Do **not** populate `steps`, `exercises`, `learningObjectives`, or `commonMistakes` on Architecture items. Architecture pages omit 핵심 단계, 학습 목표, 자주 하는 오해, and LearningCheck.
- Populate at least one sourced `adoptionCases` entry with `region`, `organization`, `useCase`, `sourceTitle`, `sourceUrl`, and `verifiedAt` in YYYY-MM-DD form. The shared Detail page renders these in 국내·해외 활용 사례. Distinguish Korean brands operating overseas from in-country usage, and historical case studies from confirmed current usage.
- Source technical claims from primary product documentation. Use documented case studies for adopters and working HTTPS URLs in CONTENT_REFERENCES and case records. Verify plan, region, and version-dependent claims before adding them.
- Keep the article, diagram, and inspector consistent in terminology. Use the overview to explain the product, public objects and interfaces, practical patterns, and trade-offs.

## Implementation and verification

1. Register typed content under `data/content/architectures` and the top-level catalog. Bind the React and TypeScript visualization lazily under `architectures`. Use the existing route, Detail, SEO, sitemap, and content audit.
2. Check that other categories retain their existing behavior. The audit must continue to reject populated Architecture fields reserved for steps, exercises, learning objectives, and misconceptions.
3. Verify the map and all relationship labels at desktop and narrow widths in light and dark mode. Test selection by mouse and keyboard, in-place inspector updates, stable map and scroll position, and pause and reduced motion when applicable.
4. Run TypeScript checks, the production build, and the sitemap and content checks. Identify any unverified state explicitly.
5. Follow the repository delivery policy for a single commit and PR review.

## Shopify reference

`/architectures/shopify` maps the buyer surfaces Storefront, Cart, and Checkout to the Catalog, Inventory, and Orders domains, and shows where GraphQL Admin API, Checkout extensions, and Webhooks connect. The six core features form the explorer. The inspector shows the selected feature's responsibilities, relationships, API, and constraints. The shared article explains location-specific inventory and order fulfillment with examples.
