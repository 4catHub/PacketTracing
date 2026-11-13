import type { ComponentType, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Database,
  FileCheck2,
  Landmark,
  LockKeyhole,
  Monitor,
  Network,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type { WorkflowVisualizationStep } from "./workflow-visualization";

type ActorId =
  | "browser"
  | "server"
  | "pg"
  | "van"
  | "issuer"
  | "db"
  | "delivery"
  | "recovery";
type PaymentBeat = WorkflowVisualizationStep & {
  payment: string;
  order: string;
  shipping: string;
};
type Tone = "neutral" | "good" | "warning" | "error";
const actorDetails: Record<
  ActorId,
  {
    label: string;
    role: string;
    Icon: ComponentType<{ size?: number; className?: string }>;
  }
> = {
  browser: { label: "구매자 화면", role: "주문서 · 결과 표시", Icon: Monitor },
  server: { label: "쇼핑몰 서버", role: "검증 · 승인 요청", Icon: Server },
  pg: { label: "PG 결제대행", role: "결제창 · 거래 API", Icon: CreditCard },
  van: { label: "VAN 중계", role: "승인 전문 전달", Icon: Network },
  issuer: { label: "카드사", role: "인증 · 승인 판단", Icon: Landmark },
  db: { label: "주문·결제 원장", role: "상태 · Outbox 기록", Icon: Database },
  delivery: {
    label: "주문·출고",
    role: "상품 제공 · 배송 지시",
    Icon: PackageCheck,
  },
  recovery: {
    label: "복구·대사",
    role: "조회 · 재처리 · 보상",
    Icon: RefreshCw,
  },
};
const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  warning:
    "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  error: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};
function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border py-2 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all font-semibold text-foreground">
        {children}
      </span>
    </div>
  );
}
function Product({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-border bg-muted ${small ? "h-12 w-12" : "h-20 w-20"}`}
    >
      <svg
        viewBox="0 0 100 100"
        className={small ? "h-9 w-9" : "h-16 w-16"}
        role="img"
        aria-label="구매 예시: 무선 헤드폰"
      >
        <path
          d="M24 59V44a26 26 0 0152 0v15"
          fill="none"
          className="stroke-foreground"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M28 42a22 22 0 0144 0"
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth="4"
        />
        <rect
          x="17"
          y="49"
          width="18"
          height="31"
          rx="8"
          className="fill-card stroke-foreground"
          strokeWidth="3"
        />
        <rect
          x="65"
          y="49"
          width="18"
          height="31"
          rx="8"
          className="fill-card stroke-foreground"
          strokeWidth="3"
        />
        <path
          d="M24 57v14m52-14v14"
          className="stroke-muted-foreground"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
function CreditCardExample() {
  return (
    <div
      className="relative mx-auto w-full max-w-64 rounded-xl border-2 border-border bg-muted p-3 sm:p-4"
      aria-label="예시 카드: 끝자리 4242"
    >
      <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-muted-foreground">
        <span>EXAMPLE CARD</span>
        <CreditCard size={19} />
      </div>
      <div className="my-3 h-6 w-8 rounded border border-amber-600/40 bg-amber-400/20">
        <div className="mt-2 border-t border-amber-600/40" />
      </div>
      <p className="whitespace-nowrap font-mono text-[13px] font-bold sm:text-base sm:tracking-wider">
        •••• •••• •••• 4242
      </p>
      <p className="mt-2 text-[10px] text-muted-foreground">
        설명용 가상 카드 · 민감정보 없음
      </p>
    </div>
  );
}
function BrowserWindow({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex items-center gap-1 border-b border-border bg-muted px-3 py-2">
        <i className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <i className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <i className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
        <span className="ml-2 truncate font-mono text-[10px] text-muted-foreground">
          {title}
        </span>
        <LockKeyhole
          size={12}
          className="ml-auto shrink-0 text-muted-foreground"
        />
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
function ActorPanel({
  id,
  step,
  side,
}: {
  id: ActorId;
  step: PaymentBeat | null;
  side: "송신" | "수신";
}) {
  const { label, role, Icon } = actorDetails[id];
  const state = step?.payment ?? "미결제";
  const tone: Tone = step?.spans.some((span) => span.status === "error")
    ? "error"
    : step?.spans.some((span) => span.status === "warning")
      ? "warning"
      : state === "PAID" || state === "CANCELED"
        ? "good"
        : "neutral";
  const order = step?.order ?? "주문 준비";
  const title = step?.title ?? "";
  const pgWindow = !step || /결제창|카드사 인증|인증 결과/.test(title);
  const lostApproval = title.startsWith("응답 유실");
  const pgState = lostApproval ? "DONE · 승인 완료" : state;
  const transactionType = /정산/.test(title)
    ? "거래·정산 대사"
    : /취소/.test(title)
      ? "원거래 취소·조회"
      : /조회|대사|복구/.test(title)
        ? "기존 거래 조회"
        : "카드 승인 처리";
  const serverModule = /검증|가격/.test(title)
    ? 0
    : /Outbox|주문.*확정|로컬 커밋/.test(title)
      ? 2
      : 1;
  return (
    <section
      data-actor-id={id}
      className="min-h-[470px] min-w-0 sm:min-h-[440px] rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4"
      aria-label={`${side} · ${label}`}
    >
      <div className="mb-4 flex items-start gap-2">
        <Icon size={19} className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0">
          <h4 className="text-sm font-bold">{label}</h4>
          <p className="text-[11px] text-muted-foreground">{role}</p>
        </div>
        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
          {side}
        </span>
      </div>
      <div className="min-h-[330px]" data-testid={`payment-apparatus-${id}`}>
        {id === "browser" && (
          <BrowserWindow title="shop.example / checkout">
            <div className="flex items-center gap-3">
              <Product />
              <div>
                <p className="text-xs font-bold">무선 헤드폰</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  1개 · 무료 배송
                </p>
                <p className="mt-2 text-lg font-bold">
                  49,000<span className="ml-1 text-xs">원</span>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Field label="주문번호">ORD-1042</Field>
              <Field label="선택한 수단">카드 · 끝자리 4242</Field>
            </div>
            <div className="mt-3 rounded-lg border border-border bg-muted px-3 py-2 text-center text-xs font-bold">
              {state === "PAID"
                ? "구매 완료 · 주문 조회"
                : state === "UNKNOWN"
                  ? "결제 결과 확인 중"
                  : state === "FAILED"
                    ? "다른 카드로 결제"
                    : state === "CANCELED"
                      ? "주문 취소 확인"
                      : state === "CANCEL_PENDING"
                        ? "취소 결과 확인 중"
                        : "49,000원 결제하기"}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              인증 뒤에도 상점 서버의 승인·주문 확정 필요
            </p>
          </BrowserWindow>
        )}
        {id === "pg" && pgWindow && (
          <BrowserWindow title="pg.example / payment">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold">카드 결제</span>
              <Badge>
                <LockKeyhole size={11} />
                PG 호스팅
              </Badge>
            </div>
            <CreditCardExample />
            <div className="mt-3">
              <Field label="결제 금액">49,000원</Field>
              <Field label="결제 시도">A · pay_example_A</Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={tone}>{state}</Badge>
              <Badge>
                <ShieldCheck size={11} />
                {state === "인증 중" || state === "AUTHENTICATED"
                  ? "카드사 앱 인증"
                  : "서버 간 거래 API"}
              </Badge>
            </div>
          </BrowserWindow>
        )}
        {id === "pg" && !pgWindow && (
          <div className="relative overflow-hidden rounded-xl border border-border bg-background p-4">
            <div className="absolute -right-4 -top-4 h-8 w-8 rotate-45 border border-border bg-muted" />
            <div className="flex items-center gap-2 border-b border-dashed border-border pb-3">
              <FileCheck2 size={24} className="text-primary" />
              <div>
                <p className="text-sm font-bold">{transactionType}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  PG 거래 기록 · 설명용 전표
                </p>
              </div>
            </div>
            <Field label="orderId">ORD-1042</Field>
            <Field label="거래 식별값">pay_example_A</Field>
            <Field label="승인 금액">49,000원</Field>
            <Field label="PG 거래 상태">
              <Badge tone={lostApproval ? "good" : tone}>{pgState}</Badge>
            </Field>
            {lostApproval && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/40 p-2 text-[11px] text-amber-800 dark:text-amber-300">
                <Clock3 size={15} className="shrink-0" />
                <span>카드 승인은 완료 · 상점으로 보낸 응답만 유실</span>
              </div>
            )}
            <p className="mt-3 border-t border-dashed border-border pt-3 text-[10px] text-muted-foreground">
              {transactionType === "거래·정산 대사"
                ? "정산 주기·수수료는 계약 기준으로 별도 대조"
                : "상점 서버만 승인·조회·취소 API 호출"}
            </p>
          </div>
        )}
        {id === "server" && (
          <div className="rounded-xl border-2 border-border bg-background p-3">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <span className="font-mono text-[10px] font-bold text-muted-foreground">
                ORDER SERVICE
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            {[
              "주문 소유자 · 금액 검증",
              "PG 승인 · 조회 · 취소",
              "주문 확정 · Outbox 저장",
            ].map((module, i) => (
              <div
                key={module}
                className={`mb-2 flex items-center gap-2 rounded-lg border px-2.5 py-3 text-xs ${i === serverModule ? "border-primary bg-primary/5 font-bold" : "border-border text-muted-foreground"}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border font-mono text-[10px]">
                  {i + 1}
                </span>
                {module}
                <span className="ml-auto flex gap-1">
                  <i className="h-1 w-1 rounded-full bg-current" />
                  <i className="h-1 w-1 rounded-full bg-current" />
                </span>
              </div>
            ))}
            <Field label="서버 저장 금액">49,000원</Field>
            <Field label="주문 상태">{order}</Field>
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <LockKeyhole size={11} />
              시크릿 키는 서버에서만 사용
            </p>
          </div>
        )}
        {id === "issuer" && state === "인증 중" && (
          <div className="mx-auto w-52 rounded-[26px] border-[3px] border-border bg-background p-3">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            <p className="text-center text-[10px] font-semibold text-muted-foreground">
              카드사 앱 · 가상 인증 화면
            </p>
            <div className="my-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
                <ShieldCheck size={32} className="text-primary" />
              </div>
            </div>
            <p className="text-center text-sm font-bold">49,000원 결제 인증</p>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              무선 헤드폰 · shop.example
            </p>
            <div className="my-5 flex justify-center gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <i
                  key={i}
                  className="h-2 w-2 rounded-full bg-muted-foreground/60"
                />
              ))}
            </div>
            <div className="rounded-lg border border-border bg-muted p-2 text-center text-xs font-bold">
              비밀번호·생체 인증
            </div>
            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              본인 확인 ≠ 카드 승인
            </p>
          </div>
        )}
        {id === "issuer" && state !== "인증 중" && (
          <div>
            <svg
              viewBox="0 0 280 92"
              className="mx-auto h-24 w-full max-w-72"
              role="img"
              aria-label="카드사: 카드 상태와 한도를 확인하는 승인 기관"
            >
              <path
                d="M20 30L140 5l120 25z"
                className="fill-muted stroke-border"
                strokeWidth="2"
              />
              <text
                x="140"
                y="26"
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                className="fill-foreground"
              >
                카드사 승인 시스템
              </text>
              {[45, 100, 155, 210].map((x) => (
                <rect
                  key={x}
                  x={x}
                  y="37"
                  width="23"
                  height="39"
                  rx="2"
                  className="fill-card stroke-border"
                  strokeWidth="2"
                />
              ))}
              <path
                d="M24 83H256"
                className="stroke-foreground"
                strokeWidth="4"
              />
            </svg>
            <div className="mt-2 rounded-xl border border-border bg-background p-3">
              <Field label="승인 요청 금액">49,000원</Field>
              {["카드 유효성 · 소유자 확인", "이용가능 한도 · 위험 판단"].map(
                (text) => (
                  <div
                    key={text}
                    className="mt-2 flex items-center gap-2 text-xs"
                  >
                    <ShieldCheck
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    {text}
                  </div>
                ),
              )}
              <div className="mt-4">
                <Badge tone={tone}>
                  {state === "DECLINED" ? (
                    <>
                      <XCircle size={13} />
                      승인 거절 · 한도 부족 예시
                    </>
                  ) : /승인 완료|승인 확인/.test(state) ? (
                    <>
                      <CheckCircle2 size={13} />
                      승인번호 81234567
                    </>
                  ) : (
                    <>
                      <Clock3 size={13} />
                      {state === "인증 중"
                        ? "카드 소유자 인증"
                        : "카드사 판단 중"}
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        )}
        {id === "van" && (
          <div>
            <div className="rounded-xl border-2 border-border bg-background p-4">
              <div className="mb-3 flex items-center gap-2">
                <Network size={20} />
                <span className="text-xs font-bold">카드 전문 중계 장비</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["PG", "신용", "체크", "회신"].map((port, i) => (
                  <div key={port} className="text-center">
                    <div
                      className={`mb-1 flex h-9 items-center justify-center rounded border-2 ${i === 0 || i === 3 ? "border-primary bg-primary/5" : "border-border"}`}
                    >
                      <i className="h-2 w-4 border-b-2 border-current" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {port}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-4 rounded-lg border border-border bg-card p-3">
              <span className="absolute -top-2 right-3 bg-card px-1 text-[9px] font-semibold text-muted-foreground">
                승인 전문 · 학습용
              </span>
              <Field label="주문">ORD-1042</Field>
              <Field label="거래 금액">KRW 49,000</Field>
              <Field label="전달 내용">
                {state === "DECLINED"
                  ? "거절 결과"
                  : state === "외부 승인 완료"
                    ? "승인번호 81234567"
                    : "카드 승인 요청"}
              </Field>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              VAN은 전문을 전달 · 승인 판단은 카드사 담당
            </p>
          </div>
        )}
        {id === "db" && (
          <div>
            <svg
              viewBox="0 0 280 60"
              className="h-14 w-full"
              role="img"
              aria-label="결제 원장 저장소"
            >
              <path
                d="M16 23v22c0 17 248 17 248 0V23"
                className="fill-muted stroke-border"
                strokeWidth="2"
              />
              <ellipse
                cx="140"
                cy="23"
                rx="124"
                ry="19"
                className="fill-card stroke-border"
                strokeWidth="2"
              />
              <text
                x="140"
                y="27"
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                className="fill-foreground"
              >
                주문 · 결제 기록
              </text>
            </svg>
            <div className="rounded-xl border border-border bg-background p-3">
              <Field label="orderId">ORD-1042</Field>
              <Field label="amount">49,000 KRW</Field>
              <Field label="payment">
                <Badge tone={tone}>
                  {title.includes("저장 실패")
                    ? "PROCESSING · 저장 전 상태"
                    : state}
                </Badge>
              </Field>
              <Field label="order">{order}</Field>
              <Field label="출고 Outbox">
                {state === "PAID" ? "ORDER_PAID · 저장" : "발행하지 않음"}
              </Field>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <FileCheck2 size={14} />
              {state === "PAID"
                ? "결제·주문·이벤트를 로컬 커밋"
                : state === "CANCELED"
                  ? "취소 확인 후 예약 자원 정리"
                  : "이 기록으로 기존 거래를 복구"}
            </div>
          </div>
        )}
        {id === "delivery" && (
          <div>
            <div className="mx-auto flex h-40 max-w-64 items-center justify-center rounded-xl border border-border bg-background">
              <svg
                viewBox="0 0 210 135"
                className="h-36 w-52"
                role="img"
                aria-label="ORD-1042 상품 출고 상자"
              >
                <path
                  d="M42 46L104 17l64 29-64 30z"
                  className="fill-muted stroke-border"
                  strokeWidth="2"
                />
                <path
                  d="M42 46v59l62 27V76zM104 76l64-30v59l-64 27z"
                  className="fill-card stroke-foreground"
                  strokeWidth="2"
                />
                <path
                  d="M72 32l64 29v25"
                  fill="none"
                  className="stroke-muted-foreground"
                  strokeWidth="8"
                />
                <rect
                  x="115"
                  y="91"
                  width="31"
                  height="18"
                  rx="2"
                  className="fill-muted"
                />
                <path
                  d="M119 95v10m4-10v10m4-10v10m4-10v10m4-10v10"
                  className="stroke-foreground"
                />
              </svg>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-background p-3">
              <Field label="주문번호">ORD-1042</Field>
              <Field label="상품">무선 헤드폰 · 1개</Field>
              <Field label="배송 지시">
                <Badge tone={state === "PAID" ? "good" : "warning"}>
                  {step?.shipping ?? "출고 전"}
                </Badge>
              </Field>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              주문 ID 중복 제거 → 같은 주문의 배송 지시 한 번
            </p>
          </div>
        )}
        {id === "recovery" && (
          <div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-border">
                <RefreshCw size={25} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold">기존 시도 A 추적</p>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  ORD-1042 / pay_example_A
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-border bg-background p-3">
              {[
                "결제 의도·원거래 식별",
                "PG 거래 상태 조회",
                state === "CANCELED"
                  ? "취소 결과·예약 자원 정리"
                  : "주문 복구 또는 취소 보상",
              ].map((task, i) => (
                <div
                  key={task}
                  className="flex items-center gap-2 border-b border-border py-3 text-xs last:border-0"
                >
                  {i === 0 ? (
                    <Check
                      size={15}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border font-mono text-[9px]">
                      {i + 1}
                    </span>
                  )}
                  {task}
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Badge tone={tone}>
                {state === "UNKNOWN" || state === "CANCEL_PENDING" ? (
                  <>
                    <Clock3 size={12} />
                    확인 전 재결제·출고 보류
                  </>
                ) : (
                  "새 승인 없이 기존 거래 복구"
                )}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Exchange({ step }: { step: PaymentBeat | null }) {
  const transition = step?.transitions?.[0];
  const uncertain = /응답 유실|연결 오류|조회 불가/.test(
    transition?.label ?? "",
  );
  return (
    <div
      className={`flex min-w-0 flex-col items-center justify-center gap-2 px-1 py-3 text-center ${uncertain ? "text-amber-700 dark:text-amber-300" : "text-primary"}`}
      aria-label="현재 전달 내용"
    >
      <span className="max-w-32 break-words text-[11px] font-bold">
        {transition?.label ?? "인증 · 승인 · 상품 제공"}
      </span>
      {uncertain ? (
        <div
          className="flex items-center gap-1"
          aria-label="응답 유실 · 결과 미확정"
        >
          <span className="w-5 border-t-2 border-dashed border-current" />
          <X size={22} />
          <span className="w-5 border-t-2 border-dashed border-current" />
        </div>
      ) : (
        <>
          <ArrowRight size={28} className="hidden sm:block" />
          <ArrowDown size={28} className="sm:hidden" />
        </>
      )}
      <span className="text-[10px] text-muted-foreground">
        {uncertain
          ? "실패 확정 아님"
          : transition?.kind === "response"
            ? "결과 전달"
            : transition?.kind === "event"
              ? "이벤트"
              : transition?.kind === "state"
                ? "기록·상태 변경"
                : "요청"}
      </span>
    </div>
  );
}

export default function CardPaymentScene({
  spec,
  stepIndex,
  playing,
  selectFrame,
}: WorkflowTopologyCanvasProps) {
  const reduced = useReducedMotion() ?? false;
  const step =
    stepIndex === null ? null : (spec.steps[stepIndex] as PaymentBeat);
  const transition = step?.transitions?.[0];
  const from = (transition?.from ?? "browser") as ActorId;
  const to = (transition?.to ?? "pg") as ActorId;
  return (
    <div
      className="space-y-3 bg-background p-3 sm:p-4"
      role="group"
      aria-label="카드 결제 단계별 구매 예시"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
        <Product small />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold">무선 헤드폰 한 개를 구매하는 예시</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            ORD-1042 · 결제 시도 A
          </p>
        </div>
        <span className="text-lg font-bold">
          49,000<span className="ml-1 text-xs">원</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2" aria-label="현재 거래 상태">
        {[
          ["결제", step?.payment ?? "전체 구조"],
          ["주문", step?.order ?? "주문 준비"],
          ["상품", step?.shipping ?? "출고 전"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="min-w-0 rounded-lg border border-border bg-card p-2"
          >
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="mt-1 break-words text-xs font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div
        className="rounded-xl border border-border bg-card p-3"
        aria-label="전체 참여자와 현재 담당 역할"
      >
        <p className="mb-2 text-[10px] font-semibold text-muted-foreground">
          구매자 ↔ 쇼핑몰 ↔ PG ↔ VAN·카드사 · 원장·출고·복구 연계
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.keys(actorDetails) as ActorId[]).map((id) => {
            const { label, Icon } = actorDetails[id];
            const active = step?.activeActorIds.includes(id);
            return (
              <div
                key={id}
                data-context-actor={id}
                className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 ${active ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"}`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="text-[11px] font-semibold">{label}</span>
                {active && (
                  <span className="ml-auto text-[9px] text-primary">현재</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <motion.div
        key={stepIndex ?? "overview"}
        initial={reduced || !playing ? false : { opacity: 0.6, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced || !playing ? 0 : 0.25 }}
        className="grid items-stretch gap-1 sm:grid-cols-[minmax(0,1fr)_100px_minmax(0,1fr)]"
        aria-label="현재 단계의 처리 장면"
      >
        <ActorPanel id={from} step={step} side="송신" />
        <Exchange step={step} />
        <ActorPanel id={to} step={step} side="수신" />
      </motion.div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        설명용 화면·전문·식별값 · 실제 결제 입력이나 API 호출 없음. 강조된 두
        역할의 처리 내용이 아래 실행 추적과 함께 바뀝니다.
      </p>
      <div className="flex flex-wrap gap-1.5" aria-label="결제 단계 선택">
        <button
          type="button"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
          className="rounded border border-border px-2 py-1.5 text-[11px] hover:bg-muted"
        >
          전체
        </button>
        {spec.steps.map((s, i) => (
          <button
            key={i}
            type="button"
            title={s.title}
            aria-label={`${i + 1}단계: ${s.title}`}
            aria-pressed={stepIndex === i}
            onClick={() => selectFrame(i)}
            className={`min-w-8 rounded border px-2 py-1.5 text-[11px] ${stepIndex === i ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
