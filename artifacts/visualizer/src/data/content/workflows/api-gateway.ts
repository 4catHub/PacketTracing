import { ContentItem } from "../content-types";

export const apiGatewayContent: ContentItem = {
  slug: "api-gateway",
  category: "workflow",
  title: "API Gateway Rate Limiting",
  subtitle: "클라이언트 요청 제어 및 Rate Limiting 과부하 흐름 시각화",
  tags: [
    "Gateway",
    "Rate Limiting",
    "Networking",
    "Security"
  ],
  description: `API Gateway는 모든 클라이언트 요청의 최전방 진입점(Front Door) 역할을 하며, 라우팅, 인증, 모니터링 및 시스템 보호를 위한 Rate Limiting(요청 속도 제한)을 수행합니다. 클럽의 입구와 경비원에 비유하여 작동 원리를 쉽게 이해할 수 있습니다.

### 1. 정상 라우팅 상태 (Normal Gateway Routing)
클라이언트 요청이 최전방 Gateway로 유입되면 경비원이 가용 토큰(입장 팔찌)을 하나씩 채워 마이크로서비스로 정상 안내합니다. 사용한 토큰은 토큰 버킷 충전기에서 지정된 속도로 천천히 재생성됩니다.
- **토큰 할당 및 통과:** 유입된 요청에 대해 토큰 버킷에서 토큰 1개를 차감하고 백엔드 서비스로 정상 포워딩합니다.
- **HTTP 헤더 전달:** 응답 시 \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\` 헤더를 통해 잔여 요청 한도를 클라이언트에 전달합니다.
- **토큰 자동 충전 (Refill):** 백그라운드 타이머에 의해 초당 정해진 비율(Refill Rate)로 가용 토큰이 버킷 용량(Capacity)까지 서서히 채워집니다.

### 2. 트래픽 폭주 상태 (Traffic Spike)
순간적으로 감당하기 힘들 정도로 대규모 클라이언트 요청이 게이트웨이로 집중되는 상황입니다.
- **빠른 토큰 소진:** 요청 유입 속도가 토큰 재생성 속도를 크게 상회하여 가용 토큰이 급격히 바닥을 보입니다.
- **대기열 및 레이턴시 증가:** 게이트웨이 앞단에 요청 대기열이 누적되며 시스템 리소스 사용률이 급상승합니다.
- **임계치 근접:** 잔여 토큰이 1개 이하로 떨어지며 서비스 다운을 방지하기 위한 능동적 방어 메커니즘이 가동 준비에 들어갑니다.

### 3. 게이트 과부하 및 요청 차단 (Access Blocked)
가용 토큰이 완전히 고갈(0개)되면 게이트웨이가 즉각 차단막을 내리고 초과된 요청을 단호하게 거부합니다.
- **HTTP 429 에러 반환:** 차단된 요청에 대해 백엔드 호출 없이 Gateway 자체에서 즉시 \`HTTP 429 Too Many Requests\` 상태 코드를 반환합니다.
- **재시도 안내 헤더:** \`Retry-After\` 헤더를 포함하여 클라이언트가 몇 초 뒤에 요청을 재시도해야 하는지 알려줍니다.
- **백엔드 보호:** 디도스(DDoS) 공격이나 악의적 크롤링으로부터 내부 마이크로서비스의 CPU 및 DB 커넥션 고갈을 원천 차단합니다.

### 4. 주요 Rate Limiting 알고리즘 비교
시스템 요구사항과 트래픽 특성에 따라 다양한 속도 제한 알고리즘이 채택됩니다.
- **Token Bucket:** 고정된 속도로 토큰을 채우고 요청마다 소비하며, 순간적인 버스트(Burst) 트래픽을 유연하게 수용할 수 있어 가장 널리 쓰입니다.
- **Leaky Bucket:** 큐에 요청을 담고 일정한 속도로 누수(처리)시켜 트래픽을 완벽하게 평활화(Smoothing)합니다.
- **Fixed Window Counter:** 고정된 시간 단위로 카운터를 증가시키며 단순하지만 경계 지점(Window Boundary)에서 2배 트래픽이 몰리는 한계가 있습니다.
- **Sliding Window Log/Counter:** 이전 윈도우의 가중치를 계산하여 경계 지점 급증 문제를 해결한 고정밀 알고리즘입니다.`,
  steps: [
    "정상 라우팅 (Normal Gateway Routing) — 춤추는 클라이언트들이 입구로 향하고, 경비원이 입장 팔찌(토큰)를 채워 마이크로서비스로 정상 안내합니다. 토큰은 충전기에서 서서히 충전됩니다.",
    "트래픽 폭주 (Traffic Spike) — 수많은 클라이언트 캐릭터들이 몰려들며 대기 줄이 길어지고, 가용 토큰(팔찌)이 빠르게 소모되어 바닥을 보이기 시작합니다.",
    "게이트 과부하 & 요청 차단 (Access Blocked) — 토큰이 완전히 소진되어 경비원이 차단막을 내리고, 팔찌가 없는 요청들을 HTTP 429 에러 코드와 함께 눈물을 흘리며 돌려보냅니다."
  ],
  examples: [
    "디도스(DDoS) 공격 방어 및 시스템 가용성 확보",
    "API 사용량 제한 및 과금 정책(SaaS API Key) 적용",
    "백엔드 마이크로서비스의 리소스 고갈 방지",
    "토큰 버킷(Token Bucket) 및 리키 버킷(Leaky Bucket) 알고리즘 이해"
  ],
  related: [
    { slug: "proxy-vs-reverse-proxy", category: "workflow", relation: "API Gateway의 기초가 되는 Reverse Proxy 아키텍처" },
    { slug: "jwt-vs-session", category: "workflow", relation: "Gateway 진입점에서 수행하는 Stateless 인증 및 토큰 검증" },
    { slug: "monolith-vs-msa", category: "workflow", relation: "MSA 라우팅 및 단일 진입점(Front Door) 역할" }
  ]
};
