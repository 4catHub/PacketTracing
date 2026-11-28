import { useState } from "react";
import {
  AppWindow, ArrowDown, ArrowLeft, ArrowRight, Bell, ChartNoAxesCombined, Check,
  CodeXml, Database, Film, Globe2, Layers3, MessageCircle, RadioTower, Search, Server, UsersRound,
} from "lucide-react";
import "./instagram-architecture.css";

const components = {
  client: {
    label: "앱·웹", caption: "조회 · 게시 · 반응", icon: AppWindow, tone: "sky", group: "사용자 접점",
    role: ["피드·스토리·릴스·탐색·DM 화면 제공", "게시물 정보와 미디어 재생 데이터를 각각 요청"],
    data: ["게시물 ID · 미디어 참조 · 노출·시청 기록"],
    check: ["초기 목록 로딩과 영상 재생 시작 시간 분리 측정"],
  },
  edge: {
    label: "엣지·전송", caption: "요청 분산 · 미디어 캐시", icon: Globe2, tone: "sky", group: "사용자 접점",
    role: ["DNS로 접속 지점 결정", "엣지에서 요청 보호·분산, CDN에서 캐시된 미디어 제공"],
    data: ["API 요청은 애플리케이션으로 전달", "CDN 캐시에 없으면 원본 서버에서 파일 조회"],
    check: ["개인화된 API 응답과 미디어의 캐시 정책 분리", "권한이 필요한 콘텐츠는 미디어 접근도 통제"],
  },
  api: {
    label: "애플리케이션 API", caption: "인증 · 기능 연결", icon: CodeXml, tone: "violet", group: "동기 요청 처리",
    role: ["계정 인증과 요청 권한 확인", "게시·피드·검색·DM 요청을 각 기능에 연결"],
    data: ["Meta 2026년 공개 사례에서 GraphQL 스키마를 Python·PHP 서버가 공유"],
    check: ["서버 간 호출 수와 API 응답 지연 확인", "GraphQL 사례의 적용 범위와 별도 인터페이스 확인"],
  },
  media: {
    label: "미디어 처리·저장", caption: "업로드 · 인코딩 · 재생", icon: Film, tone: "rose", group: "미디어 전송",
    role: ["원본 사진·영상과 파생 파일 보관", "릴스에 여러 비트레이트·코덱의 재생 버전 준비"],
    data: ["미디어 참조는 게시물과 연결", "라이브 송출 영상 수신은 녹화 영상 업로드와 별도 경로"],
    check: ["업로드 수신·재생 가능·고급 인코딩 완료 상태 구분", "기기와 네트워크에 맞는 버전 선택"],
  },
  social: {
    label: "게시·소셜 그래프", caption: "계정 · 팔로우 · 반응", icon: UsersRound, tone: "violet", group: "동기 요청 처리",
    role: ["게시물·좋아요·댓글 상태 관리", "팔로우·차단·공개 범위에 따라 접근 판단"],
    data: ["게시물에 미디어 ID 연결", "계정 관계와 게시물을 피드 후보에 사용"],
    check: ["삭제·차단은 조회 시점에도 확인", "반응 재시도에 따른 중복 기록 방지"],
  },
  jobs: {
    label: "이벤트·워커", caption: "변환 · 반영 · 알림 후보", icon: RadioTower, tone: "amber", group: "비동기 처리",
    role: ["영상 인코딩 작업과 게시물 변경 작업을 백그라운드로 전달", "색인·알림 대상 갱신과 행동 로그 전달"],
    data: ["변경 이벤트에는 게시물 ID와 변경 버전 사용", "Meta 공개 인프라 사례에서 FOQS는 작업 큐, Scribe는 로그 스트림"],
    check: ["재전달에 대비해 워커를 멱등하게 구성", "대기열 적체와 처리 지연 관측"],
  },
  ranking: {
    label: "피드·추천", caption: "후보 수집 · 순위 결정", icon: Layers3, tone: "emerald", group: "개인화 조회",
    role: ["홈 피드·스토리·릴스·탐색 화면별 콘텐츠 선정", "후보 수집 → 1차 랭킹 → 2차 랭킹"],
    data: ["팔로우 관계 · 게시물 · 시청·저장 등 관심 신호", "응답에 게시물 정보와 미디어 참조 포함"],
    check: ["후보 조회와 모델 추론 지연 분리 측정", "만료·삭제·차단 상태를 노출 전에 적용"],
  },
  analytics: {
    label: "분석·모델 학습", caption: "행동 신호 · 실험 지표", icon: ChartNoAxesCombined, tone: "emerald", group: "오프라인 처리",
    role: ["노출·클릭·시청 기록을 집계", "실험 평가와 추천 모델 학습에 사용"],
    data: ["행동 이벤트 · 순위 모델 학습 데이터 · 실험군 지표"],
    check: ["수집 지연과 중복 확인", "재생 오류와 추천 품질 지표를 함께 관찰"],
  },
  search: {
    label: "검색", caption: "계정 · 태그 · 게시물", icon: Search, tone: "violet", group: "검색 조회",
    role: ["검색어에 맞는 문서 후보 검색 및 정렬", "검색 결과의 공개 범위 확인"],
    data: ["게시물과 계정의 검색용 사본", "2015년 공개 사례에서 Elasticsearch에서 Unicorn으로 이전"],
    check: ["색인 지연과 삭제·차단 적용 시점 확인"],
  },
  messages: {
    label: "DM", caption: "대화 기록 · 실시간 전달", icon: MessageCircle, tone: "sky", group: "실시간 통신",
    role: ["대화 기록 조회와 새 메시지 전달", "재연결 시 누락 메시지 보완"],
    data: ["2022년 데스크톱 웹 공개 사례에서 REST와 MQTT 사용"],
    check: ["대화 단위 순서와 재전송 중복 처리", "알림 상태와 메시지 전달 상태 구분"],
  },
  notifications: {
    label: "알림", caption: "활동 감지 · 발송", icon: Bell, tone: "amber", group: "비동기 처리",
    role: ["반응·댓글 등에서 전달할 알림 선정", "인앱 알림 또는 푸시로 표시"],
    data: ["변경 이벤트 · 수신 설정 · 추천형 알림의 순위 점수"],
    check: ["중복 발송 방지와 수신 설정 적용", "지연된 알림의 유효성 확인"],
  },
  data: {
    label: "데이터 저장·캐시", caption: "원본 · 그래프 · 조회 캐시", icon: Database, tone: "violet", group: "데이터 인프라",
    role: ["게시물과 계정 원본, 계정 간 관계, 조회 캐시를 용도에 맞게 저장", "미디어 파일과 검색 인덱스는 각각의 조회 경로에서 사용"],
    data: ["초기 관계형 데이터는 PostgreSQL에 저장", "소셜 그래프의 Meta TAO 이전 공개"],
    check: ["복제 지연과 캐시 무효화 순서 확인", "인기 게시물의 캐시 미스 집중 방지"],
  },
  operations: {
    label: "배포·관측", caption: "용량 · 데이터센터 · 지표", icon: Server, tone: "sky", group: "운영 인프라",
    role: ["서비스와 워커의 배포·확장 및 상태 감시", "데이터센터 장애 시 트래픽을 다른 지역으로 전환"],
    data: ["API p95 · 대기열 지연 · 캐시 적중률 · 영상 재생 오류", "Meta가 공개한 클러스터 관리 시스템 Twine"],
    check: ["조회와 영상 변환의 용량을 각각 조절", "복제본과 지역별 캐시를 포함해 장애 복구 검증"],
  },
} as const;

type ComponentId = keyof typeof components;
type Connection = readonly [from: ComponentId, to: ComponentId, label: string];

const links = {
  entrance: ["client", "edge", "API·미디어 요청"],
  delivery: ["edge", "media", "미디어 경로"],
  routing: ["edge", "api", "API 라우팅"],
  upload: ["api", "media", "업로드 연결"],
  encode: ["media", "jobs", "변환 작업"],
  write: ["api", "social", "게시·반응"],
  publish: ["social", "jobs", "변경 이벤트"],
  candidates: ["social", "ranking", "게시물·관계"],
  signals: ["jobs", "analytics", "이벤트 집계"],
  training: ["analytics", "ranking", "학습 신호"],
  mediaRef: ["social", "media", "미디어 ID 참조"],
  feed: ["api", "ranking", "목록 조회"],
  watch: ["client", "jobs", "노출·시청 로그"],
  query: ["api", "search", "검색어 전달"],
  index: ["jobs", "search", "색인 갱신"],
  direct: ["api", "messages", "대화 요청"],
  realtime: ["messages", "client", "실시간 전달"],
  notify: ["jobs", "notifications", "발송 후보"],
  push: ["notifications", "client", "푸시·인앱"],
  store: ["social", "data", "상태 저장·조회"],
  deploy: ["operations", "api", "배포·관측"],
  workers: ["operations", "jobs", "용량·지연 관측"],
} satisfies Record<string, Connection>;

const connections = Object.values(links);
const explorer: ComponentId[] = ["api", "media", "social", "ranking", "jobs", "search", "messages", "notifications", "data"];
const inspectorId = "instagram-component-inspector";

const tones = {
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

const attachments: { id: ComponentId; connections: Connection[] }[] = [
  { id: "search", connections: [links.query, links.index] },
  { id: "messages", connections: [links.direct, links.realtime] },
  { id: "notifications", connections: [links.notify, links.push] },
  { id: "data", connections: [links.store] },
  { id: "operations", connections: [links.deploy, links.workers] },
];

function connectionName([from, to, label]: Connection) {
  return `${components[from].label} → ${components[to].label} · ${label}`;
}

function Connector({ link, active, direction = "down", compactLabel }: {
  link: Connection;
  active: ComponentId;
  direction?: "down" | "left" | "right";
  compactLabel?: string;
}) {
  const [from, to, label] = link;
  const Arrow = direction === "down" ? ArrowDown : direction === "left" ? ArrowLeft : ArrowRight;

  return (
    <div role="img" aria-label={connectionName(link)} data-direction={direction}
      data-connected={active === from || active === to} className="instagram-connector">
      <span className="instagram-connector-label" aria-hidden="true">
        {compactLabel ? <><span className="sm:hidden">{compactLabel}</span><span className="hidden sm:inline">{label}</span></> : label}
      </span>
      <Arrow size={14} className="instagram-connector-arrow" aria-hidden="true" />
    </div>
  );
}

function ConnectionNote({ link, active }: { link: Connection; active: ComponentId }) {
  const [from, to] = link;
  return (
    <li data-connected={active === from || active === to}
      className="break-keep text-[11px] leading-relaxed text-muted-foreground data-[connected=true]:font-semibold data-[connected=true]:text-emerald-800 dark:data-[connected=true]:text-emerald-300">
      {connectionName(link)}
    </li>
  );
}

export default function InstagramArchitectureViz() {
  const [active, setActive] = useState<ComponentId>("ranking");
  const selected = components[active];
  const activeLinks = connections.filter(([from, to]) => from === active || to === active);
  const related = new Set(activeLinks.flatMap(([from, to]) => [from, to]));

  function node(id: ComponentId, mode: "map" | "compact" | "explorer" = "map") {
    const { label, caption, icon: Icon, tone } = components[id];
    return (
      <button key={id} type="button" aria-pressed={id === active} aria-controls={inspectorId}
        onClick={() => setActive(id)} data-related={mode !== "explorer" && related.has(id)}
        data-mode={mode} className="instagram-node">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <strong className="block break-keep text-xs sm:text-sm">{label}</strong>
          <span className="block break-keep text-[11px] leading-snug text-muted-foreground">{caption}</span>
        </span>
        {id === active && <Check size={12} aria-hidden="true" className="absolute right-1 top-1 text-emerald-700 dark:text-emerald-300" />}
      </button>
    );
  }

  return (
    <div className="instagram-architecture grid gap-6" data-testid="instagram-architecture">
      <figure className="space-y-3" aria-labelledby="instagram-map-title">
        <figcaption className="space-y-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">ARCHITECTURE MAP</p>
          <h2 id="instagram-map-title" className="text-xl font-bold">SNS 기능과 인프라 구조도</h2>
          <p className="break-keep text-xs leading-relaxed text-muted-foreground sm:text-sm">
            인스타그램 공개 사례를 바탕으로 구성한 SNS 설계 모델입니다. 구성요소를 선택하면 연결과 기능 상세가 강조됩니다.
          </p>
        </figcaption>

        <div className="relative isolate rounded-xl border border-border bg-background p-2.5 sm:p-5">
          <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full rounded-xl text-muted-foreground opacity-[0.12]" aria-hidden="true">
            <defs>
              <pattern id="instagram-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 20V0H20" fill="none" stroke="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#instagram-map-grid)" />
          </svg>
          <div className="mx-auto max-w-2xl">
            <div className="mx-auto grid w-[57%] max-w-56">
              {node("client")}
              <Connector link={links.entrance} active={active} />
              {node("edge")}
            </div>

            <div className="instagram-map-grid">
              <div className="instagram-split col-span-3" aria-hidden="true" />
              <Connector link={links.delivery} active={active} />
              <div />
              <Connector link={links.routing} active={active} />
              {node("media")}
              <Connector link={links.upload} active={active} direction="left" compactLabel="업로드" />
              {node("api")}
              <Connector link={links.encode} active={active} />
              <div />
              <Connector link={links.write} active={active} />
              {node("jobs")}
              <Connector link={links.publish} active={active} direction="left" compactLabel="변경" />
              {node("social")}
              <Connector link={links.signals} active={active} />
              <div />
              <Connector link={links.candidates} active={active} />
              {node("analytics")}
              <Connector link={links.training} active={active} direction="right" compactLabel="학습" />
              {node("ranking")}
            </div>
          </div>

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1" aria-label="조회·참조·시청 신호 연결">
            <ConnectionNote link={links.feed} active={active} />
            <ConnectionNote link={links.mediaRef} active={active} />
            <ConnectionNote link={links.watch} active={active} />
          </ul>

          <section className="mt-4 rounded-lg border border-dashed border-border bg-card p-2.5 sm:p-3" aria-labelledby="instagram-integrations-title">
            <h3 id="instagram-integrations-title" className="mb-2 text-xs font-semibold text-muted-foreground">기능 연동 · 데이터 인프라</h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {attachments.map(({ id, connections: attachmentLinks }) => (
                <li key={id} className="min-w-0 rounded-lg border border-border bg-background p-1">
                  {node(id, "compact")}
                  <ul className="space-y-1 px-1.5 py-1.5">
                    {attachmentLinks.map((link) => <ConnectionNote key={link[2]} link={link} active={active} />)}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </figure>

      <section aria-labelledby="instagram-explorer-title" className="space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">ARCHITECTURE EXPLORER</p>
          <h2 id="instagram-explorer-title" className="text-base font-bold">핵심 기능</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{explorer.map((id) => node(id, "explorer"))}</div>
      </section>

      <section id={inspectorId} aria-labelledby="instagram-inspector-title" className="space-y-3 rounded-xl border border-border bg-background p-3 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold tracking-widest text-muted-foreground">COMPONENT INSPECTOR</p>
          <h2 id="instagram-inspector-title" className="mt-1 text-base font-bold">기능 상세</h2>
        </div>
        <div aria-live="polite" aria-atomic="true" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className={`grid size-8 shrink-0 place-items-center rounded-md ${tones[selected.tone]}`}>
              <selected.icon size={17} aria-hidden="true" />
            </span>
            <h3 className="font-bold">{selected.label}</h3>
            <span className="text-xs text-muted-foreground">{selected.group}</span>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["역할", selected.role],
              ["연결 관계", activeLinks.map(connectionName)],
              ["데이터·인터페이스", selected.data],
              ["설계 시 확인", selected.check],
            ] as const).map(([term, points]) => (
              <div key={term} className="min-w-0 rounded-lg border border-border bg-card p-3">
                <dt className="text-xs font-semibold">{term}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  <ul className="instagram-inspector-list space-y-1">
                    {points.map((point) => <li key={point}>{point}</li>)}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
