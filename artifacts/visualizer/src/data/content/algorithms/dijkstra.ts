import { ContentItem } from "../content-types";

export const dijkstraContent: ContentItem = {
  slug: "dijkstra",
  category: "algorithm",
  title: "다익스트라 최단 경로",
  subtitle: "단일 출발지에서 다른 모든 노드로 가는 최단 경로 탐색",
  tags: [
    "Algorithm",
    "Graph",
    "Dijkstra",
    "Shortest Path",
    "Greedy"
  ],
  description: `다익스트라 알고리즘은 그래프 상의 특정 시작 노드에서 다른 모든 노드로 가는 최단 경로를 구하는 단일 출발점 최단 경로 알고리즘입니다. 매 단계마다 방문하지 않은 노드 중 출발지로부터의 거리가 가장 짧은 노드를 선택하여 최단 거리를 확정하는 그리디(Greedy) 기법을 사용합니다.

음의 가중치를 가지는 간선이 없을 때만 올바르게 동작하며, 주로 네트워크 라우팅 프로토콜(예: OSPF)이나 지도 내비게이션 길찾기 등에서 널리 활용됩니다.

## 동작 원리
1. 출발 노드를 설정하고, 최단 거리 테이블을 무한대로 초기화한 뒤 출발지 거리는 0으로 설정합니다.
2. 방문하지 않은 노드 중에서 최단 거리가 가장 짧은 노드를 선택합니다.
3. 선택된 노드를 거쳐 다른 노드로 가는 비용을 계산하여 최단 거리 테이블을 갱신합니다. (완화, Relaxation)
4. 위 과정을 모든 노드를 방문할 때까지 반복합니다.`,
  steps: [
    "출발 노드를 설정하고 최단 거리 테이블을 초기화 (출발지는 0, 나머지는 무한대)",
    "미방문 노드 중 최단 거리가 가장 짧은 노드를 선택하고 방문 처리",
    "선택한 노드를 거쳐 갈 수 있는 인접 노드의 거리를 계산하여 기존 거리보다 작으면 테이블 갱신",
    "모든 노드를 방문하거나 미방문 노드의 최소 거리가 무한대가 될 때까지 반복"
  ],
  examples: [
    "네트워크 OSPF 라우팅 프로토콜에서의 최단 경로 탐색",
    "내비게이션 및 실시간 지도 길찾기 경로 최적화",
    "게임 내 NPC의 목표물 추적 및 이동 경로 탐색 (가중치 맵)"
  ],
  complexity: {
    best: "O(E log V)",
    avg: "O(E log V)",
    worst: "O(E log V)",
    space: "O(V + E)"
  },
  related: [
    { slug: "dfs-vs-bfs", category: "algorithm", relation: "가중치가 없는 그래프 최단 거리 탐색(BFS)의 확장판" },
    { slug: "heap-sort", category: "algorithm", relation: "다익스트라 알고리즘의 최단 거리 선택 최적화에 쓰이는 최소 힙(Min Heap)" }
  ]
};

