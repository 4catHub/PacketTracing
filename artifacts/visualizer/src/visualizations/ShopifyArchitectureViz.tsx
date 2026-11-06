import { useState } from "react";
import {
  AppWindow, Boxes, Check, ClipboardList, CodeXml, CreditCard,
  Link2, Puzzle, ShoppingCart, Warehouse, Webhook,
} from "lucide-react";
import "./shopify-architecture.css";

const core = {
  storefront: {
    label: "Storefront", caption: "상품 탐색", icon: AppWindow, tone: "blue", group: "구매자 접점",
    role: ["상품·컬렉션 노출", "Shopify 테마 또는 Hydrogen 기반 스토어"],
    relation: ["Catalog 공개 상품 조회", "선택한 상품 옵션을 Cart에 추가"],
    api: ["Storefront GraphQL API", "products · collections"],
    caution: ["Headless 채널에 게시된 상품과 마켓별 가격 확인"],
  },
  cart: {
    label: "Cart", caption: "구매 품목", icon: ShoppingCart, tone: "green", group: "구매자 접점",
    role: ["CartLine에 상품 옵션과 수량 보관", "구매자 정보와 할인 코드 연결"],
    relation: ["CartLine이 Catalog의 ProductVariant 참조", "checkoutUrl로 Checkout 연결"],
    api: ["Storefront GraphQL API", "cartCreate · cartLinesAdd"],
    caution: ["배송비·세금·할인에 따라 최종 비용 변동 가능"],
  },
  checkout: {
    label: "Checkout", caption: "배송 · 결제", icon: CreditCard, tone: "rose", group: "구매자 접점",
    role: ["배송 정보와 결제 수단 입력", "구매 확정"],
    relation: ["Cart.checkoutUrl로 진입", "구매 확정 시 Order 생성"],
    api: ["Checkout UI Extensions", "Shopify Functions"],
    caution: ["확장 가능 위치와 규칙은 API·스토어 플랜별 상이"],
  },
  catalog: {
    label: "Catalog", caption: "상품 · 옵션", icon: Boxes, tone: "violet", group: "스토어 운영",
    role: ["Product에 상품 공통 정보 보관", "ProductVariant에 색상·사이즈 등 구매 옵션 보관"],
    relation: ["Storefront에서 공개 상품 조회", "ProductVariant와 InventoryItem 연결"],
    api: ["GraphQL Admin API", "productCreate · productVariantsBulkCreate"],
    caution: ["초기 Variant 생성과 추가 Variant 등록 구분"],
  },
  inventory: {
    label: "Inventory", caption: "위치별 재고", icon: Warehouse, tone: "amber", group: "스토어 운영",
    role: ["InventoryItem × Location별 InventoryLevel 관리", "판매 가능 수량과 주문 할당 수량 기록"],
    relation: ["Catalog의 Variant와 InventoryItem 연결", "주문 이행과 배정된 Location 연결"],
    api: ["GraphQL Admin API", "InventoryItem.inventoryLevels", "inventoryAdjustQuantities"],
    caution: ["같은 SKU도 위치와 재고 상태별 수량 확인"],
  },
  orders: {
    label: "Orders", caption: "주문 · 출고", icon: ClipboardList, tone: "indigo", group: "스토어 운영",
    role: ["Order에 주문 정보 보관", "FulfillmentOrder에 출고 작업 배정", "Fulfillment로 실제 이행 기록"],
    relation: ["Checkout에서 주문 생성", "FulfillmentOrder가 출고 위치 참조", "Webhooks로 주문 변경 알림"],
    api: ["GraphQL Admin API", "orders · fulfillmentOrders · Refund"],
    caution: ["결제·이행·환불 상태를 각각 관리"],
  },
} as const;

type CoreComponentId = keyof typeof core;
const coreComponents = Object.keys(core) as CoreComponentId[];
const operations = ["catalog", "inventory", "orders"] as const;

const interfaces = {
  admin: {
    label: "GraphQL Admin API", caption: "운영 데이터 조회 · 변경", icon: CodeXml, tone: "blue", group: "확장 · 외부 연동",
    targets: operations,
    role: ["앱에서 상품·재고·주문 데이터 조회 및 변경"],
    relation: ["운영 앱과 Catalog·Inventory·Orders 연결"],
    api: ["productCreate · inventoryAdjustQuantities", "orders · fulfillmentOrders"],
    caution: ["리소스별 접근 스코프와 앱 권한 확인", "API 버전과 호출 한도 확인"],
  },
  extensions: {
    label: "Checkout 확장", caption: "UI Extensions · Functions", icon: Puzzle, tone: "rose", group: "확장 · 외부 연동",
    targets: ["checkout"],
    role: ["체크아웃 화면과 구매 로직 확장"],
    relation: ["Checkout의 지정된 화면 위치와 실행 지점에 연결"],
    api: ["Checkout UI Extensions로 화면 요소 추가", "Shopify Functions로 할인 등 로직 확장"],
    caution: ["확장 지점의 기능·플랜별 지원 범위 확인"],
  },
  webhooks: {
    label: "Webhooks", caption: "변경 이벤트 구독", icon: Webhook, tone: "indigo", group: "확장 · 외부 연동",
    targets: operations, destination: "ERP / WMS",
    role: ["상품·재고·주문 변경 알림 구독"],
    relation: ["Shopify 변경 이벤트를 ERP·WMS에 전달", "필요 시 Admin API로 원본 상태 재조회"],
    api: ["Shopify Webhooks 구독", "HTTPS 등 지원되는 전달 방식 선택"],
    caution: ["HTTPS 수신 시 HMAC 서명 검증", "전달 ID로 중복 처리"],
  },
} as const;

const components = { ...core, ...interfaces };
type ComponentId = keyof typeof components;
const interfaceIds = Object.keys(interfaces) as (keyof typeof interfaces)[];
const inspectorId = "shopify-component-inspector";

const connections = {
  cart: { endpoints: ["storefront", "cart"], label: "카트 관리", compact: "카트", arrow: true },
  checkout: { endpoints: ["cart", "checkout"], label: "checkoutUrl", compact: "결제", arrow: true },
  storefront: { endpoints: ["storefront", "catalog"], label: "공개 상품 조회", arrow: true },
  orders: { endpoints: ["checkout", "orders"], label: "주문 생성", arrow: true },
  inventory: { endpoints: ["catalog", "inventory"], label: "InventoryItem", compact: "재고", arrow: false },
  location: { endpoints: ["inventory", "orders"], label: "출고 위치", compact: "출고", arrow: false },
} satisfies Record<string, { endpoints: [CoreComponentId, CoreComponentId]; label: string; compact?: string; arrow: boolean }>;

function MapNode({ id, active, relatedTargets, onSelect }: {
  id: CoreComponentId;
  active: ComponentId;
  relatedTargets: readonly CoreComponentId[];
  onSelect: (id: ComponentId) => void;
}) {
  const { label, caption, icon: Icon, tone } = core[id];
  return (
    <button
      type="button" className="shopify-map-node" data-node={id}
      data-related={relatedTargets.includes(id)}
      aria-pressed={id === active} aria-controls={inspectorId}
      onClick={() => onSelect(id)}
    >
      <span className="shopify-node-icon" data-tone={tone}><Icon size={25} strokeWidth={1.75} aria-hidden="true" /></span>
      <strong>{label}</strong>
      <span className="shopify-node-caption">{caption}</span>
    </button>
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
  const selected = components[active];
  const mapNodeProps = {
    active,
    relatedTargets: "targets" in selected ? selected.targets : [],
    onSelect: setActive,
  };

  return (
    <div className="shopify-architecture grid gap-6" data-testid="shopify-architecture">
      <figure className="space-y-3" aria-labelledby="shopify-map-title">
        <figcaption className="space-y-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">ARCHITECTURE MAP</p>
          <h2 id="shopify-map-title" className="text-xl font-bold">Shopify 커머스 구조도</h2>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">구매자 접점 · 스토어 운영 · 앱 연동</p>
          <p className="break-keep text-xs leading-relaxed text-muted-foreground sm:text-sm">맵 또는 핵심 기능 카드 선택 → 관련 연결 강조 · 아래 기능 상세 확인</p>
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
            <MapNode id="storefront" {...mapNodeProps} />
            <Connection name="cart" active={active} />
            <MapNode id="cart" {...mapNodeProps} />
            <Connection name="checkout" active={active} />
            <MapNode id="checkout" {...mapNodeProps} />
          </div>

          <div className="shopify-map-row shopify-map-crossings">
            <Connection name="storefront" active={active} vertical />
            <span className="shopify-map-label col-span-3 col-start-2 row-start-1 place-self-center whitespace-nowrap">스토어 운영</span>
            <Connection name="orders" active={active} vertical />
          </div>
          <div className="shopify-map-row">
            <MapNode id="catalog" {...mapNodeProps} />
            <Connection name="inventory" active={active} />
            <MapNode id="inventory" {...mapNodeProps} />
            <Connection name="location" active={active} />
            <MapNode id="orders" {...mapNodeProps} />
          </div>

          <section aria-labelledby="shopify-interface-title" className="mt-4 rounded-lg border border-dashed border-border bg-card p-2.5 sm:p-3">
            <h3 id="shopify-interface-title" className="shopify-map-label mb-2.5 w-fit">확장 · 외부 연동</h3>
            <ul className="grid gap-2 sm:grid-cols-3">
              {interfaceIds.map((id) => {
                const item = interfaces[id];
                const { label, icon: Icon, caption, targets } = item;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className="shopify-interface-button h-full w-full rounded-md border border-border bg-background p-2.5 text-left text-xs"
                      aria-pressed={id === active} aria-controls={inspectorId}
                      onClick={() => setActive(id)}
                    >
                      <span className="flex items-center gap-1.5 font-semibold"><Icon size={15} aria-hidden="true" />{label}</span>
                      <span className="mt-1.5 flex items-start gap-1.5 leading-relaxed text-muted-foreground">
                        <Link2 size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>
                          {targets.map((target) => core[target].label).join(" · ")}
                          {"destination" in item && ` → ${item.destination}`}
                          <span className="block">{caption}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] leading-relaxed text-muted-foreground" role="group" aria-label="연결선 범례">
            <span><span aria-hidden="true" className="mr-1">→</span>조회 · 진입 · 이벤트 방향</span>
            <span><span aria-hidden="true" className="mr-1">—</span>데이터 · 업무 관계</span>
            <span><span aria-hidden="true" className="mr-1 inline-block h-2 w-3 rounded-sm border border-dashed border-emerald-700 dark:border-emerald-400" />연동 대상</span>
          </div>
        </div>
      </figure>

      <section aria-labelledby="shopify-explorer-title" className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">ARCHITECTURE EXPLORER</p>
          <h2 id="shopify-explorer-title" className="text-base font-bold">핵심 기능</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {coreComponents.map((id) => {
            const { label, caption, icon: Icon, tone } = components[id];
            return (
              <button
                type="button" key={id} onClick={() => setActive(id)}
                aria-pressed={active === id} aria-controls={inspectorId}
                className="shopify-component-button relative flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background p-2.5 text-left sm:p-3"
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
        id={inspectorId}
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
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { term: "역할", points: selected.role },
              { term: "연결 관계", points: selected.relation },
              { term: "API · 확장", points: selected.api },
              { term: "구현 시 확인", points: selected.caution },
            ].map(({ term, points }) => (
              <div key={term} className="min-w-0 rounded-lg border border-border bg-card p-3">
                <dt className="text-xs font-semibold">{term}</dt>
                <dd className="mt-1 [overflow-wrap:anywhere] text-xs leading-relaxed text-muted-foreground">
                  <ul className="shopify-inspector-list space-y-1 pl-3">
                    {points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
