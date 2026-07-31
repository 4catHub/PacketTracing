import { ContentItem } from "../content-types";

export const proxyVsReverseProxyContent: ContentItem = {
  slug: "proxy-vs-reverse-proxy",
  category: "workflow",
  title: "Forward Proxy vs Reverse Proxy",
  subtitle: "포워드 프록시와 리버스 프록시의 구조적 차이, 장단점, 활용 용도 및 관련 네트워크 장비 비교",
  tags: ["Proxy", "Reverse Proxy", "Nginx", "Load Balancer", "API Gateway", "Caching"],
  description: `프록시(Proxy)는 클라이언트와 서버 사이에서 네트워크 요청 및 응답을 중간 중계하는 대리 서버입니다. 중계 대상이 클라이언트인지 백엔드 서버인지에 따라 포워드 프록시(Forward Proxy)와 리버스 프록시(Reverse Proxy)로 나뉩니다.

### 1. Forward Proxy와 Reverse Proxy의 차이 및 용도

포워드 프록시는 내부 클라이언트 망 최전방에 위치하여 내부 사용자를 대신해 외부 인터넷에 접속합니다. 외부 서버는 실제 요청을 보낸 클라이언트의 IP를 알지 못하며 오직 포워드 프록시의 IP만 보게 됩니다. 사내 보안 정책 적용, 특정 사이트 접속 차단, 클라이언트 IP 은닉, 외부 요청 캐싱 등에 주로 활용됩니다.

반면 리버스 프록시는 백엔드 서버 클러스터 전방에 위치하여 외부 클라이언트로부터 오는 모든 요청을 받아 내부 애플리케이션 서버로 전달합니다. 외부 클라이언트는 실제 서비스를 처리한 백엔드 서버의 존재나 내부 IP 주소를 알지 못하며 오직 리버스 프록시 도메인으로만 통신합니다. 백엔드 보안 강화, TLS/SSL 암호화 해제(SSL Termination), 트래픽 라우팅, 서버 가용성 보호 등에 사용됩니다.

### 2. Forward Proxy와 Reverse Proxy의 장단점

- Forward Proxy 장점: 내부 클라이언트 IP를 보호하여 외부 해킹 위험을 낮추며, 유해 사이트 접속을 중앙에서 효과적으로 통제합니다. 클라이언트 측 공통 자원 캐싱을 통해 외부 인포메이션 대역폭을 절약할 수 있습니다.
- Forward Proxy 단점: 모든 클라이언트 트래픽이 프록시를 경유하므로 병목 지점이 될 수 있으며, 브라우저나 OS 차원의 프록시 설정 관리가 필요합니다.

- Reverse Proxy 장점: 백엔드 서버의 직접적인 외부 노출을 차단하여 보안성을 대폭 끌어올립니다. Nginx 등 단일 프록시 레이어에서 SSL 처리와 응답 캐싱, 로드 밸런싱을 통합 관리하여 백엔드 애플리케이션의 부하를 줄여줍니다.
- Reverse Proxy 단점: 프록시 서버 장애 시 전체 백엔드 서비스 접속이 마비될 수 있으므로(Single Point of Failure) 이중화 구성(HA)이 필수적이며, 아키텍처 복잡도가 증가합니다.

### 3. Load Balancer, API Gateway, Caching과의 비교

리버스 프록시는 로드 밸런싱, API 게이트웨이, Caching 기술과 밀접하게 연동되며 상호보완적 역할을 수행합니다.

- Load Balancer: 다수의 백엔드 서버로 트래픽을 균등하게 분산시키는 고가용성(HA) 확보에 특화되어 있습니다. L4/L7 스위치나 Nginx 업스트림 모듈 형태로 구현됩니다.
- API Gateway: 마이크로서비스 아키텍처(MSA) 관점에서 인증/인가, Rate Limiting, 라우팅, API 변환 등 풍부한 비즈니스 로직을 처리하는 스마트 진입점 역할을 담당합니다.
- Caching: 동일한 static 자원이나 API 응답 결과를 저장해 두고 백엔드 호출 없이 즉시 응답을 반환하여 전반적인 Latency를 낮추고 서버 부하를 최소화합니다.`,
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
  ]
};
