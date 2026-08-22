import { ContentItem } from "../content-types";

export const heapSortContent: ContentItem = {
  slug: "heap-sort",
  category: "algorithm",
  title: "힙 정렬",
  subtitle: "최대 힙을 활용하여 O(n log n)을 보장하는 제자리 정렬",
  tags: [
    "Sort",
    "O(n log n)",
    "Heap"
  ],
  description: `힙 정렬(Heap Sort)은 완전 이진 트리 기반의 최대 힙(Max-Heap) 자료구조를 활용하여, 루트 노드의 최댓값을 반복 추출하며 정렬하는 $O(n \log n)$ 보장 제자리 정렬(In-Place Sort) 알고리즘입니다.

### 1. 힙(Heap) 자료구조의 핵심 성질
- **최대 힙 속성:** 부모 노드의 키가 자식 노드의 키보다 항상 크거나 같은 완전 이진 트리입니다.
- **1차원 배열 매핑:** 인덱스 $i$에 대해 왼쪽 자식은 $2i+1$, 오른쪽 자식은 $2i+2$, 부모는 $\lfloor(i-1)/2\rfloor$로 추가 포인터 메모리 없이 $O(1)$에 접근합니다.
- **복잡도:** 최선, 평균, 최악 모두 $O(n \log n)$ 시간 복잡도와 $O(1)$ 보조 공간 복잡도를 가집니다.

### 2. 힙 정렬의 2단계 동작 프로세스
- **최대 힙 구축 (Build Max-Heap):** 정렬되지 않은 원본 배열의 마지막 부모 노드($\lfloor n/2 \rfloor - 1$)부터 루트(0)까지 역순으로 \`Heapify\`(하향 재조정)를 수행하여 전체 배열을 $O(n)$ 시간에 최대 힙으로 변환합니다.
- 최댓값 추출 및 힙 축소 (Extract Max & Sift-Down): 루트 노드(최댓값)를 현재 힙의 마지막 원소와 교환한 뒤, 힙 크기를 1 줄이고 루트에서 다시 \`Heapify\`를 실행하여 힙 속성을 복원합니다. 이 과정을 힙 크기가 1이 될 때까지 반복합니다.`,
  steps: [
    "Build Max-Heap: 배열 중간부터 역순으로 Heapify 적용 (O(n))",
    "루트(최대값)를 배열의 마지막 원소와 교환",
    "힙 크기를 1 감소 후 루트에서 Heapify 재적용",
    "2~3단계를 힙 크기가 1이 될 때까지 반복",
    "배열이 오름차순으로 정렬 완료"
  ],
  examples: [
    "우선순위 큐(Priority Queue) 구현",
    "실시간 스트림에서 Top-K 원소 추출",
    "메모리 제약 환경에서 O(n log n) 보장이 필요한 경우"
  ],
  complexity: {
    best: "O(n log n)",
    avg: "O(n log n)",
    worst: "O(n log n)",
    space: "O(1)",
    stable: false
  },
  related: [
    { slug: "selection-sort", category: "algorithm", relation: "선택 정렬의 최솟값/최댓값 탐색 시간을 O(log n)으로 개선한 구조" },
    { slug: "scheduling", category: "algorithm", relation: "우선순위 큐(Priority Queue) 기반 CPU 작업 스케줄링" },
    { slug: "dijkstra", category: "algorithm", relation: "최소 힙(Min-Heap)을 이용한 다익스트라 최단 거리 경로 최적화" }
  ]
};
