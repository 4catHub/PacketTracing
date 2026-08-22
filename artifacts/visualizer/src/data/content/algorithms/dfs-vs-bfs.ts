import { ContentItem } from "../content-types";

export const dfsVsBfsContent: ContentItem = {
  slug: "dfs-vs-bfs",
  category: "algorithm",
  title: "DFS vs BFS 그래프 탐색",
  subtitle: "깊이 우선 탐색(Stack) vs 너비 우선 탐색(Queue)의 탐색 방식 비교",
  tags: [
    "Algorithm",
    "Graph",
    "DFS",
    "BFS",
    "Traversal"
  ],
  description: `그래프 탐색(Graph Traversal)은 시작 정점으로부터 연결된 모든 정점을 빠짐없이 방문하는 알고리즘입니다. 방문 정점을 관리하는 핵심 자료구조(Stack vs Queue)에 따라 탐색 방향과 특성이 완전히 달라집니다.

### 1. DFS (Depth-First Search, 깊이 우선 탐색)
현재 노드에서 출발하여 한 방향으로 갈 수 있는 끝까지 깊게 파고든 뒤, 더 이상 전진할 수 없으면 이전 분기점으로 되돌아오는 백트래킹(Backtracking)을 수행합니다.
- **자료구조 및 구현:** 스택(Stack) 자료구조 또는 함수 재귀 호출(Call Stack)을 사용합니다.
- **메모리 효율성:** 현재 탐색 중인 경로 상의 노드들만 스택에 유지하므로 공간 복잡도 $O(V)$로 메모리 소비가 적습니다.
- **적합한 문제:** 모든 경로를 전수 조사해야 하는 경우, 미로 탐색, 경로의 제약 조건 저장, 그래프 사이클(Cycle) 검출, 위상 정렬(Topological Sort)

### 2. BFS (Breadth-First Search, 너비 우선 탐색)
시작 정점과 인접한 노드들을 먼저 모두 방문한 뒤, 거리(반경)가 1씩 멀어지는 순서로 레벨별(Level-order) 수평 탐색을 진행합니다.
- **자료구조 및 구현:** 큐(Queue, FIFO) 자료구조를 사용하여 방문 예정 노드를 순차적으로 큐에 적재합니다.
- **최단 경로 보장:** 간선의 가중치가 동일한(가중치 1) 무방향/방향 그래프에서 출발지로부터 목표 지점까지의 최단 경로(최소 홉 수)를 항상 보장합니다.
- **적합한 문제:** 가중치 없는 최단 경로 탐색, 네트워크 브로드캐스트 라우팅, 소셜 네트워크 친구 추천(촌수 계산)

### 3. DFS vs BFS 핵심 특성 대조
- **방문 순서:** DFS(수직 방향 깊이 우선) vs BFS(동심원 형태 수평 너비 우선)
- **주요 자료구조:** DFS(\`Stack\` / 재귀 함수 호출) vs BFS(\`Queue\` / FIFO 버퍼)
- **최단 거리 탐색:** DFS(최단 경로 미보장, 목표 발견 시 탐색 조기 종료 가능) vs BFS(가중치 1 그래프 최단 거리 무조건 보장)
- **시간 복잡도:** 인접 리스트 기준 두 알고리즘 모두 정점과 간선의 합인 $O(V + E)$에 수렴`,
  steps: [
    "시작 노드를 방문 처리하고 스택(DFS) 또는 큐(BFS)에 삽입",
    "자료구조에서 노드를 꺼내어 현재 노드로 지정",
    "현재 노드와 인접한 미방문 노드들을 탐색하여 방문 처리 후 스택/큐에 삽입",
    "자료구조가 비어 있을 때까지 2-3단계를 반복하여 탐색 완료"
  ],
  examples: [
    "네트워크 최단 거리(최단 홉) 찾기 (BFS 필수)",
    "미로 탈출 경로 찾기 (DFS / BFS 둘 다 가능하나 최단 경로는 BFS가 유리)",
    "그래프 내 사이클(Cycle) 존재 감지 (DFS)",
    "체스판 최단 이동 횟수 계산 (BFS)"
  ],
  complexity: {
    best: "O(V+E)",
    avg: "O(V+E)",
    worst: "O(V+E)",
    space: "O(V)"
  },
  related: [
    { slug: "dijkstra", category: "algorithm", relation: "BFS를 가중치(Cost) 그래프 최단 경로로 확장한 알고리즘" },
    { slug: "knapsack", category: "algorithm", relation: "상태 공간 트리를 백트래킹(DFS) 및 Dynamic Programming으로 최적화" }
  ]
};
