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
    description: `버블 정렬은 인접한 두 원소를 비교하여 순서가 잘못된 경우 교환하는 과정을 반복합니다. 각 패스마다 가장 큰 원소가 끝으로 "버블링"되어 올라갑니다.

## 복잡도
- 시간 복잡도: 최선 O(n) | 평균·최악 O(n²)
- 공간 복잡도: O(1) (제자리 정렬)
- 안정(Stable) 정렬: 동일한 값의 원소 순서 유지

## 특징과 한계
구현이 매우 단순하지만 n이 커질수록 성능이 급격히 저하됩니다. 이미 정렬된 배열에 대해 조기 종료(Early Termination) 최적화를 적용하면 O(n)이 됩니다. 교육용·소규모 데이터 외에는 실무에서 거의 사용되지 않습니다.`,
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

