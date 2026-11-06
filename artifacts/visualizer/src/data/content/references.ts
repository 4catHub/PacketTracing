import type { ContentItem } from "./content-types";

export interface ContentReference {
  title: string;
  url: string;
}

// Curated background reading, not a claim that each visualization reproduces the linked implementation.
export const CONTENT_REFERENCES: Record<string, readonly ContentReference[]> = {
  "workflow:captcha": [{ title: "Google reCAPTCHA 서버 검증", url: "https://developers.google.com/recaptcha/docs/verify" }],
  "workflow:mcp-tool-call": [{ title: "Model Context Protocol 공식 명세", url: "https://modelcontextprotocol.io/specification" }],
  "workflow:framework-rendering": [{ title: "React 렌더링과 커밋 과정", url: "https://react.dev/learn/render-and-commit" }],
  "workflow:google-dns": [{ title: "Google Public DNS 소개", url: "https://developers.google.com/speed/public-dns/docs/intro" }],
  "workflow:rest-vs-grpc": [{ title: "gRPC 소개", url: "https://grpc.io/docs/what-is-grpc/introduction/" }],
  "workflow:cicd": [{ title: "GitHub Actions 문서", url: "https://docs.github.com/en/actions" }],
  "workflow:docker-before-after": [{ title: "Dockerfile HEALTHCHECK 명세", url: "https://docs.docker.com/reference/dockerfile/#healthcheck" }],
  "workflow:k8s-before-after": [{ title: "Kubernetes Deployment 문서", url: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" }],
  "workflow:oauth-flow": [
    { title: "OpenID Connect Core 1.0 · Authorization Code Flow", url: "https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth" },
    { title: "PKCE · RFC 7636", url: "https://www.rfc-editor.org/rfc/rfc7636#section-4" },
    { title: "OAuth 2.0 보안 권고 · RFC 9700", url: "https://www.rfc-editor.org/rfc/rfc9700#section-2.1" },
  ],
  "workflow:jwt-vs-session": [{ title: "JSON Web Token RFC 7519", url: "https://www.rfc-editor.org/rfc/rfc7519" }],
  "workflow:realtime-protocols": [{ title: "MDN Server-sent events", url: "https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events" }],
  "workflow:websocket-chat-security": [
    { title: "WebSocket 프로토콜 · RFC 6455", url: "https://www.rfc-editor.org/rfc/rfc6455.html" },
    { title: "OWASP WebSocket 보안 가이드", url: "https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html" },
    { title: "OWASP XSS 방어 가이드", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" },
  ],
  "workflow:https-handshake": [{ title: "TLS 1.3 RFC 8446", url: "https://www.rfc-editor.org/rfc/rfc8446" }],
  "workflow:api-gateway": [{ title: "HTTP 429 RFC 6585", url: "https://www.rfc-editor.org/rfc/rfc6585#section-4" }],
  "workflow:message-queue-event-driven": [{ title: "RabbitMQ 공식 튜토리얼", url: "https://www.rabbitmq.com/tutorials" }],
  "workflow:event-driven-vs-polling": [{ title: "Microsoft 이벤트 기반 아키텍처", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven" }],
  "workflow:monolith-vs-msa": [{ title: "Microsoft 마이크로서비스 아키텍처", url: "https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices" }],
  "workflow:cap-theorem": [{ title: "CAP 정리 개요", url: "https://en.wikipedia.org/wiki/CAP_theorem" }],
  "workflow:global-post-retrieval": [{ title: "HTTP 캐시 동작 MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching" }],
  "workflow:db-indexing": [{ title: "PostgreSQL 인덱스 개요", url: "https://www.postgresql.org/docs/current/indexes.html" }],
  "workflow:proxy-vs-reverse-proxy": [{ title: "MDN 프록시 서버와 터널링", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Proxy_servers_and_tunneling" }],
  "workflow:virtual-threads": [{ title: "Oracle Java 가상 스레드", url: "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html" }],
  "workflow:messenger-file-transfer": [{ title: "Amazon S3 멀티파트 업로드", url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpuoverview.html" }],
  "workflow:react-architecture": [{ title: "React 렌더링과 커밋 과정", url: "https://react.dev/learn/render-and-commit" }],
  "workflow:load-balancing-consistent-hashing": [{ title: "Consistent hashing 개념", url: "https://en.wikipedia.org/wiki/Consistent_hashing" }],
  "workflow:cdn-cache-invalidation": [{ title: "HTTP 캐싱 MDN", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching" }],
  "workflow:android-local-first-finance": [{ title: "Android Offline-first 데이터 아키텍처", url: "https://developer.android.com/topic/architecture/data-layer/offline-first" }],
  "workflow:db-replication-sharding": [{ title: "PostgreSQL 고가용성과 복제", url: "https://www.postgresql.org/docs/current/high-availability.html" }],
  "workflow:distributed-transactions-2pc-saga": [{ title: "Microsoft Saga 패턴", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/saga" }],
  "algorithm:sieve-of-eratosthenes": [{ title: "CP-Algorithms 에라토스테네스의 체", url: "https://cp-algorithms.com/algebra/sieve-of-eratosthenes.html" }],
  "algorithm:bubble-sort": [{ title: "Princeton Algorithms 기초 정렬", url: "https://algs4.cs.princeton.edu/21elementary/" }],
  "algorithm:selection-sort": [{ title: "Princeton Algorithms 선택 정렬", url: "https://algs4.cs.princeton.edu/21elementary/" }],
  "algorithm:insertion-sort": [{ title: "Princeton Algorithms 삽입 정렬", url: "https://algs4.cs.princeton.edu/21elementary/" }],
  "algorithm:merge-sort": [{ title: "Princeton Algorithms 병합 정렬", url: "https://algs4.cs.princeton.edu/22mergesort/" }],
  "algorithm:quick-sort": [{ title: "Princeton Algorithms 퀵 정렬", url: "https://algs4.cs.princeton.edu/23quicksort/" }],
  "algorithm:heap-sort": [{ title: "Princeton Algorithms 우선순위 큐와 힙", url: "https://algs4.cs.princeton.edu/24pq/" }],
  "algorithm:counting-sort": [{ title: "계수 정렬 개요", url: "https://en.wikipedia.org/wiki/Counting_sort" }],
  "algorithm:radix-sort": [{ title: "Princeton Algorithms 문자열 정렬과 기수 정렬", url: "https://algs4.cs.princeton.edu/51radix/" }],
  "algorithm:dfs-vs-bfs": [{ title: "Princeton Algorithms 그래프 탐색", url: "https://algs4.cs.princeton.edu/41graph/" }],
  "algorithm:dijkstra": [{ title: "CP-Algorithms 다익스트라", url: "https://cp-algorithms.com/graph/dijkstra.html" }],
  "algorithm:knapsack": [{ title: "CP-Algorithms 0/1 Knapsack", url: "https://cp-algorithms.com/dynamic_programming/knapsack.html" }],
  "algorithm:b-plus-tree": [{ title: "PostgreSQL B-Tree 인덱스", url: "https://www.postgresql.org/docs/current/btree.html" }],
  "algorithm:cache-replacement": [{ title: "OSTEP 운영체제 교재", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" }],
  "algorithm:scheduling": [{ title: "OSTEP CPU 스케줄링 교재", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" }],
  "algorithm:trie": [{ title: "Princeton Algorithms Tries", url: "https://algs4.cs.princeton.edu/52trie/" }],
  "algorithm:binary-search-lower-upper-bound": [{ title: "CP-Algorithms 이진 탐색", url: "https://cp-algorithms.com/num_methods/binary_search.html" }],
  "algorithm:prefix-sum-segment-tree": [
    { title: "USACO Guide 누적합", url: "https://usaco.guide/silver/prefix-sums" },
    { title: "CP-Algorithms 세그먼트 트리", url: "https://cp-algorithms.com/data_structures/segment_tree.html" },
  ],
  "attack:log4shell": [{ title: "Apache Log4j 보안 공지", url: "https://logging.apache.org/security.html" }],
  "attack:nikke-supply-chain-attack": [
    { title: "NIKKE 공식 공지 · PC 런처 보안 사고 및 후속 조치", url: "https://game.naver.com/lounge/nikke/board/detail/8412545" },
    { title: "NIKKE 공식 공지 · PC 런처 수동 점검 안내", url: "https://game.naver.com/lounge/nikke/board/detail/8412547" },
    { title: "MotherSphere · 런처 변조와 K2F 기술 분석", url: "https://github.com/MotherSphere/NIKKE-Launcher-Check/blob/main/docs/incident.md" },
    { title: "SpringZali · 공개 단말 포렌식 보고서", url: "https://github.com/SpringZali/nikke-launcher-triage/blob/main/community/INCIDENT_FORENSIC_REPORT_PUBLIC.md" },
    { title: "MITRE ATT&CK · 소프트웨어 공급망 공격 T1195.002", url: "https://attack.mitre.org/techniques/T1195/002/" },
    { title: "NIST SSDF · 소프트웨어 개발과 릴리스 보안", url: "https://csrc.nist.gov/pubs/sp/800/218/final" },
  ],
  "attack:php2shell": [{ title: "PHP 공식 보안 발표", url: "https://www.php.net/archive/2026.php" }],
  "attack:redis-security-2026": [{ title: "Redis 공식 2026 보안 권고", url: "https://redis.io/blog/security-advisory-cve202623479-cve202625243-cve-2026-25588-cve202625589-cve-2026-23631/" }],
};

export function getContentReferences(item: Pick<ContentItem, "category" | "slug">): readonly ContentReference[] {
  return CONTENT_REFERENCES[`${item.category}:${item.slug}`] ?? [];
}
