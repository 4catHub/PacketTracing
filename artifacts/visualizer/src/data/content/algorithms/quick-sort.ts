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
  description: `퀵 정렬(Quick Sort)은 기준 원소인 피벗(Pivot)을 선택하여 피벗보다 작은 값은 왼쪽, 큰 값은 오른쪽으로 분할(Partition)한 뒤 재귀적으로 정렬하는 대표적인 분할 정복(Divide and Conquer) 알고리즘입니다.

### 1. 퀵 정렬의 3대 핵심 메커니즘
- **피벗 선택 (Pivot Selection):** 배열 내 임의의 원소(첫 원소, 마지막 원소, 혹은 Median-of-Three)를 분할 기준으로 지정합니다.
- **분할 (Partitioning):** 피벗을 기준으로 작은 요소들을 좌측으로, 큰 요소들을 우측으로 스왑 이동시키고 피벗을 자신의 최종 정렬 위치에 확정 배치합니다.
- **재귀 정복 (Recursion):** 피벗을 제외한 좌측 부분 배열과 우측 부분 배열에 대해 동일한 분할 정렬을 재귀 호출하며, 부분 배열의 크기가 1 이하가 되면 종료합니다.

### 2. 실제 성능과 최악 사례의 트레이드오프
- **뛰어난 캐시 지역성 (Cache Locality):** 배열을 주로 제자리에서 분할하여 메모리 접근의 지역성이 좋을 수 있지만, 실제 성능은 피벗 전략·입력 분포·구현·하드웨어에 따라 달라집니다.
- **시간 복잡도:** 평균 시간 복잡도는 $O(n \log n)$이며 병합 정렬 대비 속도 우위가 항상 보장되는 것은 아닙니다. 메모리 사용과 안정 정렬 요구까지 함께 비교해야 합니다.
- **최악 케이스 방어:** 이미 정렬된 배열에서 $O(n^2)$으로 퇴화하는 문제를 막기 위해 C++ 표준 라이브러리 구현 일부는 인트로소트로 재귀 깊이를 제한하며, Java의 기본형 배열 정렬은 별도의 Dual-Pivot QuickSort 등 구현별 전략을 사용합니다. 두 기법을 동일한 최악 사례 방어 방식으로 볼 수는 없습니다.

### 입력을 따라가는 실행 예제
마지막 원소를 피벗으로 택하는 예시에서 [3, 1, 2]의 피벗은 2입니다. 분할 결과 피벗 왼쪽에는 1, 오른쪽에는 3이 놓여 [1, 2, 3]이 됩니다. 하지만 입력이 이미 정렬된 상태이고 끝 원소만 계속 피벗으로 고르면 분할이 한쪽으로 치우칠 수 있습니다.`,
  learningObjectives: ["피벗 선택 방식이 분할 균형과 재귀 깊이를 바꾸는 이유를 이해할 수 있다."],
  commonMistakes: ["퀵 정렬의 최악 시간 복잡도는 O(n²)이며, 모든 입력에서 병합 정렬보다 빠른 것은 아닙니다."],
  keyTakeaways: ["피벗 분할이 균형 잡히면 평균 O(n log n), 계속 한쪽으로 쏠리면 O(n²)이 될 수 있습니다."],
  exercises: [{"question":"마지막 원소를 피벗으로 사용하는 퀵 정렬이 정렬된 입력에서 느려질 수 있는 이유는?","options":["분할이 한쪽으로 치우칠 수 있어서","정렬된 배열에 중복값이 없어서","병합 버퍼가 필요해서"],"answerIndex":0,"explanation":"피벗이 계속 최댓값이면 한쪽 부분 배열의 크기가 n-1로 줄어 비균형 재귀가 반복될 수 있습니다."}],
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
