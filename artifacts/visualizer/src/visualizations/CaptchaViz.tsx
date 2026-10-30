import WorkflowFocusedViz from "./WorkflowFocusedViz";
import CaptchaScene from "./CaptchaScene";
import type { WorkflowVisualizationSpec } from "./workflow-visualization";

const spec: WorkflowVisualizationSpec = {
  title: "CAPTCHA 챌린지 생성과 검증",
  subjectRisk: "sensitive",
  autoplayMs: 4400,
  overviewMs: 2600,
  overviewSummary: "이미지 저장소는 사진과 정답 라벨을 보관합니다. CAPTCHA 서버는 문제를 만들고, 브라우저는 정답을 모른 채 사용자 응답을 전달합니다. 외부 제공업체를 쓰면 챌린지 운영 주체가 달라집니다.",
  waterfallLabel: "단계별 처리 순서 · 길이는 설명용 상대 비율",
  actors: [
    { id: "assets", label: "이미지", detail: "사진·라벨", x: 17, y: 18, compactX: 25, compactY: 10, accent: "amber" },
    { id: "captcha", label: "문제 서버", detail: "정답·만료", x: 50, y: 18, compactX: 75, compactY: 10, accent: "violet" },
    { id: "browser", label: "브라우저", detail: "문제 표시", x: 17, y: 76, compactX: 25, compactY: 55, accent: "blue" },
    { id: "app", label: "앱 서버", detail: "최종 판정", x: 50, y: 76, compactX: 75, compactY: 55, accent: "emerald" },
    { id: "provider", label: "제공업체", detail: "토큰 검증", x: 83, y: 47, compactX: 50, compactY: 88, accent: "cyan" }
  ],
  topologyLinks: [
    { from: "assets", to: "captcha" },
    { from: "captcha", to: "browser" },
    { from: "browser", to: "app" },
    { from: "app", to: "captcha" },
    { from: "app", to: "provider" }
  ],
  steps: [
    {
      title: "① 이미지 또는 수식 원본 준비",
      summary: "이미지형은 사용 권한이 있는 사진과 정답 라벨을 문제 서버가 조회합니다. 수학형은 이미지 없이 서버가 숫자와 연산자를 직접 생성합니다.",
      activeActorIds: ["assets", "captcha"],
      transitions: [{ from: "assets", to: "captcha", label: "사진 + 정답 라벨", kind: "state", payload: "DB" }],
      spans: [
        { label: "사진·라벨 조회 (이미지형)", actorId: "assets", start: 0.05, end: 0.48, kind: "work" },
        { label: "문제 후보 생성", actorId: "captcha", start: 0.48, end: 0.92, kind: "work" }
      ]
    },
    {
      title: "② 일회성 챌린지 발급",
      summary: "서버가 문제 ID·만료·사용 여부와 정답을 관리하고, 브라우저에는 문제 본문과 이미지 참조만 보냅니다.",
      activeActorIds: ["captcha", "browser"],
      transitions: [{ from: "captcha", to: "browser", label: "문제 + 이미지 URL", kind: "response", payload: "UI" }],
      spans: [
        { label: "문제 ID·만료 상태 저장", actorId: "captcha", start: 0.06, end: 0.42, kind: "work" },
        { label: "챌린지 응답 전송", actorId: "captcha", start: 0.42, end: 0.72, kind: "network" },
        { label: "UI 렌더링", actorId: "browser", start: 0.72, end: 0.96, kind: "work" }
      ]
    },
    {
      title: "③ 브라우저에서 문제 풀이",
      summary: "사용자는 사진을 선택하거나 계산 결과를 입력합니다. 실제 정답 판정은 브라우저가 수행하지 않습니다.",
      activeActorIds: ["browser"],
      spans: [{ label: "사람의 선택·입력 대기", actorId: "browser", start: 0.08, end: 0.94, kind: "wait", bottleneck: true }]
    },
    {
      title: "④ 사용자 응답 제출",
      summary: "브라우저는 문제 ID와 선택 결과 또는 입력값을 앱 서버에 제출합니다. 제공업체형은 응답 토큰을 보냅니다.",
      activeActorIds: ["browser", "app"],
      transitions: [{ from: "browser", to: "app", label: "문제 ID + 응답", kind: "request", payload: "POST" }],
      spans: [
        { label: "응답 전송", actorId: "browser", start: 0.08, end: 0.58, kind: "network" },
        { label: "요청 수신", actorId: "app", start: 0.58, end: 0.9, kind: "work" }
      ]
    },
    {
      title: "⑤ 서버에서 정답 또는 토큰 검증",
      summary: "자체 구현은 서버가 정답·만료·재사용 여부를 검사합니다. 외부 제공업체형은 앱 서버가 제공업체의 공식 검증 API를 호출합니다.",
      activeActorIds: ["app", "captcha", "provider"],
      transitions: [
        { from: "app", to: "captcha", label: "자체 정답 검증", kind: "request", payload: "A" },
        { from: "app", to: "provider", label: "외부 토큰 검증", kind: "request", payload: "B" }
      ],
      spans: [
        { label: "서버 검증 시작", actorId: "app", start: 0.04, end: 0.22, kind: "work" },
        { label: "A · 정답·만료·재사용 확인", actorId: "captcha", start: 0.22, end: 0.72, kind: "work" },
        { label: "B · 제공업체 API 확인 (대안)", actorId: "provider", start: 0.22, end: 0.82, kind: "network" }
      ]
    },
    {
      title: "⑥ 판정과 일회성 소진",
      summary: "검증 성공 시 보호 작업을 허용하고 챌린지를 소진합니다. 실패 시 요청을 거부하거나 새 문제로 제한된 재시도를 안내합니다.",
      activeActorIds: ["captcha", "app", "browser"],
      transitions: [
        { from: "captcha", to: "app", label: "검증 결과", kind: "response", payload: "OK" },
        { from: "app", to: "browser", label: "허용 또는 거부", kind: "response", payload: "R" }
      ],
      spans: [
        { label: "챌린지 일회성 소진", actorId: "captcha", start: 0.06, end: 0.42, kind: "work", status: "success" },
        { label: "보호 작업 허용/거부", actorId: "app", start: 0.42, end: 0.75, kind: "work" },
        { label: "결과 표시", actorId: "browser", start: 0.75, end: 0.96, kind: "work" }
      ]
    }
  ]
};

export default function CaptchaViz() {
  return <WorkflowFocusedViz spec={spec} TopologyCanvas={CaptchaScene} />;
}
