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
  description: `계수 정렬(Counting Sort)은 원소 간의 대소 비교를 수행하지 않고, 각 정수 값의 출현 빈도수를 카운트 배열에 직접 기록하여 $O(n + k)$ 선형 시간에 정렬하는 비비교 정렬(Non-Comparison Sort) 알고리즘입니다.

### 1. 계수 정렬의 3단계 프로세스
- **빈도수 계수 (Count Frequencies):** 최댓값 $k$ 크기의 \`count\` 배열을 선언하고, 입력 배열을 순회하며 각 값의 등장 횟수를 기록합니다.
- **누적합 변환 (Prefix Sum):** \`count\` 배열을 누적합으로 변환하여, 각 원소가 최종 정렬 배열(\`output\`)에서 차지할 마지막 인덱스 위치를 계산합니다.
- **안정 정렬 역순 배치 (Stable Placement):** 원본 배열을 뒤에서부터 앞으로(역순) 순회하며, 누적합 위치에 원소를 배치하고 해당 카운트를 1 차감합니다.

### 2. 특징과 적용 전제 조건
- 비교 기반 한계($O(n \log n)$) 돌파: 두 원소를 비교하지 않으므로 $k \le n$인 환경에서 이론적 하한을 뛰어넘습니다.
- **양의 정수 한정:** 데이터가 정수이거나 인덱스로 변환 가능한 키여야 하며, 최댓값 $k$가 너무 크면 극심한 메모리 낭비가 발생합니다.`,
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
  related: [
    { slug: "radix-sort", category: "algorithm", relation: "계수 정렬을 자릿수별 서브루틴으로 활용하는 기수 정렬" },
    { slug: "sieve-of-eratosthenes", category: "algorithm", relation: "인덱스 직접 매핑을 활용하는 선형 메모리 기반 알고리즘" }
  ]
};
