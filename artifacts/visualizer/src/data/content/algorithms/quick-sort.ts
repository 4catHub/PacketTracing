import { ContentItem } from "../content-types";

export const quickSortContent: ContentItem = {
    slug: "quick-sort",
    category: "algorithm",
    title: "퀵 정렬",
    subtitle: "피벗을 기준으로 분할하는 평균 O(n log n) 정렬",
    tags: [
    "Sort",
    "O(n log n)",
    "Divide & Conquer"
],
    description: `퀵 정렬은 피벗(Pivot) 원소를 기준으로 배열을 두 부분으로 분할하고 재귀적으로 정렬합니다. 실제 데이터에서 평균적으로 가장 빠른 비교 기반 정렬 알고리즘으로, 대부분의 언어 표준 라이브러리 정렬에 기반이 됩니다.

## 복잡도
- 시간 복잡도: 평균 O(n log n) | 최악 O(n²) (이미 정렬된 배열 + 나쁜 피벗 선택)
- 공간 복잡도: O(log n) (재귀 스택)
- 불안정(Unstable) 정렬

## 피벗 선택 전략
최악 케이스(이미 정렬된 배열)를 피하기 위해 다양한 피벗 선택 전략이 사용됩니다.

- 첫 번째 원소: 구현 단순, 이미 정렬된 배열에서 O(n²)
- 랜덤 선택: 최악 케이스 확률적으로 회피
- Median-of-Three: 첫·중간·마지막 원소의 중앙값 사용 (실무 표준)

## 왜 실제로 가장 빠른가
캐시 지역성(Cache Locality)이 매우 좋습니다. 제자리 정렬이므로 메모리 접근 패턴이 순차적이어서, 이론적으로 O(n log n)인 병합 정렬보다 실제 속도가 빠른 경우가 많습니다.`,
  steps: [
    "피벗 선택 (마지막 원소 또는 랜덤)",
    "피벗보다 작은 원소들을 왼쪽, 큰 원소들을 오른쪽으로 분할 (Partition)",
    "피벗을 최종 위치에 배치",
    "왼쪽 부분 배열, 오른쪽 부분 배열에 대해 재귀 적용",
    "부분 배열 크기가 1 이하면 종료"
],
    examples: [
    "C++ std::sort, Java Arrays.sort(int[]) 내부 알고리즘",
    "대규모 데이터 인메모리 정렬 (평균 케이스 최고 성능)",
    "데이터베이스 인덱스 구축",
    "k번째 원소 찾기 (QuickSelect 변형)"
],
  complexity: {
    best: "O(n log n)",
    avg: "O(n log n)",
    worst: "O(n²)",
    space: "O(log n)",
    stable: false
},
    related: [
      { slug: "merge-sort", category: "algorithm", relation: "분할 정복 기반 또 다른 O(n log n) 정렬 (안정 정렬 보장)" },
      { slug: "heap-sort", category: "algorithm", relation: "최악의 상황(O(n²)) 발생 시 힙 정렬로 전환하는 IntroSort 기법" }
    ]
};

