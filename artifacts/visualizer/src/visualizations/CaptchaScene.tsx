import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Clock3,
  Database,
  FileCheck2,
  Globe2,
  Image as ImageIcon,
  KeyRound,
  LockKeyhole,
  PanelTop,
  Send,
  Server,
  ShieldCheck,
  SquareMousePointer,
  XCircle,
} from "lucide-react";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";

const panelClass = "min-w-0 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4";
const insetClass = "rounded-xl border border-border bg-background";

const phases = [
  { label: "원본 준비", icon: Database },
  { label: "문제 발급", icon: KeyRound },
  { label: "사용자 풀이", icon: SquareMousePointer },
  { label: "응답 제출", icon: Send },
  { label: "서버 검증", icon: ShieldCheck },
  { label: "최종 판정", icon: FileCheck2 },
] as const;

function Panel({ icon, title, caption, children, className = "" }: {
  icon: ReactNode;
  title: string;
  caption: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${panelClass} ${className}`}>
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-foreground" aria-hidden="true">{icon}</span>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-foreground">{title}</h4>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{caption}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Label({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "caution" | "info" }) {
  const tones = {
    neutral: "border-border bg-muted text-muted-foreground",
    good: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    caution: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    info: "border-blue-500/35 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
}

function Illustration({ kind, selected = false }: { kind: "crosswalk" | "street" | "bus"; selected?: boolean }) {
  const hasCrosswalk = kind === "crosswalk";
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-slate-100">
      <svg viewBox="0 0 120 90" className="block w-full" role="img" aria-label={hasCrosswalk ? "횡단보도가 그려진 그림" : kind === "bus" ? "버스가 그려진 그림" : "일반 도로가 그려진 그림"}>
        <rect width="120" height="90" fill="#dbeafe" />
        <rect x="6" y="15" width="27" height="39" rx="2" fill="#94a3b8" />
        <rect x="13" y="22" width="7" height="9" fill="#f8fafc" />
        <rect x="23" y="22" width="6" height="9" fill="#f8fafc" />
        <rect x="40" y="6" width="23" height="48" rx="2" fill="#64748b" />
        <rect x="47" y="14" width="8" height="9" fill="#e0f2fe" />
        <rect x="69" y="22" width="41" height="32" rx="2" fill="#a3a3a3" />
        <rect x="77" y="30" width="9" height="11" fill="#f8fafc" />
        <rect x="93" y="30" width="9" height="11" fill="#f8fafc" />
        <rect x="0" y="50" width="120" height="40" fill="#475569" />
        <path d="M0 54H120" stroke="#e2e8f0" strokeWidth="3" />
        {hasCrosswalk ? (
          <g fill="#f8fafc">
            <path d="M11 61H26L17 82H0Z" /><path d="M35 61H50L43 82H25Z" />
            <path d="M59 61H74L70 82H51Z" /><path d="M83 61H98L97 82H78Z" />
            <path d="M107 61H120V82H105Z" />
          </g>
        ) : (
          <path d="M5 72H115" stroke="#facc15" strokeWidth="3" strokeDasharray="13 10" />
        )}
        {kind === "bus" && (
          <g><rect x="42" y="46" width="64" height="25" rx="5" fill="#f59e0b" />
            <rect x="49" y="51" width="19" height="10" rx="2" fill="#e0f2fe" />
            <rect x="72" y="51" width="20" height="10" rx="2" fill="#e0f2fe" />
            <circle cx="56" cy="72" r="5" fill="#1e293b" /><circle cx="92" cy="72" r="5" fill="#1e293b" /></g>
        )}
      </svg>
      {selected && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-emerald-600 text-white shadow-sm" aria-label="선택됨"><Check size={14} strokeWidth={3} /></span>}
    </div>
  );
}

function ImageTiles({ selection = false }: { selection?: boolean }) {
  const pictures = [
    { id: "img-42", kind: "crosswalk" as const },
    { id: "img-57", kind: "street" as const },
    { id: "img-81", kind: "bus" as const },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {pictures.map((picture) => (
        <div key={picture.id} className="min-w-0">
          <Illustration kind={picture.kind} selected={selection && picture.kind === "crosswalk"} />
          <div className="mt-1 truncate text-center font-mono text-[9px] text-muted-foreground">{picture.id}</div>
        </div>
      ))}
    </div>
  );
}

function BrowserFrame({ children, title = "captcha.example / challenge" }: { children: ReactNode; title?: string }) {
  return (
    <div className={`${insetClass} overflow-hidden`}>
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-rose-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-2 min-w-0 truncate rounded bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{title}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function DiagramArrow({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-1 py-2 text-blue-700 dark:text-blue-300" aria-label={label}>
      <ArrowDown className="h-6 w-6 sm:hidden" strokeWidth={2.4} aria-hidden="true" />
      <ArrowRight className="hidden h-6 w-6 sm:block" strokeWidth={2.4} aria-hidden="true" />
      <span className="max-w-28 text-center text-[10px] font-semibold leading-snug">{label}</span>
    </div>
  );
}

function PhaseRail({ active }: { active: number | null }) {
  return (
    <nav aria-label="CAPTCHA 처리 단계" className="grid grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">
      {phases.map(({ label, icon: Icon }, index) => {
        const current = active === index;
        const past = active !== null && index < active;
        return (
          <div key={label} aria-current={current ? "step" : undefined} className={`flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-2 sm:justify-center ${current ? "border-blue-500 bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/50 dark:text-blue-300" : past ? "border-emerald-500/30 bg-card text-foreground" : "border-border bg-card text-muted-foreground"}`}>
            {past ? <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /> : <Icon size={14} className="shrink-0" aria-hidden="true" />}
            <span className="truncate text-[10px] font-semibold">{index + 1}. {label}</span>
          </div>
        );
      })}
    </nav>
  );
}

function OverviewScene() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel icon={<ImageIcon size={19} />} title="문제 재료" caption="사용 권한이 있는 이미지·라벨 또는 서버가 만든 수식">
        <ImageTiles />
        <div className="mt-3 flex flex-wrap gap-1.5"><Label>사진 + 서버 전용 정답 라벨</Label><Label>7 + 5 = ?</Label></div>
      </Panel>
      <Panel icon={<ShieldCheck size={19} />} title="사용자와 검증 서버" caption="브라우저는 문제를 보여주고 서버가 최종 판정">
        <BrowserFrame title="서비스의 CAPTCHA 화면">
          <div className="text-xs font-semibold text-foreground">횡단보도를 선택하세요</div>
          <div className="mt-2 grid grid-cols-3 gap-1.5"><Illustration kind="crosswalk" /><Illustration kind="street" /><Illustration kind="bus" /></div>
          <div className="mt-3 flex items-center justify-between gap-2"><Label tone="info">사용자 응답</Label><span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><LockKeyhole size={13} />서버에서 검증</span></div>
        </BrowserFrame>
      </Panel>
      <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2">화면의 이미지는 설명용으로 직접 그린 예시입니다. 실제 이미지는 권한이 확보된 데이터셋 또는 공식 CAPTCHA 제공업체에서 가져옵니다. 수학 문제는 서버에서 생성합니다.</p>
    </div>
  );
}

function SourceScene() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel icon={<Database size={19} />} title="A · 이미지 문제의 재료" caption="사진 보관소 → 문제 서버가 후보와 비공개 라벨 조회">
        <ImageTiles />
        <div className={`mt-3 ${insetClass} p-3`}>
          <div className="mb-1 font-mono text-[10px] text-muted-foreground">SERVER DATASET</div>
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-semibold text-foreground"><span>img-42</span><Label tone="good">라벨: 횡단보도</Label></div>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">직접 보유·라이선스 확보·공식 공급처 데이터만 사용합니다.</p>
      </Panel>
      <Panel icon={<Calculator size={19} />} title="B · 수학 문제의 재료" caption="외부 사진 없이 서버가 난수와 연산자를 생성">
        <div className={`${insetClass} flex min-h-32 flex-col items-center justify-center gap-2 px-3 py-4`}>
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground">QUESTION GENERATOR</span>
          <span className="font-mono text-3xl font-bold tracking-tight text-foreground">7 + 5 = ?</span>
          <Label tone="good"><LockKeyhole size={12} />정답 12는 서버에서 보관</Label>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">정답·문제 ID·만료 상태를 서버에 연결합니다.</p>
      </Panel>
      <p className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2">A와 B는 서로 다른 문제 생성 방식입니다. 실서비스에서는 필요한 CAPTCHA 유형을 선택해 사용합니다.</p>
    </div>
  );
}

function IssueScene() {
  return (
    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center">
      <Panel className="flex-1" icon={<Server size={19} />} title="문제 서버 · 발급 기록" caption="정답을 클라이언트에 넘기지 않도록 보관">
        <div className={`${insetClass} space-y-2 p-3 font-mono text-[11px]`}>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">challengeId</span><b className="text-foreground">challenge-123</b></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">expiresIn</span><b className="text-foreground">120초</b></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">used</span><b className="text-foreground">false</b></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">answer</span><Label tone="caution"><LockKeyhole size={11} />서버 전용</Label></div>
        </div>
      </Panel>
      <DiagramArrow label="문제 ID + 이미지 참조" />
      <Panel className="flex-1" icon={<PanelTop size={19} />} title="브라우저 · 공개 문제" caption="이미지 URL과 질문만 받아 화면에 표시">
        <BrowserFrame>
          <div className="mb-2 text-[11px] font-bold text-foreground">횡단보도가 있는 사진을 고르세요</div>
          <ImageTiles />
          <div className="mt-3 break-all font-mono text-[10px] text-muted-foreground">GET /captcha/assets/img-42</div><div className="mt-2 flex flex-wrap gap-1"><Label tone="info">ID: challenge-123</Label><Label><Clock3 size={11} />120초</Label></div>
        </BrowserFrame>
      </Panel>
    </div>
  );
}

function SolveScene() {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Panel icon={<SquareMousePointer size={19} />} title="이미지 선택형 · 사용자 입력" caption="정답 라벨은 보이지 않고 이미지와 선택 상태만 표시">
        <BrowserFrame>
          <div className="mb-2 text-xs font-bold text-foreground">횡단보도가 있는 이미지를 선택하세요</div>
          <ImageTiles selection />
          <div className="mt-3 flex items-center justify-between gap-2"><Label tone="good"><Check size={12} />1개 선택</Label><span className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white">확인</span></div>
        </BrowserFrame>
      </Panel>
      <Panel icon={<Calculator size={19} />} title="수학 입력형 · 대안" caption="사용자는 결과만 입력하고 서버가 채점">
        <BrowserFrame title="captcha.example / math">
          <p className="mb-3 text-[11px] font-semibold text-foreground">다음 계산의 결과는?</p>
          <div className="flex items-center gap-2"><span className="shrink-0 font-mono text-xl font-bold text-foreground">7 + 5 =</span><div className="min-w-0 flex-1 rounded-md border-2 border-blue-500 bg-card p-2 font-mono text-lg font-bold text-foreground">12</div></div>
          <div className="mt-3 text-right"><span className="inline-block rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-bold text-white">확인</span></div>
        </BrowserFrame>
        <p className="mt-2 text-[11px] text-muted-foreground">표시는 절차를 설명하는 예시이며 실제 입력 폼은 아닙니다.</p>
      </Panel>
    </div>
  );
}

function SubmitScene() {
  return (
    <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center">
      <Panel className="flex-1" icon={<PanelTop size={19} />} title="브라우저 · 응답 작성" caption="사람이 고른 이미지 ID 또는 입력한 값">
        <div className={`${insetClass} p-3`}>
          <div className="mb-2 text-[10px] font-bold tracking-wider text-muted-foreground">SUBMISSION</div>
          <div className="space-y-1.5 font-mono text-[11px] text-foreground"><div>challengeId: <b>challenge-123</b></div><div>selectedIds: <b>["img-42"]</b></div></div>
          <div className="mt-3 flex gap-1.5"><Label tone="info">이미지형</Label><Label>수학형: answer "12"</Label></div>
        </div>
      </Panel>
      <DiagramArrow label="POST /api/captcha/verify" />
      <Panel className="flex-1" icon={<Server size={19} />} title="앱 서버 · 요청 수신" caption="브라우저 주장만으로 접근을 허용하지 않음">
        <div className={`${insetClass} space-y-2 p-3`}>
          <div className="flex flex-wrap items-center justify-between gap-1"><Label tone="info">POST</Label><span className="font-mono text-[10px] text-muted-foreground">/api/captcha/verify</span></div>
          <div className="rounded-lg border border-border bg-muted p-2 font-mono text-[11px] text-foreground">{'{ challengeId, selectedIds }'}</div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground"><LockKeyhole size={15} className="text-amber-600 dark:text-amber-400" />아직 검증되지 않은 응답</div>
        </div>
      </Panel>
    </div>
  );
}

function VerifyScene() {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><Server size={15} />앱 서버가 검증 경로 선택</div>
        <Label tone="caution">A 또는 B · 대체 경로</Label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Panel icon={<Database size={19} />} title="A · 자체 구현" caption="서버가 저장된 정답과 상태를 직접 비교">
          <div className={`${insetClass} space-y-2 p-3`}>
            <div className="flex items-center justify-between gap-1 text-xs"><span className="text-muted-foreground">제출된 선택</span><b className="font-mono text-foreground">img-42</b></div>
            <div className="flex items-center justify-between gap-1 text-xs"><span className="text-muted-foreground">서버 저장 정답</span><b className="font-mono text-foreground">img-42</b></div>
            <div className="border-t border-dashed border-border pt-2"><Label tone="good"><CheckCircle2 size={12} />정답 일치 · 만료·재사용 확인</Label></div>
          </div>
        </Panel>
        <Panel icon={<Globe2 size={19} />} title="B · 공식 제공업체" caption="앱 서버가 토큰을 제공업체 검증 API에 전송">
          <div className={`${insetClass} space-y-2 p-3`}>
            <div className="flex items-center justify-between gap-1"><span className="font-mono text-[11px] text-foreground">POST siteverify</span><Label tone="info">서버 간 호출</Label></div>
            <div className="flex items-center justify-between gap-1 text-xs"><span className="text-muted-foreground">응답 토큰</span><span className="font-mono font-semibold text-foreground">token-…</span></div>
            <div className="border-t border-dashed border-border pt-2"><Label tone="good"><CheckCircle2 size={12} />API 검증 결과 확인</Label></div>
          </div>
        </Panel>
      </div>
      <div className="mt-3 rounded-xl border border-border bg-muted px-3 py-2 text-center text-[11px] font-medium leading-relaxed text-foreground">어느 방식이든 최종 허용 여부는 앱 서버에서 결정하며, 토큰·정답의 유효성은 브라우저만 믿고 판단하지 않습니다.</div>
    </div>
  );
}

function DecisionScene() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Panel icon={<CheckCircle2 size={19} className="text-emerald-600 dark:text-emerald-400" />} title="검증 성공" caption="보호 작업 허용 + 챌린지 일회성 소진">
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 text-center">
          <CheckCircle2 size={36} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <div className="text-base font-bold text-foreground">요청 허용</div>
          <div className="flex flex-wrap justify-center gap-1.5"><Label tone="good">verified: true</Label><Label><LockKeyhole size={11} />used: true</Label></div>
        </div>
      </Panel>
      <Panel icon={<XCircle size={19} className="text-rose-600 dark:text-rose-400" />} title="검증 실패 · 만료 · 재사용" caption="보호 작업 거부 또는 제한된 재시도">
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-rose-500/40 bg-rose-500/5 p-4 text-center">
          <XCircle size={36} className="text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <div className="text-base font-bold text-foreground">요청 거부</div>
          <div className="flex flex-wrap justify-center gap-1.5"><Label tone="caution">verified: false</Label><Label>새 문제 또는 재시도</Label></div>
        </div>
      </Panel>
      <div className="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2">일회성 사용·만료 상태는 서버에서 관리합니다. 위 성공·실패는 가능한 두 결과를 동시에 비교한 설명용 장면입니다.</div>
    </div>
  );
}

const scenes = [SourceScene, IssueScene, SolveScene, SubmitScene, VerifyScene, DecisionScene] as const;

/** CAPTCHA 전용 스토리보드. 상단 단계 레일은 유지하고 중앙 도식만 교체합니다. */
export default function CaptchaScene({ spec, stepIndex, playing }: WorkflowTopologyCanvasProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const Scene = stepIndex === null ? OverviewScene : scenes[stepIndex];
  return (
    <div className="space-y-3 bg-background p-3 sm:p-4" role="group" aria-label={stepIndex === null ? "CAPTCHA 전체 시각화" : `${spec.steps[stepIndex].title} 시각화`}>
      <PhaseRail active={stepIndex} />
      <motion.div
        key={stepIndex ?? "overview"}
        initial={reducedMotion || !playing ? false : { opacity: 0.65, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion || !playing ? 0 : 0.3 }}
      >
        <Scene />
      </motion.div>
    </div>
  );
}