import { useState } from "react";
import WorkflowFocusedViz from "./WorkflowFocusedViz";
import type { WorkflowVisualizationSpec, WorkflowVisualizationStep } from "./workflow-visualization";

type Variant = "oom" | "uaf";
const actors: WorkflowVisualizationSpec["actors"] = [
  { id: "attacker", label: "공격자", detail: "HTTP", accent: "rose", x: 12, y: 30, compactX: 50, compactY: 7 },
  { id: "web", label: "웹 서버", detail: "Apache/FPM", accent: "blue", x: 37, y: 30, compactX: 50, compactY: 28 },
  { id: "parser", label: "PHP", detail: "요청 처리", accent: "violet", x: 63, y: 30, compactX: 50, compactY: 49 },
  { id: "memory", label: "메모리", detail: "상태 관리", accent: "amber", x: 86, y: 30, compactX: 50, compactY: 70 },
  { id: "result", label: "결과", detail: "영향/차단", accent: "emerald", x: 63, y: 75, compactX: 50, compactY: 91 },
];
const span = (actorId: string, label: string, start: number, end: number, status?: "warning" | "error" | "success") => ({
  actorId, label, start, end, status,
  tone: status === "error" ? "danger" as const : status === "success" ? "success" as const : "primary" as const,
});
function makeSteps(variant: Variant): WorkflowVisualizationStep[] {
  const oom = variant === "oom";
  return [
    { title: "외부 HTTP 요청", summary: "인증되지 않은 공격자가 조작된 요청을 보냅니다. 실제 악용 페이로드는 표시하지 않습니다.", activeActorIds: ["attacker", "web"], transitions: [{ from: "attacker", to: "web", label: "HTTP 요청", kind: "request" }], spans: [span("attacker", "요청 전송", 0, .4), span("web", "요청 수신", .4, .85)] },
    { title: "PHP 요청 처리", summary: "웹 서버가 PHP 런타임으로 요청을 전달합니다. 애플리케이션 코드 이전의 내부 처리 경로가 공격 표면입니다.", activeActorIds: ["web", "parser"], transitions: [{ from: "web", to: "parser", label: "요청 전달", kind: "request" }], spans: [span("web", "PHP 전달", .05, .45), span("parser", "요청 파싱", .45, .9)] },
    { title: oom ? "메모리 부족(OOM)" : "이전 요청 실패", summary: oom ? "CVE-2026-109618: 메모리 할당 실패로 요청 내부 데이터의 초기화가 중단되고 비정상 정리 경로로 진입합니다." : "CVE-2026-109619: 이전 요청이 오류로 종료되면서 내부 전역 상태에 오래된 참조가 남을 수 있습니다.", activeActorIds: ["parser", "memory"], transitions: [{ from: "parser", to: "memory", label: oom ? "OOM / 정리" : "상태 잔존", kind: "state" }], spans: [span("parser", oom ? "부분 초기화" : "이전 요청 종료", 0, .48), span("memory", oom ? "비정상 정리" : "참조 잔존", .48, .95, "warning")] },
    { title: oom ? "비정상 정리와 메모리 손상" : "후속 요청의 해제 후 사용", summary: oom ? "정리 과정에서 유효하지 않은 내부 데이터를 정상 데이터처럼 처리하여 메모리 손상이 발생할 수 있습니다." : "같은 PHP 작업자가 후속 요청을 처리할 때 이전 요청에서 해제된 메모리를 다시 참조하는 Use-After-Free가 발생할 수 있습니다.", activeActorIds: ["parser", "memory"], transitions: [{ from: "memory", to: "parser", label: oom ? "손상된 상태" : "오래된 참조", kind: "state" }], spans: [span("memory", oom ? "잘못된 메모리" : "해제된 영역", 0, .55, "error"), span("parser", oom ? "잘못된 정리" : "UAF 접근", .55, .95, "error")] },
    { title: "보안 영향", summary: "조건과 환경에 따라 메모리 노출, 프로세스 충돌 또는 PHP 작업자 권한의 원격 코드 실행이 가능할 수 있습니다. 모든 요청이 RCE를 일으키는 것은 아닙니다.", activeActorIds: ["memory", "result"], transitions: [{ from: "memory", to: "result", label: "위험 발생", kind: "event" }], spans: [span("memory", "메모리 손상", 0, .52, "error"), span("result", "RCE 가능성", .52, .98, "error")] },
    { title: "패치와 검증", summary: "보안 수정 버전을 적용하고 웹 런타임을 재시작한 뒤 실제 버전과 로그를 점검합니다. WAF나 설정 변경만으로는 해결되지 않습니다.", activeActorIds: ["web", "parser", "memory", "result"], transitions: [{ from: "parser", to: "memory", label: "수정된 처리", kind: "state" }, { from: "memory", to: "result", label: "위험 차단", kind: "response" }], spans: [span("web", "서비스 재시작", 0, .25), span("parser", "패치 적용", .25, .6, "success"), span("result", "적용 확인", .6, .98, "success")] },
  ];
}
function specFor(variant: Variant): WorkflowVisualizationSpec {
  return {
    title: variant === "oom" ? "CVE-2026-109618 · OOM 메모리 손상" : "CVE-2026-109619 · 요청 간 상태 오류",
    actors, topologyLinks: [{ from: "attacker", to: "web" }, { from: "web", to: "parser" }, { from: "parser", to: "memory" }, { from: "memory", to: "result" }],
    steps: makeSteps(variant), subjectRisk: "critical", motionTone: "restrained", autoplayMs: 4400, overviewMs: 2500,
    overviewSummary: "공격자 → 웹 서버 → PHP → 메모리 → 결과. 전체 구조는 유지되며 현재 처리 경로와 메모리 상태만 강조됩니다.",
    waterfallLabel: "단계별 실행 추적 · 상대적 순서 (실측 시간 아님)",
  };
}
const specs = { oom: specFor("oom"), uaf: specFor("uaf") };
export default function Php2ShellViz() {
  const [variant, setVariant] = useState<Variant>("oom");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="취약점 선택">
        {(["oom", "uaf"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setVariant(value)} aria-pressed={variant === value}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${variant === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
            {value === "oom" ? "CVE-2026-109618 · OOM" : "CVE-2026-109619 · UAF"}
          </button>
        ))}
      </div>
      <WorkflowFocusedViz key={variant} spec={specs[variant]} />
    </div>
  );
}
