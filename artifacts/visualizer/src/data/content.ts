import { ContentItem } from "./content/content-types";
import { frameworkRenderingContent } from "./content/workflows/framework-rendering";
import { googleDnsContent } from "./content/workflows/google-dns";
import { restVsGrpcContent } from "./content/workflows/rest-vs-grpc";
import { cicdContent } from "./content/workflows/cicd";
import { dockerBeforeAfterContent } from "./content/workflows/docker-before-after";
import { k8sBeforeAfterContent } from "./content/workflows/k8s-before-after";
import { oauthFlowContent } from "./content/workflows/oauth-flow";
import { jwtVsSessionContent } from "./content/workflows/jwt-vs-session";
import { realtimeProtocolsContent } from "./content/workflows/realtime-protocols";
import { httpsHandshakeContent } from "./content/workflows/https-handshake";
import { apiGatewayContent } from "./content/workflows/api-gateway";
import { monolithVsMsaContent } from "./content/workflows/monolith-vs-msa";
import { capTheoremContent } from "./content/workflows/cap-theorem";
import { sieveOfEratosthenesContent } from "./content/algorithms/sieve-of-eratosthenes";
import { bubbleSortContent } from "./content/algorithms/bubble-sort";
import { selectionSortContent } from "./content/algorithms/selection-sort";
import { insertionSortContent } from "./content/algorithms/insertion-sort";
import { mergeSortContent } from "./content/algorithms/merge-sort";
import { quickSortContent } from "./content/algorithms/quick-sort";
import { heapSortContent } from "./content/algorithms/heap-sort";
import { countingSortContent } from "./content/algorithms/counting-sort";
import { radixSortContent } from "./content/algorithms/radix-sort";
import { dfsVsBfsContent } from "./content/algorithms/dfs-vs-bfs";
import { dijkstraContent } from "./content/algorithms/dijkstra";
import { knapsackContent } from "./content/algorithms/knapsack";
import { globalPostRetrievalContent } from "./content/workflows/global-post-retrieval";
import { dbIndexingContent } from "./content/workflows/db-indexing";
import { proxyVsReverseProxyContent } from "./content/workflows/proxy-vs-reverse-proxy";
import { bPlusTreeContent } from "./content/algorithms/b-plus-tree";
import { cacheReplacementContent } from "./content/algorithms/cache-replacement";
import { scheduling } from "./content/algorithms/scheduling";
import { trieContent } from "./content/algorithms/trie";

import { virtualThreadsContent } from "./content/workflows/virtual-threads";
import { messengerFileTransferContent } from "./content/workflows/messenger-file-transfer";
import { reactArchitectureContent } from "./content/workflows/react-architecture";

export type { Category, ComplexityInfo, ContentItem } from "./content/content-types";

export const contentData: ContentItem[] = [
  reactArchitectureContent,
  messengerFileTransferContent,
  virtualThreadsContent,
  frameworkRenderingContent,
  googleDnsContent,
  restVsGrpcContent,
  cicdContent,
  dockerBeforeAfterContent,
  k8sBeforeAfterContent,
  oauthFlowContent,
  jwtVsSessionContent,
  realtimeProtocolsContent,
  httpsHandshakeContent,
  apiGatewayContent,
  proxyVsReverseProxyContent,
  monolithVsMsaContent,
  capTheoremContent,
  sieveOfEratosthenesContent,
  bubbleSortContent,
  selectionSortContent,
  insertionSortContent,
  mergeSortContent,
  quickSortContent,
  heapSortContent,
  countingSortContent,
  radixSortContent,
  dfsVsBfsContent,
  dijkstraContent,
  knapsackContent,
  globalPostRetrievalContent,
  dbIndexingContent,
  bPlusTreeContent,
  cacheReplacementContent,
  scheduling,
  trieContent,
];
