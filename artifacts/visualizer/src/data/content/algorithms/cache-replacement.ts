import { ContentItem } from "../content-types";

export const cacheReplacementContent: ContentItem = {
  slug: "cache-replacement",
  category: "algorithm",
  title: "캐시 교체 알고리즘 (Cache Replacement)",
  subtitle: "한정된 메모리 슬롯에서 효율적으로 데이터를 교체하는 5가지 알고리즘 실시간 대조",
  tags: ["Cache", "Memory", "OS"],
  description: `캐시 메모리는 한정된 고속 저장 공간이므로, 가용 슬롯이 꽉 찬 상태에서 새 데이터를 적재하려면 기존 데이터 중 하나를 방출(Eviction)해야 합니다.

### 1. FIFO (First-In, First-Out, 선입선출)
- **방출 기준:** 캐시에 가장 먼저 들어와 머문 시간이 가장 오래된 데이터를 방출합니다.
- **특성:** 구현이 큐(Queue)로 매우 간단하지만, 자주 조회되는 인기 데이터도 진입 시점이 오래되었다는 이유만으로 방출되는 벨레이디의 모순(Belady's Anomaly)이 발생할 수 있습니다.

### 2. LRU (Least Recently Used, 최근 최소 사용)
- **방출 기준:** 마지막으로 참조된 시점으로부터 가장 오랫동안 재사용되지 않은 데이터를 방출합니다.
- **특성:** 시간적 국소성(Temporal Locality)에 기반하여 실제 웹 브라우저, Redis, OS 페이지 교체에서 가장 표준적으로 널리 쓰입니다. 더블 링크드 리스트와 해시맵으로 $O(1)$에 구현됩니다.

### 3. LFU (Least Frequently Used, 최저 빈도 사용)
- **방출 기준:** 캐시 진입 후 지금까지 누적 참조된 횟수가 가장 적은 데이터를 방출합니다.
- **특성:** 참조 횟수 카운터를 유지해야 하며, 초기에 일시적으로 집중 사용된 후 더 이상 쓰이지 않는 데이터가 캐시를 오래 점유하는 한계가 있습니다.

### 4. Clock / Second Chance (2차 기회 알고리즘)
- **방출 기준:** 원형 큐와 1비트 참조 비트(Reference Bit)를 사용하여 LRU를 저비용으로 근사(Approximate)하는 OS 가상 메모리 페이지 교체 알고리즘입니다.
- **특성:** 시계 바늘이 돌며 참조 비트가 1인 페이지는 0으로 내리고 2차 기회를 준 뒤, 비트가 0인 페이지를 찾아 방출합니다.

### 5. Random (무작위 방출)
- **방출 기준:** 캐시 슬롯 중 무작위 난수로 대상을 선택하여 즉시 방출합니다.
- **특성:** 우선순위나 사용 이력을 관리하는 연산 오버헤드가 제로($O(1)$)이며, 복잡한 워크로드에서 성능 기준선(Baseline) 대조군으로 유용합니다.`,
  steps: [
    "Step 0: 초기 상태 - 크기가 3인 빈 캐시 슬롯에 데이터 유입을 대기합니다.",
    "Step 1: 데이터 A 로드 - 비어 있는 첫 번째 슬롯에 A가 저장됩니다 (Miss).",
    "Step 2: 데이터 B 로드 - 비어 있는 두 번째 슬롯에 B가 추가됩니다 (Miss).",
    "Step 3: 데이터 C 로드 - 비어 있는 세 번째 슬롯에 C가 추가됩니다 (Miss).",
    "Step 4: 데이터 A 재조회 - 이미 슬롯에 있는 A가 조회됩니다 (Hit). LRU는 A를 최근 사용으로 변경하고, LFU는 카운터를 증가시킵니다.",
    "Step 5: 데이터 D 로드 - 캐시가 꽉 차서 하나를 방출해야 합니다 (Miss). FIFO는 A, LRU/LFU는 B, Clock은 A를 방출하고 D를 저장합니다.",
    "Step 6: 데이터 B 로드 - 꽉 찬 상태에서 B가 다시 유입됩니다. FIFO는 Hit가 발생하지만 다른 알고리즘은 캐시 교체(Miss)가 일어납니다."
  ],
  examples: [
    "웹 브라우저 이미지 및 스크립트 캐시 정책",
    "데이터베이스 버퍼 캐시 (Redis/DB Buffer Pool)",
    "운영체제(OS) 가상 메모리 페이지 교체 정책"
  ],
  complexity: {
    best: "O(1)",
    avg: "O(1)",
    worst: "O(1) ~ O(log N)",
    space: "O(N)"
  },
  related: [
    { slug: "global-post-retrieval", category: "workflow", relation: "메모리 캐시 교체 정책을 활용하는 피드 데이터 조회" },
    { slug: "db-indexing", category: "workflow", relation: "DB 버퍼 풀(Buffer Pool) 메모리 교체 메커니즘" },
    { slug: "scheduling", category: "algorithm", relation: "OS 자원 관리 및 선점/비선점 스케줄링 기법" }
  ]
};
