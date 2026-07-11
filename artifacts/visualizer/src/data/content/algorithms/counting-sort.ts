import { ContentItem } from "../content-types";

export const countingSortContent: ContentItem = {
    slug: "counting-sort",
    category: "algorithm",
    title: "계수 정렬",
    subtitle: "비교 없이 O(n+k)에 정렬하는 비교 기반 하한 극복 알고리즘",
    tags: [
    "Sort",
    "O(n+k)",
    "Non-comparison"
],
    description: `계수 정렬은 원소를 서로 비교하지 않고, 각 값의 등장 횟수를 배열에 기록하여 정렬합니다. 비교 기반 정렬의 이론적 하한인 O(n log n)을 깨뜨립니다.

## 복잡도
- 시간 복잡도: O(n + k) — n: 원소 수, k: 값의 범위(최댓값)
- 공간 복잡도: O(n + k)
- 안정(Stable) 정렬 (구현에 따라 다름)

## 전제 조건과 한계
정수 또는 정수로 변환 가능한 값이어야 하며, 값의 범위(k)가 원소 수(n)에 비해 너무 크면 메모리 낭비가 심합니다. k가 n에 비례하거나 더 작을 때 가장 효율적입니다.

## 동작 방식
1. 각 값의 등장 횟수를 count 배열에 기록
2. count 배열을 누적합으로 변환 (정렬된 위치 정보)
3. 원래 배열을 역순으로 탐색하며 output 배열의 올바른 위치에 배치

라딕스 정렬(Radix Sort)의 내부 서브루틴으로 활용됩니다.`,
  steps: [
    "입력 배열의 최댓값(k)을 찾아 크기 k+1의 count 배열 초기화",
    "각 원소의 등장 횟수를 count 배열에 기록",
    "count 배열을 누적합으로 변환 (각 값의 마지막 위치 정보)",
    "입력 배열을 역순 탐색 → output 배열의 계산된 위치에 원소 배치",
    "output 배열을 원래 배열에 복사"
],
    examples: [
    "0~100 범위 시험 점수 정렬",
    "ASCII 문자 정렬",
    "Radix Sort의 내부 서브루틴",
    "히스토그램 기반 이미지 처리"
],
  complexity: {
    best: "O(n+k)",
    avg: "O(n+k)",
    worst: "O(n+k)",
    space: "O(n+k)",
    stable: true
},
};
