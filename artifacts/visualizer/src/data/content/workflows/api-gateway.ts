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
    description: `API Gateway는 모든 클라이언트 요청의 최전방 진입점(Front Door) 역할을 하며, 시스템 보호를 위한 Rate Limiting을 수행합니다. 클럽의 입구와 경비원에 비유하여 작동 원리를 쉽게 이해할 수 있습니다.

## 1. 정상 라우팅 상태 (클럽 입장)
클라이언트 요청들(안경 쓴 개발자, 선글라스 VIP, 지친 직장인 등)이 춤추는 모습으로 변해 신나게 입구로 향합니다. 경비원이 가용 토큰(입장 팔찌)을 하나씩 채워주면, 사람들이 리듬을 타며 클럽 내부(마이크로서비스)로 입장합니다. 사용한 토큰은 토큰 충전기에서 지정된 속도로 천천히 재생성됩니다. (HTTP 헤더: X-RateLimit-Remaining 감소 및 리필)

## 2. 트래픽 폭주 상태 (입구 혼잡)
갑자기 감당하기 힘들 정도로 수많은 사람들이 입구로 밀려듭니다. 경비원이 분주하게 팔찌를 채워주지만, 유입 속도가 재생성 속도보다 훨씬 빨라 가용 팔찌가 순식간에 고갈되어 1개 이하로 떨어집니다.

## 3. 요청 차단 상태 (입장 제한)
팔찌가 완전히 소진(0개)되면 경비원이 차단막을 내리고 팔찌가 없는 사람들을 단호하게 돌려보냅니다. 돌려보내진 사람들은 눈물 아이콘과 함께 뒤로 사라집니다. 이때 차단된 요청에 대해서는 HTTP 429 Too Many Requests 상태 코드와 함께 안내 JSON 메시지가 반환되며, BLOCKED 카운터가 급증합니다.`,
  steps: [
    "정상 라우팅 (Normal Gateway Routing) — 춤추는 클라이언트들이 입구로 향하고, 경비원이 입장 팔찌(토큰)를 채워 마이크로서비스로 정상 안내합니다. 토큰은 충전기에서 서서히 충전됩니다.",
    "트래픽 폭주 (Traffic Spike) — 수많은 클라이언트 캐릭터들이 몰려들며 대기 줄이 길어지고, 가용 토큰(팔찌)이 빠르게 소모되어 바닥을 보이기 시작합니다.",
    "게이트 과부하 & 요청 차단 (Access Blocked) — 토큰이 완전히 소진되어 경비원이 차단막을 내리고, 팔찌가 없는 요청들을 HTTP 429 에러 코드와 함께 눈물을 흘리며 돌려보냅니다."
],
    examples: [
    "디도스(DDoS) 공격 방어 및 시스템 안정성 확보",
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

