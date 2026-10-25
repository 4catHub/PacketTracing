import { useState } from "react";
import WorkflowFocusedViz from "./WorkflowFocusedViz";
import Log4ShellScene from "./Log4ShellScene";
import type { WorkflowVisualizationSpec, WorkflowVisualizationStep, WorkflowWaterfallSpan } from "./workflow-visualization";

type Mode = "vulnerable" | "patched";
const span = (actorId: string, label: string, start: number, end: number,
  status: WorkflowWaterfallSpan["status"] = "default", kind: WorkflowWaterfallSpan["kind"] = "work"): WorkflowWaterfallSpan => ({
  actorId, label, start, end, status, kind,
  tone: status === "error" ? "danger" : status === "success" ? "success" : status === "warning" ? "warning" : "primary",
});

const entrySteps: WorkflowVisualizationStep[] = [
  {
    title: "1 · 로그에 도달할 외부 입력",
    summary: "공격자가 User-Agent 등 로그에 남을 수 있는 값에 JNDI 표현식을 넣습니다. 요청을 받았다는 사실만으로 취약점이 성립하지는 않습니다.",
    activeActorIds: ["input", "app"],
    transitions: [{ from: "input", to: "app", label: "조작된 HTTP 입력", kind: "request" }],
    spans: [span("input", "입력 전송", 0, .35, "default", "network"), span("app", "HTTP 수신", .35, .8)],
  },
  {
    title: "2 · 애플리케이션이 로그로 전달",
    summary: "Java 서비스가 외부 입력을 Log4j Core에 전달합니다. 입력 지점보다 실제 로그 데이터의 도착 경로가 중요합니다.",
    activeActorIds: ["app", "log4j"],
    transitions: [{ from: "app", to: "log4j", label: "로그 메시지 / 파라미터", kind: "event" }],
    spans: [span("app", "로그 호출", .05, .4), span("log4j", "메시지 처리", .4, .9)],
  },
];

const vulnerableSteps: WorkflowVisualizationStep[] = [
  ...entrySteps,
  {
    title: "3 · 문자열이 JNDI 조회로 해석됨",
    summary: "CVE-2021-44228의 취약한 메시지 Lookup이 외부 입력을 평가합니다. 로그 데이터가 외부 자원 조회 지시로 바뀌는 신뢰 경계입니다.",
    activeActorIds: ["log4j", "jndi"],
    transitions: [{ from: "log4j", to: "jndi", label: "JNDI Lookup 호출", kind: "state" }],
    spans: [span("log4j", "Lookup 평가", 0, .45, "warning"), span("jndi", "이름 해석", .45, .95, "warning")],
  },
  {
    title: "4 · 서버가 외부 LDAP로 연결",
    summary: "JNDI가 공격자 통제 엔드포인트로 나가는 연결을 시도합니다. 외부 연결 정책은 이 경로를 제한하지만 라이브러리 패치를 대체하지 않습니다.",
    activeActorIds: ["jndi", "remote"],
    transitions: [{ from: "jndi", to: "remote", label: "서버 → 외부 LDAP", kind: "request" }],
    spans: [span("jndi", "LDAP 요청", 0, .4, "warning", "network"), span("remote", "조회 수신", .4, .85, "warning")],
  },
  {
    title: "5 · 외부 객체·참조의 응답",
    summary: "LDAP 응답의 객체·참조를 처리합니다. 환경에 따라 추가 코드 로딩 등이 관여할 수 있으며 JDK 제한과 클래스패스에 따라 결과가 달라집니다.",
    activeActorIds: ["remote", "jndi"],
    transitions: [{ from: "remote", to: "jndi", label: "객체 / 참조 응답", kind: "response" }],
    spans: [span("remote", "응답 전송", 0, .4, "warning", "network"), span("jndi", "객체·참조 처리", .4, .95, "warning")],
  },
  {
    title: "6 · 실행 조건이 맞으면 RCE",
    summary: "객체 처리 경로가 악용되면 Java 프로세스 권한으로 코드가 실행될 수 있습니다. 외부 조회 성공과 실제 코드 실행은 별도의 증거로 확인해야 합니다.",
    activeActorIds: ["jndi", "jvm"],
    transitions: [{ from: "jndi", to: "jvm", label: "객체 처리 → 조건부 실행", kind: "event" }],
    spans: [span("jndi", "객체 처리 경로", 0, .5, "warning"), span("jvm", "RCE 가능 · 조건부", .5, .98, "error")],
  },
];

const patchedSteps: WorkflowVisualizationStep[] = [
  ...entrySteps,
  {
    title: "3 · 메시지를 데이터로 기록",
    summary: "메시지 Lookup이 제거된 구현은 이 입력을 JNDI 호출로 평가하지 않습니다. 44228의 경로는 여기서 끊기며 다른 CVE와 설정 권한은 별도로 점검합니다.",
    activeActorIds: ["log4j"], transitions: [],
    spans: [span("log4j", "문자열로 기록", .05, .6, "success"), span("log4j", "JNDI 호출 없음", .6, .98, "success")],
  },
];

function makeSpec(mode: Mode): WorkflowVisualizationSpec {
  return {
    title: mode === "vulnerable" ? "Log4Shell · 입력에서 조건부 RCE까지" : "패치된 로그 경로 · 메시지 Lookup 제거",
    actors: [
      { id: "input", label: "외부 입력", detail: "HTTP 요청", x: 17, y: 24, accent: "blue" },
      { id: "app", label: "Java 서비스", detail: "로그 호출", x: 50, y: 24, accent: "blue" },
      { id: "log4j", label: "Log4j Core", detail: "메시지 처리", x: 83, y: 24, accent: "violet" },
      { id: "jndi", label: "JNDI", detail: "이름 / 객체 조회", x: 83, y: 71, accent: "amber" },
      { id: "remote", label: "외부 LDAP", detail: "공격자 통제", x: 50, y: 71, accent: "rose" },
      { id: "jvm", label: "JVM 실행", detail: "조건부 RCE", x: 17, y: 71, accent: "rose" },
    ],
    topologyLinks: [
      { from: "input", to: "app" }, { from: "app", to: "log4j" },
      { from: "log4j", to: "jndi" }, { from: "jndi", to: "remote" }, { from: "jndi", to: "jvm" },
    ],
    steps: mode === "vulnerable" ? vulnerableSteps : patchedSteps,
    overviewSummary: "요청서 → Java 서버 → 로그 처리 칩 → JNDI 조회 → 외부 LDAP 응답 → 조건부 JVM 실행. 두 모드에서 같은 구성 요소의 위치를 유지합니다.",
    waterfallLabel: "현재 단계의 실행 순서 · 상대적 구간 (실측 시간 아님)",
    subjectRisk: "critical", motionTone: "restrained", autoplayMs: 4800, overviewMs: 2800,
  };
}
export const log4shellSpecs = { vulnerable: makeSpec("vulnerable"), patched: makeSpec("patched") };

export default function Log4ShellViz() {
  const [mode, setMode] = useState<Mode>("vulnerable");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Log4Shell 실행 경로 선택">
        {(["vulnerable", "patched"] as const).map(value => (
          <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold ${mode === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {value === "vulnerable" ? "취약한 경로 · 44228" : "패치된 로그 경로"}
          </button>
        ))}
      </div>
      <WorkflowFocusedViz key={mode} spec={log4shellSpecs[mode]} TopologyCanvas={Log4ShellScene} />
    </div>
  );
}
