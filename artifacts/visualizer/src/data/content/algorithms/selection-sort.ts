import { ContentItem } from "../content-types";

export const selectionSortContent: ContentItem = {
  slug: "selection-sort",
  category: "algorithm",
  title: "선택 정렬",
  subtitle: "매 패스마다 최솟값을 찾아 앞으로 가져오는 정렬",
  tags: [
    "Sort",
    "O(n²)",
    "Comparison"
  ],
  description: `선택 정렬(Selection Sort)은 미정렬 구간을 전수 조사하여 가장 작은 최솟값(Minimum)의 위치를 찾은 뒤, 미정렬 구간의 맨 첫 번째 원소와 단 한 번만 교환(Swap)하는 정렬 알고리즘입니다.

### 1. 선택 정렬의 핵심 메커니즘
- **최솟값 탐색 (Find Minimum):** 현재 인덱스 $i$부터 배열 끝까지 선형 탐색하여 가장 작은 값의 인덱스(\`min_idx\`)를 찾습니다.
- **단일 스왑 (Single Swap):** 찾은 최솟값을 $i$번째 원소와 맞바꿉니다. 패스당 스왑 횟수가 정확히 1회로 제한됩니다.
- **정렬 경계 확장:** 정렬 완료 경계를 우측으로 한 칸 이동시키며 $n-1$회 반복합니다.

### 2. 복잡도 및 트레이드오프
- **시간 복잡도:** 데이터 정렬 상태와 무관하게 항상 $O(n^2)$ 비교 연산을 수행합니다.
- **교환 횟수 최소화:** 버블 정렬 대비 스왑 횟수가 최대 $n$회에 불과하여 메모리 쓰기(Write) 비용이 매우 비싼 특수 임베디드 장치에 유용합니다.
- **불안정 정렬 (Unstable Sort):** 원거리 스왑으로 인해 동일한 키를 가진 원소의 상대적 순서가 뒤바뀔 수 있습니다.`,
  steps: [
    "미정렬 영역(0~n-1)에서 최솟값의 인덱스를 찾음",
    "최솟값을 미정렬 영역의 첫 번째 원소와 교환",
    "정렬 경계를 오른쪽으로 한 칸 이동",
    "n-1회 반복 후 완전 정렬 완료"
  ],
  examples: [
    "교환 비용이 큰 환경(예: 플래시 메모리 쓰기 최소화)",
    "알고리즘 비교 학습 (버블 정렬과 비교)"
  ],
  complexity: {
    best: "O(n²)",
    avg: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: false
  },
  related: [
    { slug: "bubble-sort", category: "algorithm", relation: "인접 원소 swap 대신 최솟값 찾기 교환을 수행하는 기초 정렬" },
    { slug: "heap-sort", category: "algorithm", relation: "최솟값 선택 과정을 힙(Heap) 트리로 O(log n)으로 개선한 정렬" }
  ]
};
