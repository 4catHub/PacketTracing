import { useState, type ReactNode } from "react";
import {
  AppWindow, Archive, Cable, FileCheck2, FileLock2, FileSearch, Globe2,
  HardDrive, Monitor, Network, ShieldCheck, Unplug,
} from "lucide-react";
import AttackStageIllustration, {
  StageFileStack, stageIconClass as icon, type StageIllustration,
} from "./AttackStageIllustration";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type {
  WorkflowVisualizationSpec, WorkflowVisualizationStep, WorkflowWaterfallSpan,
} from "./workflow-visualization";

type Stage = WorkflowVisualizationStep & {
  short: string;
  illustration: StageIllustration;
};

type Scene = WorkflowVisualizationSpec & {
  illustration: StageIllustration;
  steps: Stage[];
};

function object(
  mark: ReactNode,
  label: string,
  detail: string,
  tone: StageIllustration["objects"][number]["tone"],
  next?: StageIllustration["objects"][number]["next"],
): StageIllustration["objects"][number] {
  return { mark, label, detail, tone, next };
}

function span(
  actorId: string,
  label: string,
  start: number,
  end: number,
  tone: WorkflowWaterfallSpan["tone"],
  kind: WorkflowWaterfallSpan["kind"] = "work",
): WorkflowWaterfallSpan {
  return { actorId, label, start, end, tone, kind };
}

const playback = {
  motionTone: "restrained",
  subjectRisk: "critical",
  overviewMs: 3500,
  autoplayMs: 6000,
  waterfallLabel: "현재 단계의 실행 순서 · 상대적 구간",
} satisfies Partial<WorkflowVisualizationSpec>;

const attack: Scene = {
  ...playback,
  title: "2017년 WannaCry · 네트워크 확산과 파일 암호화",
  overviewSummary: "이미 감염된 PC에서 이야기가 시작됩니다. 같은 네트워크의 취약한 PC로 감염이 옮겨가고, 각 PC에서는 파일 암호화가 진행됩니다.",
  actors: [
    { id: "source", label: "감염 PC A", detail: "웜이 실행 중", accent: "rose", x: 17, y: 24, compactX: 14, compactY: 13 },
    { id: "target", label: "미패치 PC B", detail: "Windows · SMBv1", accent: "amber", x: 54, y: 24, compactX: 86, compactY: 13 },
    { id: "peer", label: "다른 PC C", detail: "후속 감염 대상", accent: "amber", x: 86, y: 24, compactX: 14, compactY: 39 },
    { id: "files", label: "로컬 파일", detail: "PC B의 데이터", accent: "violet", x: 54, y: 74, compactX: 86, compactY: 51 },
    { id: "note", label: "사용자 화면", detail: "몸값 요구 표시", accent: "rose", x: 86, y: 74, compactX: 50, compactY: 89 },
    { id: "switch", label: "킬 스위치", detail: "도메인 응답", accent: "emerald", x: 17, y: 74, compactX: 14, compactY: 77 },
  ],
  topologyLinks: [
    { from: "source", to: "target" },
    { from: "target", to: "peer" },
    { from: "target", to: "files" },
    { from: "target", to: "note" },
    { from: "switch", to: "target" },
  ],
  illustration: { objects: [
    object(<Monitor className={icon} />, "감염 PC", "SMBv1로 확산", "danger", "arrow"),
    object(<Network className={icon} />, "미패치 PC", "웜이 실행되면 재확산", "warning", "arrow"),
    object(<FileLock2 className={icon} />, "로컬 파일", "암호화로 사용 불가", "danger"),
  ] },
  steps: [
    {
      short: "자동 확산",
      title: "감염 PC에서 미패치 Windows로 확산",
      summary: "감염 PC A에서 시작된 SMBv1 통신으로 접근 가능한 PC B에도 감염이 옮겨갑니다. 이 장면은 이미 감염된 기기에서 시작되는 확산을 보여줍니다.",
      activeActorIds: ["source", "target"],
      transitions: [{ from: "source", to: "target", label: "SMBv1로 감염 확산", kind: "event", labelSide: "left" }],
      spans: [
        span("source", "SMBv1 통신", 0.08, 0.65, "danger", "network"),
        span("target", "미패치 PC 감염", 0.55, 0.95, "danger"),
      ],
      illustration: { objects: [
        object(<Monitor className={icon} />, "PC A", "이미 감염", "danger", "arrow"),
        object(<Cable className={icon} />, "네트워크", "SMBv1 통신", "warning", "arrow"),
        object(<Monitor className={icon} />, "PC B", "미패치 상태에서 감염", "danger"),
      ] },
    },
    {
      short: "파일 암호화",
      title: "새 감염 기기가 파일을 암호화",
      summary: "PC B는 로컬 파일을 암호화하면서 웜 기능으로 다른 기기에도 감염을 퍼뜨릴 수 있습니다. 두 작업의 실행 구간이 겹칩니다.",
      activeActorIds: ["target", "peer", "files"],
      transitions: [
        { from: "target", to: "files", label: "파일 암호화", kind: "state", labelSide: "right" },
        { from: "target", to: "peer", label: "다른 PC로 전파 시도", kind: "event", labelSide: "right" },
      ],
      spans: [
        span("target", "PC C로 확산 시도", 0.07, 0.9, "warning", "network"),
        span("files", "파일 암호화", 0.24, 0.97, "danger"),
      ],
      illustration: { objects: [
        object(<StageFileStack count={3} />, "정상 파일", "문서와 업무 자료", "blue", "arrow"),
        object(<FileLock2 className={icon} />, "암호화 파일", "열거나 사용할 수 없음", "danger"),
      ] },
    },
    {
      short: "몸값 요구",
      title: "감염 PC 화면에 몸값 요구 표시",
      summary: "업무 파일을 열 수 없게 된 PC B에 복호화를 대가로 금전을 요구하는 안내가 표시됩니다.",
      activeActorIds: ["target", "files", "note"],
      transitions: [{ from: "target", to: "note", label: "몸값 안내 표시", kind: "event", labelSide: "right" }],
      spans: [
        span("files", "업무 파일 접근 제한", 0.04, 0.92, "danger"),
        span("note", "몸값 안내 표시", 0.4, 0.97, "danger"),
      ],
      illustration: { objects: [
        object(<FileLock2 className={icon} />, "암호화 파일", "업무 자료 접근 제한", "danger", "arrow"),
        object(<AppWindow className={icon} />, "랜섬노트", "복호화 대가로 금전 요구", "danger"),
      ] },
    },
    {
      short: "킬 스위치",
      title: "도메인이 응답하자 해당 변종의 후속 실행이 멈춤",
      summary: "5월 12일 보안 연구원이 등록한 도메인이 응답하면서 해당 변종의 추가 감염이 줄었습니다. 이미 암호화된 파일에는 별도로 복구 절차가 필요했습니다.",
      activeActorIds: ["switch", "target", "files"],
      transitions: [{ from: "switch", to: "target", label: "연결 성공 → 실행 중단", kind: "response", labelSide: "left" }],
      spans: [
        span("switch", "등록된 도메인 응답", 0.04, 0.48, "success", "network"),
        span("target", "후속 실행 중단", 0.48, 0.9, "success"),
        span("files", "기존 암호화 상태 유지", 0.04, 0.97, "danger"),
      ],
      illustration: { objects: [
        object(<Globe2 className={icon} />, "도메인 응답", "해당 변종의 실행 중단", "safe"),
        object(<FileLock2 className={icon} />, "이미 암호화된 파일", "별도 복구 필요", "danger"),
      ] },
    },
  ],
};

const recovery: Scene = {
  ...playback,
  title: "감염 대응 · 네트워크 격리에서 서비스 복구까지",
  overviewSummary: "감염 PC를 격리하고 증거를 확보합니다. 깨끗한 환경을 만든 뒤 검증한 백업으로 복원하거나 가능한 복구 수단을 확인합니다.",
  actors: [
    { id: "host", label: "감염 PC", detail: "증거 수집 대상", accent: "rose", x: 17, y: 22, compactX: 14, compactY: 13 },
    { id: "network", label: "운영망", detail: "격리 · 재연결", accent: "blue", x: 81, y: 22, compactX: 86, compactY: 13 },
    { id: "evidence", label: "증거 보관", detail: "파일 · 로그", accent: "amber", x: 17, y: 77, compactX: 14, compactY: 51 },
    { id: "clean", label: "복구 환경", detail: "재설치 · 검증", accent: "emerald", x: 49, y: 77, compactX: 14, compactY: 89 },
    { id: "backup", label: "정상 백업", detail: "격리된 저장소", accent: "blue", x: 81, y: 77, compactX: 86, compactY: 89 },
  ],
  topologyLinks: [
    { from: "host", to: "network" },
    { from: "host", to: "evidence" },
    { from: "backup", to: "clean" },
    { from: "clean", to: "network" },
  ],
  illustration: { objects: [
    object(<Unplug className={icon} />, "연결 차단", "감염 PC 격리", "warning", "arrow"),
    object(<FileSearch className={icon} />, "증거 보존", "감염 범위 확인", "blue", "arrow"),
    object(<FileCheck2 className={icon} />, "복구", "검증 후 서비스 재개", "safe"),
  ] },
  steps: [
    {
      short: "격리",
      title: "감염 PC의 네트워크 연결 차단",
      summary: "감염 의심 PC를 유선과 Wi-Fi에서 분리합니다. 여러 기기로 확산됐다면 영향을 받은 네트워크 구간을 격리합니다.",
      activeActorIds: ["host", "network"],
      spans: [
        span("host", "유선 · Wi-Fi 분리", 0.05, 0.58, "warning"),
        span("network", "격리 상태 확인", 0.58, 0.95, "success"),
      ],
      illustration: { objects: [
        object(<Monitor className={icon} />, "감염 PC", "즉시 네트워크 분리", "danger", "blocked"),
        object(<Network className={icon} />, "운영망", "추가 확산 경로 차단", "safe"),
      ] },
    },
    {
      short: "증거 보존",
      title: "감염 범위 확인과 증거 수집",
      summary: "랜섬노트와 암호화 파일 사본, 탐지 로그를 확보하고 추가 감염이 있는지 조사합니다. 가능하면 디스크 이미지와 메모리도 보존합니다.",
      activeActorIds: ["host", "evidence"],
      transitions: [{ from: "host", to: "evidence", label: "파일·로그 사본 보존", kind: "event", labelSide: "left" }],
      spans: [
        span("host", "감염 흔적 수집", 0.05, 0.56, "warning"),
        span("evidence", "사본 보존·분석", 0.56, 0.95, "primary"),
      ],
      illustration: { objects: [
        object(<HardDrive className={icon} />, "감염 기기", "디스크 · 메모리", "warning", "arrow"),
        object(<FileSearch className={icon} />, "증거 사본", "파일 · 로그 · 감염 시점", "blue"),
      ] },
    },
    {
      short: "재구축",
      title: "깨끗한 환경에 재설치하고 패치",
      summary: "증거를 확보한 뒤 신뢰할 수 있는 이미지로 시스템을 재설치합니다. 보안 업데이트를 적용하고 취약한 접근 경로를 닫습니다.",
      activeActorIds: ["clean"],
      spans: [
        span("clean", "시스템 재설치", 0.07, 0.49, "primary"),
        span("clean", "패치·설정 검증", 0.49, 0.96, "success"),
      ],
      illustration: { objects: [
        object(<HardDrive className={icon} />, "정상 이미지", "OS와 앱 재설치", "blue", "arrow"),
        object(<ShieldCheck className={icon} />, "복구 환경", "업데이트 · 접근 제한", "safe"),
      ] },
    },
    {
      short: "데이터 복원",
      title: "정상 백업을 검증한 뒤 데이터를 복원",
      summary: "침해 전 백업의 시점과 무결성을 확인하고 악성코드를 검사합니다. 백업을 사용할 수 없으면 이전 버전이나 해당 변종에 맞는 복호화 가능성을 확인합니다.",
      activeActorIds: ["backup", "clean"],
      transitions: [{ from: "backup", to: "clean", label: "검증된 데이터 복원", kind: "response", labelSide: "right" }],
      spans: [
        span("backup", "백업 무결성·악성코드 검사", 0.05, 0.54, "primary"),
        span("clean", "격리 환경에 복원", 0.54, 0.97, "success"),
      ],
      illustration: { objects: [
        object(<Archive className={icon} />, "격리 백업", "침해 이전 정상 사본", "blue", "arrow"),
        object(<FileCheck2 className={icon} />, "복원 데이터", "복구 환경에서 확인", "safe"),
      ] },
    },
    {
      short: "운영 재개",
      title: "서비스를 검증하고 운영망에 순차 재연결",
      summary: "핵심 파일과 업무 기능을 확인한 뒤 우선순위에 따라 서비스를 재개합니다. 감염 징후가 다시 나타나는지 모니터링합니다.",
      activeActorIds: ["clean", "network"],
      transitions: [{ from: "clean", to: "network", label: "검증 후 재연결", kind: "response", labelSide: "left" }],
      spans: [
        span("clean", "업무 기능 확인", 0.05, 0.53, "success"),
        span("network", "재연결·재감염 감시", 0.53, 0.97, "success"),
      ],
      illustration: { objects: [
        object(<FileCheck2 className={icon} />, "복구 환경", "업무 기능 검증", "safe", "arrow"),
        object(<Network className={icon} />, "운영망", "순차 재연결 · 모니터링", "safe"),
      ] },
    },
  ],
};

const modes = [
  { id: "attack", label: "확산 경로", scene: attack },
  { id: "recovery", label: "대응·복구", scene: recovery },
] as const;

function RansomwareStages({ spec, stepIndex, selectFrame }: WorkflowTopologyCanvasProps) {
  const scene = spec === recovery ? recovery : attack;
  const step = stepIndex === null ? null : scene.steps[stepIndex];
  const transitions = step?.transitions ?? [];

  return (
    <>
      <div className="flex flex-wrap gap-1.5 px-4 py-3" role="group" aria-label="단계 선택">
        {[{ short: "전체" }, ...scene.steps].map(({ short }, index) => {
          const frame = index === 0 ? null : index - 1;
          return (
            <button key={short} type="button" aria-pressed={stepIndex === frame} onClick={() => selectFrame(frame)}
              className="min-h-8 rounded-md border border-border bg-card px-2.5 text-[11px] font-semibold text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              {index === 0 ? short : `${index} ${short}`}
            </button>
          );
        })}
      </div>
      <AttackStageIllustration illustration={step?.illustration ?? scene.illustration} overview={!step} />
      {transitions.length > 0 && (
        <ol aria-label="현재 연결" className="space-y-1.5 border-b border-border bg-card px-4 py-2 text-xs text-muted-foreground sm:hidden">
          {transitions.map(({ from, to, label }) => (
            <li key={label}>
              <span className="font-semibold text-foreground">
                {scene.actors.find((actor) => actor.id === from)?.label} → {scene.actors.find((actor) => actor.id === to)?.label}
              </span>{" · "}{label}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

export default function RansomwareViz() {
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("attack");
  const scene = mode === "attack" ? attack : recovery;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="WannaCry 워크플로우 선택">
        {modes.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground">
            {label}
          </button>
        ))}
      </div>
      <WorkflowFocusedViz key={mode} spec={scene} TopologyPrelude={RansomwareStages} />
    </div>
  );
}
