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
  description: `다익스트라(Dijkstra) 알고리즘은 가중치 그래프 상에서 특정 시작 노드로부터 다른 모든 노드까지의 최단 거리를 구하는 단일 출발점 최단 경로 알고리즘입니다. 매 단계마다 미방문 노드 중 누적 거리가 가장 짧은 노드를 탐욕적(Greedy)으로 확정합니다.

### 1. 다익스트라의 핵심 전제 및 완화 기법
- **비음수 가중치 전제:** 음의 가중치를 가지는 간선이 없을 때만 올바르게 동작합니다 (음수 간선 존재 시 벨만-포드 알고리즘 필요).
- **거리 테이블 완화 (Edge Relaxation):** 현재 선택된 노드 $u$를 거쳐 인접 노드 $v$로 가는 새로운 비용이 기존에 기록된 최단 거리보다 작으면 테이블을 갱신합니다.
- **점화 수식:** \`dist[v] = min(dist[v], dist[u] + weight(u, v))\`

### 2. 알고리즘 동작 4단계 흐름
- **최단 거리 테이블 초기화:** 출발 노드의 거리는 0으로 설정하고, 나머지 모든 노드의 최단 거리는 무한대(\`INF\`)로 초기화합니다.
- **최소 거리 노드 선택:** 미방문 노드 중 현재 출발지로부터의 최단 거리가 가장 짧은 노드를 우선순위 큐(Min Heap)에서 추출합니다.
- **인접 노드 완화 (Relaxation):** 선택된 노드의 인접 노드들을 순회하며, 해당 노드를 거쳐 갈 때의 누적 거리를 계산하여 테이블을 갱신합니다.
- **방문 확정 및 반복:** 선택 노드를 방문 완료 처리하고, 모든 노드가 방문될 때까지 2~3단계를 반복하여 최종 최단 경로 트리를 완성합니다.`,
  steps: [
    "출발 노드를 설정하고 최단 거리 테이블을 초기화 (출발지는 0, 나머지는 무한대)",
    "미방문 노드 중 최단 거리가 가장 짧은 노드를 선택하고 방문 처리",
    "선택한 노드를 거쳐 갈 수 있는 인접 노드의 거리를 계산하여 기존 거리보다 작으면 테이블 갱신",
    "모든 노드를 방문하거나 미방문 노드의 최소 거리가 무한대가 될 때까지 반복"
  ],
  examples: [
    "네트워크 OSPF 라우팅 프로토콜에서의 최단 경로 패킷 전송",
    "실시간 GPS 내비게이션 및 지도 길찾기 경로 최적화",
    "게임 내 NPC의 목표물 추적 및 최단 이동 경로 계산"
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
