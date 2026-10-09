import WorkflowFocusedViz from "./WorkflowFocusedViz";
import type { WorkflowVisualizationSpec } from "./workflow-visualization";

const spec: WorkflowVisualizationSpec = {
  title: "주소 입력부터 페이지 렌더링까지",
  motionTone: "friendly",
  beginnerFriendly: true,
  analogyDriven: false,
  subjectRisk: "normal",
  autoplayMs: 3600,
  overviewSummary: "브라우저에서 DNS 계층, 웹 서버, 렌더링 엔진까지 이어지는 전체 경로를 먼저 확인합니다.",
  waterfallLabel: "Step detail · relative execution",
  actors: [
    { id: "browser", label: "BROWSER", detail: "브라우저", accent: "blue", x: 9, y: 50, compactX: 8, compactY: 46 },
    { id: "os", label: "OS CACHE", detail: "DNS cache / hosts", accent: "cyan", x: 23, y: 80, compactX: 22, compactY: 77 },
    { id: "resolver", label: "RESOLVER", detail: "재귀 DNS", accent: "violet", x: 38, y: 68, compactX: 46, compactY: 61 },
    { id: "root", label: "ROOT NS", detail: "루트 네임서버", accent: "amber", x: 50, y: 20, compactX: 38, compactY: 12 },
    { id: "tld", label: "TLD NS", detail: ".com", accent: "amber", x: 65, y: 20, compactX: 69, compactY: 12 },
    { id: "auth-ns", label: "AUTH NS", detail: "google.com", accent: "emerald", x: 66, y: 76, compactX: 73, compactY: 76 },
    { id: "server", label: "WEB SERVER", detail: "HTTPS endpoint", accent: "emerald", x: 82, y: 50, compactX: 91, compactY: 45 },
    { id: "render", label: "RENDER", detail: "DOM → Paint", accent: "blue", x: 40, y: 92, compactX: 48, compactY: 93 },
  ],
  topologyLinks: [
    { from: "browser", to: "os" },
    { from: "os", to: "resolver" },
    { from: "resolver", to: "root" },
    { from: "resolver", to: "tld" },
    { from: "resolver", to: "auth-ns" },
    { from: "resolver", to: "browser" },
    { from: "browser", to: "server" },
    { from: "browser", to: "render" },
  ],
  steps: [
    {
      title: "1. Browser DNS 캐시 확인",
      summary: "브라우저 내부 캐시에서 이전 DNS 결과를 먼저 찾습니다. · < 1ms",
      activeActorIds: ["browser"],
      spans: [
        { id: "parse-host", actorId: "browser", label: "URL host 추출", start: 0.04, end: 0.22, tone: "primary" },
        { id: "browser-cache", actorId: "browser", parentId: "parse-host", label: "브라우저 DNS cache 조회", start: 0.18, end: 0.58, tone: "secondary" },
        { actorId: "browser", parentId: "parse-host", label: "hit / miss 판정", start: 0.56, end: 0.78, tone: "success" },
      ],
    },
    {
      title: "2. OS 캐시 & hosts 파일 확인",
      summary: "브라우저 캐시가 비어 있으면 OS DNS 캐시와 로컬 hosts 설정을 조회합니다. · ~1ms",
      activeActorIds: ["browser", "os"],
      transitions: [
        { from: "browser", to: "os", label: "local lookup", kind: "request" },
      ],
      spans: [
        { id: "local-lookup", actorId: "os", label: "OS DNS cache 조회", start: 0.04, end: 0.40, tone: "primary" },
        { actorId: "os", parentId: "local-lookup", label: "hosts 파일 확인", start: 0.35, end: 0.67, tone: "secondary" },
        { actorId: "os", label: "local miss 판정", start: 0.66, end: 0.84, kind: "wait", tone: "warning" },
      ],
    },
    {
      title: "3. 재귀 DNS Resolver 질의",
      summary: "로컬에서 찾지 못한 도메인을 ISP 또는 공개 재귀 Resolver에 위임합니다. · ~10–20ms",
      activeActorIds: ["os", "resolver"],
      transitions: [
        { from: "os", to: "resolver", label: "google.com?", kind: "request" },
      ],
      spans: [
        { id: "resolver-request", actorId: "os", label: "질의 전달", start: 0.02, end: 0.24, kind: "network", tone: "primary" },
        { actorId: "resolver", parentId: "resolver-request", label: "Resolver cache 조회", start: 0.18, end: 0.50, tone: "secondary" },
        { actorId: "resolver", label: "재귀 조회 준비", start: 0.48, end: 0.78, kind: "wait", tone: "warning" },
      ],
    },
    {
      title: "4. Root Nameserver 질의",
      summary: "Resolver가 Root Nameserver에서 .com을 담당하는 TLD 서버의 위치를 얻습니다. · ~20–40ms",
      activeActorIds: ["resolver", "root"],
      transitions: [
        { from: "resolver", to: "root", label: "google.com?", kind: "request" },
        { from: "root", to: "resolver", label: ".com TLD referral", kind: "response" },
      ],
      spans: [
        { id: "root-query", actorId: "resolver", label: "Root 질의 전송", start: 0.02, end: 0.28, kind: "network", tone: "primary" },
        { actorId: "root", parentId: "root-query", label: "TLD referral 탐색", start: 0.26, end: 0.58, tone: "secondary" },
        { actorId: "root", parentId: "root-query", label: ".com NS 반환", start: 0.58, end: 0.84, kind: "network", tone: "success" },
      ],
    },
    {
      title: "5. TLD Nameserver 질의",
      summary: ".com TLD Nameserver에서 google.com의 Authoritative Nameserver 정보를 얻습니다. · ~30–50ms",
      activeActorIds: ["resolver", "tld"],
      transitions: [
        { from: "resolver", to: "tld", label: "google.com?", kind: "request" },
        { from: "tld", to: "resolver", label: "Auth NS referral", kind: "response" },
      ],
      spans: [
        { id: "tld-query", actorId: "resolver", label: "TLD 질의 전송", start: 0.02, end: 0.28, kind: "network", tone: "primary" },
        { actorId: "tld", parentId: "tld-query", label: "zone delegation 조회", start: 0.24, end: 0.58, tone: "secondary" },
        { actorId: "tld", parentId: "tld-query", label: "Authoritative NS 반환", start: 0.58, end: 0.88, kind: "network", tone: "success" },
      ],
    },
    {
      title: "6. Authoritative NS 질의 → IP 반환",
      summary: "최종 권한 네임서버에서 대상 IP와 TTL을 얻고 결과가 브라우저 쪽으로 돌아옵니다. · ~40–60ms",
      activeActorIds: ["resolver", "auth-ns", "browser"],
      transitions: [
        { from: "resolver", to: "auth-ns", label: "A/AAAA query", kind: "request" },
        { from: "auth-ns", to: "resolver", label: "IP + TTL", kind: "response" },
        { from: "resolver", to: "browser", label: "resolved IP", kind: "response" },
      ],
      spans: [
        { id: "auth-query", actorId: "resolver", label: "Authoritative 질의", start: 0.02, end: 0.30, kind: "network", tone: "primary" },
        { actorId: "auth-ns", parentId: "auth-query", label: "A/AAAA record 조회", start: 0.28, end: 0.58, tone: "secondary" },
        { actorId: "auth-ns", parentId: "auth-query", label: "IP + TTL 반환", start: 0.56, end: 0.78, kind: "network", tone: "success" },
        { actorId: "resolver", label: "Resolver cache 저장", start: 0.72, end: 0.92, tone: "success" },
      ],
    },
    {
      title: "7. TCP 3-way Handshake",
      summary: "획득한 IP의 서버와 SYN → SYN-ACK → ACK를 교환해 TCP 연결을 수립합니다. · 1 RTT",
      activeActorIds: ["browser", "server"],
      transitions: [
        { from: "browser", to: "server", label: "SYN", kind: "request" },
        { from: "server", to: "browser", label: "SYN-ACK", kind: "response" },
        { from: "browser", to: "server", label: "ACK", kind: "request" },
      ],
      spans: [
        { actorId: "browser", label: "SYN", start: 0.02, end: 0.25, kind: "network", tone: "primary" },
        { actorId: "server", label: "SYN-ACK", start: 0.31, end: 0.56, kind: "network", tone: "secondary" },
        { actorId: "browser", label: "ACK", start: 0.62, end: 0.84, kind: "network", tone: "success" },
      ],
    },
    {
      title: "8. TLS 1.3 Handshake",
      summary: "서버 인증과 Key Share 교환을 통해 암호화 세션을 합의합니다. · 1 RTT",
      activeActorIds: ["browser", "server"],
      transitions: [
        { from: "browser", to: "server", label: "ClientHello + KeyShare", kind: "request" },
        { from: "server", to: "browser", label: "ServerHello + cert", kind: "response" },
      ],
      spans: [
        { actorId: "browser", label: "ClientHello / KeyShare", start: 0.02, end: 0.30, kind: "network", tone: "primary" },
        { actorId: "server", label: "서버 인증서 / KeyShare", start: 0.30, end: 0.62, kind: "network", tone: "secondary" },
        { actorId: "browser", label: "인증서 검증", start: 0.55, end: 0.76, tone: "warning" },
        { actorId: "browser", label: "세션키 사용 가능", start: 0.76, end: 0.94, tone: "success" },
      ],
    },
    {
      title: "9. HTTP/2 GET 요청 전송",
      summary: "암호화된 연결 위로 브라우저가 필요한 리소스의 HTTP 요청을 보냅니다. · ~1–5ms",
      activeActorIds: ["browser", "server"],
      transitions: [
        { from: "browser", to: "server", label: "GET /index.html", kind: "request" },
      ],
      spans: [
        { id: "http-request", actorId: "browser", label: "요청 헤더 구성", start: 0.04, end: 0.30, tone: "primary" },
        { actorId: "browser", parentId: "http-request", label: "HTTP/2 frame 생성", start: 0.26, end: 0.52, tone: "secondary" },
        { actorId: "browser", parentId: "http-request", label: "TLS record 전송", start: 0.50, end: 0.82, kind: "network", tone: "success" },
      ],
    },
    {
      title: "10. 서버 응답 수신",
      summary: "웹 서버가 HTML과 추가 리소스 참조를 담은 응답을 암호화해 돌려줍니다. · ~20–100ms",
      activeActorIds: ["server", "browser"],
      transitions: [
        { from: "server", to: "browser", label: "200 OK + HTML", kind: "response" },
      ],
      spans: [
        { id: "server-work", actorId: "server", label: "서버 요청 처리", start: 0.02, end: 0.46, bottleneck: true, detail: "이 단계에서 가장 긴 실행 구간", tone: "secondary" },
        { actorId: "server", parentId: "server-work", label: "응답 직렬화", start: 0.40, end: 0.62, tone: "primary" },
        { actorId: "server", label: "HTTP/2 응답 전송", start: 0.58, end: 0.88, kind: "network", tone: "success" },
      ],
    },
    {
      title: "11. HTML 파싱 & 페이지 렌더링",
      summary: "HTML과 CSS를 파싱해 Render Tree를 만들고 Layout → Paint → Compositing으로 화면을 완성합니다. · ~50–500ms",
      activeActorIds: ["browser", "render"],
      transitions: [
        { from: "browser", to: "render", label: "HTML / CSS / JS", kind: "state" },
      ],
      spans: [
        { actorId: "render", label: "HTML parse → DOM", start: 0.02, end: 0.28, tone: "primary" },
        { actorId: "render", label: "CSS parse → CSSOM", start: 0.14, end: 0.40, tone: "secondary" },
        { actorId: "render", label: "Render Tree", start: 0.38, end: 0.56, tone: "success" },
        { actorId: "render", label: "Layout", start: 0.54, end: 0.70, tone: "warning" },
        { actorId: "render", label: "Paint / Composite", start: 0.68, end: 0.96, bottleneck: true, detail: "최종 화면 생성의 지배적 구간", tone: "success" },
      ],
    },
  ],
};

export default function GoogleDnsViz() {
  return <WorkflowFocusedViz spec={spec} />;
}
