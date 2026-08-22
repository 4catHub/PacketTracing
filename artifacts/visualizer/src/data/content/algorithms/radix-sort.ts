import { ContentItem } from "../content-types";

export const radixSortContent: ContentItem = {
  slug: "radix-sort",
  category: "algorithm",
  title: "기수 정렬",
  subtitle: "자릿수별로 안정 정렬을 반복하는 O(d·n) 선형 정렬",
  tags: [
    "Sort",
    "O(dn)",
    "Non-comparison"
  ],
  description: `기수 정렬(Radix Sort)은 숫자를 자릿수(Digit) 단위로 분해한 뒤, 낮은 자릿수부터 가장 높은 자릿수까지 안정 정렬(Stable Sort, 주로 계수 정렬)을 반복 적용하여 $O(d \cdot n)$에 전체를 정렬하는 비비교 정렬 알고리즘입니다.

### 1. LSD vs MSD 정렬 방식 비교
- LSD (Least Significant Digit, 최하위 자릿수 우선): 1의 자리부터 시작하여 높은 자릿수로 순차 진행합니다. 추가 메모리가 적고 구현이 안정적이어서 정수 정렬에 주로 채택됩니다.
- MSD (Most Significant Digit, 최상위 자릿수 우선): 가장 높은 자릿수부터 시작하여 재귀적으로 버킷을 분할합니다. 가변 길이 문자열 정렬이나 사전식 정렬에 적합합니다.

### 2. 기수 정렬의 3단계 동작 프로세스
- 최대 자릿수($d$) 산출: 입력 배열에서 가장 큰 값의 자릿수 $d$를 계산하여 순회 횟수를 결정합니다.
- **자릿수별 안정 계수 정렬:** $10^0, 10^1, \dots, 10^{d-1}$ 자리 순서대로 각 자릿수 값을 키로 삼아 계수 정렬(Counting Sort)을 수행합니다.
- **정렬 완료:** 이전 자릿수의 정렬 순서가 보존된 상태로 $d$번째 패스까지 마치면 전체 배열이 완전히 정렬됩니다.`,
  steps: [
    "최대값의 자릿수(d) 파악",
    "1의 자리부터 시작: 해당 자릿수 기준으로 계수 정렬 (안정 정렬 필수)",
    "10의 자리, 100의 자리, ... 순으로 반복",
    "d번의 패스 완료 후 전체 정렬 완료"
  ],
  examples: [
    "전화번호, 우편번호 등 고정 길이 숫자 정렬",
    "IP 주소, MAC 주소 정렬",
    "대규모 정수 배열 정렬 (d << log n인 경우)",
    "문자열 사전 정렬 (MSD Radix Sort)"
  ],
  complexity: {
    best: "O(d·n)",
    avg: "O(d·n)",
    worst: "O(d·n)",
    space: "O(n+k)",
    stable: true
  },
  related: [
    { slug: "counting-sort", category: "algorithm", relation: "기수 정렬의 각 자릿수 정렬 단계에 사용되는 필수 서브루틴" },
    { slug: "quick-sort", category: "algorithm", relation: "비교 기반 O(n log n) 정렬과 비비교 기반 O(d·n) 정렬의 성능 비교" }
  ]
};
