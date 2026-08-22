import { ContentItem } from "../content-types";

export const sieveOfEratosthenesContent: ContentItem = {
  slug: "sieve-of-eratosthenes",
  category: "algorithm",
  title: "에라토스테네스의 체",
  subtitle: "범위 내 모든 소수를 O(N log log N)에 찾는 고대 알고리즘",
  tags: [
    "Math",
    "Primes",
    "Optimization"
  ],
  description: `에라토스테네스의 체(Sieve of Eratosthenes)는 특정 상한 범위 $N$ 이하의 모든 소수(Prime Numbers)를 고속으로 판별해내는 대표적인 정수론 알고리즘입니다.

### 1. 에라토스테네스의 체 핵심 원리
2부터 시작하여 현재 탐색 중인 수가 지워지지 않았다면 소수로 확정하고, 그 수의 모든 배수(합성수)를 체로 치듯이 걸러내어 지워 나갑니다.
- **배열 초기화:** 2부터 $N$까지의 모든 정수를 소수 후보(\`true\`)로 설정한 불리언 배열을 준비합니다.
- **소수 확정 및 배수 소거:** 첫 번째 소수 2를 확정하고, $2^2=4$부터 2의 배수($4, 6, 8, \dots$)를 모두 합성수(\`false\`)로 지웁니다.
- **다음 미소거 정수 탐색:** 지워지지 않고 남아있는 다음 수 3을 소수로 확정하고, $3^2=9$부터 3의 배수($9, 12, 15, \dots$)를 지웁니다.

### 2. $\sqrt{N}$ 최적화의 수학적 증명
모든 합성수 $N$은 반드시 $\sqrt{N}$ 이하의 소인수를 하나 이상 포함한다는 성질을 활용합니다.
- **조기 종료 조건:** 바깥쪽 루프를 $\sqrt{N}$까지만 순회하면 $N$ 이하의 모든 합성수가 완전히 소거됩니다.
- 중복 소거 방지 ($p^2$ 시작): 소수 $p$의 배수를 지울 때 $p \times 2, p \times 3, \dots$ 등 $p^2$ 미만의 배수들은 이미 앞선 더 작은 소수(2, 3)들에 의해 지워졌으므로, 항상 $p^2$부터 시작하여 불필요한 중복 연산을 제거합니다.
- **시간 복잡도:** 소수의 역수 합 공식(Mertens' Theorem)에 의해 $O(N \log \log N)$이라는 거의 선형에 수렴하는 극상의 속도를 달성합니다.`,
  steps: [
    "2부터 N까지 배열 초기화 (모두 \"소수 후보\")",
    "p = 2: 소수 확정 → p²(=4)부터 p 간격으로 합성수 표시",
    "p = 3: 소수 확정 → 9, 12, 15... 합성수 표시",
    "p = 4: 이미 합성수 → 건너뜀",
    "√N 이하 모든 p 처리 완료 → 남은 미표시 수 전부 소수 확정"
  ],
  examples: [
    "암호학(RSA)의 기초가 되는 큰 소수 탐색",
    "코딩 테스트 소수 판별 최적화",
    "정수론 연구 및 수학적 패턴 분석",
    "해시 테이블의 버킷 크기 결정 (소수 사용)"
  ],
  complexity: {
    best: "O(N log log N)",
    avg: "O(N log log N)",
    worst: "O(N log log N)",
    space: "O(N)"
  },
  related: [
    { slug: "counting-sort", category: "algorithm", relation: "인덱스 배열 메모리를 직접 매핑하는 공간 최적화 기법 유사" }
  ]
};
