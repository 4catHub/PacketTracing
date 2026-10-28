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
- **빈도수 계수 (Count Frequencies):** 키 범위 크기 $k$의 \`count\` 배열을 선언하고, 입력 배열을 순회하며 각 값의 등장 횟수를 기록합니다.
- **누적합 변환 (Prefix Sum):** \`count\` 배열을 누적합으로 변환하여, 각 원소가 최종 정렬 배열(\`output\`)에서 차지할 마지막 인덱스 위치를 계산합니다.
- **안정 정렬 역순 배치 (Stable Placement):** 원본 배열을 뒤에서부터 앞으로(역순) 순회하며, 누적합 위치에 원소를 배치하고 해당 카운트를 1 차감합니다.

### 2. 특징과 적용 전제 조건
- 비교 기반 한계($O(n \log n)$) 돌파: 두 원소를 비교하지 않으므로 $k \le n$인 환경에서 이론적 하한을 뛰어넘습니다.
- **정수 키 범위 제약:** 데이터가 정수이거나 인덱스로 변환 가능한 키여야 하며, 최댓값 $k$가 너무 크면 극심한 메모리 낭비가 발생합니다.

### 입력을 따라가는 실행 예제
[2, 0, 2, 1]의 빈도 배열은 값 0, 1, 2에 대해 [1, 1, 2]입니다. 누적합은 [1, 2, 4]가 됩니다. 입력을 뒤에서부터 순회하며 누적 위치에 배치하면 [0, 1, 2, 2]가 나옵니다. 이 방식은 동일 키 원소의 상대 순서를 보존하도록 구현할 수 있습니다.`,
  learningObjectives: ["빈도 배열에서 누적합과 출력 위치가 계산되는 과정을 재현할 수 있다."],
  commonMistakes: ["계수 정렬은 음수를 절대 처리할 수 없는 것이 아니라 최소값만큼 인덱스를 평행 이동시키면 처리할 수 있습니다. 다만 키 범위가 커지면 메모리 비용이 증가합니다."],
  keyTakeaways: ["정수 키 범위 크기를 k라고 할 때 일반적인 안정 계수 정렬의 시간 복잡도는 O(n+k)입니다."],
  exercises: [{"question":"입력 [2, 0, 2, 1]의 값 0·1·2에 대한 빈도 배열은?","options":["[1, 1, 2]","[0, 1, 2]","[1, 2, 4]"],"answerIndex":0,"explanation":"0은 1번, 1은 1번, 2는 2번 등장합니다. [1,2,4]는 누적합입니다."}],
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
