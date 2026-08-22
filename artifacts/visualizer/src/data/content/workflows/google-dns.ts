import { ContentItem } from "../content-types";

export const googleDnsContent: ContentItem = {
  slug: "google-dns",
  category: "workflow",
  title: "주소 입력부터 페이지 렌더링까지의 전체 흐름",
  subtitle: "Browser → DNS → TCP → HTTP → Render",
  tags: [
    "Networking",
    "DNS",
    "HTTP",
    "Browser"
  ],
  description: `웹 브라우저 주소창에 URL을 입력하고 엔터를 누르는 순간부터 화면에 픽셀이 그려질 때까지, 수백 밀리초 안에 네트워크와 브라우저 엔진의 12단계 정교한 협력이 일어납니다.

### 1. DNS 재귀 질의 단계 (Domain Resolution)
사람이 읽기 쉬운 도메인 네임을 컴퓨터 통신용 IP 주소로 변환하는 계층적 룩업 과정입니다.
- **로컬 캐시 확인:** 브라우저 내부 DNS 캐시 ➔ OS DNS 캐시 ➔ \`/etc/hosts\` 파일을 순차 조회하여 존재 시 즉시 IP를 반환합니다 (< 1ms).
- 재귀 DNS Resolver (ISP/8.8.8.8): 로컬에 없으면 통신사나 구글 Public DNS에 재귀 조회를 위임합니다.
- **계층적 네임서버 순회:** Root Nameserver (\`.\`) ➔ TLD Nameserver (\`.com\`) ➔ Authoritative Nameserver (\`google.com\`) 순으로 위임 질의를 거쳐 최종 대상 서버 IP와 TTL(Time-to-Live)을 획득합니다.

### 2. TCP 연결 및 TLS 1.3 보안 핸드셰이크
- **TCP 3-Way Handshake:** \`SYN\` ➔ \`SYN-ACK\` ➔ \`ACK\`의 1-RTT 패킷 교환을 통해 신뢰성 있는 전이중 TCP 가상 회선을 수립합니다.
- TLS 1.3 Handshake: 디피-헬만 Key Share를 교환하고 서버 CA 인증서를 검증하여 1-RTT 만에 대칭 세션키를 합의하고 암호화 터널을 엽니다.

### 3. HTTP 통신 및 Critical Rendering Path 렌더링
- **HTTP/2 다중화 요청:** 브라우저가 서버로 압축된 헤더와 함께 \`GET /index.html\` 요청을 전송하고 스트림 응답을 수신합니다.
- **브라우저 렌더링 파이프라인:** HTML 파싱(DOM 생성) + CSS 파싱(CSSOM 생성) ➔ 렌더 트리 결합(Render Tree) ➔ 레이아웃 계산(Reflow) ➔ 픽셀 페인트(Repaint) 및 합성(Compositing)을 거쳐 화면 출력을 완성합니다.`,
  steps: [
    "Browser DNS 캐시 확인 — 이전 방문 기록이 있으면 즉시 IP 반환 (< 1ms)",
    "OS 캐시 & /etc/hosts 파일 확인 — 시스템 수준 DNS 캐시 조회 (~1ms)",
    "재귀 DNS Resolver 질의 — ISP 또는 8.8.8.8 같은 공개 DNS에 위임 (~10–20ms)",
    "Root Nameserver 질의 — .com TLD NS 주소를 반환 (~20–40ms)",
    "TLD Nameserver 질의 — google.com의 Authoritative NS 주소를 반환 (~30–50ms)",
    "Authoritative Nameserver 질의 — 최종 IP 주소(예: 142.250.196.36)와 TTL 반환 (~40–60ms)",
    "TCP 3-way Handshake — SYN → SYN-ACK → ACK, 신뢰성 있는 채널 수립 (1 RTT)",
    "TLS 1.3 Handshake — 암호화 세션 협상 (1 RTT)",
    "HTTP/2 GET 요청 전송 — 헤더, 쿠키 포함 (~1–5ms)",
    "서버 응답 수신 — HTML + 리소스 참조 포함 (~20–100ms)",
    "HTML 파싱 & 페이지 렌더링 — DOM → CSSOM → Render Tree → Layout → Paint (~50–500ms)"
  ],
  examples: [
    "웹 사이트 접속 및 페이지 렌더링 과정 이해",
    "네트워크 지연 시간(Latency) 최적화 포인트 파악",
    "프론트엔드 성능 최적화(Critical Rendering Path)의 기초",
    "웹 애플리케이션 보안(TLS/SSL) 계층 이해"
  ],
  related: [
    { slug: "https-handshake", category: "workflow", relation: "DNS 질의 후 대상 서버와 수행하는 TLS 1.3 암호화 핸드셰이크" },
    { slug: "proxy-vs-reverse-proxy", category: "workflow", relation: "DNS IP가 가리키는 프록시 및 게이트웨이 엔트리 포인트" }
  ]
};
