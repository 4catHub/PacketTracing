import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Boxes, Check, ClipboardList, CreditCard, Database, Layers3, Package, Pause, Play, Puzzle, ShoppingBag, ShoppingCart, Store, Warehouse, Webhook } from "lucide-react";

type Domain = "storefront" | "cart" | "checkout" | "catalog" | "inventory" | "orders";
const domains = [
  { id: "storefront", label: "Storefront", caption: "상품 탐색 · 판매 채널", icon: Store, subject: "Theme / Hydrogen / Headless", detail: "테마 또는 Hydrogen으로 구매자 화면을 구성합니다. Headless 채널은 Storefront GraphQL API로 상품과 컬렉션을 조회합니다.", entities: ["Product", "Collection", "Theme"], api: "Storefront API · products / collections", caution: "테마와 Headless는 별도 채널 구현 방식입니다." },
  { id: "cart", label: "Cart", caption: "상품 옵션 · 구매 수량", icon: ShoppingCart, subject: "Cart / CartLine", detail: "Cart에는 ProductVariant를 가리키는 CartLine과 수량, 구매자 정보, 할인 코드 등이 연결됩니다.", entities: ["Cart", "CartLine", "ProductVariant"], api: "Storefront API · cartCreate / cartLinesAdd", caution: "Cart의 예상 금액과 최종 결제 금액은 다를 수 있습니다." },
  { id: "checkout", label: "Checkout", caption: "결제 · 배송 정보", icon: CreditCard, subject: "Shopify Checkout", detail: "Shopify Checkout에서 배송과 결제 정보를 확정합니다. Headless 카트의 checkoutUrl로 Checkout에 진입할 수 있습니다.", entities: ["Checkout", "Payment", "Discount"], api: "Cart.checkoutUrl · Checkout UI Extensions", caution: "체크아웃 확장은 플랜 및 API별 이용 제한이 있습니다." },
  { id: "catalog", label: "Catalog", caption: "상품 · 옵션 · 가격", icon: ShoppingBag, subject: "Product / ProductVariant", detail: "Product는 판매 상품을 나타내고 Variant는 구매 가능한 옵션 조합과 가격을 담습니다. Metafield로 속성을 확장할 수 있습니다.", entities: ["Product", "ProductVariant", "Metafield"], api: "Admin GraphQL · productCreate / productVariantsBulkCreate", caution: "productCreate는 최초 Variant까지만 생성합니다." },
  { id: "inventory", label: "Inventory", caption: "창고 · 재고 수량", icon: Warehouse, subject: "InventoryItem / InventoryLevel", detail: "각 Variant에 연결된 InventoryItem을 Location별 InventoryLevel로 추적합니다. 같은 상품도 위치별 수량이 다를 수 있습니다.", entities: ["InventoryItem", "InventoryLevel", "Location"], api: "Admin GraphQL · inventoryAdjustQuantities", caution: "Variant가 InventoryItem을 참조합니다. 공유 관계 여부는 사용 중인 API 버전에서 확인합니다." },
  { id: "orders", label: "Orders", caption: "주문 · 배송 · 환불", icon: ClipboardList, subject: "Order / Fulfillment", detail: "구매 완료 후 Order가 생성되며 Fulfillment, 배송, 반품과 환불이 연결됩니다. ERP/물류 시스템은 API나 웹훅으로 연동할 수 있습니다.", entities: ["Order", "Fulfillment", "Refund"], api: "Admin GraphQL · orders / fulfillmentOrders", caution: "결제 성공과 배송 완료는 서로 다른 상태입니다." },
] as const;
const variants = [
  { name: "블랙 / M", sku: "TEE-BLK-M", price: 48000, seoul: 7, busan: 3 },
  { name: "블랙 / L", sku: "TEE-BLK-L", price: 48000, seoul: 2, busan: 0 },
  { name: "화이트 / M", sku: "TEE-WHT-M", price: 52000, seoul: 0, busan: 5 },
] as const;

export default function ShopifyArchitectureViz() {
  const [active, setActive] = useState<Domain>("catalog");
  const [playing, setPlaying] = useState(true);
  const [variantIndex, setVariantIndex] = useState(0);
  const [location, setLocation] = useState<"seoul" | "busan">("seoul");
  const [quantity, setQuantity] = useState(1);
  const selected = domains.find((part) => part.id === active) ?? domains[3];
  const variant = variants[variantIndex];
  const available = variant[location];
  const canBuy = quantity <= available;
  return (
    <div className="space-y-5" data-testid="shopify-architecture">
      <style>{"@keyframes shopify-flow { from { transform: translateX(-110%); } to { transform: translateX(700%); } }" +
        "@keyframes shopify-breathe { 0%, 100% { opacity: .28; transform: scale(1); } 50% { opacity: .7; transform: scale(1.12); } }" +
        "@media (prefers-reduced-motion: reduce) { .shopify-flow, .shopify-breathe { animation: none !important; } }"}</style>
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">ARCHITECTURE EXPLORER</div>
          <h2 className="text-lg font-bold text-foreground">Shopify Commerce Platform</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">하나의 장면에서 전체 구조를 살펴보고, 구성요소를 선택해 상세 내용을 확인합니다.</p>
        </div>
        <button type="button" onClick={() => setPlaying((current) => !current)} aria-label={playing ? "장면 움직임 정지" : "장면 움직임 재생"}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          {playing ? <Pause size={13} /> : <Play size={13} />}{playing ? "일시 정지" : "재생"}
        </button>
      </div>
      <div className="relative rounded-xl border border-border bg-background p-3 sm:p-5 overflow-hidden" aria-label="Shopify 기능 구조">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "radial-gradient(currentColor 0.7px, transparent 0.7px)", backgroundSize: "18px 18px" }} />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="rounded-lg w-8 h-8 flex items-center justify-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-600/25"><Layers3 size={19} /></span>
              Shopify <span className="font-normal text-xs text-muted-foreground hidden sm:inline">· SaaS 커머스 플랫폼</span>
            </div>
            <span className="text-[10px] text-muted-foreground">공개된 기능 구조 · 내부 인프라 아님</span>
          </div>
          {[
            { name: "CUSTOMER EXPERIENCE", hint: "구매자 접점", ids: ["storefront", "cart", "checkout"] },
            { name: "COMMERCE OPERATIONS", hint: "운영 도메인", ids: ["catalog", "inventory", "orders"] },
          ].map((group) => (
            <section key={group.name} className="space-y-2" aria-label={group.hint}>
              <div className="flex justify-between text-[10px] text-muted-foreground tracking-wider font-bold"><span>{group.name}</span><span>{group.hint}</span></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {group.ids.map((id, index) => {
                  const part = domains.find((candidate) => candidate.id === id)!;
                  const Icon = part.icon;
                  const isActive = part.id === active;
                  return (
                    <button type="button" key={part.id} onClick={() => setActive(part.id)} aria-pressed={isActive}
                      className={"relative min-h-[122px] sm:min-h-[132px] text-left rounded-xl p-3 sm:p-4 border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 " +
                        (isActive ? "bg-emerald-500/[0.08] border-emerald-600/70 shadow-sm" : "bg-card border-border hover:border-emerald-600/40")}>
                      <div className="flex justify-between items-start">
                        <span className={"w-9 h-9 rounded-lg flex items-center justify-center " +
                          (isActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-foreground")}><Icon size={20} strokeWidth={1.8} /></span>
                        <span className="shopify-breathe w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true"
                          style={{ animation: "shopify-breathe 6s ease-in-out infinite", animationDelay: String(-index * 1.2) + "s", animationPlayState: playing ? "running" : "paused" }} />
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-foreground mt-3">{part.label}</div>
                      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug">{part.caption}</p>
                      {isActive && <Check size={13} className="absolute bottom-2 right-2 text-emerald-700 dark:text-emerald-400" aria-hidden />}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          <section className="space-y-2.5 border border-dashed border-emerald-600/35 bg-emerald-500/[0.04] rounded-xl p-3 sm:p-4" aria-label="확장 인터페이스">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Puzzle size={16} className="text-emerald-700 dark:text-emerald-400" /> EXTENSIONS & INTEGRATIONS <span className="ml-auto text-[10px] text-muted-foreground font-normal">외부 연결</span></div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs text-muted-foreground">
              <div className="rounded-md border border-border bg-card py-2 px-1 flex justify-center gap-1 items-center"><Database size={13} className="hidden sm:block" />GraphQL APIs</div>
              <div className="rounded-md border border-border bg-card py-2 px-1 flex justify-center gap-1 items-center"><Boxes size={13} className="hidden sm:block" />Functions / UI</div>
              <div className="rounded-md border border-border bg-card py-2 px-1 flex justify-center gap-1 items-center"><Webhook size={13} className="hidden sm:block" />Webhooks</div>
            </div>
            <div className="relative h-1 bg-emerald-500/10 rounded-full overflow-hidden" aria-hidden="true">
              <div className="shopify-flow absolute left-0 top-0 h-full w-[14%] bg-emerald-600/60 rounded-full"
                style={{ animation: "shopify-flow 12s linear infinite", animationPlayState: playing ? "running" : "paused" }} />
            </div>
          </section>
        </div>
      </div>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3" aria-label="선택한 구성요소 상세" aria-live="polite">
        <div className="text-[10px] text-muted-foreground font-bold tracking-widest">COMPONENT INSPECTOR</div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={selected.id} className="space-y-3" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .18 }}>
            <div className="text-base font-bold text-foreground">{selected.label}<span className="ml-2 text-xs font-normal text-muted-foreground">{selected.subject}</span></div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{selected.detail}</p>
            <div className="flex flex-wrap gap-1.5">{selected.entities.map((entity) => <span key={entity} className="font-mono text-[11px] bg-muted rounded px-2 py-1">{entity}</span>)}</div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-border p-3"><div className="text-muted-foreground mb-1">주요 API</div><div className="text-foreground">{selected.api}</div></div>
              <div className="rounded-lg border border-border p-3"><div className="text-muted-foreground mb-1">주의 사항</div><div className="text-foreground">{selected.caution}</div></div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-3" aria-label="상품과 재고 체험">
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground font-bold tracking-widest">SCENARIO SANDBOX</div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Package size={16} /> Product · Variant · Inventory</h3>
          <p className="text-xs text-muted-foreground">가상의 티셔츠 상품입니다. 재고 연결만 체험하며 API 요청이나 결제는 발생하지 않습니다.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-xs text-muted-foreground space-y-1">Variant
            <select aria-label="상품 옵션" value={variantIndex} onChange={(event) => setVariantIndex(Number(event.target.value))} className="block w-full rounded-md border border-border bg-background text-foreground px-2 py-2">
              {variants.map((option, index) => <option key={option.sku} value={index}>{option.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-muted-foreground space-y-1">Location
            <select aria-label="재고 위치" value={location} onChange={(event) => setLocation(event.target.value as "seoul" | "busan")} className="block w-full rounded-md border border-border bg-background text-foreground px-2 py-2">
              <option value="seoul">서울 창고</option><option value="busan">부산 창고</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground space-y-1">CartLine 수량
            <select aria-label="구매 수량" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="block w-full rounded-md border border-border bg-background text-foreground px-2 py-2">
              {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}개</option>)}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            ["Product", "Everyday Tee"], ["Variant / SKU", variant.sku],
            ["InventoryLevel", String(available) + "개"],
            ["상품 예상 금액", (variant.price * quantity).toLocaleString("ko-KR") + "원"],
          ].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/60 border border-border p-3">
            <div className="text-[10px] text-muted-foreground">{label}</div><div className="mt-1 font-semibold break-all">{value}</div>
          </div>)}
        </div>
        <div role="status" className={"flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs sm:text-sm " +
          (canBuy ? "border-emerald-600/25 text-emerald-700 dark:text-emerald-400" : "border-amber-500/30 text-amber-700 dark:text-amber-400")}>
          {canBuy ? <Check size={15} /> : <ShoppingBag size={15} />}
          {canBuy ? "선택한 Location의 예시 재고로 주문 수량 충족" : "선택한 Location에 예시 재고 부족 — 다른 위치나 옵션을 선택하세요."}
        </div>
      </section>
    </div>
  );
}
