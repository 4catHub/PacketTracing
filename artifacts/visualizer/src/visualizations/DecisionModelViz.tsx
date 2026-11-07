import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Check,
  ClipboardList,
  FileText,
  GitBranch,
  Inbox,
  ListChecks,
  Pause,
  Play,
  ScanLine,
  TextCursorInput,
  type LucideIcon,
} from "lucide-react";

const phases = ["요청", "모델 처리", "응답", "앱 동작"];
const queues = ["결제", "기술", "기타"] as const;
const threshold = 80;

const clearTicket = {
  ticket: "같은 주문이 두 번 결제됐어요.",
  draft: "중복 결제가 의심되는 내역을 확인하겠습니다. 주문 번호를 알려 주세요.",
  probabilities: [92, 5, 3],
  canAssign: true,
};

const scenarios = [
  { ...clearTicket, label: "명확한 문의" },
  {
    label: "모호한 문의",
    ticket: "결제 화면이 멈췄는데 카드 알림이 왔어요.",
    draft:
      "결제 화면과 카드 알림을 함께 확인하겠습니다. 주문 상태와 알림 시각을 알려 주세요.",
    probabilities: [52, 43, 5],
    canAssign: true,
  },
  { ...clearTicket, label: "배정 권한 없음", canAssign: false },
];

const generationStages = [
  { label: "작성 지시", Icon: FileText },
  { label: "토큰 생성", Icon: TextCursorInput },
  { label: "답변 초안", Icon: FileText },
  { label: "상담원 확인", Icon: ClipboardList },
];
const decisionStages = [
  { label: "질문과 후보", Icon: ListChecks },
  { label: "후보 평가", Icon: ScanLine },
  { label: "확률 분포", Icon: ChartNoAxesColumnIncreasing },
  { label: "정책 분기", Icon: GitBranch },
];

type Stage = { label: string; Icon: LucideIcon };

function Panel({
  name,
  title,
  stages,
  phase,
  frames,
  reducedMotion,
}: {
  name: string;
  title: string;
  stages: Stage[];
  phase: number;
  frames: ReactNode[];
  reducedMotion: boolean | null;
}) {
  return (
    <section
      aria-label={title}
      className="min-w-0 rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950 sm:p-4"
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground">
          {name}
        </span>
        <h3 className="text-sm font-bold sm:text-base">{title}</h3>
      </div>
      <ol aria-label="처리 순서" className="grid grid-cols-4 gap-1.5 sm:gap-3">
        {stages.map(({ label, Icon }, index) => (
          <li
            key={label}
            aria-current={index === phase ? "step" : undefined}
            className="relative flex min-w-0 flex-col items-center gap-1.5 text-center"
          >
            <span
              className={`relative grid size-8 place-items-center rounded-md border sm:size-10 ${
                index === phase
                  ? "border-sky-500 text-sky-700 ring-2 ring-sky-500/20 dark:text-sky-300"
                  : "border-neutral-300 text-muted-foreground dark:border-neutral-700"
              }`}
            >
              <Icon aria-hidden="true" className="size-[18px] sm:size-5" />
            </span>
            <span
              className={`break-keep text-[11px] leading-4 sm:text-xs ${index === phase ? "font-bold" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            {index < stages.length - 1 && (
              <ArrowRight
                aria-hidden="true"
                className="absolute -right-2.5 top-2.5 size-3.5 text-muted-foreground sm:-right-3.5 sm:top-3"
              />
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 grid min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-900 sm:p-3">
        {frames.map((frame, index) => (
          <div
            key={stages[index].label}
            aria-hidden={index !== phase}
            className={`col-start-1 row-start-1 min-w-0 self-center ${index === phase ? "" : "invisible"}`}
          >
            <motion.div
              key={index === phase ? "active" : "inactive"}
              initial={
                index === phase && !reducedMotion ? { opacity: 0, y: 4 } : false
              }
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.22 }}
            >
              {frame}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Artifact({
  Icon,
  title,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-6 shrink-0 text-muted-foreground"
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold">{title}</p>
        <div className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function PolicyGate({
  canAssign,
  queue,
  probability,
}: {
  canAssign: boolean;
  queue: (typeof queues)[number];
  probability: number;
}) {
  const canRoute = queue !== "기타" && probability >= threshold && canAssign;
  const branches = [
    {
      condition: "통과",
      label: `${queue} 큐로 배정`,
      Icon: Check,
      active: canRoute,
    },
    { condition: "보류", label: "수동 검토함", Icon: Inbox, active: !canRoute },
  ];

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="relative grid size-8 shrink-0 place-items-center before:absolute before:inset-1 before:rotate-45 before:rounded-[3px] before:border before:border-sky-600 before:content-['']">
          <GitBranch
            aria-hidden="true"
            className="relative size-4 text-sky-700 dark:text-sky-300"
          />
        </span>
        <div>
          <p className="text-xs font-bold">앱 서버 · 자동 배정 가능?</p>
          <p className="mt-0.5 break-keep text-xs leading-4 text-muted-foreground">
            후보 {queue} · {probability}% / 기준 {threshold}% · 권한{" "}
            {canAssign ? "있음" : "없음"}
          </p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {branches.map(({ condition, label, Icon, active }) => (
          <div
            key={condition}
            className={`rounded-md border p-1.5 sm:p-2 ${active ? "border-sky-600" : "border-dashed border-neutral-300 dark:border-neutral-700"}`}
          >
            <p className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground sm:text-xs">
              <ArrowDown aria-hidden="true" className="size-3" />
              {condition}
              {active && " · 실행"}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-bold sm:text-xs">
              <Icon aria-hidden="true" className="size-3.5 shrink-0" />
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DecisionModelViz() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reducedMotion = useReducedMotion();
  const scenario = scenarios[scenarioIndex];
  const probability = Math.max(...scenario.probabilities);
  const queue = queues[scenario.probabilities.indexOf(probability)];

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(
      () => setPhase((value) => (value + 1) % phases.length),
      4200,
    );
    return () => window.clearTimeout(timer);
  }, [phase, playing, scenarioIndex]);

  return (
    <div className="not-prose space-y-4 rounded-2xl bg-neutral-50 p-2.5 dark:bg-neutral-900 sm:p-5">
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground">
            MODEL WORKFLOW
          </p>
          <h2 className="mt-1 text-base font-bold leading-snug sm:text-xl">
            같은 문의, 다른 모델 작업
          </h2>
        </div>
        <button
          type="button"
          aria-label={playing ? "일시정지" : "재생"}
          onClick={() => setPlaying(!playing)}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950"
        >
          {playing ? (
            <Pause aria-hidden="true" className="size-4" />
          ) : (
            <Play aria-hidden="true" className="size-4" />
          )}
        </button>
      </header>

      <div
        role="group"
        aria-label="문의 시나리오"
        className="flex flex-wrap gap-1.5"
      >
        {scenarios.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={index === scenarioIndex}
            onClick={() => {
              setScenarioIndex(index);
              setPhase(0);
              setPlaying(true);
            }}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-xs font-semibold aria-pressed:border-neutral-950 aria-pressed:bg-neutral-950 aria-pressed:text-white dark:border-neutral-700 dark:bg-neutral-950 dark:aria-pressed:border-white dark:aria-pressed:bg-white dark:aria-pressed:text-neutral-950 sm:px-3"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-2.5 dark:border-neutral-700 dark:bg-neutral-950 sm:p-3">
        <Artifact Icon={FileText} title="공통 입력 · 고객 문의">
          <span className="font-medium text-foreground">
            “{scenario.ticket}”
          </span>
        </Artifact>
      </div>

      <div
        role="group"
        aria-label="공통 진행 단계"
        className="grid grid-cols-4 gap-1.5"
      >
        {phases.map((label, index) => (
          <button
            key={label}
            type="button"
            aria-current={index === phase ? "step" : undefined}
            onClick={() => {
              setPhase(index);
              setPlaying(false);
            }}
            className={`min-w-0 rounded-md border bg-white px-1 py-2 text-center text-[11px] font-semibold leading-4 dark:bg-neutral-950 sm:px-2 sm:text-xs ${
              index === phase
                ? "border-sky-600 text-sky-700 dark:text-sky-300"
                : "border-neutral-200 text-muted-foreground dark:border-neutral-700"
            }`}
          >
            <span className="block font-mono tabular-nums sm:inline sm:pr-1.5">
              0{index + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      <Panel
        name="A / GENERATE"
        title="생성형 LLM · 고객 답변 작성"
        stages={generationStages}
        phase={phase}
        reducedMotion={reducedMotion}
        frames={[
          <Artifact Icon={FileText} title="프롬프트">
            문의 내용을 바탕으로 고객에게 보낼 답변을 작성해 줘.
          </Artifact>,
          <Artifact
            Icon={TextCursorInput}
            title="다음 토큰을 골라 문장으로 이어 붙임"
          >
            <span className="font-mono text-foreground">
              {scenario.draft.split(" ").slice(0, 3).join(" ")} …
            </span>
            <span className="ml-2 text-[11px]">문장 생성 예시</span>
          </Artifact>,
          <Artifact Icon={FileText} title="모델 응답 · 자연어 초안">
            “{scenario.draft}”
          </Artifact>,
          <Artifact Icon={ClipboardList} title="상담 화면 · 초안 표시">
            상담원이 사실관계와 문구를 확인하고 발송 여부를 결정합니다.
          </Artifact>,
        ]}
      />

      <Panel
        name="B / DECIDE"
        title="의사결정 API · 담당 큐 선택"
        stages={decisionStages}
        phase={phase}
        reducedMotion={reducedMotion}
        frames={[
          <Artifact
            Icon={ListChecks}
            title="choice · 어느 큐가 이 문의를 담당하나?"
          >
            <ul aria-label="허용 후보" className="mt-1 flex flex-wrap gap-1.5">
              {queues.map((label) => (
                <li
                  key={label}
                  className="rounded-full border border-neutral-300 px-2 text-foreground dark:border-neutral-700"
                >
                  {label}
                </li>
              ))}
            </ul>
          </Artifact>,
          <Artifact Icon={ScanLine} title="정해진 후보별 적합도 평가">
            결제·기술·기타의 의미를 문의 내용과 대조해 평가합니다.
          </Artifact>,
          <Artifact
            Icon={ChartNoAxesColumnIncreasing}
            title={`모델 응답 · 최상위 후보 ${queue}`}
          >
            <ul aria-label="후보별 예시 확률" className="space-y-1">
              {queues.map((label, index) => (
                <li
                  key={label}
                  className="grid grid-cols-[2rem_1fr_2.75rem] items-center gap-2"
                >
                  <span>{label}</span>
                  <span
                    aria-hidden="true"
                    className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
                  >
                    <span
                      className={`block h-full rounded-full ${label === queue ? "bg-sky-600 dark:bg-sky-400" : "bg-neutral-500"}`}
                      style={{ width: `${scenario.probabilities[index]}%` }}
                    />
                  </span>
                  <span className="text-right font-mono tabular-nums text-foreground">
                    {scenario.probabilities[index]}%
                  </span>
                </li>
              ))}
            </ul>
          </Artifact>,
          <PolicyGate
            canAssign={scenario.canAssign}
            queue={queue}
            probability={probability}
          />,
        ]}
      />
      <p className="px-0.5 text-xs leading-5 text-muted-foreground">
        학습용 예시입니다. 확률과 배정 기준은 고정값이며, 두 흐름의 재생 속도는
        실제 API 지연과 관계가 없습니다.
      </p>
    </div>
  );
}
