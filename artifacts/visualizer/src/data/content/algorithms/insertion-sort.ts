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
  description: `삽입 정렬(Insertion Sort)은 아직 정렬되지 않은 원소를 하나씩 꺼내어 이미 정렬이 완료된 앞부분 배열의 올바른 위치를 찾아 삽입하는 정렬 알고리즘입니다.

### 1. 손패 정렬 메커니즘
- **키(Key) 추출:** 1번 인덱스 원소부터 차례대로 현재 삽입할 타겟 \`key\`로 선택합니다.
- **시프트(Shift) 이동:** \`key\`보다 큰 좌측의 정렬된 원소들을 우측으로 한 칸씩 밀어냅니다.
- **최적 위치 삽입:** \`key\`보다 작거나 같은 원소를 만난 직후의 빈 공간에 \`key\`를 안착시킵니다.

### 2. 적응형(Adaptive) 특성과 실무 가치
- **거의 정렬된 배열에서 최고 속도:** 데이터가 이미 대부분 정렬되어 있다면 시프트 연산 없이 $O(n)$ 시간에 정렬을 완료합니다.
- **하이브리드 정렬의 핵심 서브루틴:** $N \le 32$ 수준의 소규모 구간에서는 퀵 정렬이나 병합 정렬보다 함수 호출 오버헤드가 적어 Python의 \`Timsort\`, V8 엔진의 정렬에서 베이스 알고리즘으로 채택됩니다.`,
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
  related: [
    { slug: "bubble-sort", category: "algorithm", relation: "O(n²) 정렬 중 적응형(Adaptive) 속성을 지닌 또 다른 단순 정렬" },
    { slug: "merge-sort", category: "algorithm", relation: "소규모 데이터에 삽입 정렬을 적용해 혼합 활용하는 하이브리드 정렬(Timsort)" }
  ]
};
