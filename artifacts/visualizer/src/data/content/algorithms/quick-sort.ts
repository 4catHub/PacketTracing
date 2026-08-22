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

### 2. 왜 실무에서 가장 빠른 정렬인가?
- **뛰어난 캐시 지역성 (Cache Locality):** 추가적인 임시 배열 메모리를 생성하지 않는 제자리 정렬(In-Place Sort)이므로 CPU 캐시 히트율이 극대화됩니다.
- **시간 복잡도:** 평균 $O(n \log n)$으로 이론적으로 동일한 병합 정렬 대비 실제 하드웨어 실행 속도가 약 2~3배 빠릅니다.
- **최악 케이스 방어:** 이미 정렬된 배열에서 $O(n^2)$으로 퇴화하는 문제를 막기 위해 C++/Java 표준 라이브러리는 재귀 깊이가 깊어지면 힙 정렬로 스왑하는 인트로소트(IntroSort)나 Dual-Pivot 방식을 채택합니다.`,
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
