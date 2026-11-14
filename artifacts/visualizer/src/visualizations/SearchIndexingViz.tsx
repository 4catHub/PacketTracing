import { useEffect, useId, useState } from "react";
import { BookOpenText, Boxes, FileSearch, Globe, Search, UserRound } from "lucide-react";
import WorkflowFocusedViz, { type WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type { WorkflowVisualizationSpec, WorkflowVisualizationStep } from "./workflow-visualization";

const actors = [
  { id: "web", label: "웹사이트", detail: "문서 · 사이트맵", x: 12, y: 20 },
  { id: "crawler", label: "수집기", detail: "URL 대기열 · 크롤링", x: 50, y: 20 },
  { id: "processor", label: "문서 처리기", detail: "추출 · 분석 · 색인", x: 88, y: 20 },
  { id: "index", label: "검색 색인", detail: "단어 → 문서 목록", x: 88, y: 80 },
  { id: "search", label: "검색 처리기", detail: "후보 · 순위 · 결과", x: 50, y: 80 },
  { id: "user", label: "사용자", detail: "검색어 · 결과 화면", x: 12, y: 80 },
];
const links = [["web", "crawler"], ["crawler", "processor"], ["processor", "index"], ["index", "search"], ["search", "user"]] as const;
const actor = Object.fromEntries(actors.map(a => [a.id, a]));

type Operation = { title: string; summary: string; ids: string[]; from?: string; to?: string; label?: string; output: string };
const operations: Operation[] = [
  { title: "URL 발견", summary: "링크와 사이트맵에서 주소를 찾아 수집 대기열에 넣습니다.", ids: ["web", "crawler"], from: "web", to: "crawler", label: "발견한 URL", output: "/guide/cache · /guide/login" },
  { title: "수집 일정과 접근 규칙", summary: "수집기가 접근 규칙과 사이트별 요청 간격을 살펴 방문 순서를 정합니다.", ids: ["crawler", "web"], from: "crawler", to: "web", label: "robots.txt 확인", output: "대기열 → 접근 확인 → 방문 예약" },
  { title: "페이지 수집과 렌더링", summary: "크롤러가 페이지를 요청하고 응답을 가져옵니다. 필요한 콘텐츠는 렌더링해 읽습니다.", ids: ["crawler", "web", "processor"], from: "web", to: "crawler", label: "HTML 응답", output: "GET /guide/cache → 200 HTML" },
  { title: "본문 추출과 색인 대상 판별", summary: "제목·본문을 추출하고 noindex 및 중복 문서를 확인합니다.", ids: ["crawler", "processor"], from: "crawler", to: "processor", label: "수집 문서", output: "D1 · 스프링 캐시 적용 가이드" },
  { title: "문장 분석", summary: "학습용 분석기로 문장을 단어 토큰으로 나눕니다. 실제 토큰은 분석기 설정에 따라 달라집니다.", ids: ["processor"], output: "스프링 캐시 적용 가이드 → 스프링 · 캐시 · 적용 · 가이드" },
  { title: "역색인 생성", summary: "각 단어에 포함 문서 ID를 연결합니다. 같은 문서는 여러 목록에 등장할 수 있습니다.", ids: ["processor", "index"], from: "processor", to: "index", label: "단어 → 문서 ID", output: "스프링 → D1, D2, D3 · 캐시 → D1, D2" },
  { title: "검색 가능 상태로 반영", summary: "새 색인이 검색 경로에 반영됩니다. 저장 직후 곧바로 검색된다는 보장은 없습니다.", ids: ["processor", "index"], from: "processor", to: "index", label: "색인 반영", output: "반영 대기 → 검색 가능" },
  { title: "검색어 입력과 분석", summary: "사용자가 검색어를 입력하고 검색 처리기가 색인과 호환되는 규칙으로 분석합니다.", ids: ["user", "search"], from: "user", to: "search", label: "스프링 캐시", output: "스프링 캐시 → 스프링 · 캐시" },
  { title: "후보 문서 찾기", summary: "두 단어를 모두 요구하는 예시입니다. 각 목록의 교집합에서 D1과 D2를 찾습니다.", ids: ["search", "index"], from: "search", to: "index", label: "단어별 목록 조회", output: "스프링 ∩ 캐시 = D1, D2" },
  { title: "필터링과 순위", summary: "후보를 조건에 따라 걸러내고 관련성 신호를 바탕으로 순위를 정합니다. 순서는 예시입니다.", ids: ["index", "search"], from: "index", to: "search", label: "후보 D1 · D2", output: "후보 D1, D2 → 순위 D1, D2" },
  { title: "검색 결과 구성", summary: "제목·URL·문서 일부를 이용해 결과와 스니펫을 구성합니다.", ids: ["search", "index"], from: "search", to: "index", label: "결과 정보 조회", output: "제목 + URL + 검색어 관련 요약문" },
  { title: "결과 화면 표시", summary: "정렬된 검색 결과를 사용자에게 반환합니다. 색인되어도 모든 검색에서 노출되는 것은 아닙니다.", ids: ["search", "user"], from: "search", to: "user", label: "검색 결과", output: "1. D1 스프링 캐시 적용 가이드 · 2. D2 스프링 캐시 장애 분석" },
];
const steps: WorkflowVisualizationStep[] = operations.map(op => ({
  title: op.title, summary: op.summary, activeActorIds: op.ids,
  transitions: op.from && op.to ? [{ from: op.from, to: op.to, label: op.label!, kind: "event" }] : [],
  spans: op.ids.map((id, i) => ({ actorId: id, label: i === 0 ? op.title : `${actor[id].label} · ${op.label ?? "처리"}`, start: i / op.ids.length, end: (i + 1) / op.ids.length, kind: "work" })),
}));
const spec: WorkflowVisualizationSpec = {
  title: "웹 문서에서 검색 결과까지", motionTone: "friendly", autoplayMs: 5200, overviewMs: 3500,
  overviewSummary: "수집·색인과 검색·응답은 별도로 진행되며 같은 검색 색인을 사용합니다. 예시는 실제 검색이 아닌 고정된 학습 데이터입니다.",
  waterfallLabel: "현재 단계의 처리 순서 · 예시", actors, topologyLinks: links.map(([from, to]) => ({ from, to })), steps,
};

const icons = { web: Globe, crawler: FileSearch, processor: Boxes, index: BookOpenText, search: Search, user: UserRound };
const positionsWide: Record<string, [number, number]> = { web: [120, 80], crawler: [450, 80], processor: [780, 80], index: [780, 280], search: [450, 280], user: [120, 280] };
const positionsNarrow: Record<string, [number, number]> = { web: [110, 70], crawler: [350, 70], processor: [350, 255], index: [350, 440], search: [110, 440], user: [110, 255] };

function Evidence({ index }: { index: number | null }) {
  if (index === null) return <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-md border border-border px-2 py-1">D1 · 스프링 캐시 적용 가이드</span><span className="rounded-md border border-border px-2 py-1">D2 · 스프링 캐시 장애 분석</span><span className="rounded-md border border-border px-2 py-1">D3 · 스프링 로그인 구현</span></div>;
  if (index === 0 || index === 1) return <div className="flex flex-wrap items-center gap-2 text-xs"><div className="rounded-lg border border-border bg-card p-3"><div className="font-semibold">{index === 0 ? "사이트맵 · 링크" : "접근 규칙"}</div><div className="mt-1 text-muted-foreground">{index === 0 ? "URL 발견" : "robots.txt · 요청 간격"}</div></div><span aria-hidden="true">→</span><div className="rounded-lg border border-border bg-card p-2"><div className="mb-1 font-semibold">수집 대기열</div>{["/guide/cache", "/guide/login"].map(url => <div key={url} className="mt-1 rounded border border-border px-2 py-1 font-mono">{url}</div>)}</div></div>;
  if (index === 2) return <div className="flex flex-wrap items-center gap-2 text-xs"><div className="rounded-lg border border-border bg-card p-3"><div className="font-semibold">크롤러</div><div className="mt-1 font-mono text-muted-foreground">GET /guide/cache</div></div><span aria-hidden="true">→</span><div className="rounded-lg border border-border bg-card p-3"><div className="font-semibold">웹 서버</div><div className="mt-1 font-mono text-muted-foreground">200 · HTML 응답</div></div></div>;
  if (index === 6) return <div className="flex flex-wrap items-center gap-2 text-xs"><div className="rounded-lg border border-dashed border-border bg-card p-3"><div className="font-semibold">색인 데이터</div><div className="mt-1 text-muted-foreground">반영 대기</div></div><span aria-hidden="true">→</span><div className="rounded-lg border border-primary/40 bg-card p-3"><div className="font-semibold text-primary">검색 가능</div><div className="mt-1 text-muted-foreground">D1 · D2 · D3</div></div></div>;
  if (index === 4 || index === 7) return <div className="flex flex-wrap items-center gap-2 text-sm"><span className="rounded-md border border-border bg-card px-3 py-2">{index === 4 ? "스프링 캐시 적용 가이드" : "스프링 캐시"}</span><span aria-hidden="true">→</span>{(index === 4 ? ["스프링", "캐시", "적용", "가이드"] : ["스프링", "캐시"]).map(t => <span key={t} className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 font-semibold text-primary">{t}</span>)}</div>;
  if (index === 5 || index === 8) return <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="pb-2">단어 사전</th><th className="pb-2">문서 ID 목록</th></tr></thead><tbody>{[["스프링", "D1 · D2 · D3"], ["캐시", "D1 · D2"], ["로그인", "D3"]].map(([term, docs]) => <tr key={term} className={index === 8 && term !== "로그인" ? "font-semibold text-primary" : ""}><td className="border-t border-border py-1.5">{term}</td><td className="border-t border-border py-1.5">{docs}</td></tr>)}</tbody></table>{index === 8 && <p className="mt-2 text-xs font-semibold text-primary">두 단어 모두 포함 → D1 · D2</p>}</div>;
  if (index >= 9) return <div className="space-y-2">{["스프링 캐시 적용 가이드", "스프링 캐시 장애 분석"].map((title, i) => <div key={title} className="rounded-lg border border-border bg-card px-3 py-2"><div className="text-xs text-muted-foreground">{i + 1} · example.com/{i ? "troubleshooting" : "guide"}</div><div className="text-sm font-semibold text-primary">{title}</div>{index >= 10 && <div className="text-xs text-muted-foreground">스프링 캐시의 {i ? "장애 원인과 분석" : "적용 방법"}을 살펴봅니다.</div>}</div>)}</div>;
  if (index === 3) return <div className="rounded-lg border border-border bg-card p-3 text-sm"><div className="text-xs text-muted-foreground">문서 D1 · 제목과 본문 추출</div><strong>스프링 캐시 적용 가이드</strong><div className="mt-1 text-xs text-muted-foreground">본문 · 캐시를 적용하는 방법을 설명합니다.</div></div>;
  return <div className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm">{operations[index].output}</div>;
}

const exceptionNotes: Record<number, string> = { 1: "접근 제한: 수집을 보류합니다.", 2: "429 · 일시 오류: 요청 간격을 늘리고 재시도합니다.", 3: "noindex: 색인 제외 · 중복 문서: 대표 URL 선택", 5: "색인 실패: 실패 기록 후 재처리 대기열로 이동", 8: "결과 없음: 빈 결과를 표시합니다.", 9: "시간 초과: 실패 또는 부분 결과 여부를 표시합니다.", 11: "수정 · 삭제: 재수집 후 색인 갱신 또는 제거" };

function SearchTopology({ stepIndex }: WorkflowTopologyCanvasProps) {
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches);
  const id = useId().replace(/:/g, "");
  useEffect(() => { const m = window.matchMedia("(max-width: 640px)"); const change = () => setCompact(m.matches); m.addEventListener("change", change); return () => m.removeEventListener("change", change); }, []);
  const pos = compact ? positionsNarrow : positionsWide;
  const op = stepIndex === null ? null : operations[stepIndex];
  const w = compact ? 175 : 200, h = 112;
  return <div className="bg-background p-2 sm:p-3">
    <svg viewBox={compact ? "0 0 460 510" : "0 0 900 350"} className="block w-full" role="img" aria-label={`웹 검색 전체 구성도. ${op?.title ?? "전체 구조"}`}>
      <defs><marker id={`search-arrow-${id}`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0 L9 4.5 L0 9 Z" className="fill-primary" /></marker></defs>
      {links.map(([a,b]) => { const [x1,y1]=pos[a], [x2,y2]=pos[b]; const dx=x2-x1, dy=y2-y1; const factor=Math.min(dx ? (w/2)/Math.abs(dx) : Infinity, dy ? (h/2)/Math.abs(dy) : Infinity); const active=op && ((op.from===a && op.to===b)||(op.from===b && op.to===a)); const reverse=op?.from===b; const xStart=x1+dx*factor, yStart=y1+dy*factor, xEnd=x2-dx*factor, yEnd=y2-dy*factor; return <path key={a+b} d={reverse ? `M${xEnd} ${yEnd} L${xStart} ${yStart}` : `M${xStart} ${yStart} L${xEnd} ${yEnd}`} fill="none" className={active ? "stroke-primary" : "stroke-muted-foreground"} strokeOpacity={active ? 1 : .42} strokeWidth={active ? 3 : 1.5} strokeDasharray={active ? undefined : "5 5"} markerEnd={active ? `url(#search-arrow-${id})` : undefined}/>; })}
      {actors.map(a => { const [x,y]=pos[a.id]; const Icon=icons[a.id as keyof typeof icons]; const active=!!op?.ids.includes(a.id); return <g key={a.id} data-actor-id={a.id} transform={`translate(${x-w/2} ${y-h/2})`}>
        <rect width={w} height={h} rx="12" className="fill-card stroke-border" strokeWidth="1.5" />
        {active && <rect x="-3" y="-3" width={w+6} height={h+6} rx="15" fill="none" className="stroke-primary" strokeWidth="2" />}
        <rect x="12" y="13" width="34" height="34" rx="8" className={active ? "fill-primary/10" : "fill-muted"}/>
        <Icon x="19" y="20" size={20} className={active ? "text-primary" : "text-muted-foreground"}/>
        <text x="55" y="35" className="fill-foreground" fontSize="15" fontWeight="700">{a.label}</text>
        <text x="14" y="69" className="fill-muted-foreground" fontSize="12">{a.detail}</text>
        <text x="14" y="94" className={active ? "fill-primary" : "fill-muted-foreground"} fontSize="11">{active ? "● 현재 처리" : a.id === "index" ? "공유 저장소" : "대기 · 연결 유지"}</text>
      </g>; })}
    </svg>
    <div className="mt-2 rounded-xl border border-border bg-muted/30 p-3 sm:p-4" aria-live="polite">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold"><span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{stepIndex === null ? "전체 예시" : stepIndex < 7 ? "수집 · 색인" : "검색 · 결과"}</span><span className="text-muted-foreground">{op?.from && op.to ? `${actor[op.from].label} → ${actor[op.to].label} · ${op.label}` : op?.title ?? "고정된 예시 문서"}</span></div>
      <Evidence index={stepIndex} />
      {stepIndex !== null && exceptionNotes[stepIndex] && <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">예외 · 갱신</span>　{exceptionNotes[stepIndex]}</p>}
    </div>
  </div>;
}

export default function SearchIndexingViz() { return <WorkflowFocusedViz spec={spec} TopologyCanvas={SearchTopology} />; }
