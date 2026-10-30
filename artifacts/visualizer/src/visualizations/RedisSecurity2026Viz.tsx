import { useMemo, useState, type ComponentType } from "react";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import RedisSecurity2026Scene, { type RedisCaseId } from "./RedisSecurity2026Scene";
import type { WorkflowVisualizationSpec, WorkflowVisualizationStep, WorkflowWaterfallSpan } from "./workflow-visualization";

type Mode = "vulnerable" | "patched";

interface CaseDefinition {
  stepTitles: [string, string, string, string, string];
  id: RedisCaseId;
  name: string;
  short: string;
  condition: string;
  command: string;
  processor: string;
  operation: string;
  fault: string;
  impact: string;
  patch: string;
}
const cases: Record<RedisCaseId, CaseDefinition> = {
  "23479": {
    stepTitles: ["차단 명령을 사용하는 인증 클라이언트","차단 명령의 재개 처리","차단 상태 재실행과 클라이언트 축출","해제된 클라이언트 참조 · UAF","조건부 RCE · 서비스 영향"],
    id: "23479", name: "차단된 클라이언트 재개 · UAF", short: "차단 클라이언트 UAF",
    condition: "인증된 접근과 차단된 명령의 재실행 경로가 전제입니다.",
    command: "차단된 명령이 다시 실행됩니다.",
    processor: "차단 상태 · 클라이언트 축출",
    operation: "재실행 중 클라이언트가 축출될 수 있습니다.",
    fault: "processCommandAndResetClient의 오류 반환이 올바르게 처리되지 않아 해제된 상태에 재접근할 수 있습니다.",
    impact: "클라이언트 UAF가 악용되면 Redis 프로세스 권한의 RCE가 가능할 수 있습니다.",
    patch: "Redis 본체의 해당 보안 수정 릴리스를 적용하고 실제 실행 버전을 확인합니다.",
  },
  "25243": {
    stepTitles: ["RESTORE 직렬화 입력","기본 RESTORE 명령 전달","직렬화 데이터의 기본 복원 처리","메모리 접근 오류 · double-free 보고","조건부 RCE · 정보 유출 가능"],
    id: "25243", name: "기본 RESTORE · 메모리 접근 오류", short: "RESTORE 기본",
    condition: "인증된 사용자가 RESTORE 명령에 접근할 수 있어야 합니다.",
    command: "조작된 직렬화 데이터가 RESTORE 처리기로 전달됩니다.",
    processor: "기본 RESTORE 복원 처리기",
    operation: "Redis가 직렬화된 데이터를 해석해 키를 복원합니다.",
    fault: "취약한 RESTORE 복원 경로에서 유효하지 않은 메모리 접근이 발생할 수 있습니다.",
    impact: "메모리 접근 오류가 조건부 RCE, 정보 유출 또는 서비스 중단으로 이어질 수 있습니다.",
    patch: "Redis 본체 수정 버전을 적용하고 RESTORE 명령을 신뢰된 사용자에게만 허용합니다.",
  },
  "25588": {
    stepTitles: ["TimeSeries 직렬화 입력","RESTORE와 TimeSeries 사용 조건","시계열 모듈의 복원 처리","시계열 데이터 메모리 오류","조건부 RCE · 서비스 영향"],
    id: "25588", name: "RedisTimeSeries · RESTORE", short: "TimeSeries RESTORE",
    condition: "인증과 RedisTimeSeries 모듈 사용이 전제입니다.",
    command: "RESTORE가 모듈의 직렬화 데이터 복원 경로로 진입합니다.",
    processor: "RedisTimeSeries 모듈",
    operation: "시계열 데이터의 복원 과정에서 모듈이 직렬화 데이터를 처리합니다.",
    fault: "조작된 복원 데이터로 RedisTimeSeries의 잘못된 메모리 접근이 발생할 수 있습니다.",
    impact: "모듈 복원 경로의 메모리 오류가 조건부 RCE나 서비스 중단으로 이어질 수 있습니다.",
    patch: "Redis 본체 및 RedisTimeSeries 수정 버전(1.12.14 / 1.10.24 / 1.8.23 등)을 확인합니다.",
  },
  "25589": {
    stepTitles: ["Bloom 직렬화 입력","RESTORE와 RedisBloom 사용 조건","Bloom 자료구조의 복원 처리","버퍼 경계 밖 접근 · OOB","조건부 RCE · 서비스 영향"],
    id: "25589", name: "RedisBloom · RESTORE", short: "Bloom RESTORE",
    condition: "인증과 RedisBloom 모듈 사용이 전제입니다.",
    command: "RESTORE가 RedisBloom 모듈의 직렬화 데이터 복원 경로로 진입합니다.",
    processor: "RedisBloom 모듈",
    operation: "모듈이 저장된 자료구조의 직렬화 데이터를 다시 해석합니다.",
    fault: "조작된 복원 데이터로 RedisBloom의 잘못된 메모리 접근이 발생할 수 있습니다.",
    impact: "모듈 복원 경로의 메모리 오류가 조건부 RCE나 서비스 중단으로 이어질 수 있습니다.",
    patch: "Redis 본체 및 RedisBloom 수정 버전(2.8.20 / 2.6.28 / 2.4.23 등)을 확인합니다.",
  },
  "23631": {
    stepTitles: ["인증된 사용자와 쓰기 허용 레플리카","마스터·레플리카 동기화 경로","복제 과정의 Lua 상태 관리","해제된 Lua 참조 · UAF","조건부 RCE · 서비스 영향"],
    id: "23631", name: "Lua · 레플리카 동기화 UAF", short: "Lua 복제 UAF",
    condition: "인증 접근, Lua 스크립팅과 쓰기가 허용된 레플리카 구성이 주요 전제입니다.",
    command: "레플리카에서 Lua와 복제 동기화 관련 처리 경로가 사용됩니다.",
    processor: "Lua VM · 마스터/레플리카 동기화",
    operation: "복제 동기화 중 Lua 관련 상태의 수명 관리 경로가 맞물립니다.",
    fault: "replica-read-only가 비활성화된 레플리카에서 Lua UAF가 유발될 수 있습니다.",
    impact: "해제 후 사용이 조건부 RCE로 이어질 수 있습니다. 모든 레플리카에 해당하지는 않습니다.",
    patch: "지원되는 Redis 수정 버전을 적용하고 replica-read-only 설정과 복제 정책을 검증합니다.",
  },
};
export const redisSecurity2026Cases = cases;

function span(actorId: string, label: string, start: number, end: number,
  status: WorkflowWaterfallSpan["status"] = "default", kind: WorkflowWaterfallSpan["kind"] = "work"): WorkflowWaterfallSpan {
  return {
    actorId, label, start, end, status, kind,
    tone: status === "error" ? "danger" : status === "success" ? "success" :
      status === "warning" ? "warning" : "primary",
  };
}

function makeSpec(selected: RedisCaseId, mode: Mode): WorkflowVisualizationSpec {
  const item = cases[selected];
  const vulnerableSteps: WorkflowVisualizationStep[] = [
    {
      title: "1 · " + item.stepTitles[0],
      summary: item.condition + " 이 권고는 인증 우회 취약점이 아닙니다.",
      activeActorIds: ["client", "access"],
      transitions: [{ from: "client", to: "access", kind: "request", label: "인증된 연결" }],
      spans: [span("client", "사용자 명령 전송", 0, .35, "default", "network"),
        span("access", "인증·접근 확인", .35, .92)],
    },
    {
      title: "2 · " + item.stepTitles[1],
      summary: item.command,
      activeActorIds: ["access", "core"],
      transitions: [{ from: "access", to: "core", kind: "request", label: item.short }],
      spans: [span("access", "접근 조건 확인", 0, .35), span("core", item.short + " 처리", .35, .96)],
    },
    {
      title: "3 · " + item.stepTitles[2],
      summary: item.operation + " 대상: " + item.processor + ".",
      activeActorIds: ["core", "feature"],
      transitions: [{ from: "core", to: "feature", kind: "state", label: item.processor }],
      spans: [span("core", "명령 분기", 0, .37),
        span("feature", item.processor, .37, .96, "warning")],
    },
    {
      title: "4 · " + item.stepTitles[3],
      summary: item.fault,
      activeActorIds: ["feature", "memory"],
      transitions: [{ from: "feature", to: "memory", kind: "state", label: "잘못된 상태" }],
      spans: [span("feature", "취약한 상태 전이", 0, .52, "warning"),
        span("memory", selected === "23479" || selected === "23631" ? "해제 후 사용 (UAF)" : "유효하지 않은 메모리 접근", .52, .98, "error")],
    },
    {
      title: "5 · " + item.stepTitles[4],
      summary: item.impact + " 오류 발생 자체와 실제 코드 실행을 구별해야 합니다.",
      activeActorIds: ["memory", "result"],
      transitions: [{ from: "memory", to: "result", kind: "event", label: "보안 영향 가능" }],
      spans: [span("memory", "메모리 안전성 위반", 0, .5, "error"),
        span("result", "조건부 RCE · 장애 위험", .5, .98, "error")],
    },
  ];
  const patchedSteps: WorkflowVisualizationStep[] = [
    {
      title: "1 · 자산·명령 권한·전제조건 확인",
      summary: item.condition + " 실제 실행 중인 Redis 및 모듈 빌드, 명령 권한과 노드 구성을 조회합니다. 이 확인 자체로 취약점이 수정되지는 않습니다.",
      activeActorIds: ["access", "core", "feature"],
      transitions: [{ from: "core", to: "feature", kind: "state", label: "환경·버전 확인" }],
      spans: [span("access", "인증·ACL 권한 점검", 0, .34),
        span("core", "서버·빌드 확인", .34, .65),
        span("feature", "모듈·복제 설정 점검", .65, .98)],
    },
    {
      title: "2 · 해당 제품의 보안 수정 버전 적용",
      summary: item.patch + " 패치는 공격 과정에서 자동으로 실행되지 않는 별도의 운영 조치입니다.",
      activeActorIds: ["core", "feature", "memory"],
      transitions: [
        { from: "core", to: "feature", kind: "state", label: "수정 릴리스" },
        { from: "feature", to: "memory", kind: "response", label: "취약 경로 수정" },
      ],
      spans: [span("core", "Redis 보안 업데이트", 0, .4, "success"),
        span("feature", "모듈·복제 구성 적용", .4, .7, "success"),
        span("memory", "해당 결함 경로 수정", .7, 1, "success")],
    },
    {
      title: "3 · 적용 상태와 잔여 위험 검증",
      summary: "업데이트된 Redis·모듈의 실제 실행 빌드, 복제 상태, ACL, 비정상 요청 및 로그를 점검합니다. 해당 CVE가 수정됐다는 사실은 과거 침해가 없었다는 증거가 아닙니다.",
      activeActorIds: ["feature", "memory", "result"],
      transitions: [
        { from: "feature", to: "memory", kind: "response", label: "수정 상태 확인" },
        { from: "memory", to: "result", kind: "response", label: "검증 결과" },
      ],
      spans: [span("feature", "모듈·설정 재확인", 0, .33, "success"),
        span("memory", "해당 경로 수정 확인", .33, .68, "success"),
        span("result", "로그·침해 징후 점검", .68, 1, "success")],
    },
  ];
  const steps = mode === "patched" ? patchedSteps : vulnerableSteps;
  return {
    title: "CVE-2026-" + selected + " · " + item.name + (mode === "patched" ? " · 패치 후 검증" : " · 취약 경로"),
    motionTone: "restrained", subjectRisk: "critical",
    autoplayMs: 4600, overviewMs: 2600,
    overviewSummary: mode === "patched"
      ? "취약 경로와 분리된 운영 대응입니다. 자산·권한 확인 → 해당 보안 수정 버전 적용 → 실행 빌드·로그·잔여 위험 검증을 순서대로 보여줍니다."
      : "인증된 사용자 → 접근 제어 → 명령 처리 → 해당 CVE의 취약 서브시스템 → 메모리 오류 → 조건부 영향. 패치는 이 공격 과정과 별개의 대응입니다.",
    waterfallLabel: "현재 단계의 상대적 실행 순서 · 측정된 시간 아님",
    actors: [
      { id: "client", label: "사용자", detail: "인증 접근", accent: "blue", x: 12, y: 27, compactX: 50, compactY: 8 },
      { id: "access", label: "접근 제어", detail: "AUTH · ACL", accent: "blue", x: 39, y: 27, compactX: 50, compactY: 25 },
      { id: "core", label: "Redis", detail: "명령 처리", accent: "violet", x: 72, y: 27, compactX: 50, compactY: 42 },
      { id: "feature", label: "서브시스템", detail: item.processor, accent: "amber", x: 18, y: 75, compactX: 50, compactY: 58 },
      { id: "memory", label: "메모리", detail: "할당 · 해제", accent: "rose", x: 51, y: 75, compactX: 50, compactY: 75 },
      { id: "result", label: "결과", detail: "RCE · 패치", accent: "emerald", x: 83, y: 75, compactX: 50, compactY: 92 },
    ],
    topologyLinks: [
      { from: "client", to: "access" }, { from: "access", to: "core" },
      { from: "core", to: "feature" }, { from: "feature", to: "memory" },
      { from: "memory", to: "result" },
    ],
    steps,
  };
}
const specs: Record<Mode, Record<RedisCaseId, WorkflowVisualizationSpec>> = {
  vulnerable: {
    "23479": makeSpec("23479", "vulnerable"),
    "25243": makeSpec("25243", "vulnerable"),
    "25588": makeSpec("25588", "vulnerable"),
    "25589": makeSpec("25589", "vulnerable"),
    "23631": makeSpec("23631", "vulnerable"),
  },
  patched: {
    "23479": makeSpec("23479", "patched"),
    "25243": makeSpec("25243", "patched"),
    "25588": makeSpec("25588", "patched"),
    "25589": makeSpec("25589", "patched"),
    "23631": makeSpec("23631", "patched"),
  },
};
const order: RedisCaseId[] = ["23479", "25243", "25588", "25589", "23631"];

export default function RedisSecurity2026Viz() {
  const [selected, setSelected] = useState<RedisCaseId>("23479");
  const [mode, setMode] = useState<Mode>("vulnerable");
  const TopologyCanvas = useMemo<ComponentType<WorkflowTopologyCanvasProps>>(
    () => function RedisScene(props: WorkflowTopologyCanvasProps) {
      return <RedisSecurity2026Scene {...props} selected={selected} mode={mode} />;
    }, [selected, mode]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Redis 취약점 CVE 선택">
        {order.map(id => (
          <button type="button" key={id} aria-pressed={selected === id} onClick={() => setSelected(id)}
            className={"rounded-lg border px-3 py-2 text-xs font-semibold transition-colors " +
              (selected === id ? "border-primary bg-primary text-primary-foreground" :
                "border-border bg-card text-muted-foreground hover:text-foreground")}>
            <span className="block font-mono">CVE-2026-{id}</span>
            <span className="mt-0.5 block text-[10px] font-medium">{cases[id].short}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Redis 취약 경로와 패치 후 검증 전환">
        {(["vulnerable", "patched"] as const).map(value => (
          <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}
            className={"rounded-lg border px-3 py-2 text-xs font-semibold transition-colors " +
              (mode === value ? "border-primary bg-primary text-primary-foreground" :
                "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {value === "vulnerable" ? "취약한 처리 경로" : "패치 후 검증 경로"}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">두 흐름은 독립적인 학습 경로입니다.</span>
      </div>
      <WorkflowFocusedViz key={selected + "-" + mode} spec={specs[mode][selected]} TopologyCanvas={TopologyCanvas} />
    </div>
  );
}
