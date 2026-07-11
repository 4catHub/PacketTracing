import { ContentItem } from "../content-types";

export const insertionSortContent: ContentItem = {
    slug: "insertion-sort",
    category: "algorithm",
    title: "삽입 정렬",
    subtitle: "카드 패 정리하듯 원소를 적절한 위치에 삽입하는 정렬",
    tags: [
    "Sort",
    "O(n²)",
    "Adaptive"
],
    description: `삽입 정렬은 정렬되지 않은 원소를 하나씩 꺼내어 이미 정렬된 부분의 올바른 위치에 삽입합니다. 카드 게임에서 손패를 정리하는 방식과 동일합니다.

## 복잡도
- 시간 복잡도: 최선 O(n) | 평균·최악 O(n²)
- 공간 복잡도: O(1) (제자리 정렬)
- 안정(Stable) 정렬: 동일한 값의 원소 순서 유지

## 특징 및 장점
거의 정렬된 배열에서 O(n)에 가까운 성능을 보이는 적응형(Adaptive) 알고리즘입니다. 소규모 데이터(n < 30)에서는 퀵 정렬보다 빠른 경우가 있어, 많은 라이브러리의 하이브리드 정렬(예: Python Timsort)에서 소규모 구간에 삽입 정렬을 사용합니다.`,
  steps: [
    "인덱스 1부터 시작, 현재 원소(key)를 임시 저장",
    "정렬된 부분(왼쪽)에서 key보다 큰 원소들을 오른쪽으로 한 칸씩 이동",
    "빈 자리에 key 삽입",
    "인덱스를 1씩 증가하며 배열 끝까지 반복"
],
    examples: [
    "거의 정렬된 데이터의 실시간 정렬",
    "Python Timsort, Java Arrays.sort() 소규모 구간 서브루틴",
    "온라인 정렬 (데이터가 하나씩 도착할 때)"
],
  complexity: {
    best: "O(n)",
    avg: "O(n²)",
    worst: "O(n²)",
    space: "O(1)",
    stable: true
},
};
