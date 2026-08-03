import { ContentItem } from "../content-types";

export const mergeSortContent: ContentItem = {
    slug: "merge-sort",
    category: "algorithm",
    title: "병합 정렬",
    subtitle: "분할 정복으로 O(n log n)을 보장하는 안정 정렬",
    tags: [
    "Sort",
    "O(n log n)",
    "Divide & Conquer"
],
    description: `병합 정렬은 배열을 절반으로 재귀적으로 분할하고, 분할된 두 배열을 정렬된 상태로 병합하는 분할 정복(Divide & Conquer) 알고리즘입니다.

## 복잡도
- 시간 복잡도: 최선·평균·최악 모두 O(n log n)
- 공간 복잡도: O(n) (추가 배열 필요)
- 안정(Stable) 정렬: 동일한 값의 원소 순서 유지

## 특징
어떤 입력에도 O(n log n)을 보장하는 신뢰성이 가장 큰 장점입니다. 추가 메모리(O(n))가 필요하지만, 링크드 리스트 정렬에서는 O(1) 공간으로 구현 가능합니다. Java의 Arrays.sort(Object[])와 Python의 Timsort 기반이 병합 정렬에서 출발했습니다.

## 병합 단계
두 정렬된 배열을 합칠 때, 각 배열의 맨 앞 원소를 비교하여 더 작은 것을 결과 배열에 넣는 과정을 반복합니다. 이 병합 연산의 시간 복잡도는 O(n)이며, log n번의 분할 레벨을 거치므로 전체 O(n log n)이 됩니다.`,
  steps: [
    "배열을 절반으로 분할 (재귀적으로 길이 1이 될 때까지)",
    "길이 1인 배열은 이미 정렬된 상태",
    "두 정렬된 배열을 병합: 각 배열 맨 앞 원소를 비교하며 작은 것을 결과에 추가",
    "한쪽 배열이 소진되면 나머지 배열을 결과에 이어 붙임",
    "재귀 호출이 반환될수록 점점 큰 단위가 정렬 완료"
],
    examples: [
    "Java Arrays.sort(Object[]) 내부 구현",
    "외부 정렬(External Sort): 디스크의 대용량 파일 정렬",
    "링크드 리스트 정렬 (추가 메모리 없이 O(n log n))",
    "안정 정렬이 필요한 다중 키 정렬"
],
  complexity: {
    best: "O(n log n)",
    avg: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
    stable: true
},
    related: [
      { slug: "quick-sort", category: "algorithm", relation: "분할 정복 기반 대표 O(n log n) 정렬 (제자리 정렬 vs 추가 메모리 필요)" },
      { slug: "insertion-sort", category: "algorithm", relation: "소규모 데이터 하이브리드 병합 정렬(Timsort)과의 결합" }
    ]
};

