---
name: product-architecture
description: Build PacketTracing Architecture-category articles that decompose existing SaaS products, frameworks, platforms, or infrastructure technologies into an always-visible, interactive component map. Use for category="architecture" only; unlike workflow visualizations, do not create a stepwise playback.
---

# Product Architecture category · reusable authoring contract

Read the repository root AGENTS.md and current content schema, registry, routing, and Detail page before editing.

## Purpose and distinction

- Architecture asks: "What capabilities and publicly documented components does this existing product provide, how do they relate, and how do developers use or extend them?"
- Workflow asks: "In what order does a request or state transition execute?" Keep that model in the workflow category.
- Do not invent private service topologies, deployment infrastructure, internal databases, source code, throughput, or undocumented implementation details from a product's publicly exposed APIs.
- No subcategory taxonomy unless the user explicitly requests it. Topic type (SaaS, Framework, etc.) may appear in tags or prose.

## Scene contract (not a step player)

1. Use **one stable, self-contained architectural scene**. All major subsystems stay visible throughout; no next/previous steps, chapter navigation, page scrolling, viewport movement, switching canvases, or timeline playback.
2. Separate clearly meaningful responsibility boundaries, e.g. customer-facing modules, operational domains, and extension surfaces. Use distinct domain icons, recognizable shapes and labels; not an undifferentiated node-and-edge graph.
3. Use an **Architecture Explorer** for selecting a module, a **Component Inspector** for its purpose/data models/APIs/limitations, and an optional **Scenario Sandbox** when manipulating a representative object demonstrates the model. Inspector and sandbox belong beneath the complete diagram; do not replace the diagram with another screen.
4. Treat motion like a restrained looping GIF: one consistent ambient signal or focused pulse to suggest relationships. No uncontrolled particle clouds, unrelated simultaneous animations, or artificial sequential story steps. Provide pause/resume if motion is nontrivial; respect prefers-reduced-motion.
5. All semantic information must remain visible/readable when animation is paused. Do not imply that a diagram animation simulates real Shopify (or another product) traffic.
6. Use theme-aware neutral solid panels, restrained semantic accents, readable small-screen card layout, keyboard-accessible module controls with aria-pressed/focus styles. Do not rely only on colors. No gradient canvas backgrounds.
7. Visual content and the detailed article must agree on data model names, distinctions, and limitations.

## Detail-page article contract

- Reuse the site's normal Detail page for breadcrumbs, title/tags, hero visualization, Markdown overview, learning objectives, misconceptions, takeaways, practical examples, references, and related links.
- Do **not** populate steps or exercises for Architecture content. Show no numbered "핵심 단계" section or LearningCheck question widget.
- Instead populate at least one sourced **adoptionCases** entry with: region, organization, useCase, sourceTitle, sourceUrl, verifiedAt (YYYY-MM-DD). Detail must render a clearly labeled "국내·해외 활용 사례" section in place of exercises.
- Prefer specific, verified adopters. Keep Korea-internal deployments separate from Korean brands operating overseas, and distinguish current confirmed usage from historical case studies. Never invent client brands.
- Source primary vendor documentation for capabilities and documented adopter case studies / trustworthy developer or agency reports for real-world use. Include working URLs in CONTENT_REFERENCES and case entries.
- Avoid exact limits, plan entitlement claims, or version-sensitive fields without a dated, explicit source. Explain that plan/version/region differences should be checked.
- Describe product function boundaries vs private internals. Keep a cited "as checked" date when factual current status needs it.
- Scope Article content to one product per page. The overview should cover purpose, functional decomposition, public objects/interfaces, practical patterns, limits and tradeoffs.

## Required integration and quality gates

1. Add a typed ContentItem with category "architecture" under data/content/architectures and register at the top-level catalog.
2. Bind lazy visualization in visualizations/registry.ts under architectures; add /architectures/:slug routing, navbar, Home filter, Category listing, SEO, sitemap and audit mapping; do not invent a subcategory route.
3. Use shared Detail. Render adoptionCases instead of LearningCheck for architecture. Preserve other category behavior.
4. Update content references for public API claims. Ensure sources use HTTPS and case records all have region, organization, useCase and an HTTPS source URL.
5. Audit all category and route fallbacks: no generic ternary should accidentally classify architecture as algorithm.
6. Validate typecheck, audit, build, sitemap, interactions (module select, inspector, optional sandbox, pause/reduced motion), themes and widths when the environment allows. If unavailable, report unverified tests explicitly.
7. Follow repository change delivery policy: single commit per user request, PR for review after verification, never merge without instruction.

## Shopify reference

The first application is /architectures/shopify. Its fixed explorer displays Storefront, Cart, Checkout, Catalog, Inventory, Orders plus an extension layer; inspector details show responsibilities/data/API constraints; a local-only Variant × Location sandbox demonstrates conceptual inventory. No checkout or inventory changes reach Shopify.
