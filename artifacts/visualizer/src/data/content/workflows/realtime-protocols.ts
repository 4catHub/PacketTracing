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
    description: `웹에서 실시간으로 데이터를 주고받기 위해서는 일반적인 단방향 HTTP 요청-응답 모델을 극복해야 합니다. 대표적인 실시간 통신 기법인 Polling, SSE, WebSocket은 네트워크 효율성과 실시간성 측면에서 뚜렷한 차이를 보입니다.

## Polling (폴링)
클라이언트가 주기적으로(예: 3초마다) 서버에 새 HTTP 요청을 보내 새 데이터가 있는지 확인합니다. 구현이 매우 단순하지만, 데이터 변화가 없더라도 불필요한 요청/응답 패킷이 계속 오가므로 서버 리소스 낭비가 매우 큽니다.

## SSE (Server-Sent Events)
클라이언트가 한 번 연결을 요청하면(EventSource), 서버는 연결을 유지한 채 서버 측에서 클라이언트로 실시간 데이터를 푸시(Push)하는 단방향 스트리밍 방식입니다. HTTP 표준 프로토콜을 그대로 사용하며 재연결 처리가 내장되어 있어 가볍지만, 클라이언트가 서버로 데이터를 보낼 때는 별도의 HTTP 요청을 쏘아야 합니다.

## WebSocket (웹소켓)
최초에 HTTP 연결(Switching Protocols)을 거친 뒤, TCP 양방향 소켓 채널을 수립하여 헤더 오버헤드가 거의 없는 순수 프레임 형태로 실시간 양방향 데이터를 전송하는 방식입니다. 실시간 게임, 채팅 등 실시간성이 극도로 요구되는 서비스에 필수적이지만, 연결 관리 비용이 가장 큽니다.`,
  steps: [
    "연결 수립: Polling은 매번 단발성 HTTP 연결, SSE는 단방향 스트림 연결 유지, WebSocket은 HTTP에서 소켓 프로토콜로 업그레이드",
    "클라이언트 데이터 송신: Polling과 SSE는 일반 HTTP 요청 사용, WebSocket은 이미 열린 소켓을 통해 가벼운 프레임으로 직접 즉시 송신",
    "서버 데이터 푸시: Polling은 다음 요청 주기까지 대기 후 응답, SSE와 WebSocket은 이벤트 발생 즉시 서버가 클라이언트로 데이터를 즉시 푸시",
    "연결 오버헤드: Polling은 매번 헤더 전송 및 핸드셰이크 발생, SSE/WebSocket은 한 번 맺은 영구 연결을 사용하여 전송 오버헤드가 거의 없음"
],
    examples: [
    "실시간 주식 차트, 주가 실시간 갱신 (SSE가 매우 효율적)",
    "실시간 멀티플레이어 웹 게임, 실시간 협업 에디터 (WebSocket 필수)",
    "실시간 알림 피드, SNS 새 피드 알림 (SSE 또는 폴링)",
    "주기적인 센서 데이터 모니터링 (폴링 또는 SSE)"
],
};
