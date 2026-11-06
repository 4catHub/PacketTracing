import { useState } from "react";
import {
  AppWindow, Boxes, Check, ClipboardList, CodeXml, CreditCard,
  Link2, Pause, Play, Puzzle, ShoppingBag, ShoppingCart, Warehouse, Webhook,
} from "lucide-react";
import "./shopify-architecture.css";

const components = {
  storefront: {
    label: "Storefront", caption: "상품 탐색", icon: AppWindow, tone: "blue", group: "구매자 접점",
    detail: "상품과 컬렉션을 구매자에게 보여주는 판매 채널입니다. Shopify 테마를 쓰거나 Hydrogen 등으로 자체 스토어를 구성할 수 있습니다.",
    relation: "Catalog의 공개 상품을 표시하고, 선택한 상품 옵션을 Cart에 담습니다.",
    api: "Storefront GraphQL API · products, collections",
    caution: "Headless 채널에서는 채널에 게시된 상품과 판매 시장의 가격 맥락을 확인합니다.",
  },
  cart: {
    label: "Cart", caption: "구매 품목", icon: ShoppingCart, tone: "green", group: "구매자 접점",
    detail: "구매 예정인 상품 옵션과 수량을 CartLine에 보관합니다. Cart에는 구매자 정보와 할인 코드도 연결할 수 있습니다.",
    relation: "CartLine은 Catalog의 ProductVariant를 참조합니다. Cart.checkoutUrl은 Shopify Checkout에 연결됩니다.",
    api: "Storefront GraphQL API · cartCreate, cartLinesAdd",
    caution: "카트의 예상 비용은 배송비, 세금, 할인에 따라 체크아웃에서 달라질 수 있습니다.",
  },
  checkout: {
    label: "Checkout", caption: "배송 · 결제", icon: CreditCard, tone: "rose", group: "구매자 접점",
    detail: "배송 정보와 결제 수단을 입력하고 구매를 확정하는 Shopify 화면입니다.",
    relation: "Cart의 checkoutUrl을 통해 진입할 수 있습니다. 구매가 완료되면 운영 영역의 Order로 연결됩니다.",
    api: "Cart.checkoutUrl · Checkout UI Extensions · Shopify Functions",
    caution: "확장 가능한 화면 위치와 규칙은 대상 API와 스토어 플랜에 따라 다릅니다.",
  },
  catalog: {
    label: "Catalog", caption: "상품 · 옵션", icon: Boxes, tone: "violet", group: "스토어 운영",
    detail: "Product는 상품의 공통 정보를, ProductVariant는 색상과 사이즈처럼 구매 가능한 옵션 조합을 담습니다.",
    relation: "Storefront는 공개 상품을 조회하고, ProductVariant는 Inventory의 InventoryItem과 연결됩니다.",
    api: "GraphQL Admin API · productCreate, productVariantsBulkCreate",
    caution: "여러 옵션 조합을 한꺼번에 만들 때는 초기 Variant 생성과 추가 Variant 등록을 구분합니다.",
  },
  inventory: {
    label: "Inventory", caption: "위치별 재고", icon: Warehouse, tone: "amber", group: "스토어 운영",
    detail: "InventoryLevel은 InventoryItem과 Location의 조합별로 판매 가능 수량과 주문에 할당된 수량 등 재고 상태를 기록합니다.",
    relation: "Catalog의 Variant가 InventoryItem에 연결됩니다. 주문 이행은 배정된 Location과 연결됩니다.",
    api: "GraphQL Admin API · InventoryItem.inventoryLevels, inventoryAdjustQuantities",
    caution: "같은 SKU라도 창고별 판매 가능 수량이 다릅니다. 재고 수량은 위치와 상태를 함께 확인합니다.",
  },
  orders: {
    label: "Orders", caption: "주문 · 출고", icon: ClipboardList, tone: "indigo", group: "스토어 운영",
    detail: "Order는 주문 정보를 보관합니다. FulfillmentOrder는 특정 위치에 배정된 이행 작업을, Fulfillment는 실제 이행을 나타냅니다.",
    relation: "Checkout과 주문이 연결되고, FulfillmentOrder는 출고 위치를 참조합니다. 주문 변경은 Webhooks로 외부에 알릴 수 있습니다.",
    api: "GraphQL Admin API · orders, fulfillmentOrders, Refund",
    caution: "주문 결제, 배송 이행, 환불 상태를 각각 관리합니다.",
  },
} as const;

type ComponentId = keyof typeof components;
const coreComponents = Object.keys(components) as ComponentId[];

const connections = {
  cart: { endpoints: ["storefront", "cart"], label: "카트 관리", compact: "카트", arrow: true },
  checkout: { endpoints: ["cart", "checkout"], label: "checkoutUrl", compact: "결제", arrow: true },
  storefront: { endpoints: ["storefront", "catalog"], label: "공개 상품 조회", arrow: true },
  orders: { endpoints: ["checkout", "orders"], label: "주문 생성", arrow: true },
  inventory: { endpoints: ["catalog", "inventory"], label: "InventoryItem", compact: "재고", arrow: false },
  location: { endpoints: ["inventory", "orders"], label: "출고 위치", compact: "출고", arrow: false },
} satisfies Record<string, { endpoints: [ComponentId, ComponentId]; label: string; compact?: string; arrow: boolean }>;

const interfaces = [
  { label: "GraphQL Admin API", icon: CodeXml, target: "Catalog · Inventory · Orders", relation: "운영 앱의 조회 · 변경" },
  { label: "Checkout 확장", icon: Puzzle, target: "Checkout", relation: "UI Extensions · Functions" },
  { label: "Webhooks", icon: Webhook, target: "Catalog · Inventory · Orders → ERP / WMS", relation: "변경 이벤트 구독" },
];

function MapNode({ id, active }: { id: ComponentId; active: ComponentId }) {
  const { label, caption, icon: Icon, tone } = components[id];
  return (
    <div className="shopify-map-node" data-node={id} data-selected={id === active}>
      <span className="shopify-node-icon" data-tone={tone}><Icon size={25} strokeWidth={1.75} aria-hidden="true" /></span>
      <strong>{label}</strong>
      <span className="shopify-node-caption">{caption}</span>
    </div>
  );
}

function Connection({ name, active, vertical = false }: {
  name: keyof typeof connections;
  active: ComponentId;
  vertical?: boolean;
}) {
  const connection = connections[name];
  const [from, to] = connection.endpoints;

  return (
    <div
      className="shopify-map-connection"
      data-vertical={vertical}
      data-arrow={connection.arrow}
      data-connected={active === from || active === to}
      role="img"
      aria-label={`${components[from].label} ${connection.arrow ? "→" : "—"} ${components[to].label} · ${connection.label}`}
    >
      <span className="shopify-connector-line" aria-hidden="true" />
      <span className="shopify-connector-label" aria-hidden="true">
        {"compact" in connection ? (
          <><span className="hidden md:inline">{connection.label}</span><span className="md:hidden">{connection.compact}</span></>
        ) : connection.label}
      </span>
    </div>
  );
}

export default function ShopifyArchitectureViz() {
  const [active, setActive] = useState<ComponentId>("catalog");
  const [playing, setPlaying] = useState(true);
  const selected = components[active];

  return (
    <div className="shopify-architecture grid gap-6" data-testid="shopify-architecture" data-playing={playing}>
      <figure className="space-y-3" aria-labelledby="shopify-map-title">
        <figcaption className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">ARCHITECTURE MAP</p>
            <h2 id="shopify-map-title" className="text-xl font-bold">Shopify 커머스 구조도</h2>
            <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">공개 기능과 데이터 모델을 기준으로 구매자 접점, 스토어 운영, 앱 연동을 연결했습니다.</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:hidden"
            onClick={() => setPlaying(!playing)}
          >
            {playing ? <Pause size={13} aria-hidden="true" /> : <Play size={13} aria-hidden="true" />}
            {playing ? "움직임 정지" : "움직임 재생"}
          </button>
        </figcaption>

        <div className="shopify-map relative isolate rounded-xl border border-border bg-background p-2.5 sm:p-5">
          <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-muted-foreground opacity-[0.14]" aria-hidden="true">
            <defs>
              <pattern id="shopify-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 20V0H20" fill="none" stroke="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#shopify-map-grid)" />
          </svg>

          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shopify-map-label">구매자 접점</span>
            <span className="text-[11px] text-muted-foreground">온라인 스토어 · Headless</span>
          </div>
          <div className="shopify-map-row">
            <MapNode id="storefront" active={active} />
            <Connection name="cart" active={active} />
            <MapNode id="cart" active={active} />
            <Connection name="checkout" active={active} />
            <MapNode id="checkout" active={active} />
          </div>

          <div className="shopify-map-row shopify-map-crossings">
            <Connection name="storefront" active={active} vertical />
            <span className="shopify-map-label col-start-3 row-start-1 place-self-center">스토어 운영</span>
            <Connection name="orders" active={active} vertical />
          </div>
          <div className="shopify-map-row">
            <MapNode id="catalog" active={active} />
            <Connection name="inventory" active={active} />
            <MapNode id="inventory" active={active} />
            <Connection name="location" active={active} />
            <MapNode id="orders" active={active} />
          </div>

          <section aria-labelledby="shopify-interface-title" className="mt-4 rounded-lg border border-dashed border-border bg-card p-2.5 sm:p-3">
            <h3 id="shopify-interface-title" className="shopify-map-label mb-2.5 w-fit">확장 · 외부 연동</h3>
            <ul className="grid gap-2 sm:grid-cols-3">
              {interfaces.map(({ label, icon: Icon, target, relation }) => (
                <li key={label} className="rounded-md border border-border bg-background p-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold"><Icon size={15} aria-hidden="true" />{label}</div>
                  <div className="mt-1.5 flex items-start gap-1.5 leading-relaxed text-muted-foreground">
                    <Link2 size={13} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{target}<span className="block">{relation}</span></span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-relaxed text-muted-foreground" role="group" aria-label="연결선 범례">
            <span><span aria-hidden="true" className="mr-1">→</span>조회 · 진입 · 이벤트 방향</span>
            <span><span aria-hidden="true" className="mr-1">—</span>데이터 · 업무 관계</span>
          </div>
        </div>
      </figure>

      <section aria-labelledby="shopify-explorer-title" className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">ARCHITECTURE EXPLORER</p>
          <h2 id="shopify-explorer-title" className="text-base font-bold">핵심 기능</h2>
          <p className="text-xs text-muted-foreground">카드를 선택하면 구조도에서 연결 관계가 강조되고, 아래에 상세 설명이 표시됩니다.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {coreComponents.map((id) => {
            const { label, caption, icon: Icon, tone } = components[id];
            return (
              <button
                type="button" key={id} onClick={() => setActive(id)}
                aria-pressed={active === id} aria-controls="shopify-component-inspector"
                className="shopify-component-button relative flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background p-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:p-3"
              >
                <span className="shopify-node-icon" data-tone={tone}><Icon size={17} aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block [overflow-wrap:anywhere] text-xs font-bold sm:text-sm">{label}</span>
                  <span className="block text-[11px] leading-snug text-muted-foreground">{caption}</span>
                </span>
                {active === id && <Check size={12} className="absolute right-1 top-1 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      <section
        id="shopify-component-inspector"
        aria-labelledby="shopify-inspector-title"
        className="space-y-3 rounded-xl border border-border bg-background p-3 sm:p-5"
      >
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">COMPONENT INSPECTOR</p>
          <h2 id="shopify-inspector-title" className="mt-1 text-base font-bold">기능 상세</h2>
        </div>
        <div aria-live="polite" aria-atomic="true" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="shopify-node-icon" data-tone={selected.tone}><selected.icon size={18} aria-hidden="true" /></span>
            <h3 className="font-bold">{selected.label}</h3>
            <span className="text-xs text-muted-foreground">{selected.group}</span>
          </div>
          <p className="text-sm leading-relaxed">{selected.detail}</p>
          <dl className="grid gap-2 sm:grid-cols-3">
            {[
              { term: "연결 관계", text: selected.relation },
              { term: "API · 확장", text: selected.api },
              { term: "구현 시 확인", text: selected.caution },
            ].map(({ term, text }) => (
              <div key={term} className="min-w-0 rounded-lg border border-border bg-card p-3">
                <dt className="text-xs font-semibold">{term}</dt>
                <dd className="mt-1 [overflow-wrap:anywhere] text-xs leading-relaxed text-muted-foreground">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
