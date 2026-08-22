import { ContentItem } from "../content-types";

export const knapsackContent: ContentItem = {
  slug: "knapsack",
  category: "algorithm",
  title: "냅색 (Knapsack)",
  subtitle: "한정된 용량의 배낭에 담을 수 있는 물건들의 최대 가치 결정",
  tags: [
    "Algorithm",
    "Dynamic Programming",
    "Knapsack",
    "Optimization"
  ],
  description: `배낭 문제(0/1 Knapsack Problem)는 한정된 배낭의 최대 적재 무게 한도 내에서 가치의 합이 최대가 되도록 아이템을 선택하는 대표적인 조합 최적화 문제입니다. 물건을 쪼갤 수 없으므로 그리디 접근이 불가능하며 동적 계획법(Dynamic Programming)의 바텀업 타뷸레이션(Tabulation)으로 해결합니다.

### 1. 0/1 냅색의 핵심 점화식 원리
각 아이템 $i$와 현재 배낭의 임시 수용 무게 $w$에 대해 두 가지 선택지를 비교합니다.
- **아이템을 제외하는 경우 (Exclusion):** 현재 아이템 무게가 한도를 초과하여 담을 수 없으면 이전 단계의 최적해를 그대로 승계합니다 (\`dp[i-1][w]\`).
- **아이템을 포함하는 경우 (Inclusion):** 아이템을 담고 남은 잔여 무게(\`w - weight[i]\`)에 대한 이전 최적 가치에 현재 아이템의 가치를 합산합니다 (\`value[i] + dp[i-1][w - weight[i]]\`).
- **최종 점화식:** \`dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w - weight[i]])\`

### 2. 알고리즘 실행 4단계 흐름
- **DP 테이블 초기화:** 아이템 개수 $N$과 배낭 최대 용량 $W$를 축으로 하는 $(N+1) \times (W+1)$ 2차원 배열을 생성하고 0으로 초기화합니다.
- **행별 순차 순회:** 각 아이템을 1번부터 $N$번까지 순회하며, 배낭 무게 한도를 1부터 $W$까지 1씩 증가시키며 최댓값을 계산합니다.
- **테이블 채우기 (Tabulation):** 이전 행(상단 셀)과 대각선 좌측 셀(잔여 용량 최적해)을 참조하여 현재 셀의 최적 가치를 결정합니다.
- **역추적 (Backtracking):** 테이블의 우측 하단 끝 셀(\`dp[N][W]\`)에서부터 거꾸로 추적하여 최종 선택된 아이템 목록을 식별합니다.`,
  steps: [
    "아이템과 배낭 무게 한도를 축으로 하는 2차원 DP 테이블을 0으로 초기화",
    "각 아이템을 차례로 순회하며 배낭 무게 한도에 따른 최대 가치 계산",
    "현재 아이템을 담지 않는 경우(이전 단계 최적해)와 담는 경우(현재 가치 + 남은 무게 최적해) 중 최댓값 선택",
    "DP 테이블의 오른쪽 하단 끝 셀에서 최종 최대 가치를 확인하고, 역추적(Backtracking)을 통해 선택된 아이템 식별"
  ],
  examples: [
    "가치 대비 무게 제한이 있는 예산 배분 및 투자 포트폴리오 최적화",
    "화물선, 차량 또는 서버 컨테이너의 제한된 용량 적재 최적화",
    "게임 내 인벤토리 한정 무게 대비 최대 가치 아이템 획득 전략"
  ],
  complexity: {
    best: "O(N * W)",
    avg: "O(N * W)",
    worst: "O(N * W)",
    space: "O(N * W)"
  },
  related: [
    { slug: "dfs-vs-bfs", category: "algorithm", relation: "상태 공간 트리를 탐색하며 최적해를 찾는 백트래킹(DFS) 개념 연관" }
  ]
};
