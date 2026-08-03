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
    description: `에라토스테네스의 체는 고대 그리스 수학자 에라토스테네스가 고안한 소수 탐색 알고리즘으로, 특정 범위 N까지의 모든 소수를 찾는 가장 효율적인 방법 중 하나입니다. 시간 복잡도 O(N log log N), 공간 복잡도 O(N)입니다.

## 동작 원리
2부터 시작하여 해당 수가 합성수로 표시되지 않았다면 소수로 확정하고, 그 배수들을 모두 합성수로 표시합니다. √N까지만 반복하면 N 이하의 모든 소수를 찾을 수 있습니다.

- 2는 소수 → 4, 6, 8, ... 을 합성수로 표시
- 3은 소수 → 6, 9, 12, ... 을 합성수로 표시
- 4는 이미 합성수 → 건너뜀
- 5는 소수 → 10, 15, 20, ... 을 합성수로 표시
- √N 이후 남은 미표시 수는 모두 소수

## 왜 효율적인가
각 합성수는 단 한 번만 표시됩니다. 소수 p에 대해 p² 미만의 배수는 이미 더 작은 소수에 의해 표시되어 있으므로, p²부터 시작해 배수를 지워 나갑니다. 이 덕분에 일반적인 소수 판별(O(N√N))보다 훨씬 빠릅니다.`,
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

