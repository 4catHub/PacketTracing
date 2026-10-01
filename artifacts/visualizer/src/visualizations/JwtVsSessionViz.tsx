import WorkflowFocusedViz from "./WorkflowFocusedViz";
import type { WorkflowVisualizationSpec } from "./workflow-visualization";

const spec: WorkflowVisualizationSpec = {
  title: "Session vs JWT 인증 흐름",
  motionTone: "playful",
  beginnerFriendly: true,
  analogyDriven: true,
  subjectRisk: "normal",
  autoplayMs: 3600,
  actors: [
    { id: "client", label: "CLIENT", detail: "관람객", accent: "blue", x: 10, y: 50 },
    { id: "auth", label: "AUTH", detail: "매표소", accent: "violet", x: 34, y: 50 },
    { id: "session-store", label: "SESSION", detail: "장부", accent: "cyan", x: 58, y: 25 },
    { id: "resource", label: "RESOURCE", detail: "입장 게이트", accent: "emerald", x: 82, y: 50 },
    { id: "blacklist", label: "BLACKLIST", detail: "JWT 차단 목록", accent: "amber", x: 58, y: 75 },
  ],
  topologyLinks: [
    { from: "client", to: "auth" },
    { from: "auth", to: "session-store" },
    { from: "client", to: "resource" },
    { from: "resource", to: "session-store" },
    { from: "auth", to: "blacklist" },
  ],
  steps: [
    {
      title: "대기",
      summary: "클라이언트가 로그인 전 상태에서 인증 흐름을 시작할 준비를 합니다.",
      activeActorIds: ["client"],
      spans: [
        { label: "로그인 입력 대기", start: 0.08, end: 0.36, tone: "secondary" },
        { label: "요청 준비", start: 0.34, end: 0.62, tone: "primary" },
      ],
      playfulHint: "관람객이 티켓을 받을 준비를 하는 장면처럼 가볍게 표현합니다.",
    },
    {
      title: "로그인과 자격 증명 발급",
      summary: "세션은 서버 장부를 만들고 Session ID를 발급하며, JWT는 서명된 토큰을 발급합니다.",
      activeActorIds: ["client", "auth", "session-store"],
      transitions: [
        { from: "client", to: "auth", label: "ID / PW", kind: "request" },
        { from: "auth", to: "session-store", label: "세션 기록", kind: "state" },
        { from: "auth", to: "client", label: "Session ID / JWT", kind: "response" },
      ],
      spans: [
        { label: "자격 증명 확인", start: 0.00, end: 0.32, tone: "primary" },
        { label: "Session: 장부 기록", start: 0.28, end: 0.62, tone: "secondary" },
        { label: "JWT: 서명 생성", start: 0.30, end: 0.56, tone: "success" },
        { label: "자격 증명 반환", start: 0.60, end: 0.90, tone: "warning" },
      ],
      playfulHint: "세션은 팔찌, JWT는 도장이 찍힌 스마트 티켓처럼 연상시키는 정도로만 의인화합니다.",
    },
    {
      title: "인가된 API 접근",
      summary: "세션은 저장소 조회가 필요하고, JWT는 게이트에서 토큰 서명을 자체 검증합니다.",
      activeActorIds: ["client", "resource", "session-store"],
      transitions: [
        { from: "client", to: "resource", label: "Session ID / JWT", kind: "request" },
        { from: "resource", to: "session-store", label: "세션 조회", kind: "request" },
        { from: "session-store", to: "resource", label: "유효 세션", kind: "response" },
      ],
      spans: [
        { label: "요청 수신", start: 0.00, end: 0.18, tone: "primary" },
        { label: "Session: 저장소 조회", start: 0.17, end: 0.66, tone: "secondary" },
        { label: "JWT: 서명 자체 검증", start: 0.18, end: 0.42, tone: "success" },
        { label: "리소스 접근 허용", start: 0.68, end: 0.92, tone: "success" },
      ],
      playfulHint: "유효한 티켓이 게이트를 통과하는 작은 반응은 방향과 성공 상태를 기억하는 데 도움을 줍니다.",
    },
    {
      title: "로그아웃과 무효화",
      summary: "세션은 서버 기록을 삭제하고, JWT는 필요할 경우 블랙리스트를 통해 조기 무효화합니다.",
      activeActorIds: ["client", "auth", "session-store", "blacklist"],
      transitions: [
        { from: "client", to: "auth", label: "Logout", kind: "request" },
        { from: "auth", to: "session-store", label: "세션 삭제", kind: "state" },
        { from: "auth", to: "blacklist", label: "JWT 차단 등록", kind: "state" },
      ],
      spans: [
        { label: "로그아웃 요청", start: 0.00, end: 0.20, tone: "primary" },
        { label: "Session: 레코드 삭제", start: 0.18, end: 0.48, tone: "danger" },
        { label: "JWT: 블랙리스트 등록", start: 0.26, end: 0.70, tone: "warning" },
        { label: "이후 요청 차단", start: 0.72, end: 0.94, tone: "danger" },
      ],
      playfulHint: "로그아웃은 실패나 사고가 아니므로 티켓에 '사용 종료' 표시가 생기는 정도의 가벼운 연출을 허용합니다.",
    },
  ],
};

export default function JwtVsSessionViz() {
  return <WorkflowFocusedViz spec={spec} />;
}
