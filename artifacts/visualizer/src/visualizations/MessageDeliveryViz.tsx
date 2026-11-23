import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2, MessageSquareText, RotateCcw } from "lucide-react";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
  WorkflowTransition,
} from "./workflow-visualization";

type NodeId = "service" | "outbox" | "worker" | "agency" | "kakao" | "carrier" | "phone" | "monitor";
type Mode = "sms" | "kakao" | "recovery";
type Operation = readonly [NodeId, string, number, number, ("work" | "network" | "wait")?, ("default" | "success" | "warning" | "error")?];
type Hop = { from: NodeId; to: NodeId; label: string; kind?: WorkflowTransition["kind"] };

const nodes: Record<NodeId, { title: string; caption: string; accent: string }> = {
  service: { title: "운영사 서비스", caption: "주문 · 인증 이벤트", accent: "#2563eb" },
  outbox: { title: "발송 원장", caption: "DB · Outbox", accent: "#6366f1" },
  worker: { title: "발송 워커", caption: "큐 · 재시도", accent: "#0284c7" },
  agency: { title: "발송 대행사", caption: "API · 채널 라우터", accent: "#7c3aed" },
  kakao: { title: "카카오 비즈", caption: "알림톡 경로", accent: "#b45309" },
  carrier: { title: "문자 통신망", caption: "중계 · 이동통신사", accent: "#0d9488" },
  phone: { title: "수신자 단말", caption: "톡 · 문자 앱", accent: "#16a34a" },
  monitor: { title: "결과 수집", caption: "웹훅 · 조회 대사", accent: "#e11d48" },
};

const order = Object.keys(nodes) as NodeId[];
const coordinates = {
  wide: {
    width: 1000, height: 620,
    positions: {
      service: [117, 127], outbox: [370, 127], worker: [623, 127], agency: [873, 127],
      monitor: [117, 401], kakao: [623, 401], carrier: [873, 401], phone: [873, 559],
    },
  },
  compact: {
    width: 440, height: 755,
    positions: {
      service: [110, 89], outbox: [330, 89], worker: [110, 281], agency: [330, 281],
      monitor: [110, 473], kakao: [330, 473], carrier: [110, 665], phone: [330, 665],
    },
  },
} satisfies Record<"wide" | "compact", { width: number; height: number; positions: Record<NodeId, number[]> }>;

const baseLinks: Hop[] = [
  { from: "service", to: "outbox", label: "트랜잭션" },
  { from: "outbox", to: "worker", label: "큐 작업" },
  { from: "worker", to: "agency", label: "HTTPS API" },
  { from: "agency", to: "kakao", label: "비즈메시지" },
  { from: "agency", to: "carrier", label: "문자 중계" },
  { from: "kakao", to: "phone", label: "카카오톡" },
  { from: "carrier", to: "phone", label: "SMS" },
  { from: "agency", to: "monitor", label: "결과 웹훅" },
  { from: "monitor", to: "outbox", label: "상태 갱신" },
];

const span = ([actorId, label, start, end, kind = "work", status = "default"]: Operation): WorkflowWaterfallSpan => ({
  actorId, label, start, end, kind, status,
  tone: status === "error" ? "danger" : status === "warning" ? "warning" : status === "success" ? "success" : kind === "network" ? "secondary" : "primary",
});

function beat(
  title: string,
  summary: string,
  hops: Hop[],
  operations: Operation[],
  message?: [string, string],
): WorkflowVisualizationStep {
  return {
    title,
    summary,
    activeActorIds: Array.from(new Set(hops.flatMap(({ from, to }) => [from, to]))),
    transitions: hops,
    spans: operations.map(span),
    message: message ? { label: message[0], code: message[1] } : undefined,
  };
}

const actors = order.map((id) => {
  const point = coordinates.wide.positions[id];
  const compact = coordinates.compact.positions[id];
  return {
    id, label: nodes[id].title, detail: nodes[id].caption,
    x: point[0] / coordinates.wide.width * 100,
    y: point[1] / coordinates.wide.height * 100,
    compactX: compact[0] / coordinates.compact.width * 100,
    compactY: compact[1] / coordinates.compact.height * 100,
  };
});

const common = {
  title: "발송 대행사를 거치는 메시지 전달",
  actors,
  topologyLinks: baseLinks,
  motionTone: "restrained" as const,
  autoplayMs: 4200,
  overviewMs: 2600,
  waterfallLabel: "참여자별 전송·대기 타임라인",
  messagePanelSize: "compact" as const,
};

const sms: WorkflowVisualizationSpec = {
  ...common,
  overviewSummary: "SMS는 운영사 → 대행사 API → 문자 중계·통신사 → 수신자 단말 순서로 전달됩니다. 운영사는 이후 발송 결과를 별도로 수집합니다.",
  steps: [
    beat("① 주문 완료 · 발송 의도 저장",
      "주문 완료 트랜잭션과 같은 DB 트랜잭션에 알림 발송 의도(eventId)를 기록합니다. 실제 전송은 아직 시작되지 않았습니다.",
      [{ from: "service", to: "outbox", label: "order.completed + outbox", kind: "event" }],
      [["service", "주문 확정", 0, 0.4], ["outbox", "발송 의도 커밋", 0.4, 1, "work", "success"]],
      ["운영사 내부 이벤트 · 개념 예시", "eventId: evt-401\nchannel: SMS\nrecipient: 010-****-5678\nstatus: QUEUED"]),
    beat("② 비동기 워커 · 대행사 호출",
      "워커가 작업을 읽고 발신번호·수신번호·메시지 본문을 대행사별 API 형식으로 변환한 뒤 인증된 HTTPS 요청을 보냅니다.",
      [{ from: "outbox", to: "worker", label: "미처리 이벤트", kind: "event" }, { from: "worker", to: "agency", label: "SMS 발송 API" }],
      [["outbox", "대기 작업 읽기", 0, 0.2], ["worker", "전송 검증·서명", 0.2, 0.55], ["agency", "API 접수", 0.55, 1, "network"]],
      ["운영사 → 대행사 · 의사 요청", "POST /messages\nAuthorization: <서버 비밀키>\ntype: SMS\nfrom: 등록 발신번호\nto: 010-****-5678\ntext: 주문이 완료되었습니다."]),
    beat("③ 대행사 · 채널 접속과 라우팅",
      "대행사는 형식·발신번호·쿼터를 검사한 뒤 계약된 문자 중계/통신사 접속 경로로 전달합니다. 사업자에 따라 내부 중계 단계는 더 많을 수 있습니다.",
      [{ from: "agency", to: "carrier", label: "SMS 중계 요청" }],
      [["agency", "유형·발신번호 검증", 0, 0.38], ["carrier", "통신망 접수", 0.38, 1, "network"]],
      ["대행사 접수와 외부망 접수는 별개", "providerMessageId: p-msg-401\nstatus: ACCEPTED → SENDING\n※ 아직 단말 수신 성공 아님"]),
    beat("④ 통신사 · 문자 앱으로 전달",
      "통신사 측 문자 설비가 단말로 전달을 시도합니다. 단말 오프라인·망 장애 시 사업자 정책에 따라 지연, 보관 재시도 또는 실패가 됩니다.",
      [{ from: "carrier", to: "phone", label: "단말로 SMS" }],
      [["carrier", "문자망 전달 처리", 0, 0.72, "network"], ["phone", "문자 앱 수신", 0.72, 1, "work", "success"]],
      ["수신자 단말 예시", "[문자 메시지]\n주문이 완료되었습니다.\n※ 전송 완료와 사용자의 읽음은 별개"]),
    beat("⑤ 대행사 · 최종 결과 알림",
      "통신사 결과가 대행사에 반영된 뒤 제공자가 웹훅/조회로 수신 결과를 제공합니다. 접수 성공과 단말 전달 성공을 분리해 추적합니다.",
      [{ from: "carrier", to: "agency", label: "전송 결과", kind: "response" }, { from: "agency", to: "monitor", label: "결과 Webhook", kind: "event" }],
      [["carrier", "전송 결과 보고", 0, 0.35, "network"], ["agency", "결과 매핑", 0.35, 0.65], ["monitor", "웹훅 확인", 0.65, 1, "work", "success"]],
      ["대행사 → 운영사 · 의사 결과 이벤트", "providerMessageId: p-msg-401\nstatus: DELIVERED\nreportedAt: 예시 수신 시각"]),
    beat("⑥ 운영사 · 원장 상태 확정",
      "콜백 중복을 제거하고 providerMessageId로 원본을 찾아 DELIVERED를 확정합니다. 콜백 누락 건은 조회 API로 대사합니다.",
      [{ from: "monitor", to: "outbox", label: "최종 상태 저장", kind: "state" }],
      [["monitor", "결과 서명·ID 검증", 0, 0.5], ["outbox", "원장 상태 갱신", 0.5, 1, "work", "success"]],
      ["운영사 저장 상태", "eventId: evt-401\nproviderMessageId: p-msg-401\nstatus: DELIVERED\nread: 알 수 없음"]),
  ],
};

const kakao: WorkflowVisualizationSpec = {
  ...common,
  overviewSummary: "알림톡은 운영사가 등록한 발신 프로필과 승인된 정보성 템플릿을 대행사가 카카오 비즈메시지 경로로 전달합니다. 문자 경로와 자동으로 동일해지지 않습니다.",
  steps: [
    beat("① 채널·템플릿 검증 후 Outbox 기록",
      "운영사는 카카오 채널 연동 상태·승인 템플릿·치환값을 확인합니다. 주문 상태 변경과 알림 발송 의도는 같은 원장에 기록합니다.",
      [{ from: "service", to: "outbox", label: "승인 템플릿 + 주문", kind: "event" }],
      [["service", "템플릿 변수 검증", 0, 0.55], ["outbox", "알림톡 의도 저장", 0.55, 1]],
      ["운영사 템플릿 모델", "channel: ALIMTALK\ntemplateCode: ORDER_DONE\nvariables: { 주문번호: ORD-401 }\nstatus: QUEUED"]),
    beat("② 워커 → 대행사 API 접수",
      "대행사별 Adapter가 템플릿 식별자, 발신 프로필, 수신번호, 치환값을 해당 대행사의 HTTPS API로 전송합니다. 접수 ID를 저장합니다.",
      [{ from: "outbox", to: "worker", label: "비동기 발행", kind: "event" }, { from: "worker", to: "agency", label: "알림톡 발송 API" }],
      [["outbox", "이벤트 선택", 0, 0.18], ["worker", "대행사 포맷 변환", 0.18, 0.55], ["agency", "접수 ID 반환", 0.55, 1, "network"]],
      ["운영사 → 대행사 · 개념 데이터", "channel: ALIMTALK\nsenderProfile: 등록 채널\ntemplateCode: ORDER_DONE\nproviderMessageId: p-kakao-401"]),
    beat("③ 대행사 → 카카오 비즈메시지",
      "대행사는 비즈메시지 연동 경로로 요청을 넘깁니다. 카카오는 승인 템플릿, 채널 정책, 수신자 발송 가능성 등을 평가합니다.",
      [{ from: "agency", to: "kakao", label: "템플릿 메시지" }],
      [["agency", "카카오 커넥터 라우팅", 0, 0.48], ["kakao", "비즈메시지 처리", 0.48, 1, "network"]],
      ["접수 ≠ 수신 완료", "providerMessageId: p-kakao-401\nstatus: ACCEPTED / SENDING\n카카오 경로로 전달 중"]),
    beat("④ 카카오톡 채팅방에 알림 도착",
      "카카오톡 앱이 수신 가능한 상태라면 정보성 알림톡이 수신자의 채팅방에 표시됩니다. 친구 추가 여부와 별개로 알림톡 정책을 만족해야 합니다.",
      [{ from: "kakao", to: "phone", label: "알림톡 수신" }],
      [["kakao", "메시지 전달", 0, 0.77, "network"], ["phone", "카카오톡 수신", 0.77, 1, "work", "success"]],
      ["수신자 카카오톡 예시", "[알림톡 · 주문완료]\n주문번호: ORD-401\n상품 배송 준비가 시작됩니다."]),
    beat("⑤ 카카오 결과 → 대행사 → 운영사",
      "카카오 결과가 대행사에 반영되고 대행사가 웹훅이나 결과 조회 API로 알립니다. 전송 결과와 사용자 읽음 지표는 구분합니다.",
      [{ from: "kakao", to: "agency", label: "채널 전송 결과", kind: "response" }, { from: "agency", to: "monitor", label: "상태 웹훅", kind: "event" }],
      [["kakao", "최종 결과 반환", 0, 0.33, "network"], ["agency", "상태 변환", 0.33, 0.7], ["monitor", "이벤트 수신", 0.7, 1]],
      ["대행사 → 운영사 · 결과 예시", "providerMessageId: p-kakao-401\nstatus: DELIVERED\n※ 수신자 읽음 보증 아님"]),
    beat("⑥ 원장 갱신 · 결과 대사",
      "중복·역순 웹훅을 확인하고 최종 결과를 저장합니다. 처리 중 상태가 오래 남아 있다면 대행사의 발송 결과 조회 API로 대사합니다.",
      [{ from: "monitor", to: "outbox", label: "DELIVERED 확정", kind: "state" }],
      [["monitor", "중복·순서 검증", 0, 0.5], ["outbox", "최종 수신 상태", 0.5, 1, "work", "success"]],
      ["운영사 결과 원장", "eventId: evt-kakao-401\nproviderMessageId: p-kakao-401\nstatus: DELIVERED"]),
  ],
};

const recovery: WorkflowVisualizationSpec = {
  ...common,
  overviewSummary: "장애 예시: 알림톡 API 응답이 유실되고 웹훅도 지연됩니다. 무작정 재호출하지 않고 상태 조회로 결과를 확정한 뒤, 최종 실패에 대해서만 SMS 대체 발송합니다.",
  steps: [
    beat("① 알림톡 발송 요청 · 외부 호출",
      "워커가 알림톡 요청을 대행사로 전송합니다. 내부 DB에는 동일 알림의 eventId와 시도 정보를 먼저 기록해 두었습니다.",
      [{ from: "worker", to: "agency", label: "알림톡 API 요청" }],
      [["worker", "발송 시도 기록", 0, 0.38], ["agency", "요청 처리", 0.38, 1, "network"]],
      ["운영사 상태", "eventId: evt-502\nattempt: 1\nstatus: REQUESTING"]),
    beat("② API 응답 경로 단절 · 결과 미확인",
      "대행사는 요청을 이미 받았을 수 있지만 응답이 네트워크에서 유실됐습니다. 타임아웃을 '발송 실패'로 확정하거나 즉시 재요청하지 않습니다.",
      [{ from: "agency", to: "worker", label: "응답 유실 · timeout", kind: "state" }],
      [["agency", "요청 수락 여부 불명", 0, 0.45, "work", "warning"], ["worker", "타임아웃·UNKNOWN", 0.45, 1, "wait", "warning"]],
      ["운영사 진단 상태", "status: UNKNOWN\nreason: HTTP_TIMEOUT\n접수 성공·실패 둘 다 미확인\n※ 중복 발송 방지: 즉시 재호출 금지"]),
    beat("③ 제공자 조회로 접수·결과 대사",
      "대행사에서 지원하는 ID·고유 조회 키로 요청 상태를 조회합니다. 외부 조회가 불가능하면 한도를 정해 UNKNOWN으로 보류하고 관제·수동 처리합니다.",
      [{ from: "worker", to: "agency", label: "발송 상태 조회" }, { from: "agency", to: "monitor", label: "조회 응답", kind: "response" }],
      [["worker", "중복 전송 대신 조회", 0, 0.3, "network"], ["agency", "접수 기록 검색", 0.3, 0.75], ["monitor", "외부 결과 비교", 0.75, 1]],
      ["조회가 가능한 구성의 예시", "eventId: evt-502\nproviderMessageId: p-kakao-502\nstatus: SENDING\n※ 아직 SMS 대체발송 금지"]),
    beat("④ 카카오 전송이 최종 실패로 확인",
      "대행사가 카카오 채널의 최종 실패 결과를 확인합니다. 템플릿 영구 오류라면 먼저 수정해야 하며, 이번 예시는 카카오톡 수신 불가로 확정된 경우입니다.",
      [{ from: "kakao", to: "agency", label: "확정 실패 결과", kind: "response" }, { from: "agency", to: "monitor", label: "FAILED 보고", kind: "event" }],
      [["kakao", "카카오 전송 실패", 0, 0.4, "work", "error"], ["agency", "최종 상태 변환", 0.4, 0.75], ["monitor", "실패 유형 판정", 0.75, 1, "work", "warning"]],
      ["최종 전송 실패 확인", "status: FAILED\nreason: 카카오톡 전달 불가 (예시)\nfallbackEligible: true"]),
    beat("⑤ 승인된 정책에 따라 SMS Fallback",
      "문자 대체 발송을 사전 설정하고 등록 발신번호·본문을 준비한 경우 대행사가 문자 커넥터로 한 번만 분기합니다. 설정하지 않았다면 실패로 종료합니다.",
      [{ from: "agency", to: "carrier", label: "대체 SMS 전송", kind: "request" }],
      [["agency", "Fallback 정책·중복 확인", 0, 0.5], ["carrier", "SMS 경로 접수", 0.5, 1, "network"]],
      ["대체 발송 조건", "original: p-kakao-502 (FAILED)\nfallback: p-sms-502\nsender: 사전 등록 발신번호\n1개 알림에 2개 채널 시도 연결"]),
    beat("⑥ 통신사 → 사용자에게 SMS 전달",
      "대체 SMS가 통신망을 거쳐 수신자에게 전달됩니다. 문자 변환 시 알림톡 버튼·서식은 보존되지 않을 수 있으므로 별도 문자 본문을 사용합니다.",
      [{ from: "carrier", to: "phone", label: "대체 문자 수신" }],
      [["carrier", "SMS 발송 처리", 0, 0.8, "network"], ["phone", "문자 앱 도착", 0.8, 1, "work", "success"]],
      ["대체 문자 예시", "[문자 메시지]\nORD-502 주문이 접수되었습니다.\n원래 채널: 알림톡 실패"]),
    beat("⑦ 웹훅 유실 · 주기적 조회로 보정",
      "문자 성공 콜백이 누락되더라도 배치 대사 작업이 대행사 결과 조회 API로 최종 상태를 보정합니다. 웹훅은 인증·멱등성·역순 이벤트 검증이 필요합니다.",
      [{ from: "monitor", to: "agency", label: "누락 상태 조회" }, { from: "agency", to: "monitor", label: "SMS 성공 조회", kind: "response" }],
      [["monitor", "SENDING 장기 체류 감지", 0, 0.33, "work", "warning"], ["agency", "발송 결과 조회", 0.33, 0.65, "network"], ["monitor", "최종 결과 검증", 0.65, 1, "work", "success"]],
      ["콜백이 없어도 최종 조회로 대사", "original: FAILED\nfallback: DELIVERED\nsource: STATUS_QUERY"]),
    beat("⑧ 발송 원장에 최종 결과 기록",
      "한 알림의 원본 알림톡은 FAILED, 대체 SMS는 DELIVERED로 각각 기록합니다. 조회 불가·재시도 소진 등 미해결 건은 DLQ와 운영자 확인으로 넘깁니다.",
      [{ from: "monitor", to: "outbox", label: "원본·대체 상태 확정", kind: "state" }],
      [["monitor", "결과와 원본 시도 연결", 0, 0.55], ["outbox", "중복 없는 상태 저장", 0.55, 1, "work", "success"]],
      ["운영사 원장 · 예시", "eventId: evt-502\nALIMTALK: FAILED\nSMS fallback: DELIVERED\nfinal: DELIVERED_BY_FALLBACK"]),
  ],
};

const scenarios: Record<Mode, WorkflowVisualizationSpec> = { sms, kakao, recovery };

function Symbol({ id, x, y, active }: { id: NodeId; x: number; y: number; active: boolean }) {
  const color = active ? nodes[id].accent : "currentColor";
  const commonProps = { stroke: color, strokeWidth: 2.8, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g transform={"translate(" + x + " " + y + ")"} {...commonProps}>
      {id === "service" && <><rect x="-17" y="-14" width="34" height="29" rx="5" /><path d="M -17 -5 H 17 M -10 2 H 4 M -10 9 H 10" /></>}
      {id === "outbox" && <><ellipse cx="0" cy="-10" rx="17" ry="6" /><path d="M -17 -10 V 14 C -17 23 17 23 17 14 V -10 M -17 3 C -17 12 17 12 17 3" /></>}
      {id === "worker" && <><rect x="-18" y="-14" width="21" height="12" rx="2" /><rect x="-7" y="3" width="21" height="12" rx="2" /><path d="M 4 -9 H 19 M 13 -15 L 19 -9 L 13 -3" /></>}
      {id === "agency" && <><rect x="-19" y="-20" width="38" height="40" rx="5" /><path d="M -8 -10 H 8 M -8 0 H 8 M -8 10 H -2" /><circle cx="12" cy="10" r="2" fill={color} /></>}
      {id === "kakao" && <><path d="M -19 -13 H 19 V 11 H 4 L -5 21 V 11 H -19 Z" /><path d="M -10 -3 H 10 M -10 4 H 3" /></>}
      {id === "carrier" && <><path d="M -10 19 L 0 -12 L 10 19 M -6 7 H 6 M -12 19 H 12" /><circle cx="0" cy="-15" r="3" fill={color} /><path d="M -11 -21 Q -20 -15 -11 -9 M 11 -21 Q 20 -15 11 -9" /></>}
      {id === "phone" && <><rect x="-13" y="-23" width="26" height="46" rx="6" /><path d="M -8 -15 H 8 M -7 0 H 7 M -7 6 H 4" /><circle cx="0" cy="16" r="2" fill={color} /></>}
      {id === "monitor" && <><rect x="-20" y="-16" width="40" height="30" rx="4" /><path d="M -14 0 H -7 L -3 -7 L 3 7 L 7 0 H 15 M -8 20 H 8 M 0 14 V 20" /></>}
    </g>
  );
}

function MessageDeliveryScene({ spec, stepIndex, playing }: WorkflowTopologyCanvasProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const arrowId = "delivery-arrow-" + useId().replace(/:/g, "");
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const listener = () => setCompact(media.matches);
    listener();
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const layout = compact ? coordinates.compact : coordinates.wide;
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const current = new Set(step?.activeActorIds ?? []);
  const transitions = step?.transitions ?? [];
  const points = layout.positions;

  const pathFor = (from: string, to: string): string => {
    const a = points[from as NodeId];
    const b = points[to as NodeId];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const dist = Math.max(Math.hypot(dx, dy), 1);
    // End outside each illustrated card so arrowheads are not hidden by its fill.
    const ux = dx / dist;
    const uy = dy / dist;
    const clearance = Math.min(94 / Math.max(Math.abs(ux), 0.001), 57 / Math.max(Math.abs(uy), 0.001));
    const sx = a[0] + ux * clearance;
    const sy = a[1] + uy * clearance;
    const tx = b[0] - ux * clearance;
    const ty = b[1] - uy * clearance;
    return "M " + sx + " " + sy + " L " + tx + " " + ty;
  };

  const errorStep = !!step?.title.includes("단절") || !!step?.title.includes("실패");
  return (
    <div className="overflow-x-auto border-t border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 text-[10px] font-medium text-muted-foreground">
        <span>실선 화살표 · 현재 전송 경로 / 점선 · 기본 연결</span>
        <span>대행사 API 접수 ≠ 단말 전달</span>
      </div>
      <svg viewBox={"0 0 " + layout.width + " " + layout.height} className="block min-w-[440px] w-full" role="img" aria-label={step ? step.title + ": 활성 전송 경로" : "운영사와 대행사, 카카오, 통신사, 수신자의 전체 연결 구조"}>
        <defs>
          <marker id={arrowId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 8 4 L 0 8 Z" fill="context-stroke" />
          </marker>
        </defs>
        {baseLinks.map((link) => (
          <path key={link.from + "-" + link.to} d={pathFor(link.from, link.to)} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 7" opacity=".18" />
        ))}
        {transitions.map((hop, idx) => {
          const tone = errorStep && (hop.kind === "state" || hop.kind === "response") ? "#e11d48" : hop.kind === "response" ? "#059669" : hop.kind === "event" ? "#7c3aed" : "#2563eb";
          const path = pathFor(hop.from, hop.to);
          const end = points[hop.to as NodeId];
          const start = points[hop.from as NodeId];
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const d = Math.max(Math.hypot(dx, dy), 1);
          const ux = dx / d;
          const uy = dy / d;
          const clearance = Math.min(94 / Math.max(Math.abs(ux), 0.001), 57 / Math.max(Math.abs(uy), 0.001));
          const finalX = end[0] - ux * clearance;
          const finalY = end[1] - uy * clearance;
          return (
            <g key={String(stepIndex) + "-" + idx}>
              <path d={path} fill="none" stroke={tone} strokeWidth="4.5" strokeLinecap="round" strokeDasharray={hop.kind === "state" ? "9 6" : undefined} markerEnd={"url(#" + arrowId + ")"} />
              {playing && !reducedMotion ? (
                <circle r="9" fill={tone} stroke="white" strokeWidth="2">
                  <animateMotion dur="1.8s" begin={idx * 0.3 + "s"} path={path} repeatCount="indefinite" />
                </circle>
              ) : <circle cx={finalX} cy={finalY} r="6" fill={tone} stroke="white" strokeWidth="1.5" />}
            </g>
          );
        })}
        {order.map((id) => {
          const point = points[id];
          const active = current.has(id);
          const focus = !step || active;
          return (
            <g key={id} opacity={focus ? 1 : 0.48}>
              <rect x={point[0] - 86} y={point[1] - 49} width="172" height="98" rx="14" className="fill-card" stroke={focus ? nodes[id].accent : "currentColor"} strokeWidth={active ? 3.4 : 1.6} strokeOpacity={focus ? 0.9 : 0.23} />
              <rect x={point[0] - 78} y={point[1] - 40} width="53" height="78" rx="9" className="fill-muted" />
              <g className="text-muted-foreground"><Symbol id={id} x={point[0] - 51} y={point[1]} active={active} /></g>
              <text x={point[0] - 14} y={point[1] - 8} className="fill-foreground" fontSize="13.6" fontWeight="750">{nodes[id].title}</text>
              <text x={point[0] - 14} y={point[1] + 13} className="fill-muted-foreground" fontSize="10.5">{nodes[id].caption}</text>
              {active && <circle cx={point[0] + 72} cy={point[1] - 35} r="4.7" fill={nodes[id].accent} />}
            </g>
          );
        })}
      </svg>
      <div className="flex min-h-[48px] flex-wrap items-center gap-2 border-t border-border bg-card px-4 py-2">
        {transitions.length ? transitions.map((hop, idx) => (
          <span key={String(stepIndex) + "-legend-" + idx} className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted/45 px-2.5 py-1.5 text-[10px] font-semibold text-foreground">
            <span className="font-bold text-primary">{nodes[hop.from as NodeId].title}</span>
            <span aria-hidden="true">→</span>
            <span>{nodes[hop.to as NodeId].title}</span>
            <span className="ml-1 rounded bg-background px-1.5 py-0.5 text-muted-foreground">{hop.label}</span>
          </span>
        )) : (
          <span className="text-xs text-muted-foreground">고정된 8개 참여자와 연결 경로. SMS·알림톡은 대행사 뒤에서 서로 다른 채널로 분기합니다.</span>
        )}
      </div>
    </div>
  );
}

export default function MessageDeliveryViz() {
  const [mode, setMode] = useState<Mode>("sms");
  const options: { id: Mode; title: string; Icon: typeof MessageSquareText }[] = [
    { id: "sms", title: "SMS 발송", Icon: MessageSquareText },
    { id: "kakao", title: "알림톡 발송", Icon: CheckCircle2 },
    { id: "recovery", title: "장애 · 복구", Icon: AlertTriangle },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-2">
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="메시지 전송 시나리오">
          {options.map(({ id, title, Icon }) => (
            <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id}
              className={"inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors " + (mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon size={14} aria-hidden="true" />{title}
            </button>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><RotateCcw size={12} aria-hidden="true" />시나리오 전환 시 첫 장면부터 재생</span>
      </div>
      <WorkflowFocusedViz key={mode} spec={scenarios[mode]} TopologyCanvas={MessageDeliveryScene} />
    </div>
  );
}
