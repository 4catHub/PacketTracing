import { lazy } from "react";

export const VISUALIZER_REGISTRY: Record<
  string,
  Record<string, React.LazyExoticComponent<React.ComponentType>>
> = {
  workflows: {
    "framework-rendering": lazy(() => import("@/visualizations/FrameworkRenderingViz")),
    "google-dns": lazy(() => import("@/visualizations/GoogleDnsViz")),
    "rest-vs-grpc": lazy(() => import("@/visualizations/RestVsGrpcViz")),
    "oauth-flow": lazy(() => import("@/visualizations/OauthFlowViz")),
    "jwt-vs-session": lazy(() => import("@/visualizations/JwtVsSessionViz")),
    "realtime-protocols": lazy(() => import("@/visualizations/RealtimeProtocolsViz")),
    "https-handshake": lazy(() => import("@/visualizations/HttpsHandshakeViz")),
    "api-gateway": lazy(() => import("@/visualizations/ApiGatewayViz")),
    "monolith-vs-msa": lazy(() => import("@/visualizations/MonolithVsMsaViz")),
    "cicd": lazy(() => import("@/visualizations/CiCdViz")),
    "docker-before-after": lazy(() => import("@/visualizations/DockerViz")),
    "k8s-before-after": lazy(() => import("@/visualizations/K8sViz")),
    "global-post-retrieval": lazy(() => import("@/visualizations/GlobalPostRetrievalViz")),
  },
  algorithms: {
    "sieve-of-eratosthenes": lazy(() => import("@/visualizations/SieveViz")),
    "bubble-sort": lazy(() => import("@/visualizations/BubbleSortViz")),
    "selection-sort": lazy(() => import("@/visualizations/SelectionSortViz")),
    "insertion-sort": lazy(() => import("@/visualizations/InsertionSortViz")),
    "merge-sort": lazy(() => import("@/visualizations/MergeSortViz")),
    "quick-sort": lazy(() => import("@/visualizations/QuickSortViz")),
    "heap-sort": lazy(() => import("@/visualizations/HeapSortViz")),
    "counting-sort": lazy(() => import("@/visualizations/CountingSortViz")),
    "radix-sort": lazy(() => import("@/visualizations/RadixSortViz")),
    "dfs-vs-bfs": lazy(() => import("@/visualizations/DfsVsBfsViz")),
    "dijkstra": lazy(() => import("@/visualizations/DijkstraViz")),
    "knapsack": lazy(() => import("@/visualizations/KnapsackViz")),
  },
};
