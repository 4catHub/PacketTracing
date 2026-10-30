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
  description: `병합 정렬(Merge Sort)은 배열을 크기가 1이 될 때까지 절반으로 쪼갠 뒤(Divide), 정렬된 두 부분 배열을 정렬 순서를 유지하며 합쳐 나가는(Conquer & Combine) 분할 정복 알고리즘입니다.

### 1. 병합 정렬의 3대 핵심 특징
- 완벽한 $O(n \log n)$ 보장: 최선, 평균, 최악의 모든 경우에 트리의 높이가 $\log n$이고 각 레벨의 병합 비용이 $O(n)$이므로 항상 $O(n \log n)$ 성능을 보장합니다.
- **안정 정렬 (Stable Sort):** 동일한 값을 가진 원소들의 상대적인 이전 순서가 병합 후에도 그대로 보존됩니다.
- 공간 복잡도 $O(n)$: 두 부분 배열을 합치기 위한 별도의 임시 버퍼 배열 메모리가 요구됩니다.

### 2. 분할 및 병합 2단계 프로세스
- **재귀 분할 (Divide):** 배열의 중간 인덱스(\`mid\`)를 기준으로 좌우 2개의 서브 배열로 길이가 1이 될 때까지 쪼갭니다.
- **투 포인터 병합 (Two-Pointer Merge):** 정렬된 두 서브 배열의 맨 앞 원소를 투 포인터로 비교하여 더 작은 원소를 임시 결과 배열에 순서대로 복사하고 원본 배열로 덮어씁니다.

### 입력을 따라가는 실행 예제
[4, 1, 3, 2]를 [4, 1]과 [3, 2]로 나누고, 각각 [1, 4]와 [2, 3]으로 정렬합니다. 마지막 병합에서 앞 원소를 1, 2, 3, 4 순서로 선택해 [1, 2, 3, 4]를 얻습니다. 같은 값의 좌·우 원소가 만나면 왼쪽을 먼저 선택해야 안정성이 유지됩니다.`,
  learningObjectives: ["분할 트리의 하위 배열과 마지막 병합 결과를 단계별로 추적할 수 있다."],
  commonMistakes: ["병합 정렬이 안정적이라는 성질은 동점 원소를 병합할 때 왼쪽 원소를 먼저 선택하는 구현을 전제로 합니다."],
  keyTakeaways: ["각 분할 단계에서 전체 원소를 한 번씩 병합하고 분할 깊이가 로그 규모이므로 O(n log n)입니다."],
  exercises: [{"question":"[4, 1]과 [2, 3]을 오름차순으로 병합하기 전에 필요한 조치는?","options":["각 부분 배열을 먼저 정렬한다","두 배열을 역순으로 합친다","중간값을 피벗으로 정한다"],"answerIndex":0,"explanation":"일반적인 병합 단계는 두 입력 부분 배열이 각각 이미 정렬되었다는 전제를 사용합니다."}],
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
