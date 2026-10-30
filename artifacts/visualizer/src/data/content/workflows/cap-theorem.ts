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
  description: `CAP 정리는 노드 간 네트워크 분할이 발생할 때 분산 데이터 시스템이 강한 일관성과 가용성을 동시에 보장할 수 없다는 제약을 설명합니다.

### 1. CAP 3대 핵심 요소 정의
- **Consistency (일관성):** 완료된 쓰기가 후속 읽기에서 하나의 최신 값으로 관찰되는 선형화 가능성(linearizability)을 뜻합니다.
- **Availability (가용성):** 클러스터 내 일부 노드가 비정상 상태이더라도, 정상적으로 동작하는 노드에 도착한 요청이 유한 시간 내에 응답을 받는 성질입니다. HTTP 상태 코드 자체로 정의되지는 않습니다.
- **Partition Tolerance (분할 내성):** 노드 사이의 메시지가 손실되거나 상당히 지연되는 네트워크 분할 상황을 시스템이 견뎌야 한다는 조건입니다.

### 2. 왜 현실의 분산 시스템은 CP 또는 AP인가?
물리적 네트워크 환경에서 케이블 단선, 라우터 지연, 스위치 고장 등으로 인한 네트워크 분할($P$)은 필연적으로 발생합니다.
- **분할 상황의 선택:** 네트워크 분할을 고려하는 분산 데이터베이스는 분할이 발생했을 때 일관성과 가용성 사이에 선택이 필요합니다. 평상시에도 항상 고정된 CP/AP 두 범주로만 구분되는 것은 아닙니다.
- **CP 시스템 (일관성 우선):** 네트워크 단절 시 데이터 불일치를 막기 위해 최신 데이터가 동기화되지 않은 노드의 읽기/쓰기를 차단(에러 반환)하여 가용성을 희생합니다 (예: 은행 계좌 잔액, 금융 원장 시스템, RDBMS 클러스터, HBase).
- **AP 시스템 (가용성 우선):** 네트워크가 단절되더라도 일단 구버전 데이터(V1)라도 200 OK로 반환하여 서비스 중단을 막고, 네트워크 복구 후 최종 일관성(Eventual Consistency)으로 동기화합니다 (예: SNS 피드, 쇼핑몰 장바구니, Cassandra, DynamoDB).`,
  learningObjectives: ["네트워크 분할 발생 시 일관성과 가용성 사이의 선택이 무엇인지 설명할 수 있다."],
  commonMistakes: ["CAP의 Availability는 모든 요청에 HTTP 200을 보장한다는 뜻이 아닙니다. 정상 노드의 요청이 종료된 응답을 반환하는 성질을 뜻합니다."],
  keyTakeaways: ["CAP의 일관성은 선형화 가능한 단일 복사본 일관성 관점이며, 비분할 상황의 성능 및 지연을 설명하는 정리는 아닙니다."],
  exercises: [{"question":"CAP 정리의 선택이 특히 중요해지는 상황은?","options":["네트워크 분할 발생 시","모든 메시지가 항상 즉시 전달될 때","단일 프로세스의 정렬 실행 시"],"answerIndex":0,"explanation":"노드 간 통신이 끊어진 상태에서 일관성과 가용성을 동시에 보장할 수 없다는 제약을 다룹니다."}],
  steps: [
    "Consistency — 완료된 쓰기 결과가 후속 요청에서 하나의 최신 값으로 관찰되는 선형화 가능성을 뜻합니다.",
    "Availability — 정상 노드에 도착한 요청이 유한 시간 안에 응답을 받는 성질이며 HTTP 200 고정과 동일하지 않습니다.",
    "Partition Tolerance — 일부 노드 간 통신이 끊긴 분할 상황에서도 동작 모델을 정의해야 합니다.",
    "CP 선택 — 분할 구간에서 최신 값의 일관성을 확신할 수 없는 일부 요청을 보류하거나 거절할 수 있습니다.",
    "AP 선택 — 분할 중에도 응답을 제공하는 대신 일시적으로 서로 다른 상태를 관찰할 수 있으며 복구 후 동기화가 필요합니다."
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
