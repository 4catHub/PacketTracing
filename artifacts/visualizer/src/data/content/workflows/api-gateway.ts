import { ContentItem } from "../content-types";

export const apiGatewayContent: ContentItem = {
  slug: "api-gateway",
  category: "workflow",
  title: "API Gateway Rate Limiting",
  subtitle: "빨간 후드 요청의 클럽 입장기로 이해하는 Token Bucket과 HTTP 429",
  tags: [
    "Gateway",
    "Rate Limiting",
    "Networking",
    "Security"
  ],
  description: `API Gateway는 모든 클라이언트 요청의 최전방 진입점(Front Door)에서 라우팅, 인증, 관측과 Rate Limiting을 수행합니다. 시각화에서는 빨간 후드 손님인 Request #11이 클럽 입구에서 429로 반송되고, 기다린 뒤 같은 요청으로 재시도하여 입장하는 과정을 따라갑니다.

### 1. 정상 트래픽과 토큰 소비 (Normal Traffic)
요청이 Gateway에 도착하면 API Key, 사용자, IP, 라우트 등에 맞는 제한 정책을 찾습니다. 가용 토큰이 있으면 요청 하나당 토큰 하나를 원자적으로 차감한 뒤 허용된 요청만 백엔드로 전달합니다.
- **정책 한도:** 시각화의 \`10 req/s\`는 예시 정책이며 실제 값은 서비스 요구사항에 따라 다릅니다.
- **가용 토큰:** 입장 팔찌는 물리적인 클럽 수용 인원이 아니라 지금 허용할 수 있는 요청량을 뜻합니다.
- **정상 전달:** 토큰을 받은 요청은 백엔드에서 처리되고 성공 응답을 받습니다.

### 2. 트래픽 증가와 버스트 흡수 (Traffic Rising)
요청 유입 속도가 높아지면 저장된 토큰이 빠르게 줄어듭니다. Token Bucket은 미리 모아 둔 토큰만큼 짧은 버스트를 허용하지만, Arrival Rate가 Refill Rate보다 계속 높으면 결국 0에 도달합니다.
- **한도 아래:** 현재 요청률이 정책 한도보다 낮으면 요청은 계속 허용됩니다.
- **버스트 허용:** 저장된 토큰이 순간적인 요청 증가를 흡수합니다.
- **빠른 소진:** 유입이 충전보다 빠르면 가용 토큰은 감소합니다.

### 3. 한도 도달 (Rate Limit Reached)
사용량이 정책 한도에 도달하고 버킷이 비면 Gateway는 새로운 요청을 더 이상 통과시키지 않습니다. 이미 Gateway를 지난 요청은 취소되지 않고 백엔드에서 정상 처리됩니다.
- **새 요청 차단 준비:** 이후 도착한 요청부터 토큰 유무에 따라 즉시 허용 또는 거절을 결정합니다.
- **기존 요청 유지:** 한도 도달 전에 전달된 요청은 정상적으로 완료됩니다.

### 4. HTTP 429와 백엔드 보호 (Local Rejection)
토큰이 없는 Request #11은 Gateway에서 \`HTTP 429 Too Many Requests\`를 받습니다. 일반적인 Token Bucket Rate Limiter는 초과 요청을 반드시 대기열에 쌓지 않고 빠르게 거절할 수 있습니다.
- **로컬 응답:** 백엔드 호출 없이 Gateway가 직접 429를 반환합니다.
- **재시도 안내:** \`Retry-After\`는 클라이언트가 언제 다시 요청할지 판단하도록 돕습니다.
- **백엔드 보호:** 거절된 요청은 내부 서비스의 CPU, 스레드, DB 커넥션을 소비하지 않습니다.

### 5. 토큰 회복과 재시도 (Refill & Retry)
토큰은 요청이 줄었다는 이유만으로 즉시 복구되지 않습니다. 독립적인 refill clock이 정해진 속도로 토큰을 추가하고, 최대 Capacity를 넘겨 저장하지 않습니다. Request #11은 잠시 기다린 뒤 새 토큰을 소비해 정상 입장합니다.
- **Refill Rate:** 단위 시간마다 추가되는 토큰 수입니다.
- **Capacity:** 저장 가능한 최대 토큰 수이며 허용 가능한 순간 버스트 크기를 결정합니다.
- **임시 거절:** 429는 영구 차단이 아니며 정책과 토큰 상태가 허용하면 재시도할 수 있습니다.

### 6. 주요 Rate Limiting 알고리즘 비교
시스템 요구사항과 트래픽 특성에 따라 다양한 속도 제한 알고리즘이 채택됩니다.
- **Token Bucket:** 고정된 속도로 토큰을 채우고 요청마다 소비하며, 순간적인 버스트(Burst) 트래픽을 유연하게 수용할 수 있어 가장 널리 쓰입니다.
- **Leaky Bucket:** 큐에 요청을 담고 일정한 속도로 누수(처리)시켜 트래픽을 완벽하게 평활화(Smoothing)합니다.
- **Fixed Window Counter:** 고정된 시간 단위로 카운터를 증가시키며 단순하지만 경계 지점(Window Boundary)에서 2배 트래픽이 몰리는 한계가 있습니다.
- **Sliding Window Log/Counter:** 이전 윈도우의 가중치를 계산하여 경계 지점 급증 문제를 해결한 고정밀 알고리즘입니다.`,
  learningObjectives: ["토큰 버킷의 용량과 refill rate가 각각 허용 버스트와 지속 요청률을 결정하는 이유를 설명할 수 있다."],
  commonMistakes: ["HTTP 429는 사용량 제한 응답이며 초과 요청이 반드시 내부 대기열에 쌓인다는 뜻은 아닙니다."],
  keyTakeaways: ["토큰이 0일 때 거절한 요청은 백엔드까지 전달되지 않으며, 이후 충전과 재시도 정책을 분리해서 다룹니다."],
  exercises: [{"question":"토큰 버킷이 비어 있는 상태에서 새로운 요청이 들어오면 일반적인 거절형 limiter는 무엇을 반환하나요?","options":["HTTP 429","HTTP 101","HTTP 301"],"answerIndex":0,"explanation":"토큰을 사용할 수 없으면 게이트웨이가 요청을 차단하고 429 Too Many Requests로 응답할 수 있습니다."}],
  steps: [
    "정상 트래픽 (Normal Traffic) — 요청이 차례로 도착하고, Gateway가 요청마다 토큰 하나를 소비한 뒤 Backend로 전달합니다.",
    "트래픽 증가 (Traffic Rising) — 요청 속도가 정책 한도에 가까워지고 저장된 토큰이 빠르게 줄어듭니다.",
    "한도 도달 (Limit Reached) — 사용량이 10/10에 도달하면 경비원이 입구를 닫지만 이미 허용된 요청은 계속 처리됩니다.",
    "HTTP 429 반송 (Local Rejection) — 토큰이 없는 Request #11은 Backend를 호출하지 않고 Retry-After와 함께 즉시 반송됩니다.",
    "토큰 회복 (Token Refill) — 독립적인 refill clock이 가용 토큰을 다시 채우는 동안 Request #11은 대기합니다.",
    "재시도 성공 (Retry Success) — 같은 요청이 새 토큰을 소비하고 200 OK를 받아 정상적으로 Backend에 전달됩니다."
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
