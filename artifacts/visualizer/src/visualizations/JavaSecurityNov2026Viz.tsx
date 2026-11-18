import { useState } from "react";
import { ExternalLink } from "lucide-react";
import WorkflowFocusedViz from "./WorkflowFocusedViz";
import JavaSecurityScene, { javaScenePositions } from "./JavaSecurityScenes";
import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

export type Kind = "xml" | "heap" | "jgss" | "tls" | "compiler" | "library";
type Mode = "attack" | "patch";
type Owner = "source" | "app" | "core" | "target" | "ops";
export interface Vulnerability {
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
      "xmlXIncludeProcess / xmlXIncludeProcessTree가 문서의 parseFlags를 전달하지 않아, 하위 로더에서 네트워크 제한이 유지되지 않을 수 있습니다.",
    outcome: "로더의 예상 밖 자원 접근 → XXE·SSRF·지연 가능",
    remedy:
      "문서의 parseFlags를 두 XInclude API와 하위 파서에 전파하는 수정 배포를 적용합니다.",
    verify:
      "외부 자원 요청의 거부와 문서에 정의된 fallback, 정상 문서 처리를 회귀 확인합니다.",
    target: "요청 대상 자원",
    source: "https://nvd.nist.gov/vuln/detail/cve-2026-86144",
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
    source: "https://nvd.nist.gov/vuln/detail/cve-2026-114939",
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
    source: "https://nvd.nist.gov/vuln/detail/cve-2026-114940",
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
    outcome: "hang·반복 crash에 의한 DoS · 일부 조회·변경 영향",
    remedy:
      "해당 Compiler 수정이 포함된 공급자 JDK로 교체합니다. 제한·격리는 보조 대응입니다.",
    verify: "서비스 처리 결과·오류율·지연·프로세스 재시작 지표를 확인합니다.",
    target: "프로세스 · 데이터",
    source: "https://nvd.nist.gov/vuln/detail/cve-2026-114941",
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
    outcome: "전체 DoS · 일부 데이터 조회·갱신·삽입·삭제 가능",
    remedy: "Libraries 수정이 포함된 공급자 런타임과 번들 JRE를 교체합니다.",
    verify:
      "정상 처리 결과와 장애 지표를 확인하고 기존 JVM이 남지 않았는지 점검합니다.",
    target: "일부 접근 데이터",
    source: "https://nvd.nist.gov/vuln/detail/cve-2026-114942",
  },
];

export interface JavaStep extends WorkflowVisualizationStep {
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
  const titles: Record<Kind, [string, string, string, string]> = {
    xml: [
      "외부 XML 문서 처리",
      "XInclude 포함 자원 처리",
      "파싱 옵션 전달 누락",
      "로더가 예상 밖 자원 요청",
    ],
    heap: [
      "Base64 입력 수신",
      "AVX-512 디코딩 경로",
      "출력 경계 밖 쓰기",
      "힙 손상과 프로세스 영향",
    ],
    jgss: [
      "비신뢰 Java 코드 실행",
      "JGSS 기능에 도달",
      "샌드박스 보호 범위 · 세부 미공개",
      "접근 데이터의 기밀성·무결성 영향",
    ],
    tls: [
      "TLS 상대가 레코드 전달",
      "JSSE가 통신 입력 처리",
      "보호 레코드 처리 · 세부 미공개",
      "통신 데이터의 정보 노출·변조 영향",
    ],
    compiler: [
      "서비스가 API 입력 수신",
      "Compiler 처리 경로 도달",
      "컴파일러 내부 결함 · 세부 미공개",
      "hang·crash와 일부 데이터 영향",
    ],
    library: [
      "서비스가 API 입력 수신",
      "Libraries 공용 API 호출",
      "라이브러리 결함 · 세부 미공개",
      "일부 데이터 접근·서비스 중단 영향",
    ],
  };
  attack.forEach((step, index) => {
    step.title = titles[v.kind][index];
  });
  if (v.kind === "jgss") {
    attack[1].transitions![0].label = "API";
    patch[0].transitions![0].label = "조사";
    patch[1].transitions![0].label = "완화";
    patch[2].transitions![0].label = "업데이트";
    patch[3].transitions![0].label = "재시작";
    patch[3].transitions![1].label = "새 JVM";
    patch[4].transitions![0].label = "검증";
  }
  if (v.kind === "tls") {
    patch[4].transitions?.push({
      from: "app",
      to: "source",
      label: "정상 TLS 응답",
      kind: "response",
    });
    patch[4].activeActorIds.push("source");
    patch[4].spans.push(
      span("source", "TLS 왕복 결과 확인", 0.82, 0.99, "success"),
    );
  }
  if (v.kind === "xml") {
    patch[2].title = "문서·하위 파서에 옵션 전파";
    patch[4].title = "네트워크 거부와 fallback 확인";
  }
  const appLabel =
    v.kind === "jgss"
      ? "클라이언트 실행부"
      : v.kind === "tls"
        ? "Java TLS 앱"
        : v.kind === "xml"
          ? "JavaFX 앱"
          : "Java 서비스";
  const positions = javaScenePositions[v.kind];
  const roles = ["source", "app", "core", "ops", "target"] as const;
  const labels = {
    source: v.input,
    app: appLabel,
    core: v.component,
    ops: "운영자 · 수정 배포",
    target: v.target,
  };
  return {
    title: `CVE-2026-${v.id} · ${mode === "attack" ? "공격 흐름" : "패치·운영 확인"}`,
    vulnerability: v,
    mode,
    steps: mode === "attack" ? attack : patch,
    actors: roles.map((id) => ({
      id,
      label: labels[id],
      x: positions[id][0] / 4.4,
      y: positions[id][1] / 5.2,
    })),
    topologyLinks: [
      { from: "source", to: "app" },
      { from: "app", to: "core" },
      { from: "core", to: "target" },
      { from: "ops", to: "core" },
      ...(v.kind === "tls" ? [{ from: "app", to: "source" }] : []),
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
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border bg-card px-3 py-2 text-xs"
        data-testid="java-nvd-evidence"
      >
        <a
          href={`https://nvd.nist.gov/vuln/detail/cve-2026-${v.id}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline underline-offset-4"
        >
          NVD 원문 · CVE-2026-{v.id}
        </a>
        <span>
          {v.kind === "xml"
            ? "NIST 7.8 · MITRE 5.6 · Oracle 제품 7.5"
            : `NIST 점수 미게시 · Oracle CNA ${v.kind === "heap" ? "8.1" : v.kind === "jgss" || v.kind === "tls" ? "7.4" : "7.0"}`}
        </span>
        <span className="text-muted-foreground">
          {v.kind === "xml"
            ? "CWE-669 · MITRE"
            : v.kind === "heap"
              ? "CWE-122 · CISA-ADP"
              : "CWE 값 미등록"}{" "}
          · 2026-11-18 15:58 KST 확인
        </span>
      </div>
      <p className="rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">적용 조건 · </strong>
        {v.condition}
      </p>
      <WorkflowFocusedViz
        key={`${selected}-${mode}`}
        spec={makeJavaSpec(v, mode)}
        TopologyCanvas={JavaSecurityScene}
      />
    </div>
  );
}
