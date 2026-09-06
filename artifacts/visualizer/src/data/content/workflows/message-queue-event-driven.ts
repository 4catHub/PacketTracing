import { ContentItem } from "../content-types";

export const messageQueueEventDrivenContent: ContentItem = {
  slug: "message-queue-event-driven",
  category: "workflow",
  title: "메시지 큐와 이벤트 기반 아키텍처",
  subtitle:
    "Producer, Broker, Consumer Group, Retry, DLQ로 이해하는 비동기 처리 흐름",
  tags: [
    "Message Queue",
    "Event-Driven",
    "Kafka",
    "Consumer Group",
    "DLQ",
    "Distributed Systems",
  ],
  description: `메시지 큐(Message Queue)는 요청을 보낸 서비스와 처리하는 서비스를 시간적으로 분리해, 트래픽 급증과 일시적인 장애를 견딜 수 있게 하는 비동기 통신 기반입니다. Producer는 이벤트를 Broker에 기록하고, Consumer Group은 파티션을 나누어 읽으며 처리 결과를 offset으로 기록합니다.

### 1. 이벤트 발행 (Publish)
- **Producer:** 주문 서비스처럼 이벤트를 만들어 내는 Producer는 처리할 Consumer가 현재 살아 있는지 기다리지 않고, \`order.created\` 같은 이벤트를 토픽으로 발행합니다.
- **Event Envelope:** \`eventId\`, \`traceId\`, \`key\`, 발생 시각과 payload를 함께 기록하면 중복 처리 방지, 분산 추적, 재처리의 기준을 확보할 수 있습니다.
- **비동기 경계:** HTTP 요청을 동기적으로 여러 서비스에 전파하는 대신 Broker에 한 번 기록하므로, Producer와 Consumer의 배포·장애·처리 속도를 분리할 수 있습니다.

### 2. 토픽과 파티션 (Topic & Partition)
- **Topic:** 같은 성격의 이벤트를 모으는 논리 채널입니다. 예를 들어 주문 이벤트는 \`orders\`, 결제 이벤트는 \`payments\` 토픽에 기록합니다.
- **Partition:** 토픽을 여러 로그로 나누어 병렬 처리량을 확보합니다. 같은 \`key\`는 보통 같은 파티션으로 보내 순서를 보장하고, 서로 다른 key는 여러 파티션에 분산합니다.
- **Offset:** 파티션 안에서 이벤트의 위치를 나타내는 단조 증가 번호입니다. Consumer는 처리 완료 위치를 커밋해 장애 후에도 마지막 성공 지점부터 다시 읽습니다.

### 3. Consumer Group 처리
- **Consumer Group:** 같은 그룹의 Consumer는 하나의 파티션을 한 Consumer만 읽도록 분담합니다. Consumer 수를 늘리면 파티션 수 한도까지 처리량을 수평 확장할 수 있습니다.
- **At-least-once:** offset을 처리 후 커밋하면 장애 시 같은 이벤트가 다시 전달될 수 있습니다. 따라서 Consumer는 \`eventId\` 기반 멱등성(Idempotency)을 가져야 합니다.
- **Backpressure:** Consumer가 느려지면 메시지는 Broker에 누적됩니다. 지연 시간, lag, 처리율을 관측하고 무작정 Producer를 막기보다 Consumer 확장과 처리 비용을 함께 조정합니다.

### 4. Retry와 Dead Letter Queue
- **Retry Topic:** 일시적인 네트워크 오류나 외부 API 제한처럼 다시 시도할 가치가 있는 실패는 지수 백오프와 최대 시도 횟수를 적용해 별도 retry 토픽으로 보냅니다.
- **DLQ (Dead Letter Queue):** 스키마 오류, 유효하지 않은 데이터처럼 자동 복구하기 어려운 이벤트는 DLQ로 격리합니다. 정상 파티션을 멈추지 않으면서 운영자가 원인 분석·수정·재처리를 수행할 수 있습니다.
- **실패를 숨기지 않기:** 재시도와 DLQ는 이벤트 유실을 해결하는 장치가 아니라 실패를 관측 가능하고 안전하게 처리하는 경로입니다. alert, 원본 payload, 실패 사유, 재처리 도구를 함께 설계해야 합니다.`,
  steps: [
    "이벤트 발행 — 주문 Producer가 `order.created` envelope를 `orders` 토픽에 기록합니다. Consumer의 응답을 기다리지 않아 Producer의 요청 경로가 분리됩니다.",
    "파티션 분배 — Broker는 이벤트 key를 해시해 Partition 0~2 중 하나에 추가합니다. 같은 주문 key는 같은 파티션을 사용해 순서를 유지합니다.",
    "Consumer Group 처리 — 서로 다른 Consumer가 각 파티션을 나누어 읽고, 성공한 이벤트의 offset을 커밋합니다. 처리량은 파티션 수 범위에서 수평 확장됩니다.",
    "재시도 예약 — 결제 승인처럼 일시 실패한 이벤트는 retry 토픽으로 이동합니다. backoff와 최대 횟수를 적용한 뒤 Consumer가 다시 처리합니다.",
    "DLQ 격리 — 재시도 한도를 넘거나 복구 불가능한 이벤트는 DLQ로 보냅니다. 정상 이벤트 흐름은 유지하고, 운영자는 원본 payload와 실패 원인을 분석해 재처리합니다.",
  ],
  examples: [
    "주문 생성 후 결제·재고·알림 서비스를 느슨하게 결합하는 이커머스 이벤트 처리",
    "이미지 변환·메일 발송·검색 인덱싱처럼 오래 걸리는 작업을 웹 요청 경로 밖에서 처리",
    "IoT 센서와 로그 이벤트를 파티션 단위로 병렬 수집·분석",
    "외부 결제·배송 API의 일시 장애를 retry와 DLQ로 격리하고 안전하게 재처리",
  ],
  related: [
    {
      slug: "api-gateway",
      category: "workflow",
      relation: "동기 API 진입점의 부하 제어와 비동기 후속 처리의 연결",
    },
    {
      slug: "monolith-vs-msa",
      category: "workflow",
      relation: "서비스 간 동기 호출을 이벤트 기반으로 느슨하게 결합하는 방식",
    },
    {
      slug: "cap-theorem",
      category: "workflow",
      relation:
        "비동기 전달과 최종 일관성을 설계할 때의 분산 시스템 트레이드오프",
    },
    {
      slug: "realtime-protocols",
      category: "workflow",
      relation:
        "Broker가 처리한 이벤트를 최종 사용자에게 실시간으로 전달하는 채널",
    },
  ],
};
