import { ContentItem } from "../content-types";

export const bubbleSortContent: ContentItem = {
  slug: "bubble-sort",
  category: "algorithm",
  title: "버블 정렬",
  subtitle: "인접한 두 원소를 반복 비교·교환하는 기초 정렬",
  tags: [
    "Sort",
    "O(n²)",
    "Comparison"
  ],
  description: `버블 정렬(Bubble Sort)은 인접한 두 원소를 비교하여 순서가 맞지 않으면 서로 교환(Swap)하는 과정을 반복하며, 각 회차마다 가장 큰 원소가 거품(Bubble)처럼 배열의 맨 뒤로 밀려 올라가는 기초 비교 정렬 알고리즘입니다.

### 1. 버블 정렬의 핵심 동작 원리
- **인접 원소 비교 및 교환:** 배열의 첫 번째 원소부터 마지막 미정렬 원소까지 인접한 두 값을 비교하여 앞의 값이 더 크면 교환합니다.
- **패스(Pass)별 최댓값 확정:** 1회 순회가 끝날 때마다 현재 미정렬 구간의 최댓값이 배열 우측 끝에 영구 고정됩니다.
- **조기 종료 최적화 (Early Exit):** 한 패스 동안 단 한 번의 원소 교환도 발생하지 않았다면 이미 전체 배열이 정렬된 상태이므로 루프를 즉시 탈출하여 최선 $O(n)$ 시간에 종료합니다.

### 2. 복잡도 및 특성
- **시간 복잡도:** 최선 $O(n)$ (이미 정렬된 경우), 평균 및 최악 $O(n^2)$ (역순 정렬인 경우)
- **공간 복잡도:** $O(1)$ 보조 메모리만을 사용하는 제자리 정렬(In-Place Sort)
- **안정 정렬 (Stable Sort):** 동일한 값을 가진 원소 간에는 스왑이 일어나지 않으므로 상대적 순서가 보존됩니다.`,
  steps: [
    "0번째 원소부터 (n-1)번째 원소까지 인접 비교",
    "arr[i] > arr[i+1]이면 두 원소 교환 (swap)",
    "한 패스 완료 후 배열 끝에 최대값 고정",
    "다음 패스는 마지막 고정 원소를 제외하고 반복",
    "교환이 한 번도 없으면 이미 정렬됨 → 조기 종료"
  ],
  examples: [
    "알고리즘 교육 및 정렬 개념 입문",
    "소규모 데이터 또는 거의 정렬된 데이터"
  ],
  complexity: {
    best: "O(n)",
    avg: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: true
  },
  related: [
    { slug: "insertion-sort", category: "algorithm", relation: "O(n²) 정렬 중 거의 정렬된 데이터에서 높은 효율을 보이는 정렬" },
    { slug: "quick-sort", category: "algorithm", relation: "분할 정복(Divide & Conquer)을 활용해 O(n log n)으로 개선한 정렬" }
  ]
};
