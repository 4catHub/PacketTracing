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
    description: `힙 정렬은 이진 최대 힙(Max-Heap) 자료구조를 활용한 정렬 알고리즘입니다. 배열을 힙으로 변환한 뒤, 루트(최댓값)를 반복적으로 추출하여 배열 끝에 배치합니다.

## 복잡도
- 시간 복잡도: 최선·평균·최악 모두 O(n log n)
- 공간 복잡도: O(1) (제자리 정렬)
- 불안정(Unstable) 정렬

## 힙(Heap)이란
완전 이진 트리 형태로, 부모 노드가 자식 노드보다 항상 크거나 같은(Max-Heap) 성질을 만족합니다. 배열로 표현할 때 인덱스 i의 왼쪽 자식은 2i+1, 오른쪽 자식은 2i+2입니다.

## 두 단계 흐름
1. Build Max-Heap: 배열을 최대 힙으로 변환 (O(n))
2. Extract Max 반복: 루트(최대값)를 배열 끝과 교환 후 힙 크기를 줄이고 Heapify 수행 (O(n log n))

힙 정렬은 O(n log n) 최악 보장과 O(1) 공간이라는 두 장점을 모두 가지지만, 캐시 지역성이 좋지 않아 실제 속도는 퀵 정렬보다 느린 경우가 많습니다.`,
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

