import { useId, useState } from "react";
import { useReducedMotion, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import WorkflowFocusedViz, {
  type WorkflowTopologyCanvasProps,
} from "./WorkflowFocusedViz";
import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

type Kind = "xml" | "heap" | "jgss" | "tls" | "compiler" | "library";
type Mode = "attack" | "patch";
type Owner = "source" | "app" | "core" | "target" | "ops";
interface Vulnerability {
  id: string;
  kind: Kind;
  label: string;
  component: string;
  evidence: string;
  condition: string;
  input: string;
  call: string;
  cause: string;
  outcome: string;
  remedy: string;
  verify: string;
  target: string;
  source: string;
}

export const javaVulnerabilities: Vulnerability[] = [
  {
    id: "86144",
    kind: "xml",
    label: "XXE · SSRF",
    component: "JavaFX · libxml2",
    evidence: "공개 원인",
    condition:
      "Oracle: 비신뢰 코드·샌드박스 배포 + 사용자 상호작용. libxml2: XInclude와 네트워크에 접근하는 커스텀 로더 조건.",
    input: "외부 XML 문서",
    call: "XInclude 처리",
    cause:
      "하위 파싱에 parseFlags가 전달되지 않아 네트워크 제한이 유지되지 않을 수 있습니다.",
    outcome: "로더의 예상 밖 자원 접근 → XXE·SSRF·지연 가능",
    remedy:
      "보안 옵션을 하위 처리에 전파하는 수정이 포함된 JavaFX·libxml2 배포를 적용합니다.",
    verify: "외부 자원 접근 정책과 정상 문서 처리를 회귀 확인합니다.",
    target: "요청 대상 자원",
    source: "https://ubuntu.com/security/CVE-2026-86144",
  },
  {
    id: "114938",
    kind: "heap",
    label: "힙 버퍼 오버플로",
    component: "Compiler · Base64",
    evidence: "공개 원인",
    condition:
      "영향받는 HotSpot + x86-64 AVX-512 VBMI + 활성화된 Base64 최적화 + 공격자 제어 입력. Oracle 특수 perf 빌드는 별도 대조.",
    input: "외부 Base64 입력",
    call: "Base64 디코딩",
    cause:
      "패딩 꼬리 부분의 저장 마스크 계산 오류로 출력 영역을 벗어나 쓸 수 있습니다.",
    outcome: "힙 손상 → 충돌·정보 노출·조건부 코드 실행",
    remedy:
      "수정 JDK로 교체합니다. 적용 전에는 지원 환경에서 Base64 intrinsic 비활성화를 임시 검토합니다.",
    verify: "실행 빌드·CPU·옵션 반영과 정상 Base64 처리를 확인합니다.",
    target: "힙 · JVM 프로세스",
    source: "https://calif.io/java4shell/",
  },
  {
    id: "114939",
    kind: "jgss",
    label: "정보 노출 · 변조",
    component: "JGSS",
    evidence: "개념 모델 · 상세 미확인",
    condition:
      "Oracle Note 2: 비신뢰 코드를 실행하고 Java 샌드박스에 의존하는 배포. 관리자 설치 코드만 실행하는 서버와 구분.",
    input: "비신뢰 코드 배포",
    call: "JGSS 기능 사용",
    cause:
      "공개 공지는 JGSS와 기밀성·무결성 영향을 명시합니다. 특정 토큰·검증 우회는 확정하지 않습니다.",
    outcome: "JGSS 접근 데이터의 기밀성·무결성 영향",
    remedy:
      "공급자의 수정 런타임을 적용합니다. 아래 검증 장면은 운영 권장 절차입니다.",
    verify:
      "정상 인증과 거부 경로, cross-realm 사용 환경의 호환성을 점검합니다.",
    target: "보호 데이터",
    source: "https://www.oracle.com/security-alerts/cspunov2026.html",
  },
  {
    id: "114940",
    kind: "tls",
    label: "TLS · 정보 노출",
    component: "JSSE · TLS",
    evidence: "개념 모델 · 상세 미확인",
    condition:
      "Oracle Note 3: JSSE API에 입력을 공급하는 경로 또는 비신뢰 코드 배포. TLS 사용만으로 악용 성공을 뜻하지 않음.",
    input: "TLS 통신 상대",
    call: "JSSE API 처리",
    cause:
      "JSSE의 공개 영향은 기밀성·무결성입니다. 특정 핸드셰이크나 인증서 우회를 추정하지 않습니다.",
    outcome: "JSSE 접근 데이터의 정보 노출·변조 가능",
    remedy: "Java TLS 런타임을 수정 배포로 교체하고 프로세스를 재시작합니다.",
    verify:
      "정상 TLS 연결과 실패 연결, Java의 외부 API 호출을 회귀 확인합니다.",
    target: "TLS 보호 데이터",
    source: "https://www.oracle.com/security-alerts/cspunov2026.html",
  },
  {
    id: "114941",
    kind: "compiler",
    label: "컴파일러 · DoS",
    component: "Compiler",
    evidence: "개념 모델 · 상세 미확인",
    condition:
      "Oracle가 나열한 21·25·27 빌드에서 해당 API로 입력이 전달되는 경로. 구체적인 트리거는 확인 자료에 없음.",
    input: "외부 API 입력",
    call: "Compiler 경로",
    cause:
      "영향 구성요소와 데이터 입력 조건까지만 공개 확인. Base64와 같은 원인으로 묶지 않습니다.",
    outcome: "가용성에 높은 영향 · 일부 데이터 영향",
    remedy:
      "해당 Compiler 수정이 포함된 공급자 JDK로 교체합니다. 제한·격리는 보조 대응입니다.",
    verify: "서비스 처리 결과·오류율·지연·프로세스 재시작 지표를 확인합니다.",
    target: "결과 · 서비스 상태",
    source: "https://www.oracle.com/security-alerts/cspunov2026.html",
  },
  {
    id: "114942",
    kind: "library",
    label: "라이브러리 · DoS",
    component: "Libraries",
    evidence: "개념 모델 · 상세 미확인",
    condition:
      "Oracle가 나열한 21·25·27 빌드에서 해당 API로 입력이 전달되는 경로. 취약 메서드는 확인 자료에 없음.",
    input: "외부 API 입력",
    call: "Libraries 경로",
    cause:
      "라이브러리의 세부 결함은 확인되지 않았습니다. 특정 파서·역직렬화 공격을 가정하지 않습니다.",
    outcome: "서비스 중단·일부 정보 노출·변조 가능",
    remedy: "Libraries 수정이 포함된 공급자 런타임과 번들 JRE를 교체합니다.",
    verify:
      "정상 처리 결과와 장애 지표를 확인하고 기존 JVM이 남지 않았는지 점검합니다.",
    target: "결과 · 서비스 상태",
    source: "https://www.oracle.com/security-alerts/cspunov2026.html",
  },
];

interface JavaStep extends WorkflowVisualizationStep {
  phase:
    | "input"
    | "call"
    | "boundary"
    | "result"
    | "inventory"
    | "mitigate"
    | "install"
    | "restart"
    | "verify";
}
export interface JavaSpec extends WorkflowVisualizationSpec {
  vulnerability: Vulnerability;
  mode: Mode;
  steps: JavaStep[];
}

const span = (
  actorId: Owner,
  label: string,
  start: number,
  end: number,
  status: WorkflowWaterfallSpan["status"] = "default",
): WorkflowWaterfallSpan => ({
  actorId,
  label,
  start,
  end,
  status,
  tone:
    status === "error"
      ? "danger"
      : status === "warning"
        ? "warning"
        : status === "success"
          ? "success"
          : "primary",
});
export function makeJavaSpec(v: Vulnerability, mode: Mode): JavaSpec {
  const attack: JavaStep[] = [
    {
      phase: "input",
      title: "입력이 애플리케이션에 도달",
      summary: `${v.input}이 처리 경로에 들어옵니다. ${v.condition}`,
      activeActorIds: ["source", "app"],
      transitions: [{ from: "source", to: "app", label: "입력 전달" }],
      spans: [
        span("source", "입력 공급", 0.05, 0.35),
        span("app", "처리 경로 진입", 0.35, 0.9),
      ],
    },
    {
      phase: "call",
      title: `${v.call}로 전달`,
      summary:
        "애플리케이션이 입력을 해당 구성요소에 전달합니다. 구성요소 이름만 같다고 모든 호출이 취약한 것은 아닙니다.",
      activeActorIds: ["app", "core"],
      transitions: [{ from: "app", to: "core", label: "호출 · 데이터" }],
      spans: [
        span("app", "구성요소 호출", 0.05, 0.4),
        span("core", v.call, 0.4, 0.95),
      ],
    },
    {
      phase: "boundary",
      title:
        v.kind === "heap"
          ? "출력 경계 밖 쓰기"
          : v.kind === "xml"
            ? "옵션 전달이 빠지는 지점"
            : "취약 처리 위치 · 상세 미확인",
      summary: v.cause,
      activeActorIds: ["core"],
      transitions: [],
      spans: [
        span(
          "core",
          v.kind === "heap"
            ? "저장 마스크 오류"
            : v.kind === "xml"
              ? "parseFlags 전달 누락"
              : "상세 미공개 처리",
          0.12,
          0.95,
          "warning",
        ),
      ],
    },
    {
      phase: "result",
      title: "보호 자원에 영향",
      summary: v.outcome,
      activeActorIds: ["core", "target"],
      transitions: [
        {
          from: "core",
          to: "target",
          label: v.kind === "xml" ? "예상 밖 요청" : "영향 전파",
          kind: "state",
        },
      ],
      spans: [
        span("core", "구성요소의 결과", 0.03, 0.45, "warning"),
        span("target", v.outcome, 0.45, 0.98, "error"),
      ],
    },
  ];
  const patch: JavaStep[] = [
    {
      phase: "inventory",
      title: "실행 환경과 노출 경로 확인",
      summary: v.condition,
      activeActorIds: ["ops", "app", "core"],
      transitions: [
        { from: "ops", to: "core", label: "빌드 · 경로 조사", kind: "state" },
      ],
      spans: [
        span("ops", "공급자·실행 빌드 수집", 0.03, 0.45),
        span("core", "CVE 적용 조건 대조", 0.45, 0.95),
      ],
    },
    {
      phase: "mitigate",
      title:
        v.kind === "heap"
          ? "임시로 Base64 가속 경로 제한"
          : "패치 전 노출·피해 범위 축소",
      summary:
        v.kind === "heap"
          ? "지원하는 HotSpot 환경에서 -XX:-UseBASE64Intrinsics를 적용하고 재시작·옵션 반영을 확인합니다. 이 CVE의 임시 완화입니다."
          : "불필요한 비신뢰 입력·외부 접근을 제한하고 작업을 격리합니다. 운영 보조 조치이며 이 CVE의 해결을 증명하지 않습니다.",
      activeActorIds: ["ops", "core"],
      transitions: [
        { from: "ops", to: "core", label: "임시 조치", kind: "state" },
      ],
      spans: [
        span("ops", "적용 범위·호환성 점검", 0.03, 0.5),
        span("core", "노출 경로 축소", 0.5, 0.95, "warning"),
      ],
    },
    {
      phase: "install",
      title: "공급자 수정 배포로 교체",
      summary: v.remedy,
      activeActorIds: ["ops", "core"],
      transitions: [
        { from: "ops", to: "core", label: "수정 배포 적용", kind: "state" },
      ],
      spans: [
        span("ops", "수정 JDK·JavaFX 확보", 0.03, 0.4),
        span("core", "런타임·이미지 교체", 0.4, 0.95, "success"),
      ],
    },
    {
      phase: "restart",
      title: "실행 중인 프로세스 교체",
      summary:
        "서비스를 재시작하거나 컨테이너를 재배포합니다. 실제 프로세스의 Java 경로·전체 빌드와 시작 옵션을 대조합니다.",
      activeActorIds: ["ops", "app", "core"],
      transitions: [
        { from: "ops", to: "core", label: "재시작 · 배포", kind: "state" },
        { from: "app", to: "core", label: "새 런타임 사용" },
      ],
      spans: [
        span("ops", "재시작·재배포", 0.03, 0.4),
        span("app", "새 JVM 구동", 0.4, 0.7, "success"),
        span("core", "실행 빌드 확인", 0.7, 0.98, "success"),
      ],
    },
    {
      phase: "verify",
      title: "회귀 확인 · 관측으로 마무리",
      summary: `${v.verify} 특정 서비스에서 시험을 완료했다는 뜻이 아닌 권장 확인 순서입니다.`,
      activeActorIds: ["app", "core", "target"],
      transitions: [
        { from: "app", to: "core", label: "정상·거부 경로 시험" },
        { from: "core", to: "target", label: "결과 확인", kind: "response" },
      ],
      spans: [
        span("app", "회귀 입력 실행", 0.03, 0.35),
        span("core", "정상·실패 처리 확인", 0.35, 0.7, "success"),
        span("target", "결과·운영 지표 대조", 0.7, 0.98, "success"),
      ],
    },
  ];
  return {
    title: `CVE-2026-${v.id} · ${mode === "attack" ? "공격 흐름" : "패치·운영 확인"}`,
    vulnerability: v,
    mode,
    steps: mode === "attack" ? attack : patch,
    actors: [
      { id: "source", label: v.input, x: 25, y: 10 },
      { id: "app", label: "애플리케이션", x: 75, y: 10 },
      { id: "core", label: v.component, x: 50, y: 50 },
      { id: "ops", label: "운영자 · 수정 배포", x: 25, y: 90 },
      { id: "target", label: v.target, x: 75, y: 90 },
    ],
    topologyLinks: [
      { from: "source", to: "app" },
      { from: "app", to: "core" },
      { from: "core", to: "target" },
      { from: "ops", to: "core" },
    ],
    overviewSummary:
      "외부 입력, 애플리케이션, 구성요소, 영향받는 자원, 운영자를 유지한 채 현재 경로를 강조합니다.",
    waterfallLabel: "현재 단계의 소유자와 순서 · 시간 구간은 설명용",
    autoplayMs: 5600,
    overviewMs: 2800,
    motionTone: "restrained",
    subjectRisk: "critical",
  };
}

function Mechanism({
  v,
  step,
  patched,
}: {
  v: Vulnerability;
  step?: JavaStep;
  patched: boolean;
}) {
  const danger = step?.phase === "boundary" || step?.phase === "result";
  const tone = patched
    ? "text-emerald-700 dark:text-emerald-300"
    : danger
      ? "text-rose-700 dark:text-rose-300"
      : "text-muted-foreground";
  if (v.kind === "heap")
    return (
      <g className={tone}>
        <text
          x="220"
          y="205"
          textAnchor="middle"
          fontSize="13"
          className="fill-muted-foreground"
        >
          Base64 → AVX-512 intrinsic
        </text>
        <text
          x="220"
          y="231"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="currentColor"
        >
          {step?.phase === "mitigate"
            ? "임시 완화 · Base64 intrinsic 비활성화"
            : patched
              ? "수정 런타임 · 경계 보존"
              : danger
                ? "저장 마스크 오류 → 범위 밖 쓰기"
                : "출력 버퍼와 인접 힙 메모리"}
        </text>
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i}>
            <rect
              x={40 + i * 45}
              y="252"
              width="41"
              height="37"
              rx="3"
              className={i < 5 ? "fill-muted" : "fill-card"}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={i >= 5 ? "4 3" : undefined}
            />
            <text
              x={60 + i * 45}
              y="276"
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fill="currentColor"
            >
              {danger && !patched ? (i < 5 ? "•" : "!") : "·"}
            </text>
          </g>
        ))}
        <path d="M263 244 V300" stroke="currentColor" strokeWidth="2.5" />
        <text
          x="150"
          y="315"
          textAnchor="middle"
          fontSize="13"
          className="fill-foreground"
        >
          허용 출력 영역
        </text>
        <text
          x="336"
          y="315"
          textAnchor="middle"
          fontSize="13"
          fill="currentColor"
        >
          인접 힙
        </text>
        <text
          x="220"
          y="341"
          textAnchor="middle"
          fontSize="12"
          className="fill-muted-foreground"
        >
          바이트 칸은 경계 설명용 · 오프셋 재현 아님
        </text>
      </g>
    );
  if (v.kind === "xml")
    return (
      <g className={tone}>
        <rect
          x="43"
          y="199"
          width="354"
          height="127"
          rx="9"
          className="fill-muted"
          stroke="currentColor"
        />
        <text x="62" y="222" fontSize="13" className="fill-foreground">
          상위 XML 파서 · XML_PARSE_NONET
        </text>
        <path
          d="M65 236 V276 H93"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray={danger && !patched ? "4 4" : undefined}
        />
        <rect
          x="105"
          y="241"
          width="272"
          height="67"
          rx="7"
          className="fill-card"
          stroke="currentColor"
        />
        <text
          x="241"
          y="266"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="currentColor"
        >
          XInclude · 하위 자원 처리
        </text>
        <text
          x="241"
          y="290"
          textAnchor="middle"
          fontSize="13"
          fill="currentColor"
        >
          {patched
            ? "parseFlags 전파 → 정책 유지"
            : danger
              ? "parseFlags 누락 → 정책 단절"
              : "parseFlags 전달 여부가 핵심"}
        </text>
        <text
          x="220"
          y="347"
          textAnchor="middle"
          fontSize="12"
          className="fill-muted-foreground"
        >
          커스텀 로더의 네트워크 접근 조건
        </text>
      </g>
    );
  const security = v.kind === "jgss" || v.kind === "tls";
  return (
    <g className={tone}>
      {security ? (
        <>
          <path
            d="M220 197 L260 212 V248 Q256 276 220 294 Q184 276 180 248 V212 Z"
            className="fill-muted"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 3"
          />
          <path
            d="M208 239 V230 A12 12 0 0 1 232 230 V239 M203 239 H237 V263 H203 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="43"
            y="223"
            width="108"
            height="52"
            rx="3"
            className="fill-card"
            stroke="currentColor"
          />
          <text
            x="97"
            y="245"
            textAnchor="middle"
            fontSize="13"
            className="fill-foreground"
          >
            {v.kind === "jgss" ? "티켓 / 토큰" : "TLS 데이터"}
          </text>
          <text
            x="97"
            y="264"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
          >
            역할 예시
          </text>
          <path
            d="M159 249 H174 M268 249 H284"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
          <rect
            x="290"
            y="223"
            width="108"
            height="52"
            rx="3"
            className="fill-card"
            stroke="currentColor"
          />
          <text
            x="344"
            y="245"
            textAnchor="middle"
            fontSize="13"
            className="fill-foreground"
          >
            보호 데이터
          </text>
          <text
            x="344"
            y="264"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
          >
            기밀성·무결성
          </text>
        </>
      ) : (
        <>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect
                x={57 + i * 111}
                y={210 + i * 10}
                width="103"
                height="65"
                rx="6"
                className="fill-muted"
                stroke="currentColor"
                strokeDasharray={i === 1 ? "5 3" : undefined}
              />
              <text
                x={108 + i * 111}
                y={238 + i * 10}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="currentColor"
              >
                {["API 입력", "?", "처리 결과"][i]}
              </text>
              <text
                x={108 + i * 111}
                y={259 + i * 10}
                textAnchor="middle"
                fontSize="12"
                className="fill-muted-foreground"
              >
                {["호출 경로", "세부 미확인", "가용성·데이터"][i]}
              </text>
            </g>
          ))}
        </>
      )}
      <text
        x="220"
        y="319"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="currentColor"
      >
        {patched
          ? "수정 배포 적용 · 회귀 검증"
          : danger
            ? "공개 영향 범위 · 내부 절차 미확인"
            : "역할과 영향 위치를 설명하는 모형"}
      </text>
      <text
        x="220"
        y="343"
        textAnchor="middle"
        fontSize="12"
        className="fill-muted-foreground"
      >
        점선 · 물음표 = 구체적 exploit을 확정하지 않음
      </text>
    </g>
  );
}

function JavaScene({
  spec: raw,
  stepIndex,
  playing,
  selectFrame,
}: WorkflowTopologyCanvasProps) {
  const spec = raw as JavaSpec;
  const v = spec.vulnerability;
  const step = stepIndex === null ? undefined : spec.steps[stepIndex];
  const reduced = useReducedMotion();
  const marker = `java-${useId().replace(/:/g, "")}`;
  const patched =
    spec.mode === "patch" &&
    !!step &&
    ["install", "restart", "verify"].includes(step.phase);
  const activeColor =
    spec.mode === "patch"
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";
  const routes = [
    { from: "source", to: "app", d: "M186 62 H254", x: 220, y: 44 },
    { from: "app", to: "core", d: "M337 100 V150", x: 337, y: 129 },
    { from: "core", to: "target", d: "M337 370 V420", x: 337, y: 399 },
    { from: "ops", to: "core", d: "M103 420 V370", x: 103, y: 399 },
  ];
  return (
    <div className="border-t border-border bg-background">
      <div
        className="flex flex-wrap gap-1.5 p-3"
        role="group"
        aria-label="Java 취약점 단계 선택"
      >
        <button
          type="button"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
          className="min-h-9 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary"
        >
          전체
        </button>
        {spec.steps.map((s, i) => (
          <button
            key={s.phase}
            type="button"
            title={s.title}
            aria-label={`${i + 1}단계 · ${s.title}`}
            aria-pressed={stepIndex === i}
            onClick={() => selectFrame(i)}
            className="min-h-9 min-w-9 rounded-md border border-border px-2 text-xs font-semibold hover:bg-muted aria-pressed:border-primary aria-pressed:text-primary"
          >
            {i + 1}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 440 510"
        className="mx-auto block w-full max-w-[580px]"
        role="img"
        aria-label={`${v.component}. ${step ? `${step.title}. ${step.summary}` : "외부 입력에서 구성요소와 보호 자원으로 이어지는 전체 경로. 운영자가 수정 배포를 적용합니다."}`}
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
          >
            <path d="M0 0L10 5L0 10Z" fill="context-stroke" />
          </marker>
        </defs>
        {routes.map((r) => {
          const t = step?.transitions?.find(
            (t) => t.from === r.from && t.to === r.to,
          );
          return (
            <g
              key={r.from + r.to}
              className={t ? activeColor : "text-muted-foreground/50"}
            >
              <path
                d={r.d}
                fill="none"
                stroke="currentColor"
                strokeWidth={t ? 2.3 : 1.3}
                strokeDasharray={t ? undefined : "4 4"}
                markerEnd={`url(#${marker})`}
              />
              {t && (
                <>
                  <text
                    x={r.x}
                    y={r.y}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="currentColor"
                    className="stroke-background"
                    strokeWidth="5"
                    paintOrder="stroke"
                  >
                    {t.label}
                  </text>
                  {!reduced && playing && (
                    <motion.circle
                      key={`${stepIndex}-${r.from}`}
                      r="3"
                      fill="currentColor"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: ["0%", "100%"] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        repeatDelay: 0.8,
                      }}
                      style={{ offsetPath: `path('${r.d}')` }}
                    />
                  )}
                </>
              )}
            </g>
          );
        })}
        <g
          className={
            step?.activeActorIds.includes("source")
              ? activeColor
              : "text-muted-foreground"
          }
        >
          <path
            d="M25 20 H161 L185 44 V100 H25 Z M161 20 V44 H185"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M39 43 H119 M39 49 H99" stroke="currentColor" opacity=".6" />
          <text
            x="105"
            y="71"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            className="fill-foreground"
          >
            {v.input}
          </text>
          <text
            x="105"
            y="90"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
          >
            입력 공급자
          </text>
        </g>
        <g
          className={
            step?.activeActorIds.includes("app")
              ? activeColor
              : "text-muted-foreground"
          }
        >
          <rect
            x="255"
            y="20"
            width="160"
            height="80"
            rx="7"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <rect
            x="267"
            y="31"
            width="136"
            height="15"
            rx="3"
            className="fill-muted"
            stroke="currentColor"
          />
          <circle cx="391" cy="38" r="2" fill="currentColor" />
          <text
            x="335"
            y="71"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            className="fill-foreground"
          >
            애플리케이션
          </text>
          <text
            x="335"
            y="90"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
          >
            진입 경로 · API 호출
          </text>
        </g>
        <g
          className={
            step?.activeActorIds.includes("core")
              ? activeColor
              : "text-muted-foreground"
          }
        >
          <rect
            x="20"
            y="150"
            width="400"
            height="220"
            rx="12"
            className="fill-card"
            stroke="currentColor"
            strokeWidth={step?.activeActorIds.includes("core") ? 2.2 : 1.3}
          />
          <text
            x="220"
            y="179"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            className="fill-foreground"
          >
            {v.component}
          </text>
          <Mechanism v={v} step={step} patched={patched} />
        </g>
        <g
          className={
            step?.activeActorIds.includes("ops")
              ? activeColor
              : "text-muted-foreground"
          }
        >
          <path
            d="M25 433 L105 420 L185 433 V490 H25 Z M25 433 H185 M105 420 V444"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <text
            x="105"
            y="459"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            className="fill-foreground"
          >
            운영자 · 수정 배포
          </text>
          <text
            x="105"
            y="480"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
          >
            {patched ? "새 런타임 적용" : "조사 · 완화 · 교체"}
          </text>
        </g>
        <g
          className={
            step?.activeActorIds.includes("target")
              ? activeColor
              : "text-muted-foreground"
          }
        >
          <path
            d="M255 433 A80 13 0 0 1 415 433 V478 A80 13 0 0 1 255 478 Z"
            className="fill-card"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <ellipse
            cx="335"
            cy="433"
            rx="80"
            ry="13"
            className="fill-muted"
            stroke="currentColor"
          />
          <text
            x="335"
            y="463"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            className="fill-foreground"
          >
            {v.target}
          </text>
          <text
            x="335"
            y="482"
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
          >
            {patched ? "결과 · 정책 확인" : "프로세스 접근 범위"}
          </text>
        </g>
      </svg>
    </div>
  );
}

export default function JavaSecurityNov2026Viz() {
  const [selected, setSelected] = useState("114938");
  const [mode, setMode] = useState<Mode>("attack");
  const v = javaVulnerabilities.find((v) => v.id === selected)!;
  return (
    <div className="space-y-3" data-testid="java-security-viz">
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="group"
        aria-label="Java 취약점 선택"
      >
        {javaVulnerabilities.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === item.id}
            onClick={() => setSelected(item.id)}
            className="min-w-0 rounded-lg border border-border bg-card px-3 py-2.5 text-left hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted"
          >
            <span className="block font-mono text-[11px] font-semibold text-muted-foreground">
              CVE-2026-{item.id}
            </span>
            <span className="mt-1 block text-xs font-bold text-foreground sm:text-sm">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="공격 또는 패치 과정 선택"
        >
          {(["attack", "patch"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className="min-h-9 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {value === "attack" ? "공격 흐름" : "패치·운영 확인"}
            </button>
          ))}
        </div>
        <a
          href={v.source}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-4"
        >
          {v.evidence === "공개 원인"
            ? "공개 원인 분석"
            : "공식 조건 · 개념 모델"}
          <ExternalLink size={12} />
        </a>
      </div>
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">적용 조건 · </strong>
        {v.condition}
      </p>
      <WorkflowFocusedViz
        key={`${selected}-${mode}`}
        spec={makeJavaSpec(v, mode)}
        TopologyCanvas={JavaScene}
      />
    </div>
  );
}
