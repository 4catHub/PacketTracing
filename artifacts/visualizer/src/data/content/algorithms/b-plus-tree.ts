import { ContentItem } from "../content-types";

export const bPlusTreeContent: ContentItem = {
  slug: "b-plus-tree",
  category: "algorithm",
  title: "B+ 트리 탐색",
  subtitle: "데이터베이스와 파일 시스템의 기초가 되는 다방 자가 균형 탐색 트리",
  tags: [
    "Tree",
    "Database",
    "Index",
    "Search",
    "O(log n)"
  ],
  description: `B+ 트리는 모든 실제 데이터 레코드가 최하단 단말(Leaf) 노드에만 저장되고, 내부(Internal) 노드는 탐색 분기를 유도하기 위한 키 배열만을 보관하는 다방 자가 균형 트리(Self-balancing Tree)입니다.

### 1. B+ Tree의 핵심 구조적 특징
- **인덱스 노드 (Non-Leaf Node):** 실제 레코드 값이 존재하지 않고 오직 자식 노드의 키 범위 정보만 제공하여 노드 1개당 팬아웃(Fan-out)을 극대화합니다.
- **단말 노드 (Leaf Node):** 실제 데이터 레코드의 포인터가 정렬된 상태로 저장되며, 모든 리프 노드가 양방향 링크드 리스트(Doubly Linked List)로 연결되어 범위 검색(Range Scan) 및 \`BETWEEN\` 연산이 압도적으로 빠릅니다.
- **완벽한 균형 유지:** 모든 단말 노드가 루트로부터 항상 동일한 깊이(Level)를 유지하므로 어떤 키를 검색하든 시간 복잡도가 $O(\log n)$으로 보장됩니다.

### 2. 트리 탐색 4단계 프로세스
- **루트 노드 진입:** 메모리 버퍼에 상주하는 최상단 루트 노드에서 키 탐색을 시작합니다.
- **브랜치 분기점 비교:** 검색 대상 키를 내부 노드의 정렬된 키 배열과 비교하여 올바른 하위 자식 포인터를 결정합니다.
- **단말 노드까지 하강 (Descent):** 타겟 리프 노드에 도달할 때까지 $O(\log n)$ 횟수만큼 하위 레벨 노드로 점진 하강합니다.
- **레코드 획득:** 단말 노드 내부의 정렬된 키를 이진 탐색하여 실제 데이터 레코드 또는 ROWID를 반환합니다.`,
  steps: [
    "루트 노드(Root)에서 탐색을 시작합니다.",
    "내부 노드의 키들과 대상 키를 비교하여 알맞은 자식 노드 포인터를 결정합니다.",
    "자식 노드 포인터를 따라 하위 레벨의 노드로 내려갑니다.",
    "단말 노드(Leaf)에 도달할 때까지 이 하강 과정을 반복합니다.",
    "도달한 단말 노드 내의 키들과 비교하여 실제 레코드를 탐색하고 반환합니다."
  ],
  examples: [
    "관계형 데이터베이스(RDBMS)의 인덱스 구조 (예: MySQL InnoDB, PostgreSQL)",
    "대용량 스토리지 파일 시스템 (예: NTFS, Btrfs, XFS)",
    "대량의 정렬된 데이터에 대한 고속 범위 검색 및 순차 처리"
  ],
  complexity: {
    best: "O(log n)",
    avg: "O(log n)",
    worst: "O(log n)",
    space: "O(n)"
  },
  related: [
    { slug: "db-indexing", category: "workflow", relation: "B+Tree 자료구조 기반의 DB 인덱싱 탐색 워크플로우" },
    { slug: "global-post-retrieval", category: "workflow", relation: "DB 디스크 I/O 절감을 위한 B+Tree 인덱스 스캔" }
  ]
};
