import { ContentItem } from "../content-types";

export const proxyVsReverseProxyContent: ContentItem = {
  slug: "proxy-vs-reverse-proxy",
  category: "workflow",
  title: "Forward Proxy vs Reverse Proxy",
  subtitle: "포워드 프록시와 리버스 프록시의 구조적 차이, 장단점, 활용 용도 및 관련 네트워크 장비 비교",
  tags: ["Proxy", "Reverse Proxy", "Nginx", "Load Balancer", "API Gateway", "Caching"],
  description: `프록시(Proxy)는 클라이언트와 원격 서버 사이에서 네트워크 요청과 응답을 대리 중계하는 중계 서버입니다. 중계 대상이 '내부 클라이언트'인지 '백엔드 서버'인지에 따라 물리적 위치와 보안 목적이 명확히 구분됩니다.

### 1. Forward Proxy와 Reverse Proxy의 핵심 차이
- **Forward Proxy (클라이언트 대리):** 사내망/내부망 클라이언트 전방에 위치하여 외부 인터넷 접속을 대리합니다. 외부 웹 서버는 실제 클라이언트의 IP를 알지 못하고 포워드 프록시의 IP만 보게 됩니다. 사내 보안 정책 필터링, 유해 사이트 차단, 클라이언트 IP 은닉, 외부 요청 캐싱에 쓰입니다.
- **Reverse Proxy (서버 대리):** 백엔드 애플리케이션 서버 클러스터 최전방에 위치하여 외부 클라이언트의 유입 요청을 접수하고 내부 서버들로 라우팅합니다. 외부 사용자는 실제 백엔드 서버의 내부 사설 IP를 알 수 없으며 오직 리버스 프록시 도메인과만 통신합니다.

### 2. Forward Proxy vs Reverse Proxy 장단점 대조
- **Forward Proxy 장점:** 내부 클라이언트 신원 보호, 중앙 집중식 유해 트래픽 제어, 공통 웹 리소스 캐싱을 통한 외부 대역폭 절감
- **Forward Proxy 한계:** 전사 트래픽 집중 시 네트워크 병목 가능성, 각 클라이언트 PC/브라우저별 프록시 설정 배포 필요
- **Reverse Proxy 장점:** 백엔드 서버의 직접적인 외부 노출 차단(보안성 극대화), SSL 암호화 해제(SSL Termination) 부하 경감, 정적 콘텐츠 캐싱 및 L7 로드 밸런싱 통합 처리
- **Reverse Proxy 한계:** 프록시 서버 장애 시 전체 백엔드 서비스가 마비될 수 있는 단일 장애점(SPOF)이 되므로 Keepalived 등을 이용한 다중화 고가용성(HA) 구성이 필수적

### 3. 연관 네트워크 기술 비교 (Load Balancer / API Gateway / Caching)
- **Load Balancer:** 트래픽을 여러 대의 서버로 균등 분산하여 가용성(HA)을 보장하는 데 특화된 기술 (L4/L7 스위치, Nginx upstream)
- **API Gateway:** 단순 프록시를 넘어 JWT 인증/인가, Rate Limiting, API 버전 라우팅, 모니터링 등 마이크로서비스 전방의 스마트 제어 계층
- **Web Caching:** 동일한 static 정적 파일(JS, CSS, 이미지)이나 고빈도 API 응답을 메모리/디스크에 캐싱하여 백엔드 DB 부하를 획기적으로 경감`,
  steps: [
    "Forward Proxy 구조 — 사내망 클라이언트의 요청이 포워드 프록시를 경유하여 외부 인터넷 웹 서버로 전달되며 클라이언트 IP가 보호됩니다.",
    "Reverse Proxy 구조 — 외부 클라이언트 요청이 Nginx 리버스 프록시로 들어오면 내부 백엔드 서버(8080/8081)로 안전하게 라우팅되어 응답을 반환합니다.",
    "통합 비교 — Forward Proxy, Reverse Proxy, Load Balancer, API Gateway, Web Caching의 위치 및 핵심 역할 차이를 한눈에 확인합니다."
  ],
  examples: [
    "Nginx를 활용한 백엔드 아키텍처 보안 강화 및 IP 은닉",
    "기업 인트라넷 환경에서의 외부 웹사이트 접속 제어 및 보안 필터링",
    "웹 서버 부담 감소를 위한 SSL Termination 및 HTTP 응답 캐싱 구축",
    "마이크로서비스(MSA) 전방 진입점에서의 로드 밸런싱 및 API 라우팅"
  ],
  related: [
    { slug: "api-gateway", category: "workflow", relation: "Reverse Proxy에 인증/Rate Limiting 로직이 더해진 고급 진입점" },
    { slug: "https-handshake", category: "workflow", relation: "Reverse Proxy 단에서 수행되는 TLS Termination 및 암호화 부하 절감" },
    { slug: "google-dns", category: "workflow", relation: "DNS 주소가 실제 도달하는 네트워크 프록시 진입 레이어" }
  ]
};
