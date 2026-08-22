import { ContentItem } from "../content-types";

export const capTheoremContent: ContentItem = {
  slug: "cap-theorem",
  category: "workflow",
  title: "분산 시스템을 위한 CAP 정리",
  subtitle: "Consistency, Availability, Partition Tolerance와 CP / AP 트레이드오프 시각화",
  tags: [
    "Distributed Systems",
    "CAP Theorem",
    "Consistency",
    "Availability",
    "Partition Tolerance",
    "Database Architecture"
  ],
  description: `CAP 정리(Brewer's CAP Theorem)는 분산 컴퓨터 시스템이 일관성(Consistency), 가용성(Availability), 분할 내성(Partition Tolerance)의 3가지 속성을 동시에 완벽하게 만족할 수 없다는 분산 시스템의 근본적인 트레이드오프 이론입니다.

### 1. CAP 3대 핵심 요소 정의
- **Consistency (일관성):** 분산 노드 중 어느 노드에서 데이터를 조회하더라도 항상 가장 최신의 쓰기 결과를 읽거나, 그렇지 못하면 즉시 에러를 반환해야 합니다.
- **Availability (가용성):** 클러스터 내 일부 노드가 비정상 상태이더라도, 정상적인 모든 노드는 언제나 에러 없이 유효한 200 OK 응답을 반환해야 합니다.
- **Partition Tolerance (분할 내성):** 노드 간의 네트워크 통신망이 단절(Partition)되거나 메시지 유실/지연이 발생하더라도 전체 클러스터 시스템이 멈추지 않고 가동을 유지해야 합니다.

### 2. 왜 현실의 분산 시스템은 CP 또는 AP인가?
물리적 네트워크 환경에서 케이블 단선, 라우터 지연, 스위치 고장 등으로 인한 네트워크 분할($P$)은 필연적으로 발생합니다.
- **CA 시스템의 불가능성:** 네트워크 분할($P$)이 전혀 없는 완벽한 네트워크는 물리적으로 불가능하므로, 실제 모든 분산 데이터베이스는 $P$를 전제하고 CP와 AP 중 하나를 선택해야 합니다.
- **CP 시스템 (일관성 우선):** 네트워크 단절 시 데이터 불일치를 막기 위해 최신 데이터가 동기화되지 않은 노드의 읽기/쓰기를 차단(에러 반환)하여 가용성을 희생합니다 (예: 은행 계좌 잔액, 금융 원장 시스템, RDBMS 클러스터, HBase).
- **AP 시스템 (가용성 우선):** 네트워크가 단절되더라도 일단 구버전 데이터(V1)라도 200 OK로 반환하여 서비스 중단을 막고, 네트워크 복구 후 최종 일관성(Eventual Consistency)으로 동기화합니다 (예: SNS 피드, 쇼핑몰 장바구니, Cassandra, DynamoDB).`,
  steps: [
    "Consistency (일관성) — 클라이언트가 특정 노드에 데이터를 기록하면, 다른 모든 노드에 즉시 동기화되어 어느 노드에서 읽더라도 항상 최신 데이터(V2)를 반환합니다.",
    "Availability (가용성) — 클러스터 내의 특정 노드에 장애가 발생하더라도, 살아있는 다른 노드들은 정상적으로 200 OK 응답을 반환하여 시스템의 가용성을 유지합니다.",
    "Partition Tolerance (분할 내성) — 노드들 간의 네트워크 연결이 끊어져 서로 통신할 수 없는 분할(Partition) 상태가 발생하더라도 시스템 전체가 중단되지 않고 가동을 유지합니다.",
    "CP 시스템의 동작 — 네트워크 분할 상태에서 새로운 데이터 쓰기가 발생하면, 일관성을 보장하기 위해 동기화되지 않은 노드는 클라이언트의 읽기 요청에 대해 에러(500)나 응답 거부 처리를 하여 가용성을 희생합니다.",
    "AP 시스템의 동작 — 네트워크 분할 상태에서도 가용성을 우선시하여 응답 거부 대신 예전 데이터(V1)라도 200 OK와 함께 반환합니다. 분할 복구 시점에 데이터가 최종적으로 일관성을 맞추게 됩니다."
  ],
  examples: [
    "금융 원장 시스템 (CP) — 은행의 잔고 확인 및 송금 시스템에서는 정확한 금액(일관성)이 중요하므로 네트워크 문제 발생 시 차라리 에러를 띄워 거래를 중단시킵니다.",
    "상품 리뷰 및 추천 피드 (AP) — 사용자가 가장 최근에 작성된 리뷰를 당장 보지 못하더라도(일관성 유예) 서비스 자체는 끊김 없이 보여주는(가용성) 것이 중요합니다."
  ],
  related: [
    { slug: "monolith-vs-msa", category: "workflow", relation: "분산 서비스 환경에서의 트레이드오프 기법" },
    { slug: "global-post-retrieval", category: "workflow", relation: "대규모 글로벌 게시글 조회에서의 AP 최종 일관성 적용" },
    { slug: "db-indexing", category: "workflow", relation: "분산 노드 간의 DB 저장 및 탐색 원리" }
  ]
};
