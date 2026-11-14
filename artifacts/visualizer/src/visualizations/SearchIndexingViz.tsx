import WorkflowFocusedViz from "./WorkflowFocusedViz";
import SearchIndexingScene from "./SearchIndexingScene";
import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

const actors = [
  { id: "web", label: "웹사이트", detail: "문서 · 사이트맵", x: 12, y: 20 },
  {
    id: "crawler",
    label: "수집기",
    detail: "URL 대기열 · 크롤링",
    x: 50,
    y: 20,
  },
  {
    id: "processor",
    label: "문서 분석기",
    detail: "추출 · 분석 · 색인",
    x: 88,
    y: 20,
  },
  { id: "index", label: "검색 색인", detail: "단어 → 문서 목록", x: 88, y: 80 },
  {
    id: "search",
    label: "검색 작업대",
    detail: "후보 · 순위 · 결과",
    x: 50,
    y: 80,
  },
  { id: "user", label: "사용자", detail: "검색어 · 결과 화면", x: 12, y: 80 },
];
const links = [
  ["web", "crawler"],
  ["crawler", "processor"],
  ["processor", "index"],
  ["index", "search"],
  ["search", "user"],
] as const;

type Operation = {
  title: string;
  summary: string;
  ids: string[];
  from?: string;
  to?: string;
  label?: string;
  output: string;
};
const operations: Operation[] = [
  {
    title: "URL 발견",
    summary: "링크와 사이트맵에서 주소를 찾아 수집 대기열에 넣습니다.",
    ids: ["web", "crawler"],
    from: "web",
    to: "crawler",
    label: "발견한 URL",
    output: "/guide/cache · /guide/login",
  },
  {
    title: "수집 일정과 접근 규칙",
    summary:
      "수집기가 접근 규칙과 사이트별 요청 간격을 살펴 방문 순서를 정합니다.",
    ids: ["crawler", "web"],
    from: "crawler",
    to: "web",
    label: "robots.txt 확인",
    output: "대기열 → 접근 확인 → 방문 예약",
  },
  {
    title: "페이지 수집과 렌더링",
    summary:
      "크롤러가 페이지를 요청하고 응답을 가져옵니다. 필요한 콘텐츠는 렌더링해 읽습니다.",
    ids: ["crawler", "web"],
    from: "web",
    to: "crawler",
    label: "HTML 응답",
    output: "GET /guide/cache → 200 HTML",
  },
  {
    title: "본문 추출과 색인 대상 판별",
    summary: "제목·본문을 추출하고 noindex 및 중복 문서를 확인합니다.",
    ids: ["crawler", "processor"],
    from: "crawler",
    to: "processor",
    label: "수집 문서",
    output: "D1 · 스프링 캐시 적용 가이드",
  },
  {
    title: "문장 분석",
    summary:
      "학습용 분석기로 문장을 단어 토큰으로 나눕니다. 실제 토큰은 분석기 설정에 따라 달라집니다.",
    ids: ["processor"],
    output: "스프링 캐시 적용 가이드 → 스프링 · 캐시 · 적용 · 가이드",
  },
  {
    title: "역색인 생성",
    summary:
      "각 단어에 포함 문서 ID를 연결합니다. 같은 문서는 여러 목록에 등장할 수 있습니다.",
    ids: ["processor", "index"],
    from: "processor",
    to: "index",
    label: "단어 → 문서 ID",
    output: "스프링 → D1, D2, D3 · 캐시 → D1, D2",
  },
  {
    title: "검색 가능 상태로 반영",
    summary:
      "새 색인이 검색 경로에 반영됩니다. 저장 직후 곧바로 검색된다는 보장은 없습니다.",
    ids: ["index"],
    label: "색인 반영",
    output: "반영 대기 → 검색 가능",
  },
  {
    title: "검색어 입력과 분석",
    summary:
      "사용자가 검색어를 입력하고 검색 처리기가 색인과 호환되는 규칙으로 분석합니다.",
    ids: ["user", "search"],
    from: "user",
    to: "search",
    label: "스프링 캐시",
    output: "스프링 캐시 → 스프링 · 캐시",
  },
  {
    title: "후보 문서 찾기",
    summary:
      "두 단어를 모두 요구하는 예시입니다. 각 목록의 교집합에서 D1과 D2를 찾습니다.",
    ids: ["search", "index"],
    from: "search",
    to: "index",
    label: "단어별 목록 조회",
    output: "스프링 ∩ 캐시 = D1, D2",
  },
  {
    title: "필터링과 순위",
    summary:
      "후보를 조건에 따라 걸러내고 관련성 신호를 바탕으로 순위를 정합니다. 순서는 예시입니다.",
    ids: ["search"],
    label: "후보 D1 · D2",
    output: "후보 D1, D2 → 순위 D1, D2",
  },
  {
    title: "검색 결과 구성",
    summary: "제목·URL·문서 일부를 이용해 결과와 스니펫을 구성합니다.",
    ids: ["search", "index"],
    from: "search",
    to: "index",
    label: "결과 정보 조회",
    output: "제목 + URL + 검색어 관련 요약문",
  },
  {
    title: "결과 화면 표시",
    summary:
      "정렬된 검색 결과를 사용자에게 반환합니다. 색인되어도 모든 검색에서 노출되는 것은 아닙니다.",
    ids: ["search", "user"],
    from: "search",
    to: "user",
    label: "검색 결과",
    output: "1. D1 스프링 캐시 적용 가이드 · 2. D2 스프링 캐시 장애 분석",
  },
];
const span = (
  actorId: string,
  label: string,
  start: number,
  end: number,
  kind: WorkflowWaterfallSpan["kind"] = "work",
): WorkflowWaterfallSpan => ({ actorId, label, start, end, kind });
const traces: WorkflowWaterfallSpan[][] = [
  [
    span("web", "링크에서 URL 발견", 0, 0.15),
    span("crawler", "대기열에 URL 적재", 0.15, 1),
  ],
  [
    span("crawler", "접근 규칙·일정 확인", 0, 0.35),
    span("crawler", "허용한 URL 통과", 0.35, 1),
  ],
  [
    span("crawler", "HTTP 요청", 0, 0.3, "network"),
    span("web", "HTML 응답", 0.35, 0.8, "network"),
    span("crawler", "수집 문서 적재", 0.8, 1),
  ],
  [
    span("crawler", "문서 전달", 0, 0.45, "network"),
    span("processor", "본문 스캔·추출", 0.45, 1),
  ],
  [span("processor", "문장 분리·토큰 생성", 0, 1)],
  [
    span("processor", "토큰·문서 ID 전달", 0, 0.55),
    span("index", "단어별 문서 목록 저장", 0.15, 1),
  ],
  [
    span("index", "색인 반영 대기", 0, 0.6, "wait"),
    span("index", "검색 가능 상태 공개", 0.6, 1),
  ],
  [
    span("user", "검색어 입력", 0, 0.55),
    span("search", "검색어 수신·분석", 0.55, 1),
  ],
  [
    span("index", "단어 목록 조회", 0, 0.45),
    span("search", "목록 수신·교집합 선택", 0.25, 1),
  ],
  [span("search", "후보 필터링·순위 변경", 0, 1)],
  [
    span("index", "문서 정보 반환", 0, 0.5, "network"),
    span("search", "제목·URL·요약문 조립", 0.15, 1),
  ],
  [
    span("search", "검색 결과 전송", 0, 0.5, "network"),
    span("user", "결과 카드 표시", 0.45, 1),
  ],
];
const steps: WorkflowVisualizationStep[] = operations.map((op, i) => ({
  title: op.title,
  summary: op.summary,
  activeActorIds: op.ids,
  transitions:
    op.from && op.to
      ? [
          {
            from: op.from,
            to: op.to,
            label: op.label!,
            kind: i === 2 || i === 11 ? "response" : "event",
          },
        ]
      : [],
  spans: traces[i],
}));
const spec: WorkflowVisualizationSpec = {
  title: "웹 문서에서 검색 결과까지",
  motionTone: "friendly",
  autoplayMs: 5200,
  overviewMs: 3500,
  overviewSummary:
    "수집·색인과 검색·응답은 별도로 진행되며 같은 검색 색인을 사용합니다. 예시는 실제 검색이 아닌 고정된 학습 데이터입니다.",
  waterfallLabel: "현재 단계의 처리 순서 · 예시",
  actors,
  topologyLinks: links.map(([from, to]) => ({ from, to })),
  steps,
};

export default function SearchIndexingViz() {
  return (
    <WorkflowFocusedViz spec={spec} TopologyCanvas={SearchIndexingScene} />
  );
}
