import { ContentItem } from "../content-types";

export const distributedTransactions2pcSagaContent: ContentItem = {
  slug: "distributed-transactions-2pc-saga",
  category: "workflow",
  title: "분산 트랜잭션: 2PC vs Saga",
  subtitle: "Prepare/Commit의 강한 원자성과 로컬 트랜잭션·보상의 장기 흐름 비교",
  tags: [
    "Distributed Transaction",
    "Two-Phase Commit",
    "Saga Pattern",
    "Consistency",
    "Microservices",
  ],
  description: `분산 트랜잭션은 여러 데이터베이스나 서비스에 걸친 상태 변경을 하나의 비즈니스 결과로 묶는 문제입니다. 2PC(Two-Phase Commit)는 모든 참여자가 같은 최종 결정을 따르게 하여 강한 원자성을 제공하고, Saga는 짧은 로컬 트랜잭션을 순서대로 커밋한 뒤 실패 시 이미 완료된 작업을 보상합니다. 둘은 구현 방식뿐 아니라 사용자에게 약속하는 일관성의 의미가 다릅니다.

## 1. 왜 로컬 ACID만으로 부족한가
주문 생성, 결제 승인, 재고 차감이 각각 별도 DB를 사용하면 하나의 로컬 트랜잭션으로 묶을 수 없습니다. 결제는 성공했지만 재고가 실패하거나, 응답이 유실되어 같은 요청이 재실행되는 부분 실패가 정상적으로 발생할 수 있습니다.

- **핵심 질문:** 모든 변경이 동시에 보이도록 잠글 것인가, 중간 상태를 허용하고 실패를 보상할 것인가?
- **불확실한 결과:** 네트워크 timeout은 실패를 뜻하지 않습니다. 상대가 커밋했지만 응답만 잃었을 수 있으므로 상태 조회와 멱등 재시도가 필요합니다.
- **업무 불변식:** 잔액이 음수가 되면 안 되는 규칙처럼 즉시 지켜야 할 불변식과, 몇 초 뒤 수렴해도 되는 배송 알림 같은 상태를 구분해야 합니다.

## 2. 2PC: Prepare 후 하나의 결정
2PC의 Coordinator는 모든 Participant에게 동일한 결정을 전달합니다.

1. **Prepare/Vote:** Coordinator가 \`PREPARE\`를 보내면 각 Participant는 변경을 실제 반영할 수 있는지 검사하고, 필요한 lock과 redo/undo 정보를 durable log에 기록한 뒤 \`YES\` 또는 \`NO\`로 투표합니다.
2. **Commit/Abort:** 모두 \`YES\`이면 Coordinator가 commit 결정을 로그에 남기고 \`COMMIT\`을 전파합니다. 하나라도 \`NO\`이거나 prepare 전 timeout이면 \`ABORT\`를 전파합니다.

- **강점:** Commit이 완료되면 여러 리소스가 전부 반영되거나 전부 취소되는 원자적 결과를 제공할 수 있습니다.
- **비용:** Prepare 이후 Participant는 최종 결정을 알 때까지 lock과 연결·로그 상태를 유지할 수 있어 지연과 장애 전파 범위가 커집니다.
- **Coordinator 장애:** Prepared Participant는 독자적으로 commit/abort를 추측할 수 없습니다. Coordinator가 durable log로 복구하거나 결정 정보를 얻을 때까지 blocking될 수 있습니다.
- **주의:** 2PC는 합의 알고리즘 자체가 아닙니다. Coordinator 고가용성이나 결정 로그의 복제에는 별도의 consensus/복구 설계가 필요합니다.

## 3. Saga: 커밋된 작업을 의미적으로 보상
Saga는 \`T1 → T2 → T3\`처럼 각 서비스의 로컬 트랜잭션을 즉시 커밋합니다. T3가 실패하면 \`C2 → C1\`처럼 완료된 작업의 보상 트랜잭션을 역순으로 실행합니다.

- **보상은 rollback이 아님:** 이미 외부에 공개된 커밋을 시간상 되돌릴 수는 없습니다. 환불, 예약 해제, 주문 취소처럼 비즈니스 의미가 반대인 새 트랜잭션을 수행합니다.
- **Orchestration:** 중앙 Orchestrator가 다음 명령과 보상 순서를 관리합니다. 흐름과 관측이 명확하지만 중앙 로직의 복잡도와 결합도가 커질 수 있습니다.
- **Choreography:** 각 서비스가 이벤트를 구독하고 다음 이벤트를 발행합니다. 결합은 느슨하지만 전체 흐름, 순환 의존성, 장애 위치를 파악하기 어려워질 수 있습니다.
- **격리 부재:** 다른 요청이 Saga의 중간 상태를 볼 수 있습니다. 예약 상태, semantic lock, version check 같은 대책으로 dirty read와 동시 실행 충돌을 제어합니다.

## 4. 2PC와 Saga 선택 기준

| 기준 | 2PC | Saga |
|---|---|---|
| 결과 모델 | 원자적 commit/abort | 최종 일관성 + 보상 |
| 실행 중 자원 | Prepare lock과 세션 유지 가능 | 각 로컬 트랜잭션은 짧게 종료 |
| 장애 특성 | Coordinator/Participant 복구까지 blocking 가능 | 재시도·보상 실패·중간 상태 관리 필요 |
| 적용 범위 | XA 지원 DB, 짧고 제한된 참여자 | 독립 서비스, 장기 실행 비즈니스 흐름 |
| 되돌리기 | DB undo/abort | 환불·취소 같은 명시적 보상 API |

- **2PC가 적합한 경우:** 참여 리소스가 프로토콜을 지원하고, 트랜잭션이 짧으며, 강한 원자성이 lock 비용보다 중요할 때입니다.
- **Saga가 적합한 경우:** 서비스가 독립 DB를 소유하고, 사람 승인·외부 결제·배송처럼 오래 걸리며, 보상 가능한 업무 흐름일 때입니다.
- **혼합 설계:** 한 서비스 내부는 로컬 ACID, 서비스 사이는 Saga를 사용하고, 절대 함께 커밋되어야 하는 작은 경계만 제한적으로 2PC로 묶을 수 있습니다.

## 5. 실패를 견디는 구현 체크리스트
- **멱등성:** 모든 명령과 보상에 \`transactionId\` 또는 \`idempotencyKey\`를 부여해 같은 메시지가 다시 와도 효과가 한 번만 발생하게 합니다.
- **Transactional Outbox:** 비즈니스 상태와 발행할 이벤트를 같은 로컬 트랜잭션에 기록해 DB 커밋과 메시지 발행 사이의 유실 구간을 닫습니다.
- **Inbox/Deduplication:** Consumer가 처리한 message ID를 기록해 at-least-once 전달의 중복 효과를 막습니다.
- **Timeout과 재시도:** 단계별 deadline, 지수 backoff, 최대 시도, DLQ와 운영자 개입 경로를 정의합니다.
- **상태 머신과 관측:** \`PENDING → APPROVED → COMPENSATING → CANCELLED\` 같은 명시적 상태, trace ID, 단계별 로그와 감사 기록을 남깁니다.
- **보상 실패:** 보상도 실패할 수 있습니다. 무한 자동 재시도 대신 경보, 수동 해결, 정산 프로세스까지 포함해야 합니다.`,
  steps: [
    "2PC Prepare — Coordinator가 모든 Participant에 PREPARE를 보내고, 각 DB는 lock과 복구 로그를 확보한 뒤 YES/NO로 투표합니다.",
    "2PC Commit — 모든 표가 YES이면 Coordinator가 결정을 durable log에 기록하고 COMMIT을 전파합니다. 각 DB는 커밋 후 lock을 해제합니다.",
    "2PC 장애와 Blocking — Prepare 이후 Coordinator 응답이 끊기면 Participant는 최종 결정을 임의로 바꾸지 못하고 복구를 기다립니다.",
    "Saga 정방향 실행 — Orchestrator가 주문 생성, 결제 승인, 재고 예약을 각각 독립된 로컬 트랜잭션으로 순서대로 커밋합니다.",
    "Saga 부분 실패 — 재고 예약 실패를 감지하면 새 정방향 단계를 멈추고 완료된 단계 목록을 기준으로 보상 계획을 확정합니다.",
    "Saga 역순 보상 — 결제를 환불하고 주문을 취소합니다. 각 보상은 멱등하게 재시도되며 실패 시 운영자 개입 상태로 남습니다.",
  ],
  examples: [
    "은행 내부 원장 이체 — 짧은 범위의 강한 원자성이 필요하고 참여 DB가 XA를 지원하면 2PC 검토",
    "항공권·호텔·렌터카 예약 — 외부 시스템과 장시간 상호작용하므로 예약 취소 보상을 가진 Saga 적용",
    "이커머스 주문 — 주문 생성 → 결제 승인 → 재고 예약 실패 시 환불과 주문 취소를 역순 실행",
    "포인트와 쿠폰 사용 — 중복 요청을 idempotency key로 막고 보상 시 포인트·쿠폰을 다시 지급",
    "데이터베이스 Shard 간 갱신 — 강한 원자성이 필요한 소수 쓰기는 2PC, 장기 업무 흐름은 Saga로 경계 분리",
    "메시지 기반 Saga — Transactional Outbox와 Inbox로 DB 상태와 이벤트 전달 사이의 유실·중복 제어",
  ],
  related: [
    {
      slug: "db-replication-sharding",
      category: "workflow",
      relation: "여러 Shard와 Replica로 데이터가 나뉜 환경에서 트랜잭션 경계가 확장되는 이유",
    },
    {
      slug: "message-queue-event-driven",
      category: "workflow",
      relation: "Saga 이벤트 전달, 재시도, DLQ를 구성하는 비동기 메시징 기반",
    },
    {
      slug: "monolith-vs-msa",
      category: "workflow",
      relation: "단일 DB 로컬 트랜잭션에서 서비스별 DB 분산 트랜잭션으로 바뀌는 구조",
    },
    {
      slug: "cap-theorem",
      category: "workflow",
      relation: "네트워크 분할과 부분 실패에서 일관성·가용성 요구를 결정하는 기준",
    },
  ],
};
