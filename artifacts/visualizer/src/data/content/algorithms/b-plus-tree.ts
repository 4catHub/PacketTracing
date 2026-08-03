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
  description: `B+ 트리는 모든 실제 데이터 레코드가 단말(Leaf) 노드에만 저장되고, 내부(Internal) 노드는 분기를 유도하기 위한 키 배열만을 가지는 자가 균형 검색 트리입니다. 데이터베이스 인덱스와 파일 시스템처럼 디스크 I/O 속도가 병목이 되는 대규모 정렬 데이터 저장 환경에서 표준 인덱싱 구조로 널리 사용됩니다.

### B+ Tree 핵심 구조의 특징
- 인덱스 노드 (Internal Node): 실제 레코드 값이 존재하지 않고 자식 노드의 키 범위 정보만 제공하여 노드의 팬아웃(Fan-out)을 높이고 탐색 속도를 극대화합니다.
- 단말 노드 (Leaf Node): 실제 데이터 레코드 주소 혹은 레코드(Rec) 값을 가지며, 모든 단말 노드가 링크드 리스트(연결 리스트)로 순차 연결되어 있어 범위 검색 및 정렬 조회가 매우 용이합니다.
- 일정한 탐색 속도: 모든 단말 노드가 루트 노드로부터 동일한 깊이(Level)를 가집니다. 따라서 트리의 불균형이 없어 어떤 키를 검색하든 시간 복잡도가 O(log n)으로 항상 동일하며 균일한 성능을 보장합니다.`,
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

