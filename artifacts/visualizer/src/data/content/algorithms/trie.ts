import { ContentItem } from "../content-types";

export const trieContent: ContentItem = {
  slug: "trie",
  category: "algorithm",
  title: "트라이 (Trie)",
  subtitle: "문자열 검색 및 접두사 자동완성에 최적화된 트리 자료구조",
  tags: [
    "Algorithm",
    "Data Structure",
    "Trie",
    "String",
    "Prefix Tree",
    "Autocomplete"
  ],
  description: `트라이(Trie)는 문자열의 집합을 효율적으로 저장하고 탐색하기 위해 설계된 트리 기반 자료구조로, 접두사 트리(Prefix Tree)라고도 불립니다.

### 1. 트라이의 핵심 아키텍처 특성
- **공통 접두사 압축 공유:** 동일한 접두사를 가진 단어들이 루트 노드부터 해당 접두사까지의 노드 경로를 공통으로 공유하여 메모리 중복을 방지합니다.
- **단어 길이에 비례하는 초고속 탐색:** 검색 대상 단어의 길이를 $L$이라 할 때, 전체 저장된 단어 수 $N$에 상관없이 탐색/삽입 시간 복잡도가 $O(L)$로 일정합니다.
- **접두사 자동완성 (Autocomplete):** 특정 접두사로 시작하는 모든 하위 트리 노드를 빠르게 수집할 수 있어 검색어 추천에 최적입니다.

### 2. 트라이의 3대 핵심 연산 메커니즘
- **단어 삽입 (Insert):** 루트 노드부터 단어의 각 문자를 따라 내려가며, 문자에 해당하는 자식 노드가 없으면 새로 동적 생성합니다. 단어의 마지막 문자에 도달하면 \`isEndOfWord = true\` 플래그를 마킹합니다.
- **단어 검색 (Search):** 탐색하려는 단어의 문자를 차례대로 내려가다가 중간에 경로가 끊기면 \`false\`를 반환하고, 마지막 문자 노드에서 \`isEndOfWord\` 상태를 확인하여 완성된 단어 여부를 판단합니다.
- **접두사 탐색 (StartsWith):** 접두사의 모든 문자가 트리 경로 상에 존재하는지만 검증하며, 단어의 완결 여부와 상관없이 경로가 유효하면 \`true\`를 반환합니다.`,
  steps: [
    "루트(Root) 노드부터 시작하여 삽입/탐색 대상 단어의 첫 번째 문자 위치로 이동",
    "단어의 각 문자에 대응하는 자식 노드가 존재하지 않으면 새 노드를 동적 생성 및 연결",
    "단어의 마지막 문자를 저장하는 노드에 '단어 완성(isEndOfWord)' 상태 플래그 설정",
    "지정된 접두사 경로를 따라 내려간 후 하위 트리의 완성 단어를 탐색하여 자동완성 목록 수집"
  ],
  examples: [
    "포털 사이트 및 이커머스 검색창의 실시간 검색어 자동완성 (Autocomplete) 추천",
    "스펠링 체크(Spell Checker) 및 맞춤법 교정 프로그램",
    "IP 라우터 패킷 전달을 위한 최장 접두사 매칭 (Longest Prefix Matching, LPM) 알고리즘"
  ],
  complexity: {
    best: "O(L)",
    avg: "O(L)",
    worst: "O(L)",
    space: "O(N * L)"
  },
  related: [
    { slug: "b-plus-tree", category: "algorithm", relation: "다지 트리 구조 기반의 효율적인 인덱싱 및 키 탐색 원리 연관" },
    { slug: "dfs-vs-bfs", category: "algorithm", relation: "트리 하위 노드를 탐색하며 자동완성 대상 단어들을 모으는 깊이 우선 탐색 적용" }
  ]
};
