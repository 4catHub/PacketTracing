import { ContentItem } from "../content-types";

export const cacheReplacementContent: ContentItem = {
  slug: "cache-replacement",
  category: "algorithm",
  title: "캐시 교체 알고리즘 (Cache Replacement)",
  subtitle: "한정된 메모리 슬롯에서 효율적으로 데이터를 교체하는 5가지 알고리즘 실시간 대조",
  tags: ["Cache", "Memory", "OS"],
  description: `캐시 메모리는 한정되어 있으므로 새 데이터를 저장하려면 기존 데이터 중 하나를 찾아 지워야(방출, Eviction) 합니다. 이를 결정하는 5가지 주요 알고리즘의 동작 과정을 비교합니다.

### 1. FIFO (First-In, First-Out)
- 가장 먼저 들어와서 캐시에 머문 시간이 가장 오래된 데이터를 방출합니다.
- 구현이 매우 단순하지만, 최근에 자주 쓰이는 데이터도 무조건 오래되었다는 이유로 삭제되는 단점이 있습니다.

### 2. LRU (Least Recently Used)
- 가장 오랫동안 사용되지 않은 데이터를 방출합니다.
- 시간적 국소성(Temporal Locality) 원리에 근거하며 실제 시스템에서 가장 널리 활용됩니다.

### 3. LFU (Least Frequently Used)
- 지금까지 참조된 횟수가 가장 적은 데이터를 방출합니다.
- 참조 횟수를 기록해야 하며, 초기에 집중적으로 사용되다가 더 이상 안 쓰이는 데이터가 캐시에 남아있는 단점이 있습니다.

### 4. Clock / Second Chance
- 원형 큐와 참조 비트(1비트)를 활용하여 LRU를 O(1)에 효율적으로 모사하는 OS 페이지 교체 알고리즘입니다.
- 시계 바늘이 돌며 최근 접근된 데이터에 두 번째 기회(Second Chance)를 줍니다.

### 5. Random
- 캐시 슬롯 중 무작위로 하나를 선택하여 즉시 방출합니다.
- 별도의 이력이나 우선순위를 유지할 필요가 없어 연산 오버헤드가 제로(0)에 수렴하며, 교체 효율도 나쁘지 않아 대조군으로 유용합니다.`,
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

