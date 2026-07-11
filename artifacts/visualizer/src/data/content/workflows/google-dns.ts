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
    description: `URL을 입력하고 엔터를 누르는 순간부터 화면에 페이지가 그려질 때까지, 수백 밀리초 안에 12단계 이상의 정교한 협력이 일어납니다.

## DNS 조회 단계
브라우저는 먼저 자신의 캐시를 확인하고, 없으면 OS 캐시와 /etc/hosts 파일을 조회합니다. 로컬 캐시가 모두 없을 경우 ISP의 재귀 DNS Resolver가 Root Nameserver → TLD Nameserver → Authoritative Nameserver 순으로 질의하며 최종 IP 주소를 찾아냅니다. 이 과정에서 각 단계는 TTL 기간 동안 결과를 캐시하여 다음 요청을 빠르게 처리합니다.

## TCP & TLS 연결 단계
IP를 얻은 브라우저는 서버와 TCP 3-way Handshake(SYN → SYN-ACK → ACK)를 수행해 신뢰성 있는 연결을 맺습니다. HTTPS 사이트라면 그 위에 TLS 1.3 협상이 추가됩니다. TLS 1.3은 1-RTT 만에 완료되어 이전 버전보다 빠릅니다.

## HTTP 요청 & 렌더링 단계
연결이 완료되면 브라우저는 HTTP/2 GET 요청을 보냅니다. 서버(Google의 GWS)는 HTML, CSS, JS 파일을 응답하고, 브라우저는 이를 파싱해 DOM → CSSOM → Render Tree → Layout → Paint 순서로 화면을 그립니다.`,
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
};
