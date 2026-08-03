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
    description: `선택 정렬은 정렬되지 않은 부분에서 최솟값을 찾아 맨 앞 원소와 교환하는 과정을 반복합니다. 각 패스마다 정렬된 부분이 하나씩 늘어납니다.

## 복잡도
- 시간 복잡도: 최선·평균·최악 모두 O(n²)
- 공간 복잡도: O(1) (제자리 정렬)
- 불안정(Unstable) 정렬: 동일한 값의 원소 순서가 바뀔 수 있음

## 특징
버블 정렬에 비해 교환 횟수가 적습니다(패스당 최대 1번). 데이터 이동 비용이 매우 클 때 상대적으로 유리할 수 있지만, 비교 횟수는 여전히 O(n²)이라 실무에서는 잘 사용되지 않습니다.`,
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

