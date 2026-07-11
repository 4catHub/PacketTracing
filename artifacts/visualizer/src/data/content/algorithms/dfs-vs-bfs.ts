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
    description: `그래프 탐색은 하나의 정점으로부터 시작하여 모든 정점들을 한 번씩 방문하는 과정입니다. 대표적인 탐색 방식인 DFS와 BFS는 방문 정점을 관리하는 자료구조에 따라 탐색 방향과 특징이 완전히 갈립니다.

## DFS (Depth-First Search, 깊이 우선 탐색)
현재 노드에서 갈 수 있는 한 방향으로 깊이 파고든 뒤, 더 이상 갈 곳이 없으면 가장 최근의 갈림길로 되돌아와(Backtracking) 다른 방향을 탐색합니다. 스택(Stack) 자료구조 또는 재귀 호출을 사용하여 구현합니다. 미로 찾기, 경로의 특징을 저장해야 하는 경우, 사이클 존재 여부 파악 등에 적합합니다.

## BFS (Breadth-First Search, 너비 우선 탐색)
시작 노드에서 가까운 노드들을 우선하여 넓게 탐색한 뒤, 그 다음 반경의 노드들을 차례로 방문합니다. 큐(Queue) 자료구조를 사용하여 구현합니다. 두 노드 간의 최단 경로(단순 최단 거리)나 최소 비용 경로를 찾을 때 가장 유용합니다.`,
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
};
