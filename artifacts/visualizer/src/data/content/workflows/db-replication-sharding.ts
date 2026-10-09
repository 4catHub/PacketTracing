import { ContentItem } from "../content-types";

export const dbReplicationShardingContent: ContentItem = {
  slug: "db-replication-sharding",
  category: "workflow",
  title: "DB Replication과 Sharding",
  subtitle: "같은 데이터를 복제하는 방법과 서로 다른 데이터를 분할하는 방법",
  tags: [
    "Database",
    "Replication",
    "Sharding",
    "High Availability",
    "Horizontal Scaling",
  ],
  description: `Replication은 같은 데이터를 여러 노드에 복사하고, Sharding은 전체 데이터를 여러 노드에 나누어 저장합니다. 전자는 읽기 확장·장애 복구가 주목적이고, 후자는 한 서버의 저장 용량과 쓰기 처리량 한계를 넘는 것이 주목적입니다. 실제 대규모 데이터베이스는 각 Shard를 다시 여러 Replica로 구성해 두 축을 함께 사용합니다.

## 1. Replication과 Sharding의 역할 차이

| 구분 | Replication | Sharding |
|---|---|---|
| 데이터 배치 | 동일한 데이터의 복사본 | 서로 다른 데이터 부분집합 |
| 주된 목적 | 고가용성, 읽기 확장, 재해 복구 | 저장 용량, 쓰기 처리량의 수평 확장 |
| 대표 위험 | Replication lag, 오래된 읽기, failover 정합성 | Hot shard, 재분배, cross-shard 쿼리 |
| 장애 대응 | Replica 승격으로 서비스 복구 | Shard마다 별도의 Replica 구성이 필요 |

- **서로의 대체재가 아님:** Replica를 늘려도 모든 쓰기가 같은 데이터 집합에 반영되므로 단일 Writer의 쓰기 한계는 그대로일 수 있습니다. Shard만 나누고 복제하지 않으면 한 Shard 장애가 곧 그 범위의 데이터 손실 또는 중단으로 이어집니다.
- **실전의 단위:** 보통 \`Shard A = Primary + Replica 1 + Replica 2\`처럼 각 Shard가 하나의 복제 그룹을 이룹니다.

## 2. Replication의 쓰기와 읽기 흐름
Leader–Follower 방식에서 쓰기는 해당 Shard의 Primary(Leader)에 먼저 적용되고, WAL/binlog 같은 변경 로그가 Replica(Follower)로 전달됩니다.

- **동기 복제:** 하나 이상의 Replica가 변경을 안전하게 기록할 때까지 성공을 응답합니다. 데이터 손실 가능성은 낮지만 네트워크 왕복만큼 쓰기 지연과 장애 민감도가 커집니다.
- **비동기 복제:** Primary가 로컬 커밋 후 먼저 응답하고 Replica는 뒤따라갑니다. 쓰기는 빠르지만 장애 순간 아직 전달되지 않은 변경이 유실될 수 있습니다.
- **읽기 분산:** 오래되어도 괜찮은 조회는 Replica로 보내 Primary 부하를 줄일 수 있습니다. 방금 쓴 값을 즉시 읽어야 한다면 Primary 읽기, 세션 고정, 복제 위치 대기 같은 Read-your-writes 전략이 필요합니다.
- **Failover:** Primary 장애를 감지한 뒤 가장 최신 Replica를 새 Primary로 승격하고 라우팅 epoch를 갱신합니다. 오래된 Primary가 다시 쓰기를 받는 Split Brain을 막기 위해 quorum, lease, fencing token이 필요합니다.

## 3. Sharding의 라우팅과 키 선택
애플리케이션이나 Shard Router는 Partition Key를 보고 요청이 향할 Shard를 결정합니다. 좋은 키는 데이터를 고르게 나누면서 자주 함께 조회하는 데이터를 같은 Shard에 모읍니다.

- **Hash Sharding:** \`hash(userId) % N\` 또는 Consistent Hashing으로 고르게 분산합니다. 범위 조회는 어렵지만 특정 시간대나 지역에 쓰기가 몰리는 현상을 줄일 수 있습니다.
- **Range Sharding:** 날짜, ID 구간처럼 연속 범위를 나눕니다. 범위 조회는 쉽지만 최근 날짜나 증가하는 ID의 끝 Shard가 Hotspot이 되기 쉽습니다.
- **Directory 기반:** 별도 메타데이터가 key와 Shard의 매핑을 관리합니다. 유연하지만 Router와 메타데이터 계층의 가용성이 중요합니다.
- **잘못된 키의 비용:** 국가처럼 값 종류가 적거나 트래픽 편차가 큰 키는 일부 Shard만 과열시킵니다. 높은 cardinality, 균등한 분포, 주요 쿼리 패턴을 함께 고려해야 합니다.

## 4. Scatter–Gather와 분산 쿼리 비용
Partition Key가 없는 조회는 Router가 여러 Shard에 쿼리를 병렬 전송한 뒤 결과를 합쳐야 합니다. 가장 느린 Shard가 전체 응답 시간을 결정하고, 전역 정렬·집계·JOIN·pagination은 네트워크와 메모리를 더 사용합니다.

- 가능한 요청에는 Partition Key를 포함하고, 자주 필요한 전역 조회는 별도 검색 인덱스나 집계 테이블로 모델링합니다.
- Global Secondary Index도 자체적으로 분할·복제·동기화해야 하므로 쓰기 증폭과 최종 일관성 비용이 생깁니다.
- 여러 Shard를 동시에 갱신하면 단일 DB 트랜잭션 경계를 벗어납니다. 강한 원자성이 꼭 필요하면 2PC를, 장기 비즈니스 흐름이면 Saga와 보상을 검토합니다.

## 5. Rebalancing과 운영 안전장치
Shard가 커지면 새로운 노드를 추가하고 일부 key range를 복사한 뒤 라우팅을 전환합니다. 복사 중에도 쓰기가 계속되므로 snapshot 이후 변경 로그 추적, dual read/write 또는 짧은 cutover가 필요합니다.

- **안전한 전환:** 새 Shard를 \`JOINING\`으로 등록 → snapshot 복사 → 변경 로그 catch-up → 검증 → 라우팅 epoch 전환 → 이전 복사본 정리 순서로 진행합니다.
- **관측 지표:** Replica lag, WAL 보존량, Shard별 QPS·데이터 크기·p95 지연, failover 시간, scatter fan-out 수를 함께 봅니다.
- **백업과 복제의 차이:** Replica는 실수로 삭제한 데이터도 빠르게 복제합니다. 시점 복구가 가능한 독립 백업과 복구 훈련은 별도로 필요합니다.`,
  steps: [
    "Partition Key 라우팅 — 클라이언트 요청의 `userId`를 Shard Router가 해석해 담당 Primary를 선택합니다.",
    "Primary 쓰기와 복제 — 담당 Primary가 로컬 트랜잭션을 커밋하고 WAL 변경을 Replica에 전달합니다. 동기/비동기 정책에 따라 응답 시점이 달라집니다.",
    "Replica 읽기 — 읽기 허용 수준에 따라 Replica로 조회를 분산합니다. 복제 지연이 있으면 방금 쓴 값보다 오래된 값을 볼 수 있습니다.",
    "Shard별 병렬 처리 — 서로 다른 Partition Key는 각 Shard에서 독립적으로 처리되어 저장 용량과 쓰기 처리량이 수평 확장됩니다.",
    "Scatter–Gather — Partition Key가 없는 전역 조회는 모든 Shard로 fan-out되고, Router가 결과를 병합하며 가장 느린 Shard를 기다립니다.",
    "Rebalancing — 대상 key range를 새 Shard로 복사하고 변경 로그를 따라잡은 뒤 라우팅 epoch를 원자적으로 전환합니다.",
    "Failover — Primary 장애 시 최신 Replica를 승격하고 fencing으로 이전 Primary의 쓰기를 차단한 뒤 Router를 새 Primary로 연결합니다.",
  ],
  examples: [
    "커머스 주문 DB — `customerId`로 Shard를 선택하고 각 Shard를 다중 AZ Replica로 구성",
    "소셜 피드 — 사용자 홈 Shard의 쓰기는 Primary가 처리하고 오래되어도 되는 피드 조회는 Replica로 분산",
    "시계열 데이터 — 시간 Range Sharding에 hash suffix를 더해 최신 구간의 Hotspot 완화",
    "멀티테넌트 SaaS — `tenantId` 기반 Directory Sharding으로 큰 고객을 전용 Shard로 이동",
    "글로벌 서비스 — 지역별 Primary와 로컬 Read Replica를 배치하고 허용 가능한 일관성 수준에 맞춰 라우팅",
    "대규모 검색 — 운영 DB의 cross-shard 검색 대신 변경 이벤트로 별도 검색 인덱스를 구축",
  ],
  related: [
    {
      slug: "distributed-transactions-2pc-saga",
      category: "workflow",
      relation: "여러 Shard나 서비스를 함께 갱신할 때 2PC와 Saga로 원자성·보상을 설계하는 방법",
    },
    {
      slug: "load-balancing-consistent-hashing",
      category: "workflow",
      relation: "서버 증감 시 데이터 이동 범위를 줄이는 Consistent Hashing과 라우팅 원리",
    },
    {
      slug: "cap-theorem",
      category: "workflow",
      relation: "네트워크 분할 중 복제 그룹이 일관성과 가용성 사이에서 선택하는 기준",
    },
    {
      slug: "db-indexing",
      category: "workflow",
      relation: "각 Shard 내부에서 인덱스가 읽기와 쓰기 비용을 바꾸는 방식",
    },
  ],
};
