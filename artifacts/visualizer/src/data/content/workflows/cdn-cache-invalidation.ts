import { ContentItem } from "../content-types";

export const cdnCacheInvalidationContent: ContentItem = {
  slug: "cdn-cache-invalidation",
  category: "workflow",
  title: "CDN과 캐시 무효화 (Cache Invalidation)",
  subtitle:
    "브라우저 캐시, Edge POP, Origin 서버와 TTL·Purge·Stale-While-Revalidate 수명 주기",
  tags: [
    "CDN",
    "Cache-Control",
    "Edge POP",
    "Cache Invalidation",
    "TTL",
    "Stale-While-Revalidate",
    "ETag",
    "Networking",
  ],
  description: `CDN(Content Delivery Network)은 전 세계 사용자 인근에 분산 배치된 엣지 서버(Edge POP)에 원본 서버의 콘텐츠를 복제·캐싱하여 전송 지연(Latency)을 낮추고 대역폭 비용과 원본 서버 부하를 획기적으로 줄이는 분산 인프라입니다. 캐시 수명 주기(TTL), 조건부 재검증, 긴급 무효화(Purge), 그리고 불변 에셋 번들링(Cache Busting)의 작동 원리를 단계별로 다룹니다.

### 1. 3계층 캐시 아키텍처와 RTT 지연 격차
사용자 요청은 브라우저에서 오리진 서버까지 도달하는 동안 여러 계층의 캐시를 거칩니다.
- **브라우저 로컬 캐시 (Private Cache):** 사용자의 디바이스 메모리나 디스크에 저장됩니다. 캐시 히트 시 네트워크 호출이 전혀 발생하지 않아 지연 시간은 사실상 0ms입니다.
- **엣지 서버 (Edge POP / Shared CDN Cache):** 전 세계 거점(POP)에 위치하며 Anycast 라우팅을 통해 사용자에게 가장 물리적으로 가까운 엣지로 연결됩니다. 평균 RTT는 5~15ms 수준입니다.
- **오리진 서버 (Origin Server):** 실제 웹 애플리케이션 및 스토리지(S3 등)가 위치한 중앙 데이터센터입니다. 대륙 간 해저 케이블 및 백본망을 경유해야 하므로 왕복 150~200ms 이상의 물리적 RTT가 발생합니다.
- **Origin Shielding:** 엣지 서버가 수많은 사용자 요청의 90% 이상을 흡수(Hit)하여 오리진 서버가 트래픽 폭주로 다운되는 것을 방지합니다.

### 2. HTTP 캐시 제어 메커니즘과 핵심 헤더
HTTP/1.1 규격의 \`Cache-Control\` 및 검증자 헤더는 자원의 캐시 가능 여부와 갱신 방식을 결정합니다.
- **public vs private:** \`public\`은 브라우저와 CDN 엣지 모두 캐시 가능함을 의미하며, \`private\`은 개인 정보 등이 포함되어 사용자 브라우저에만 저장되어야 함을 뜻합니다.
- **max-age vs s-maxage:** \`max-age\`는 브라우저 캐시의 유효 초(seconds)를 지정하고, \`s-maxage\`(Shared max-age)는 CDN과 같은 공유 프록시 캐시에만 우선 적용되는 TTL입니다.
- **stale-while-revalidate:** 캐시가 만료된 후에도 지정된 시간 동안은 구버전(Stale) 데이터를 즉시 반환하여 사용자 지연을 없애고, 백그라운드에서 비동기로 오리진에 최신 데이터를 요청하여 캐시를 갱신합니다.
- **ETag와 If-None-Match:** 자원의 해시값인 ETag를 비교하여 데이터가 변하지 않았으면 오리진은 본문 없이 \`304 Not Modified\`만 응답하므로 네트워크 대역폭을 크게 절약합니다.
- **no-cache vs no-store:** \`no-cache\`는 캐시에 저장하되 매 요청마다 오리진에 유효성 검증을 거쳐야 함을 뜻하며, \`no-store\`는 보안상 어떠한 캐시에도 저장하지 말라는 지시어입니다.

### 3. 캐시 라이프사이클의 핵심 시나리오
캐시의 생명 주기는 단순한 Hit/Miss를 넘어 현대적인 비동기 갱신과 무효화 기법으로 동작합니다.
- **Cache Miss & Origin Fill:** 첫 요청 시 엣지 POP에 캐시가 없어 오리진까지 패킷이 왕복하고, 돌아오는 길에 엣지에 캐시 엔트리가 생성됩니다.
- **Edge Cache Hit:** 유효 기간 내 동일 자원 요청은 엣지에서 즉시 반환되어 초저지연과 오리진 트래픽 0%를 달성합니다.
- **Stale-While-Revalidate (SWR):** 만료 시점에 순간적인 트래픽이 몰릴 때 모든 사용자가 오리진으로 돌진하는 캐시 스탬피드(Thundering Herd) 현상을 방지하는 최적의 패턴입니다.
- **Instant Purge API:** 버그 수정이나 공지사항 갱신처럼 즉시 반영이 필요할 때 CDN API를 통해 전 세계 엣지의 특정 캐시를 강제로 무효화합니다.
- **Cache Busting (Fingerprinting):** 빌드 산출물 파일명에 내용 해시(\`app.8f3a9.js\`)를 붙이고 \`max-age=1년, immutable\`을 적용하여 무효화 API 호출 없이도 영구 캐싱과 즉시 배포를 동시에 실현합니다.

### 4. 캐시 무효화(Invalidation) 전략과 배포 모범 사례
웹 애플리케이션 배포 시 가장 신뢰할 수 있는 캐시 전략은 HTML 파일과 정적 에셋(JS/CSS/이미지)의 캐시 정책을 이원화하는 것입니다.
- **HTML 문서 (Entry Point):** \`Cache-Control: no-cache\`를 적용하여 항상 엣지와 오리진을 거쳐 최신 버전의 해시된 자원 URL 목록을 참조하게 합니다.
- **정적 번들 자원:** 파일명에 고유 해시를 포함하여 \`Cache-Control: public, max-age=31536000, immutable\`로 서빙합니다. 내용이 바뀌면 URL 자체가 바뀌므로 이전 캐시와 충돌하지 않습니다.
- **API 응답 및 동적 콘텐츠:** 짧은 TTL과 함께 \`stale-while-revalidate\`를 부여하거나, 데이터 변경 시 웹훅을 통해 태그 기반(Cache-Tags/Surrogate-Keys) Purge를 실행합니다.`,
  steps: [
    "캐시 미스와 오리진 적재 (Cache Miss) — 브라우저에 캐시가 없는 상태에서 최초 요청이 발생합니다. 가까운 엣지 POP에도 캐시가 없어(X-Cache: MISS), 물리적으로 먼 오리진 서버로 요청을 전달하여 200 OK 응답을 받아 엣지에 적재한 뒤 브라우저에 전달합니다.",
    "엣지 캐시 히트 (Edge Cache Hit) — 유효 기간 내 동일 자원 요청이 유입되면 엣지 POP의 공유 캐시에서 즉시 응답합니다(X-Cache: HIT). 오리진 서버를 거치지 않아 응답 지연이 180ms에서 8ms로 단축되며 오리진 부하가 완벽히 차단됩니다.",
    "Stale-While-Revalidate 비동기 갱신 — TTL이 만료되었지만 stale 허용 범위 내에 요청이 들어오면, 엣지는 기존 캐시를 사용자에게 지연 없이 즉각 반환하고 동시에 백그라운드로 오리진에 조건부 검증(If-None-Match)을 보내 조용히 캐시를 최신화합니다.",
    "긴급 캐시 무효화 (Instant Purge API) — 긴급 버그 수정 배포 시 CI/CD나 운영자가 CDN Invalidation API를 호출하여 전 세계 엣지 POP의 특정 URL 및 태그 캐시를 즉각 만료(Purge)시킵니다.",
    "Cache Busting과 불변 정적 자원 (Immutable Assets) — 번들 파일명에 빌드 해시(app.8f3a9.js)를 부여하고 1년 유효 기간과 immutable을 선언합니다. 새 배포는 새 URL을 생성하므로 캐시 무효화 비용 없이 영구 캐싱과 즉시 갱신을 동시에 보장합니다.",
  ],
  examples: [
    "SPA(Single Page App) 배포 시 index.html(no-cache)과 JS 번들(immutable hash)의 이원화 캐싱",
    "대규모 이커머스 플래시 세일 시 오리진 서버 다운을 방지하는 Origin Shielding 및 Edge Caching",
    "뉴스 속보나 긴급 공지 배포 시 CDN Purge API 및 Cache Tag를 활용한 전 세계 엣지 즉시 갱신",
    "트래픽 폭주 환경에서 Thundering Herd(Cache Stampede)를 방지하는 stale-while-revalidate 적용",
  ],
  related: [
    {
      slug: "global-post-retrieval",
      category: "workflow",
      relation: "대륙 간 RTT 물리 지연(150ms)과 계층별 지연 시간 분석",
    },
    {
      slug: "proxy-vs-reverse-proxy",
      category: "workflow",
      relation: "CDN 엣지 POP의 기반이 되는 Reverse Proxy 구조와 중계 역할",
    },
    {
      slug: "api-gateway",
      category: "workflow",
      relation: "최전방 진입점에서의 캐시 제어, 인증 및 트래픽 부하 분산",
    },
    {
      slug: "cache-replacement",
      category: "algorithm",
      relation: "엣지 및 로컬 메모리 캐시 교체 정책(LRU/LFU)",
    },
  ],
};
