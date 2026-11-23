import { useState } from "react";
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, Check, Database,
  Link2, MessageCircle, Monitor, RadioTower, RefreshCcw, Route, ServerCog,
  Smartphone, Workflow, type LucideIcon,
} from "lucide-react";

type ComponentId =
  | "business" | "outbox" | "worker" | "gateway" | "router"
  | "alimtalk" | "sms" | "receiver" | "report" | "recovery";

type ComponentInfo = {
  label: string;
  subtitle: string;
  group: string;
  Icon: LucideIcon;
  tone: "blue" | "violet" | "amber" | "emerald" | "rose";
  role: string[];
  relation: string[];
  api: string[];
  caution: string[];
  example: string;
};

const components: Record<ComponentId, ComponentInfo> = {
  business: {
    label: "업무 서비스", subtitle: "주문 · 인증 · 배송 이벤트", group: "운영사",
    Icon: Monitor, tone: "blue",
    role: ["주문 완료·인증 요청 등 발송을 유발하는 업무 이벤트 생성", "수신자와 채널 정책 결정"],
    relation: ["Outbox에 같은 트랜잭션으로 발송 의도 저장", "사용자 화면과 알림 발송은 서로 별도 처리"],
    api: ["order.completed · otp.issued (개념 예시)", "eventId · recipient · channelPolicy"],
    caution: ["전송 성공을 주문 완료 트랜잭션의 조건으로 삼지 않기", "알림 목적·동의와 OTP 유효기간 확인"],
    example: "주문 ORD-401 확정 → 주문 정보와 발송 의도를 동시에 기록",
  },
  outbox: {
    label: "발송 원장 · Outbox", subtitle: "발송 예정 · 시도 이력", group: "운영사",
    Icon: Database, tone: "violet",
    role: ["업무 트랜잭션과 발송 의도를 함께 보관", "원본/대체 시도 및 최종 상태 관리"],
    relation: ["업무 서비스에서 기록 → 워커가 미처리 이벤트 소비", "결과 수집기의 상태 갱신 수신"],
    api: ["eventId · messageId · status · expiresAt", "providerMessageId · attemptId · reasonCode"],
    caution: ["eventId와 수신자·메시지 목적 기반 중복키 검증", "외부 요청 수락 후 DB 커밋 실패 시 중복 전송 위험"],
    example: "QUEUED → ACCEPTED → SENDING → DELIVERED / FAILED / UNKNOWN",
  },
  worker: {
    label: "발송 큐 · 워커", subtitle: "비동기 소비 · 전송 제어", group: "운영사",
    Icon: Workflow, tone: "blue",
    role: ["발송 예약·작업 대기·속도 제한 처리", "채널별 메시지 형식으로 변환 후 대행사 호출"],
    relation: ["Outbox 또는 메시지 큐 소비", "대행사 API에 TLS로 전송"],
    api: ["POST /messages (개념 요청)", "retryAt · attempts · idempotencyKey (지원 여부 확인)"],
    caution: ["429 및 일시적인 오류만 제한적으로 재시도", "요청 타임아웃은 UNKNOWN으로 분리"],
    example: "고객 1,000명 발송 시 큐에 쌓아 대행사 한도 내에서 전송",
  },
  gateway: {
    label: "대행사 발송 API", subtitle: "인증 · 검증 · 접수", group: "메시징 대행사",
    Icon: ServerCog, tone: "violet",
    role: ["계약 고객사의 REST API/SDK 요청 접수", "발신번호·요청 필드·잔액·쿼터 확인"],
    relation: ["운영사 워커에서 HTTPS 요청 수신", "채널 라우터로 유효한 발송 요청 전달"],
    api: ["대행사별 API Key/Secret 또는 지정된 인증 헤더", "요청 ID와 대행사 메시지 ID 반환"],
    caution: ["HTTP 200 또는 ACCEPTED는 고객 단말 전달 성공과 구분", "업체별 오류·조회 API 형식 다름"],
    example: "SOLAPI 메시지 API와 NHN Cloud 알림톡 API는 서로 다른 인증 및 요청 스키마",
  },
  router: {
    label: "채널 라우터", subtitle: "알림톡·SMS 연결 정책", group: "메시징 대행사",
    Icon: Route, tone: "violet",
    role: ["발송 유형에 따라 카카오 비즈메시지·문자 커넥터 선택", "템플릿·발신자·전송 정책에 맞게 데이터 변환"],
    relation: ["발송 API가 접수한 요청을 외부 채널 연결로 분기", "최종 실패 시 허용된 Fallback 정책과 연동"],
    api: ["type: SMS / LMS / MMS / ALIMTALK", "senderKey · templateCode · registeredFrom"],
    caution: ["대행사 내부의 실제 배치·망 구성과 동일한 도식이 아님", "채널 연결·기능은 계약 상품과 설정에 따라 다름"],
    example: "채널=ALIMTALK → 승인 템플릿 확인 → 카카오 연동, 채널=SMS → 통신망 연동",
  },
  alimtalk: {
    label: "알림톡 커넥터", subtitle: "카카오 비즈메시지 연동", group: "외부 발송 채널",
    Icon: MessageCircle, tone: "amber",
    role: ["승인된 정보성 템플릿을 카카오톡 채널로 전송", "고객의 카카오톡 대화방으로 전달 결과 수집"],
    relation: ["대행사 라우터 → 카카오 비즈메시지 경로", "실패 결과는 대행사 결과/복구 시스템으로 반환"],
    api: ["발신 프로필 · 템플릿 코드 · 치환값", "알림톡 결과 코드 · 메시지 ID"],
    caution: ["정보성 심사와 템플릿 승인을 먼저 충족", "친구 추가 불필요하더라도 채널·콘텐츠 정책 적용"],
    example: "ORDER_DONE 템플릿의 {주문번호}에 ORD-401을 치환",
  },
  sms: {
    label: "문자망 커넥터", subtitle: "문자 중계 · 이동통신망", group: "외부 발송 채널",
    Icon: RadioTower, tone: "emerald",
    role: ["SMS/LMS/MMS의 통신사 접속·중계 경로로 전달", "단말 전달 여부·실패 사유 보고"],
    relation: ["대행사 라우터와 문자 게이트웨이 연결", "알림톡 확정 실패 시 조건부 문자 대체 경로"],
    api: ["수신번호 · 사전 등록된 발신번호 · 본문", "통신망 및 중계사별 최종 결과 코드"],
    caution: ["실제 SMSC·중계망 구조 및 보관 정책은 사업자별 상이", "망 접수·단말 전달·읽음은 구별"],
    example: "알림톡 실패 → 사전 등록된 02-****-1234 번호에서 SMS/LMS 대체 발송",
  },
  receiver: {
    label: "수신자 단말", subtitle: "카카오톡 · 문자 앱", group: "외부 발송 채널",
    Icon: Smartphone, tone: "emerald",
    role: ["카카오톡 채팅방이나 기본 문자 앱에서 메시지 표시", "외부 채널의 단말 전달 결과와 사용자 열람을 구분"],
    relation: ["알림톡 또는 통신망을 통해 메시지 수신", "채널에서 전송 결과를 대행사에 보고"],
    api: ["카카오톡 앱 · 단말 문자 앱", "전달 성공 보고 (제공자가 정의한 수준)"],
    caution: ["DELIVERED가 사용자의 열람·읽음을 뜻하지 않음", "오프라인·번호 오류·차단·수신 불가로 지연/실패 가능"],
    example: "주문 완료 알림은 카카오톡 메시지 또는 SMS 중 한 채널로 수신",
  },
  report: {
    label: "결과 수집 · 대사", subtitle: "웹훅 · 상태 조회 · 집계", group: "메시징 대행사 / 운영사",
    Icon: Activity, tone: "blue",
    role: ["대행사의 전달 보고를 운영사 원장으로 반영", "콜백이 누락되면 결과 조회 API로 보정"],
    relation: ["카카오·문자망 결과 → 대행사 → 운영사 웹훅/상태 조회", "최종 결과를 Outbox 및 시도 테이블과 연결"],
    api: ["Webhook eventId · providerMessageId · resultCode", "status query · delivery report"],
    caution: ["서명/인증 검증, 동일 이벤트 중복 및 역순 처리 차단", "승인·접수·수신 성공의 지표를 분리"],
    example: "카카오: FAILED, 대체 SMS: DELIVERED → 전체 업무 알림 최종 성공",
  },
  recovery: {
    label: "장애 복구 · Fallback", subtitle: "재시도 · 조회 · 대체 문자", group: "운영사 / 대행사",
    Icon: RefreshCcw, tone: "rose",
    role: ["API 타임아웃과 알림톡 최종 실패를 구분", "지원되는 조회·멱등 처리 후 재시도 또는 SMS 대체 발송"],
    relation: ["대행사 결과와 운영사 발송 원장 참조", "확정 실패 시 문자 커넥터로 새 시도 연결"],
    api: ["UNKNOWN → QUERY → FAILED / DELIVERED", "retry queue · fallbackAttempt · DLQ"],
    caution: ["응답 유실만으로 즉시 재발송하지 않기", "대체 발송은 업체별 기본값과 사전 등록 번호·본문 확인"],
    example: "접수 응답 유실 → 결과 조회 → 알림톡 FAILED 확정 → SMS Fallback",
  },
};

const edges: { from: ComponentId; to: ComponentId; label: string }[] = [
  { from: "business", to: "outbox", label: "업무 이벤트 + 발송 의도" },
  { from: "outbox", to: "worker", label: "발송 작업 소비" },
  { from: "worker", to: "gateway", label: "HTTPS API / SDK" },
  { from: "gateway", to: "router", label: "요청 검증·채널 선택" },
  { from: "router", to: "report", label: "대행사 발송 상태 반영" },
  { from: "router", to: "alimtalk", label: "알림톡 메시지" },
  { from: "router", to: "sms", label: "SMS/LMS/MMS" },
  { from: "alimtalk", to: "receiver", label: "카카오톡 수신" },
  { from: "sms", to: "receiver", label: "문자 앱 수신" },
  { from: "alimtalk", to: "report", label: "채널 결과" },
  { from: "sms", to: "report", label: "통신사 결과" },
  { from: "report", to: "outbox", label: "웹훅·조회 대사" },
  { from: "report", to: "recovery", label: "실패·상태 미확인" },
  { from: "recovery", to: "sms", label: "확정 실패 시 Fallback" },
];

const featured: ComponentId[] = [
  "gateway", "router", "alimtalk", "sms", "outbox", "worker", "report", "recovery",
];

const accent: Record<ComponentInfo["tone"], string> = {
  blue: "#2563eb", violet: "#7c3aed", amber: "#d97706",
  emerald: "#059669", rose: "#e11d48",
};
const inspectorId = "messaging-architecture-inspector";

function VisualModel({ id }: { id: ComponentId }) {
  const color = accent[components[id].tone];
  return <svg viewBox="0 0 240 100" className="h-24 w-full max-w-[238px]" aria-hidden="true">
    {id === "business" && <>
      <rect x="23" y="10" width="194" height="76" rx="9" className="fill-card stroke-border" strokeWidth="2"/>
      <path d="M23 31 H217" className="stroke-border" strokeWidth="2"/>
      {[0, 1, 2].map(i => <circle key={i} cx={37 + i*13} cy={21} r="3" className="fill-muted-foreground" opacity=".5"/>)}
      <rect x="36" y="42" width="95" height="29" rx="5" className="fill-muted"/>
      <text x="44" y="60" fontSize="12" fontWeight="700" className="fill-foreground">ORD-401</text>
      <rect x="143" y="42" width="59" height="29" rx="6" fill={color} fillOpacity=".14" stroke={color}/>
      <text x="153" y="60" fontSize="11" fontWeight="800" fill={color}>완료</text>
    </>}
    {id === "outbox" && <>
      <path d="M28 33 V77 C28 96 123 96 123 77 V33" className="fill-muted stroke-border" strokeWidth="2"/>
      <ellipse cx="75" cy="33" rx="47" ry="16" className="fill-card stroke-border" strokeWidth="2"/>
      <path d="M28 54 C28 72 123 72 123 54" className="stroke-border" strokeWidth="2" fill="none"/>
      <text x="57" y="80" fontSize="15" fontWeight="800" className="fill-foreground">DB</text>
      {[0,1].map(i => <g key={i} transform={`translate(141 ${23+i*32})`}>
        <rect width="76" height="27" rx="5" className="fill-card" stroke={color} strokeWidth="1.8"/>
        <path d="M 9 10 H 66 M 9 18 H 49" className="stroke-muted-foreground" strokeWidth="2"/>
      </g>)}
    </>}
    {id === "worker" && <>
      <path d="M20 49 H221 V74 H20 Z" className="fill-muted stroke-border" strokeWidth="2"/>
      {[0,1,2,3,4].map(i=><circle key={i} cx={35+i*42} cy="80" r="7" className="fill-card stroke-border" strokeWidth="2"/>)}
      {[0,1,2].map(i=><g key={i} transform={`translate(${35+i*60} 23)`}>
        <rect width="48" height="29" rx="4" className="fill-card" stroke={color} strokeWidth="1.8"/>
        <path d="M2 3 L24 17 L46 3" fill="none" stroke={color} strokeWidth="1.6"/>
      </g>)}
      <path d="M 192 34 H 217 M 209 27 L 217 34 L 209 41" stroke={color} strokeWidth="3" fill="none"/>
    </>}
    {id === "gateway" && <>
      <rect x="34" y="12" width="170" height="77" rx="8" className="fill-card stroke-border" strokeWidth="2.5"/>
      <rect x="45" y="22" width="148" height="19" rx="4" className="fill-muted"/>
      <text x="55" y="36" fontSize="12" fontWeight="800" className="fill-foreground">POST /messages</text>
      {[0,1].map(i=><g key={i}><rect x="46" y={49+i*20} width="145" height="15" rx="3" className="fill-background stroke-border"/><circle cx="58" cy={56+i*20} r="3.5" fill={color}/><path d={`M 70 ${56+i*20} H 176`} className="stroke-border" strokeWidth="2"/></g>)}
    </>}
    {id === "router" && <>
      <path d="M 109 8 L 166 46 L 109 86 L 53 46 Z" className="fill-card" stroke={color} strokeWidth="3"/>
      <text x="84" y="50" fontSize="13" fontWeight="800" className="fill-foreground">ROUTE</text>
      <path d="M53 46 H18 M166 46 H218 M109 86 V97" fill="none" stroke={color} strokeWidth="2.5"/>
      <rect x="15" y="9" width="55" height="21" rx="5" className="fill-background stroke-border"/>
      <rect x="173" y="67" width="57" height="21" rx="5" className="fill-background stroke-border"/>
      <text x="23" y="23" fontSize="10" className="fill-foreground">ALIM</text>
      <text x="190" y="82" fontSize="10" className="fill-foreground">SMS</text>
    </>}
    {id === "alimtalk" && <>
      <path d="M27 10 H213 Q221 10 221 19 V74 Q221 82 213 82 H100 L78 95 L83 82 H27 Q19 82 19 74 V19 Q19 10 27 10 Z" className="fill-card" stroke={color} strokeWidth="2.5"/>
      <rect x="30" y="23" width="179" height="16" rx="5" fill={color} fillOpacity=".17"/>
      <text x="39" y="35" fontSize="12" fontWeight="800" className="fill-foreground">주문완료 알림톡</text>
      <text x="36" y="57" fontSize="11" className="fill-foreground">ORD-401 결제 완료</text>
      <text x="36" y="72" fontSize="10" className="fill-muted-foreground">승인 템플릿 · 치환값</text>
    </>}
    {id === "sms" && <>
      <rect x="18" y="16" width="91" height="67" rx="7" className="fill-card stroke-border" strokeWidth="2"/>
      <text x="30" y="37" fontSize="13" fontWeight="800" className="fill-foreground">SMSC</text>
      <path d="M30 51 H98 M30 62 H84" stroke={color} strokeWidth="2"/>
      <path d="M154 84 L178 26 L202 84 Z" fill="none" stroke={color} strokeWidth="2.5"/>
      <path d="M178 26 V84 M163 50 H193 M157 67 H199" stroke={color} strokeWidth="2"/>
      {[20,32].map(r=><path key={r} d={`M ${178-r} ${20-r*.4} Q178 ${1-r} ${178+r} ${20-r*.4}`} fill="none" stroke={color} strokeWidth="1.6"/>)}
    </>}
    {id === "receiver" && <>
      <rect x="76" y="5" width="86" height="89" rx="17" className="fill-card" stroke={color} strokeWidth="3"/>
      <rect x="84" y="17" width="70" height="60" rx="6" className="fill-muted stroke-border"/>
      <path d="M95 34 H145 V56 H121 L111 65 V56 H95 Z" fill={color} fillOpacity=".17" stroke={color} strokeWidth="1.5"/>
      <path d="M103 43 H137 M103 50 H130" className="stroke-muted-foreground" strokeWidth="2"/>
      <circle cx="118" cy="85" r="3.5" className="fill-muted-foreground"/>
    </>}
    {id === "report" && <>
      <rect x="20" y="11" width="200" height="74" rx="8" className="fill-card stroke-border" strokeWidth="2"/>
      <path d="M20 31 H220" className="stroke-border"/>
      <text x="32" y="26" fontSize="11" fontWeight="800" className="fill-foreground">DELIVERY REPORT</text>
      {["ACCEPTED", "SENDING", "DELIVERED"].map((label,i)=><g key={label}>
        <rect x="32" y={37+i*15} width={i===2?146:92+i*23} height="10" rx="4" fill={color} fillOpacity={.2+i*.14}/>
        <text x="183" y={45+i*15} fontSize="7.8" textAnchor="middle" className="fill-foreground">{label}</text>
      </g>)}
    </>}
    {id === "recovery" && <>
      <path d="M58 67 A55 40 0 1 1 178 34" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      <path d="M166 20 L187 34 L167 46" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <rect x="55" y="36" width="131" height="34" rx="8" className="fill-card stroke-border" strokeWidth="2"/>
      <text x="70" y="57" fontSize="13" fontWeight="800" className="fill-foreground">QUERY → SMS</text>
      <circle cx="58" cy="23" r="11" fill={color} fillOpacity=".12" stroke={color}/>
      <path d="M58 16 V24 M58 29 V30" stroke={color} strokeWidth="2.5"/>
    </>}
  </svg>;
}

function MapNode({ id, selected, related, onSelect }: {
  id: ComponentId; selected: ComponentId; related: boolean; onSelect: (id: ComponentId) => void;
}) {
  const c = components[id];
  return <button type="button" onClick={() => onSelect(id)}
    aria-pressed={id === selected} aria-controls={inspectorId} data-node={id}
    className={`group relative flex h-full min-w-0 flex-col items-center rounded-xl border bg-background p-2 text-center shadow-sm outline-offset-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary sm:p-3 ${id === selected ? "border-primary ring-2 ring-primary/25" : related ? "border-primary/60" : "border-border hover:border-primary/40"}`}>
    <span className="absolute left-2 top-2 text-[9px] font-bold text-muted-foreground">{c.group}</span>
    <VisualModel id={id}/>
    <span className="block text-[12px] font-bold text-foreground sm:text-sm">{c.label}</span>
    <span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground sm:text-[11px]">{c.subtitle}</span>
    {selected === id && <Check size={14} className="absolute right-2 top-2 text-primary" aria-hidden="true"/>}
  </button>;
}

function Connector({ from, to, label, selected, vertical = false, reverse = false }: {
  from: ComponentId; to: ComponentId; label: string; selected: ComponentId;
  vertical?: boolean; reverse?: boolean;
}) {
  const relevant = selected === from || selected === to;
  return <div role="img" aria-label={`${components[from].label} → ${components[to].label} · ${label}`}
    className={`flex shrink-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center ${relevant ? "text-primary" : "text-muted-foreground"}`}>
    {vertical ? <ArrowDown size={18} strokeWidth={relevant?2.7:1.6} aria-hidden="true"/> :
      reverse ? <ArrowLeft size={19} strokeWidth={relevant?2.7:1.6} aria-hidden="true"/> :
      <ArrowRight size={19} strokeWidth={relevant?2.7:1.6} aria-hidden="true"/>}
    <span className="max-w-[100px] break-keep text-[10px] leading-snug font-medium">{label}</span>
  </div>;
}

function BoundaryBridge({ title, sub, selected, endpoints }: {
  title: string; sub: string; selected: ComponentId; endpoints: readonly ComponentId[];
}) {
  const related = endpoints.includes(selected);
  return <div className={`my-2 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-[11px] ${related ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
    <span className="min-w-0 flex-1 text-right font-semibold">{title}</span>
    <ArrowDown size={17} className="shrink-0" aria-hidden="true"/>
    <span className="min-w-0 flex-1 break-keep">{sub}</span>
  </div>;
}

function InspectorGroup({ title, items }: { title: string; items: string[] }) {
  return <div className="min-w-0 rounded-lg border border-border bg-card p-3">
    <dt className="text-xs font-bold text-foreground">{title}</dt>
    <dd className="mt-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
      <ul className="space-y-1.5">
        {items.map(item=><li key={item} className="flex items-start gap-1.5 break-keep"><span aria-hidden="true">-</span><span>{item}</span></li>)}
      </ul>
    </dd>
  </div>;
}

export default function MessageDeliveryArchitectureViz() {
  const [selected, setSelected] = useState<ComponentId>("router");
  const detail = components[selected];
  const neighbors = new Set<ComponentId>();
  edges.forEach(edge => {
    if (edge.from === selected) neighbors.add(edge.to);
    if (edge.to === selected) neighbors.add(edge.from);
  });
  const related = (id: ComponentId) => neighbors.has(id);
  const node = (id: ComponentId) => <MapNode key={id} id={id} selected={selected} related={related(id)} onSelect={setSelected}/>;
  const inline = (from: ComponentId, to: ComponentId, label: string, reverse = false) =>
    <Connector from={from} to={to} label={label} selected={selected} reverse={reverse}/>;
  const selectedEdges = edges.filter(edge => edge.from === selected || edge.to === selected);

  return <div className="space-y-6" data-testid="messaging-architecture">
    <figure className="space-y-3" aria-labelledby="message-map-title">
      <figcaption className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Architecture map</p>
        <h2 id="message-map-title" className="text-lg font-bold text-foreground">문자·알림톡 발송 솔루션 구성도</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">운영사 → 발송 대행사 → 카카오·통신사·수신자. 도형을 클릭하면 연결 관계와 구현 조건을 확인할 수 있습니다.</p>
      </figcaption>
      <div className="rounded-2xl border border-border bg-card p-3 sm:p-4">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="mb-3 flex items-center gap-2"><span className="rounded bg-muted px-2 py-1 text-[10px] font-extrabold text-foreground">운영사 영역</span><span className="text-[10px] text-muted-foreground">업무 데이터 · 발송 의도 · 비동기 처리</span></div>
          <div className="hidden items-stretch gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_94px_minmax(0,1fr)_94px_minmax(0,1fr)]">
            {node("business")}{inline("business","outbox","원자적 기록")}
            {node("outbox")}{inline("outbox","worker","이벤트 소비")}
            {node("worker")}
          </div>
          <div className="grid gap-1 lg:hidden">
            {node("business")}<Connector from="business" to="outbox" label="업무 이벤트 + Outbox 동시 기록" selected={selected} vertical/>
            {node("outbox")}<Connector from="outbox" to="worker" label="발송 작업 소비" selected={selected} vertical/>
            {node("worker")}
          </div>
        </div>
        <BoundaryBridge title="운영사 → 대행사" sub="HTTPS API · SDK · 인증" selected={selected} endpoints={["worker","gateway"]}/>
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="mb-3 flex items-center gap-2"><span className="rounded bg-muted px-2 py-1 text-[10px] font-extrabold text-foreground">메시징 대행사 영역</span><span className="text-[10px] text-muted-foreground">공개 인터페이스 기반의 논리 구성</span></div>
          <div className="hidden items-stretch gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_94px_minmax(0,1fr)_94px_minmax(0,1fr)]">
            {node("gateway")}{inline("gateway","router","검증·접수")}
            {node("router")}{inline("router","report","결과 반영")}
            {node("report")}
          </div>
          <div className="grid gap-1 lg:hidden">
            {node("gateway")}<Connector from="gateway" to="router" label="인증·유효성 검증" selected={selected} vertical/>
            {node("router")}<Connector from="router" to="report" label="외부 채널 발송 상태 반영" selected={selected} vertical/>
            {node("report")}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-dashed border-border pt-3 lg:flex-row lg:items-center lg:justify-center">
            <span className="text-center text-[11px] font-semibold text-muted-foreground lg:w-64">FAILED / UNKNOWN 분리 · 조회 후 대체</span>
            <div className="w-full max-w-sm self-center lg:w-72">{node("recovery")}</div>
            <span className="text-center text-[11px] text-muted-foreground lg:w-64">확정 실패 · 사전 설정 → SMS Fallback</span>
          </div>
        </div>
        <BoundaryBridge title="대행사 → 외부 채널" sub="카카오 Bizmessage / 문자 중계 · 통신사" selected={selected} endpoints={["router","alimtalk","sms"]}/>
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="mb-3 flex items-center gap-2"><span className="rounded bg-muted px-2 py-1 text-[10px] font-extrabold text-foreground">외부 채널 · 사용자</span><span className="text-[10px] text-muted-foreground">실제 수신 경로는 채널별로 분리</span></div>
          <div className="hidden items-stretch gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_94px_minmax(0,1fr)_94px_minmax(0,1fr)]">
            {node("alimtalk")}{inline("alimtalk","receiver","카카오톡 도착")}
            {node("receiver")}{inline("sms","receiver","문자 앱 도착",true)}
            {node("sms")}
          </div>
          <div className="lg:hidden">
            <div className="grid grid-cols-2 gap-2">{node("alimtalk")}{node("sms")}</div>
            <Connector from="alimtalk" to="receiver" label="카카오톡 또는 문자 앱으로 전달" selected={selected} vertical/>
            {node("receiver")}
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            <RefreshCcw size={15} className="shrink-0" aria-hidden="true"/>
            <span className="break-keep">채널 결과 → 대행사 발송 상태 → 운영사 Webhook / 조회 대사 → 원장 갱신</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[10px] text-muted-foreground" aria-label="아키텍처 연결 범례">
          <span className="inline-flex items-center gap-1"><ArrowRight size={13}/>메시지 요청·채널 전달</span>
          <span className="inline-flex items-center gap-1"><RefreshCcw size={13}/>전달 결과·재조회·복구</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-3 rounded-sm border-2 border-primary"/>선택·연관 기능</span>
        </div>
      </div>
    </figure>

    <section className="space-y-3" aria-labelledby="messaging-explorer-title">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Architecture explorer</p>
        <h2 id="messaging-explorer-title" className="text-base font-bold">핵심 기능 탐색</h2>
        <p className="text-xs leading-relaxed text-muted-foreground">기능을 선택하면 상단 구성도의 관련 기능이 강조되고 상세 내용이 아래에서 변경됩니다.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {featured.map(id=>{
          const c=components[id];const Icon=c.Icon;const pressed=selected===id;
          return <button type="button" key={id} onClick={()=>setSelected(id)}
            aria-pressed={pressed} aria-controls={inspectorId}
            className={`relative flex min-w-0 items-start gap-2 rounded-xl border bg-background p-3 text-left outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary ${pressed?"border-primary ring-2 ring-primary/20":"border-border hover:border-primary/40"}`}>
            <span className="rounded-md bg-muted p-1.5 text-foreground"><Icon size={18} aria-hidden="true"/></span>
            <span className="min-w-0"><span className="block break-keep text-xs font-bold text-foreground">{c.label}</span><span className="mt-1 block break-keep text-[10px] leading-relaxed text-muted-foreground">{c.subtitle}</span></span>
            {pressed && <Check size={13} className="absolute right-1.5 top-1.5 text-primary" aria-hidden="true"/>}
          </button>;
        })}
      </div>
    </section>

    <section id={inspectorId} className="space-y-3 rounded-xl border border-border bg-background p-3 sm:p-5" aria-labelledby="message-inspector-title">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Component inspector</p>
        <h2 id="message-inspector-title" className="text-base font-bold">구성 요소 상세</h2>
      </div>
      <div aria-live="polite" aria-atomic="true" className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-border bg-muted p-2"><detail.Icon size={20} aria-hidden="true"/></span>
          <h3 className="text-sm font-bold text-foreground">{detail.label}</h3>
          <span className="text-xs text-muted-foreground">{detail.group} · {detail.subtitle}</span>
        </div>
        <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <InspectorGroup title="기능 · 역할" items={detail.role}/>
          <InspectorGroup title="연결 · 데이터 흐름" items={detail.relation}/>
          <InspectorGroup title="인터페이스 · 상태" items={detail.api}/>
          <InspectorGroup title="구현·운영 유의" items={detail.caution}/>
        </dl>
        <p className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">예시 · </span>{detail.example}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <Link2 size={13} aria-hidden="true"/><span className="font-semibold">직접 연결:</span>
          {selectedEdges.map(edge=><span className="rounded border border-border bg-card px-2 py-0.5" key={edge.from+"-"+edge.to}>{components[edge.from].label} → {components[edge.to].label} · {edge.label}</span>)}
        </div>
      </div>
    </section>
  </div>;
}
