import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  CreditCard,
  Database,
  Landmark,
  Monitor,
  Network,
  PackageCheck,
  RefreshCw,
  Server,
} from "lucide-react";
import WorkflowFocusedViz, {
  type WorkflowTopologyCanvasProps,
} from "./WorkflowFocusedViz";
import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

const actors = {
  browser: {
    label: "구매자 · 브라우저",
    detail: "주문 · PG 결제창",
    Icon: Monitor,
  },
  server: {
    label: "쇼핑몰 서버",
    detail: "검증 · 승인 · 주문 확정",
    Icon: Server,
  },
  pg: {
    label: "PG 결제대행",
    detail: "인증 · 승인 · 취소 API",
    Icon: CreditCard,
  },
  van: { label: "VAN 중계", detail: "전문 · 전표 전달", Icon: Network },
  issuer: {
    label: "카드사",
    detail: "인증 · 한도 · 승인 판단",
    Icon: Landmark,
  },
  db: {
    label: "주문 · 결제 DB",
    detail: "시도 · 원장 · Outbox",
    Icon: Database,
  },
  delivery: {
    label: "주문 · 출고 시스템",
    detail: "이벤트 소비 · 배송 지시",
    Icon: PackageCheck,
  },
  recovery: {
    label: "복구 · 대사 워커",
    detail: "조회 · 재처리 · 보상",
    Icon: RefreshCw,
  },
};
type Actor = keyof typeof actors;
type Point = readonly [number, number];
type Route = { from: Actor; to: Actor; wide: Point[]; narrow: Point[] };
const wide: Record<Actor, Point> = {
  browser: [115, 90],
  server: [370, 90],
  pg: [640, 90],
  van: [640, 300],
  issuer: [885, 300],
  db: [115, 300],
  delivery: [370, 520],
  recovery: [640, 520],
};
const narrow: Record<Actor, Point> = {
  browser: [115, 75],
  server: [345, 75],
  db: [115, 305],
  pg: [345, 305],
  delivery: [115, 535],
  van: [345, 535],
  recovery: [115, 785],
  issuer: [345, 785],
};
const routes: Route[] = [
  {
    from: "browser",
    to: "server",
    wide: [
      [210, 90],
      [275, 90],
    ],
    narrow: [
      [205, 75],
      [255, 75],
    ],
  },
  {
    from: "browser",
    to: "pg",
    wide: [
      [115, 133],
      [115, 190],
      [640, 190],
      [640, 133],
    ],
    narrow: [
      [25, 75],
      [8, 75],
      [8, 195],
      [345, 195],
      [345, 262],
    ],
  },
  {
    from: "server",
    to: "db",
    wide: [
      [370, 133],
      [370, 230],
      [115, 230],
      [115, 257],
    ],
    narrow: [
      [345, 118],
      [345, 160],
      [115, 160],
      [115, 262],
    ],
  },
  {
    from: "server",
    to: "pg",
    wide: [
      [465, 90],
      [545, 90],
    ],
    narrow: [
      [345, 118],
      [430, 118],
      [430, 225],
      [380, 225],
      [380, 262],
    ],
  },
  {
    from: "pg",
    to: "van",
    wide: [
      [640, 133],
      [640, 257],
    ],
    narrow: [
      [345, 348],
      [345, 492],
    ],
  },
  {
    from: "van",
    to: "issuer",
    wide: [
      [735, 300],
      [790, 300],
    ],
    narrow: [
      [345, 578],
      [345, 742],
    ],
  },
  {
    from: "pg",
    to: "issuer",
    wide: [
      [735, 90],
      [885, 90],
      [885, 257],
    ],
    narrow: [
      [435, 305],
      [450, 305],
      [450, 885],
      [345, 885],
      [345, 828],
    ],
  },
  {
    from: "server",
    to: "delivery",
    wide: [
      [370, 133],
      [370, 477],
    ],
    narrow: [
      [435, 75],
      [458, 75],
      [458, 425],
      [115, 425],
      [115, 492],
    ],
  },
  {
    from: "recovery",
    to: "pg",
    wide: [
      [735, 520],
      [765, 520],
      [765, 210],
      [700, 210],
      [700, 133],
    ],
    narrow: [
      [205, 785],
      [235, 785],
      [235, 305],
      [255, 305],
    ],
  },
  {
    from: "recovery",
    to: "db",
    wide: [
      [640, 563],
      [640, 585],
      [115, 585],
      [115, 343],
    ],
    narrow: [
      [25, 785],
      [8, 785],
      [8, 305],
      [25, 305],
    ],
  },
  {
    from: "recovery",
    to: "server",
    wide: [
      [545, 520],
      [490, 520],
      [490, 25],
      [370, 25],
      [370, 47],
    ],
    narrow: [
      [115, 742],
      [115, 660],
      [225, 660],
      [225, 25],
      [345, 25],
      [345, 32],
    ],
  },
];
type Beat = WorkflowVisualizationStep & {
  payment: string;
  order: string;
  shipping: string;
};
const trace = (
  actorId: Actor,
  label: string,
  start: number,
  end: number,
  kind: WorkflowWaterfallSpan["kind"] = "work",
  status: WorkflowWaterfallSpan["status"] = "default",
): WorkflowWaterfallSpan => ({
  actorId,
  label,
  start,
  end,
  kind,
  status,
  tone:
    status === "error"
      ? "danger"
      : status === "warning"
        ? "warning"
        : kind === "network"
          ? "secondary"
          : "primary",
});
const beat = (
  title: string,
  summary: string,
  from: Actor,
  to: Actor,
  label: string,
  payment: string,
  order: string,
  shipping = "출고 보류",
  kind: "request" | "response" | "event" | "state" = "request",
  status: WorkflowWaterfallSpan["status"] = "default",
): Beat => ({
  title,
  summary,
  activeActorIds: [from, to],
  transitions: [{ from, to, label, kind }],
  spans: [
    trace(from, label, 0, 0.4, "network", status),
    trace(
      to,
      title.split(" · ").pop()!,
      0.4,
      1,
      status === "warning" ? "wait" : "work",
      status,
    ),
  ],
  payment,
  order,
  shipping,
});
const prepare: Beat[] = [
  beat(
    "주문 준비 · 서버 가격 검증",
    "상품·수량·쿠폰·배송비를 서버에서 재계산합니다. 브라우저가 보낸 금액을 그대로 승인하지 않습니다.",
    "browser",
    "server",
    "상품 1개 · 주문 요청",
    "미결제",
    "생성 중",
  ),
  beat(
    "결제 의도 · 주문과 시도 저장",
    "49,000원과 결제 시도 A를 저장하고 재고를 예약합니다. 주문별 동시 결제를 막을 기준을 외부 호출 전에 남깁니다.",
    "server",
    "db",
    "49,000원 · 시도 A",
    "READY",
    "재고 예약",
    "출고 보류",
    "state",
  ),
  beat(
    "결제창 · 카드 소유자 인증",
    "구매자가 PG 결제창에서 카드·할부를 고르고 카드사 앱 등을 실행합니다. 카드 원문은 상점 서버에 전달하지 않는 구성을 사용합니다.",
    "browser",
    "pg",
    "PG SDK · 인증 시작",
    "인증 중",
    "재고 예약",
  ),
  beat(
    "카드사 인증 · 승인과 별개",
    "PG·카드사 인증 경로를 개념적으로 묶은 장면입니다. 본인 인증 성공만으로 이용한도가 반영되거나 상품이 출고되지는 않습니다.",
    "pg",
    "issuer",
    "앱카드 등 본인 인증",
    "인증 중",
    "재고 예약",
  ),
  beat(
    "인증 결과 · 브라우저 복귀",
    "PG가 브라우저로 거래 키·주문번호·금액을 반환합니다. 이 성공 URL 도착은 인증 결과 전달이며 결제 완료의 증거가 아닙니다.",
    "pg",
    "browser",
    "인증 결과 · 아직 미승인",
    "AUTHENTICATED",
    "재고 예약",
    "출고 보류",
    "response",
  ),
  beat(
    "승인 전 검증 · 주문 소유자와 금액",
    "브라우저가 인증 결과를 서버로 전달합니다. 서버는 주문 소유자·저장 금액·주문 상태와 거래 키를 대조하고 위변조 또는 만료된 주문이면 승인을 중단합니다.",
    "browser",
    "server",
    "거래 키 · 주문 · 금액 대조",
    "AUTHENTICATED",
    "재고 예약",
  ),
  beat(
    "서버 승인 · PG API 호출",
    "검증을 통과한 시도 A만 승인합니다. 서버 자격증명과 해당 API에서 지원하는 멱등키를 사용하며, 동일 주문의 병렬 승인을 차단합니다.",
    "server",
    "pg",
    "시도 A · 승인 49,000원",
    "PROCESSING",
    "결제 처리 중",
  ),
];
const routeApproval: Beat[] = [
  beat(
    "결제망 · VAN에 승인 전문 전달",
    "이 예시는 PG → VAN → 카드사 경로를 사용합니다. PG가 카드사와 직접 연결하는 계약에서는 VAN 구간을 생략할 수 있습니다.",
    "pg",
    "van",
    "카드 승인 전문",
    "PROCESSING",
    "결제 처리 중",
  ),
  beat(
    "카드사 · 한도와 위험 판단",
    "VAN이 전문을 중계합니다. 카드사는 카드 상태·이용가능 한도·부정거래 위험 등을 판단합니다. 신용카드 승인은 즉시 계좌 출금을 의미하지 않습니다.",
    "van",
    "issuer",
    "49,000원 승인 요청",
    "PROCESSING",
    "결제 처리 중",
  ),
];
const approved: Beat[] = [
  beat(
    "카드사 승인 · 응답 중계",
    "카드사가 승인번호를 반환합니다. 아직 상점 DB에는 결제 완료가 저장되지 않았습니다.",
    "issuer",
    "van",
    "승인번호 · 승인 완료",
    "외부 승인 완료",
    "결제 처리 중",
    "출고 보류",
    "response",
  ),
  beat(
    "VAN 응답 · PG 거래 확정",
    "VAN이 카드사 결과를 PG로 전달하고 PG가 거래 상태를 기록합니다.",
    "van",
    "pg",
    "카드사 승인 결과",
    "외부 승인 완료",
    "결제 처리 중",
    "출고 보류",
    "response",
  ),
];
const commit: Beat[] = [
  beat(
    "승인 응답 · 상점 결과 검증",
    "서버가 PG 응답의 거래 ID·주문번호·금액과 완료 상태를 확인합니다. 이 장면 이후에도 DB 저장 실패 가능성이 남아 있습니다.",
    "pg",
    "server",
    "최종 승인 결과",
    "외부 승인 완료",
    "확정 대기",
    "출고 보류",
    "response",
  ),
  beat(
    "로컬 커밋 · 주문과 Outbox",
    "결제 완료·주문 확정·출고 Outbox를 하나의 로컬 트랜잭션으로 저장합니다. PG 승인까지 이 트랜잭션에 포함되는 것은 아닙니다.",
    "server",
    "db",
    "PAID + 주문 + Outbox",
    "PAID",
    "주문 확정",
    "출고 대기",
    "state",
  ),
  beat(
    "상품 제공 · 출고 이벤트",
    "상점의 Outbox 전달기가 출고 이벤트를 보냅니다. 재전송돼도 소비자는 주문 ID로 중복 배송 지시를 막습니다.",
    "server",
    "delivery",
    "주문 확정 이벤트",
    "PAID",
    "주문 확정",
    "배송 지시",
    "event",
  ),
  beat(
    "결과 화면 · 서버 원장 조회",
    "브라우저가 상점 서버에 저장된 결제·주문 상태를 확인해 완료 화면을 보여줍니다. 브라우저가 닫혀도 출고는 서버 흐름으로 이어집니다.",
    "server",
    "browser",
    "구매 완료 · 주문번호",
    "PAID",
    "주문 확정",
    "배송 지시",
    "response",
  ),
  beat(
    "후속 처리 · 매입과 정산 대사",
    "이후 카드 매출전표가 매입되고 계약 주기에 따라 가맹점 정산이 진행됩니다. 복구 워커는 PG 거래·정산 내역을 주문 원장과 대조합니다. 그림의 막대는 시간 축척이 아닙니다.",
    "recovery",
    "pg",
    "거래 · 정산 내역 조회",
    "PAID",
    "주문 확정",
    "배송 지시",
  ),
];
const timeout: Beat[] = [
  beat(
    "응답 유실 · 타임아웃은 미확정",
    "카드사 승인은 끝났지만 PG → 상점 응답이 끊긴 상황입니다. 사용자는 확인 중 안내를 받고 새 결제 시도는 잠시 차단됩니다.",
    "pg",
    "server",
    "응답 유실 · timeout",
    "UNKNOWN",
    "확인 중",
    "출고 보류",
    "response",
    "warning",
  ),
  beat(
    "복구 조회 · 기존 거래 확인",
    "복구 워커가 저장된 시도 A와 거래 키로 PG를 조회합니다. 지원 웹훅도 검증 후 같은 복구 경로에 합류하고, 웹훅만 기다리지는 않습니다.",
    "recovery",
    "pg",
    "시도 A · 거래 상태 조회",
    "UNKNOWN",
    "확인 중",
  ),
  beat(
    "조회 결과 · 승인 사실 복원",
    "PG에서 시도 A가 승인 완료임을 확인했습니다. 새 승인을 만들지 않고 저장된 원래 주문의 복구를 진행합니다.",
    "pg",
    "recovery",
    "시도 A = 승인 완료",
    "외부 승인 확인",
    "복구 중",
    "출고 보류",
    "response",
  ),
  beat(
    "복구 인계 · 원래 주문 재처리",
    "워커가 검증된 거래를 주문 서비스에 넘깁니다. 재고 예약·주문 이행 가능성을 다시 검사하고 조건부 전이로 중복 확정을 막습니다.",
    "recovery",
    "server",
    "검증된 승인 결과",
    "외부 승인 확인",
    "복구 중",
    "출고 보류",
    "event",
  ),
];
const scenarios = {
  success: {
    label: "정상 구매",
    detail: "카드 승인 → 주문 확정 → 배송 지시 → 이후 정산",
    steps: [...prepare, ...routeApproval, ...approved, ...commit],
  },
  declined: {
    label: "카드사 거절",
    detail: "명시적 거절 → 예약 해제 → 다른 카드 안내",
    steps: [
      ...prepare,
      ...routeApproval,
      beat(
        "명시적 실패 · 카드사 거절",
        "한도 부족 등으로 카드사가 거절한 예시입니다. 같은 요청을 자동 반복해 해결하려 하지 않습니다.",
        "issuer",
        "van",
        "승인 거절 · 사유 코드",
        "DECLINED",
        "미결제",
        "출고 보류",
        "response",
        "error",
      ),
      beat(
        "거절 중계 · PG에 결과 전달",
        "VAN은 카드사의 최종 거절 결과를 PG에 전달합니다.",
        "van",
        "pg",
        "거절 결과",
        "DECLINED",
        "미결제",
        "출고 보류",
        "response",
        "error",
      ),
      beat(
        "실패 확정 · 상점에 결과 전달",
        "PG의 에러 코드와 거래 상태를 확인합니다. 이 시나리오는 미승인이 확정된 경우입니다.",
        "pg",
        "server",
        "카드 거절 확인",
        "FAILED",
        "미결제",
        "출고 보류",
        "response",
        "error",
      ),
      beat(
        "자원 복구 · 예약 해제",
        "실패한 결제 시도를 기록하고 재고·쿠폰 예약을 해제합니다. 재결제할 때는 유효 재고와 가격을 다시 검사합니다.",
        "server",
        "db",
        "실패 기록 · 예약 해제",
        "FAILED",
        "재결제 가능",
        "출고 없음",
        "state",
      ),
      beat(
        "대체 수단 · 새 카드 선택",
        "구매자에게 다른 카드·결제수단을 안내합니다. 새 인증·결제 시도는 고객 선택 후 시작합니다.",
        "server",
        "browser",
        "다른 카드로 결제 안내",
        "FAILED",
        "재결제 가능",
        "출고 없음",
        "response",
      ),
    ],
  },
  timeout: {
    label: "승인 응답 유실",
    detail: "승인 여부 조회 → 기존 주문 복구 · 재승인 없음",
    steps: [
      ...prepare,
      ...routeApproval,
      ...approved,
      ...timeout,
      ...commit.slice(1),
    ],
  },
  outage: {
    label: "결제망 연동 장애",
    detail: "조회도 불가능 → 확인 중 유지 · 무조건 PG 우회 금지",
    steps: [
      ...prepare,
      beat(
        "연동 장애 · 결과를 알 수 없음",
        "PG·VAN·카드사 구간 장애로 승인 요청의 최종 결과를 알 수 없습니다. 요청이 전달됐을 가능성을 남겨 두고 UNKNOWN으로 관리합니다.",
        "pg",
        "server",
        "연결 오류 · 결과 미확정",
        "UNKNOWN",
        "확인 중",
        "출고 보류",
        "response",
        "warning",
      ),
      beat(
        "제한 재시도 · 조회도 실패",
        "워커가 백오프·지터와 횟수 제한을 적용해 조회하지만 결제망이 복구되지 않았습니다. 무한 요청으로 장애를 키우지 않습니다.",
        "recovery",
        "pg",
        "조회 불가 · backoff",
        "UNKNOWN",
        "확인 중",
        "출고 보류",
        "request",
        "warning",
      ),
      beat(
        "복구 대기 · 미확정 거래 보존",
        "회로를 차단하고 미확정 거래·운영 알림을 기록합니다. 재고 예약 만료도 결제 실패의 증거는 아닙니다. 이후 승인 발견 시 재고 확인 또는 취소 보상을 수행합니다.",
        "recovery",
        "db",
        "미확정 보존 · 운영 알림",
        "UNKNOWN",
        "운영 확인 필요",
        "출고 보류",
        "state",
        "warning",
      ),
      beat(
        "사용자 안내 · 중복 결제 차단",
        "확인 중 안내와 주문 조회를 제공합니다. 미승인·취소 확정 전에는 다른 PG로 재승인하지 않습니다. 확정 후에만 사전 계약된 대체 PG에서 새 인증을 진행할 수 있습니다.",
        "server",
        "browser",
        "결과 확인 중 · 재결제 보류",
        "UNKNOWN",
        "확인 중",
        "출고 보류",
        "response",
        "warning",
      ),
    ],
  },
  compensate: {
    label: "주문 확정 실패",
    detail: "카드 승인 후 주문 이행 불가 → 취소 보상·재확인",
    steps: [
      ...prepare,
      ...routeApproval,
      ...approved,
      commit[0],
      beat(
        "주문 이행 불가 · 저장 실패",
        "카드 승인은 됐지만 주문 확정 트랜잭션이 실패했습니다. 이 예시는 복구 시 재고 예약도 소멸해 상품을 제공할 수 없는 경우입니다.",
        "server",
        "db",
        "커밋 실패 · 출고 금지",
        "외부 승인 완료",
        "확정 실패",
        "출고 보류",
        "state",
        "error",
      ),
      beat(
        "대사 · 승인 누락 거래 확인",
        "워커가 먼저 PG 승인 사실과 주문 이행 불가를 확인합니다. 상품 제공이 가능했다면 주문 복구를 선택할 수 있습니다.",
        "recovery",
        "pg",
        "승인 사실 조회",
        "외부 승인 확인",
        "이행 불가",
      ),
      beat(
        "보상 요청 · 취소 의도 기록",
        "워커가 주문 서비스에 취소 보상을 요청합니다. 주문 서비스는 기존 결제 시도에 취소 의도를 기록하고 출고를 차단합니다.",
        "recovery",
        "server",
        "취소 보상 요청",
        "취소 필요",
        "이행 불가",
        "출고 보류",
        "event",
      ),
      beat(
        "취소 보상 · 원거래 취소",
        "서버가 PG 취소 API를 호출합니다. 이후 PG·카드사 내부 취소 처리는 계약 경로를 따릅니다. 망취소를 쓰는 PG는 해당 조건·시간 제한을 별도로 적용합니다.",
        "server",
        "pg",
        "원거래 취소 요청",
        "CANCEL_PENDING",
        "취소 처리 중",
      ),
      beat(
        "취소 타임아웃 · 아직 미확정",
        "취소 응답도 유실될 수 있습니다. 취소 완료라고 표시하지 않고 확인 중 상태로 두며 운영 알림과 조회를 이어갑니다.",
        "pg",
        "server",
        "취소 응답 유실",
        "CANCEL_PENDING",
        "취소 확인 중",
        "출고 보류",
        "response",
        "warning",
      ),
      beat(
        "취소 조회 · 보상 결과 확인",
        "워커가 원거래를 조회합니다. 이 예시는 뒤이은 조회에서 취소 완료를 확인하는 경로이며, 확인되지 않으면 보류와 운영 대응을 유지합니다.",
        "recovery",
        "pg",
        "취소 상태 조회",
        "CANCEL_PENDING",
        "취소 확인 중",
      ),
      beat(
        "보상 완료 · 원장과 예약 복구",
        "PG 조회에서 취소 완료가 확인된 뒤 결제 원장을 CANCELED로 갱신하고 재고·쿠폰 예약을 정리합니다. 실제 환급 반영 시점은 카드사·매입 상태에 따라 다릅니다.",
        "recovery",
        "db",
        "취소 확인 · 예약 정리",
        "CANCELED",
        "주문 취소",
        "출고 없음",
        "state",
      ),
    ],
  },
} satisfies Record<string, { label: string; detail: string; steps: Beat[] }>;
type Scenario = keyof typeof scenarios;

export function createCardPaymentSpec(
  scenario: Scenario,
): WorkflowVisualizationSpec {
  return {
    title: "온라인 카드 결제의 연결 구조",
    overviewSummary: `${scenarios[scenario].detail}. 모든 구성요소는 자리를 유지하며 현재 메시지의 방향만 강조됩니다. VAN 경유 승인과 직접 인증 연결을 구분한 학습 예시입니다.`,
    motionTone: "restrained",
    subjectRisk: "sensitive",
    autoplayMs: 4200,
    overviewMs: 2600,
    waterfallLabel: "현재 단계 실행 순서 · 상대 비중",
    actors: (Object.keys(actors) as Actor[]).map((id) => ({
      id,
      label: actors[id].label,
      x: wide[id][0] / 10,
      y: wide[id][1] / 6,
    })),
    topologyLinks: routes,
    steps: scenarios[scenario].steps,
  };
}

function PaymentTopology({
  spec,
  stepIndex,
  playing,
  selectFrame,
}: WorkflowTopologyCanvasProps) {
  const [compact, setCompact] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const svg = useRef<SVGSVGElement>(null);
  const marker = `card-arrow-${useId().replace(/:/g, "")}`;
  const step = stepIndex === null ? null : (spec.steps[stepIndex] as Beat);
  const positions = compact ? narrow : wide;
  const width = compact ? 360 : 1000;
  const xScale = compact ? 360 / 460 : 1;
  const height = compact ? 910 : 600;
  const half = compact ? 90 * xScale : 95;
  const routePoints = (route: Route): Point[] =>
    compact
      ? route.narrow.map(([x, y]) => [x * xScale, y] as Point)
      : route.wide;
  const d = (points: readonly Point[]) =>
    points.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (playing) svg.current?.unpauseAnimations();
    else svg.current?.pauseAnimations();
  }, [playing, stepIndex, compact]);
  const activeLinks = step?.transitions ?? [];
  return (
    <div className="bg-background p-2 sm:p-4">
      <div className="mb-3 grid grid-cols-3 gap-2" aria-label="현재 거래 상태">
        {[
          ["결제", step?.payment ?? "전체 구조"],
          ["주문", step?.order ?? "아직 시작 전"],
          ["상품", step?.shipping ?? "출고 전"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-border bg-card p-2"
          >
            <div className="text-[10px] text-muted-foreground">{label}</div>
            <div className="mt-1 break-words text-xs font-bold">{value}</div>
          </div>
        ))}
      </div>
      <svg
        ref={svg}
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full"
        role="img"
        aria-label={`카드 결제 구성도 · ${step?.title ?? "전체 구조"}`}
      >
        <defs>
          <marker
            id={marker}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0 0L10 5L0 10z" fill="context-stroke" />
          </marker>
        </defs>
        {routes.map((route) => (
          <path
            key={`${route.from}-${route.to}`}
            d={d(routePoints(route))}
            fill="none"
            className="stroke-muted-foreground"
            strokeWidth={1.5}
            strokeOpacity={0.44}
            strokeDasharray="5 5"
          />
        ))}
        {activeLinks.map((edge, i) => {
          const route = routes.find(
            (r) =>
              (r.from === edge.from && r.to === edge.to) ||
              (r.to === edge.from && r.from === edge.to),
          );
          if (!route) return null;
          const points =
            route.from === edge.from
              ? routePoints(route)
              : [...routePoints(route)].reverse();
          const path = d(points);
          const uncertain = /응답 유실|연결 오류|조회 불가/.test(edge.label);
          const failed = step?.spans.some((span) => span.status === "error");
          const color = uncertain
            ? "#d97706"
            : failed
              ? "#e11d48"
              : edge.kind === "response"
                ? "#059669"
                : edge.kind === "event"
                  ? "#8b5cf6"
                  : edge.kind === "state"
                    ? "#d97706"
                    : "#3b82f6";
          return (
            <g key={`${stepIndex}-${i}`}>
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={3}
                markerEnd={uncertain ? undefined : `url(#${marker})`}
                strokeDasharray={uncertain ? "7 5" : undefined}
              />
              {!reduced && !uncertain && (
                <g
                  transform={
                    playing
                      ? undefined
                      : `translate(${points[0][0]} ${points[0][1]})`
                  }
                >
                  <circle r={6} fill={color} stroke="white" strokeWidth={1.5} />
                  {playing && (
                    <animateMotion
                      dur="2.2s"
                      repeatCount="indefinite"
                      path={path}
                    />
                  )}
                </g>
              )}
            </g>
          );
        })}
        {(Object.keys(actors) as Actor[]).map((id) => {
          const [rawX, y] = positions[id];
          const x = rawX * xScale;
          const { label, detail, Icon } = actors[id];
          const active = step?.activeActorIds.includes(id) ?? false;
          return (
            <g
              key={id}
              data-actor-id={id}
              transform={`translate(${x} ${y})`}
              opacity={step && !active ? 0.78 : 1}
            >
              {id === "db" ? (
                <>
                  <path
                    d={`M${-half} -29 V29 C${-half} 49 ${half} 49 ${half} 29 V-29`}
                    className="fill-card stroke-border"
                    strokeWidth={active ? 2.5 : 1.5}
                  />
                  <ellipse
                    cy={-29}
                    rx={half}
                    ry={14}
                    className="fill-card stroke-border"
                  />
                </>
              ) : (
                <rect
                  x={-half}
                  y={-43}
                  width={half * 2}
                  height={86}
                  rx={id === "issuer" ? 2 : 10}
                  className="fill-card stroke-border"
                  strokeWidth={active ? 2.5 : 1.5}
                />
              )}
              {active && (
                <rect
                  x={-half - 4}
                  y={-47}
                  width={half * 2 + 8}
                  height={94}
                  rx={10}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              )}
              <Icon
                x={compact ? -11 : -half + 12}
                y={compact ? (id === "db" ? -20 : -34) : -12}
                width={compact ? 22 : 25}
                height={compact ? 22 : 25}
                className={active ? "text-primary" : "text-muted-foreground"}
                aria-hidden="true"
              />
              <text
                x={compact ? 0 : -half + 46}
                y={compact ? (id === "db" ? 16 : 6) : -3}
                textAnchor={compact ? "middle" : "start"}
                className="fill-foreground"
                fontSize={compact ? 13 : 14}
                fontWeight={700}
              >
                {label}
              </text>
              <text
                x={compact ? 0 : -half + 46}
                y={compact ? (id === "db" ? 33 : 25) : 19}
                textAnchor={compact ? "middle" : "start"}
                className="fill-muted-foreground"
                fontSize={10}
              >
                {detail}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        className="min-h-16 rounded-lg border border-border bg-card p-3 text-xs"
        aria-live="polite"
      >
        {activeLinks.length ? (
          activeLinks.map((edge, i) => (
            <div key={i}>
              <strong>
                {actors[edge.from as Actor].label} →{" "}
                {actors[edge.to as Actor].label}
              </strong>
              <span className="mt-1 block text-muted-foreground">
                {edge.label}
              </span>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            점선: 전체 연결 · 화살표: 전달 방향 · 강조된 끊긴 선: 결과 미확정 ·
            교차선은 접속점이 아님
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="결제 단계 선택">
        <button
          type="button"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
          className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted"
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
            className={`min-w-7 rounded border px-2 py-1 text-[11px] ${stepIndex === i ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CardPaymentViz() {
  const [scenario, setScenario] = useState<Scenario>("success");
  const spec = createCardPaymentSpec(scenario);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="mb-2 text-xs font-semibold">결제 시나리오</p>
        <div className="flex flex-wrap gap-2" aria-label="결제 시나리오 선택">
          {(Object.keys(scenarios) as Scenario[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={scenario === id}
              onClick={() => setScenario(id)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium ${scenario === id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              {scenarios[id].label}
            </button>
          ))}
        </div>
        <p className="mt-2 min-h-8 text-xs text-muted-foreground">
          {scenarios[scenario].detail}
        </p>
      </div>
      <WorkflowFocusedViz
        key={scenario}
        spec={spec}
        TopologyCanvas={PaymentTopology}
      />
    </div>
  );
}
