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
- **하이브리드 정렬의 핵심 서브루틴:** $N \le 32$ 수준의 소규모 구간에서는 퀵 정렬이나 병합 정렬보다 함수 호출 오버헤드가 적어 Python의 \`Timsort\`처럼 작은 실행(run)을 활용하는 하이브리드 정렬에서 구성 요소로 사용됩니다.

### 입력을 따라가는 실행 예제
[4, 2, 3]에서 2를 키로 잡으면 4를 한 칸 밀어 [2, 4, 3]을 만들고, 다음 키 3을 넣을 때 4를 밀어 [2, 3, 4]가 됩니다. 반대로 [2, 3, 4]에서는 원소를 옮길 필요가 없어 각 키마다 한 번의 경계 비교만 필요합니다.`,
  learningObjectives: ["키와 정렬된 접두 구간의 경계가 어떻게 이동하는지 설명할 수 있다."],
  commonMistakes: ["삽입 정렬은 임의의 두 원소를 교환하는 방식만 가능한 것이 아닙니다. 일반적으로 큰 원소를 오른쪽으로 밀고 키를 빈 자리에 넣습니다."],
  keyTakeaways: ["거의 정렬된 입력에서는 이동이 적어 효율적이지만 역순 입력에서는 이동 횟수가 제곱 규모로 증가합니다."],
  exercises: [{"question":"[4, 2, 3]에서 키 2를 삽입한 직후 상태는?","options":["[2, 4, 3]","[4, 3, 2]","[2, 3, 4]"],"answerIndex":0,"explanation":"정렬된 구간 [4]의 4를 오른쪽으로 밀고 2를 앞에 배치합니다."}],
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
