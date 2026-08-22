import { ContentItem } from "../content-types";

export const realtimeProtocolsContent: ContentItem = {
  slug: "realtime-protocols",
  category: "workflow",
  title: "실시간 통신 프로토콜 비교",
  subtitle: "WebSocket vs SSE (Server-Sent Events) vs Polling",
  tags: [
    "Networking",
    "Real-time",
    "WebSocket",
    "SSE",
    "HTTP"
  ],
  description: `웹 애플리케이션에서 실시간 데이터 동기화를 달성하기 위해서는 전통적인 단방향 HTTP 요청-응답(Request-Response) 모델의 한계를 극복해야 합니다. Polling, SSE, WebSocket은 데이터 흐름 방향과 연결 생명주기에서 뚜렷한 아키텍처 차이를 보입니다.

### 1. Polling (주기적 폴링)
클라이언트가 타이머를 두고 주기적(예: 3초 간격)으로 새 데이터가 있는지 확인하는 단발성 HTTP 요청을 반복합니다.
- **동작 특성:** 구현이 매우 단순하지만, 데이터 변경이 없는 동안에도 불필요한 HTTP 핸드셰이크와 헤더(800B+) 패킷이 계속 오가므로 서버 CPU 및 네트워크 대역폭 낭비가 큽니다.
- **Long Polling:** 서버가 데이터가 발생할 때까지 응답을 지연(Hold)시키는 방식으로 실시간성을 높였으나 여전히 연결 재수립 오버헤드가 잔존합니다.

### 2. SSE (Server-Sent Events, 서버 푸시 스트리밍)
클라이언트가 \`EventSource\` API를 통해 한 번 연결을 맺으면, 서버가 연결을 닫지 않고 \`text/event-stream\` MIME 타입으로 실시간 이벤트를 지속 푸시(Push)하는 단방향 스트리밍 모델입니다.
- **표준 HTTP 기반:** HTTP/2 위에서 동작하며 방화벽 및 프록시 환경에서 호환성이 뛰어납니다.
- **자동 재연결 내장:** 네트워크 단절 시 브라우저가 마지막 수신 ID(\`Last-Event-ID\`)를 기억하고 자동으로 재연결을 시도합니다.
- **단방향 제약:** 클라이언트가 서버로 메시지를 보낼 때는 별도의 일반 HTTP POST 요청을 전송해야 합니다.

### 3. WebSocket (전이중 양방향 소켓 통신)
최초에 HTTP 연결(\`101 Switching Protocols\`) 핸드셰이크를 거친 뒤, TCP 양방향 소켓 채널을 수립하여 단 2~10바이트의 극소 프레임으로 데이터를 주고받는 완전 양방향(Full-Duplex) 프로토콜입니다.
- **초저지연 양방향 통신:** 서버와 클라이언트가 언제든 대기 없이 데이터를 즉각 전송할 수 있습니다.
- **헤더 오버헤드 0:** 초기 핸드셰이크 이후에는 무거운 HTTP 헤더를 일절 전송하지 않아 트래픽 효율이 극대화됩니다.
- **운영 복잡도:** 소켓 연결 유지를 위해 하트비트(Ping/Pong) 및 로드 밸런서의 Sticky Session 설정이 요구됩니다.`,
  steps: [
    "연결 수립: Polling은 매번 단발성 HTTP 연결, SSE는 단방향 스트림 연결 유지, WebSocket은 HTTP에서 소켓 프로토콜로 업그레이드",
    "클라이언트 데이터 송신: Polling과 SSE는 일반 HTTP 요청 사용, WebSocket은 이미 열린 소켓을 통해 가벼운 프레임으로 직접 즉시 송신",
    "서버 데이터 푸시: Polling은 다음 요청 주기까지 대기 후 응답, SSE와 WebSocket은 이벤트 발생 즉시 서버가 클라이언트로 데이터를 즉시 푸시",
    "연결 오버헤드: Polling은 매번 헤더 전송 및 핸드셰이크 발생, SSE/WebSocket은 한 번 맺은 영구 연결을 사용하여 전송 오버헤드가 거의 없음"
  ],
  examples: [
    "실시간 주식 호가 차트 및 코인 시세 갱신 (SSE 최적)",
    "실시간 멀티플레이어 웹 게임 및 협업 화이트보드 (WebSocket 필수)",
    "SNS 새 알림 피드 및 배송 현황 추적 (SSE 또는 폴링)",
    "주기적인 IoT 센서 데이터 수집 모니터링 (폴링)"
  ],
  related: [
    { slug: "rest-vs-grpc", category: "workflow", relation: "단방향 REST vs 양방향/스트리밍 통신 프로토콜 대조" },
    { slug: "framework-rendering", category: "workflow", relation: "실시간 수신 데이터의 프론트엔드 UI 렌더링 반영" }
  ]
};
