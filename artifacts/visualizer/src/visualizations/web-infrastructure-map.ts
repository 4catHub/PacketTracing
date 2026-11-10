export const infrastructureNodes = {
  client: ["클라이언트", "브라우저·앱에서 API 요청과 정적 파일 요청을 각각 전송"],
  dns: ["Geo DNS", "위치·상태 정책으로 API 엔드포인트 응답. 실제 HTTP는 선택된 리전으로 직접 전송"],
  web: ["웹 서버", "HTTP 연결을 받고 같은 호스트의 애플리케이션으로 동적 요청 전달"],
  waf: ["WAF", "HTTP 요청 검사. 예시에서는 API 인입에 배치하고, 정적 CDN은 별도 경로로 유지"],
  cdn: ["CDN Edge", "인근 엣지에서 정적 파일 제공. 미스 시 객체 원본에서 가져와 캐싱"],
  lb: ["L7 LB", "헬스 체크를 통과한 앱 또는 Gateway 인스턴스에 HTTP 요청 분배"],
  gateway: ["API Gateway", "요청 경로별 서비스 라우팅. 공통 인증·속도 제한을 적용할 수 있는 인입 계층"],
  app: ["앱 A · AZ 1", "같은 애플리케이션의 첫 번째 복제본. 선택된 읽기 요청을 처리"],
  appB: ["앱 B · AZ 2", "같은 애플리케이션의 두 번째 복제본. AZ 1의 인스턴스와 동일한 로직 수행"],
  media: ["미디어 서비스", "업로드 접수 및 변환 상태 담당. 독립 저장소를 소유하고 변환 작업을 발행"],
  db: ["Primary DB", "쓰기와 최신성이 필요한 읽기를 처리. 변경 로그를 Replica로 복제"],
  cache: ["데이터 캐시", "반복 읽기를 메모리에서 반환. Cache-Aside의 미스 조회와 채움은 애플리케이션 책임"],
  replica: ["읽기 Replica", "Primary의 변경을 반영하고 지연이 허용되는 읽기를 처리"],
  mediaDb: ["미디어 DB", "미디어 서비스 소유 데이터. 영상 메타데이터 및 처리 상태 저장"],
  broker: ["이벤트 브로커", "영속화 설정에 따라 작업을 보관하고 소비자에게 전달. 처리 실패는 재시도 정책으로 관리"],
  worker: ["변환 워커", "큐의 작업을 읽어 객체 원본을 변환. 중복 수신에도 같은 결과가 되도록 처리"],
  storage: ["Object Storage", "원본 영상과 변환 파일 보관. CDN이 읽는 정적 파일 원본"],
  control: ["배포·관측", "배포 파이프라인과 오케스트레이터가 복제본 상태를 조정. 메트릭·로그·트레이스로 변화 관측"],
  policy: ["워크로드 정책", "서비스 ID, mTLS, 권한 정책, 비밀 회전을 관리. 요청 흐름과 별도의 제어 관계"],
  regionBEdge: ["B · API 인입", "리전 B의 별도 WAF·LB·Gateway를 축약 표시. 로컬 읽기 경로로 라우팅"],
  regionBApp: ["B · Catalog", "리전 B에 배포된 카탈로그 복제본 그룹. 이 예시의 로컬 읽기 담당"],
  regionBReplica: ["B · Replica", "리전 A의 카탈로그 DB 변경을 비동기로 반영. 승격 전에는 읽기만 처리"],
  search: ["검색 인덱스", "게시물 변경을 검색용 문서로 구성. 비동기 갱신으로 최신 DB와 차이가 날 수 있음"],
  stream: ["스트림 처리", "변경 이벤트를 재생 가능한 스트림으로 소비. 검색 갱신과 분석 적재로 분기"],
  warehouse: ["분석 저장소", "Lake 또는 Warehouse에서 집계·분석. 온라인 조회와 독립적으로 용량 운영"],
} as const;

export type NodeId = keyof typeof infrastructureNodes;
type LineKind = "sync" | "event" | "replication" | "control";
type Slot = readonly [column: number, row: number];
type NodePlacement = readonly [id: NodeId, column: number, row: number, label?: string, detail?: string];
type Link = readonly [from: NodeId, to: NodeId, label: string, kind?: LineKind, rail?: number];

const flowKinds = {
  sync: { label: "동기 요청·응답", color: "var(--color-sky-600)", dash: undefined },
  event: { label: "비동기 이벤트", color: "var(--color-amber-600)", dash: "8 5" },
  replication: { label: "데이터 복제", color: "var(--color-violet-600)", dash: "2 5" },
  control: { label: "제어 흐름", color: "var(--color-teal-600)", dash: "10 4 2 4" },
} as const;
export { flowKinds };

export function getInfrastructureMap(stage: number) {
  const nodes: NodePlacement[] = [["client", 1, 0]];
  const links: Link[] = [];
  const paths: { label: string; links: Link[]; result: string }[] = [];
  const addPath = (label: string, path: Link[], result: string) => {
    paths.push({ label, links: path, result });
    links.push(...path);
  };
  const prefix: Link[] = [];
  if (stage >= 10) {
    nodes.push(["dns", 0, 0]);
    addPath("지역 선택", [["client", "dns", "API 도메인 조회 · 지역별 주소 응답", "control"]],
      "DNS 응답으로 주소를 선택한 클라이언트가 리전 API에 직접 연결");
  }
  if (stage < 3) {
    nodes.push(["web", 1, 1]);
    prefix.push(["client", "web", "GET /posts/42"], ["web", "app", "동적 요청 전달"]);
  } else {
    nodes.push(["lb", 1, 2]);
    if (stage >= 9) {
      nodes.push(["waf", 1, 1]);
      prefix.push(["client", "waf", "GET /posts/42 · HTTP 검사"], ["waf", "lb", "허용된 HTTP 요청"]);
    } else {
      prefix.push(["client", "lb", "GET /posts/42"]);
    }
    if (stage >= 7) {
      nodes.push(["gateway", 1, 3]);
      prefix.push(["lb", "gateway", "정상 Gateway로 전달"]);
    }
    prefix.push([stage >= 7 ? "gateway" : "lb", "app", stage >= 7 ? "/posts → 카탈로그" : "정상 복제본 A 선택"]);
    links.push([stage >= 7 ? "gateway" : "lb", "appB", "다른 정상 복제본도 선택 가능"]);
    nodes.push(["appB", 0, 4, stage >= 8 ? "Catalog Pod B" : stage === 7 ? "Catalog · AZ 2" : undefined]);
  }
  const appLabel = stage < 3 ? "모놀리스" : stage >= 8 ? "Catalog Pod A" : stage === 7 ? "Catalog · AZ 1" : undefined;
  nodes.push(["app", 1, 4, appLabel, stage < 3 ? "한 배포 단위 안에서 HTTP 요청을 처리하고 DB에 접근" : undefined]);
  nodes.push([
    "db", 1, 5,
    stage >= 7 ? "카탈로그 DB" : stage >= 6 ? undefined : stage === 1 ? "로컬 DB" : "별도 DB",
    stage >= 6 ? undefined : stage === 1 ? "앱과 같은 VM에서 실행되는 SQL 저장소" : "앱과 분리된 네트워크 엔드포인트에서 SQL을 처리하는 저장소",
  ]);

  const read: Link = stage >= 6 ? ["app", "replica", "지연 허용 SQL 읽기", "sync", 352] : ["app", "db", "게시물 SQL 조회"];
  const cacheRead: Link = ["app", "cache", "게시물 캐시 조회"];
  paths.unshift({
    label: stage >= 4 ? "게시물 · 캐시 미스" : "게시물 조회",
    links: [...prefix, ...(stage >= 4 ? [cacheRead] : []), read],
    result: stage >= 4 ? "앱이 조회 결과를 캐시에 채운 뒤 인입 경로를 역순으로 응답" : "DB 결과를 받은 앱이 인입 경로를 역순으로 응답",
  });
  links.push(...paths[0].links);

  if (stage >= 4) {
    nodes.push(["cache", 0, 5], ["cdn", 2, 0], ["storage", 2, 6]);
    addPath("게시물 · 캐시 적중", [...prefix, cacheRead], "캐시 값을 받은 앱이 DB에 접근하지 않고 응답");
    addPath("정적 파일", [["client", "cdn", "이미지·영상 파일 요청"], ["cdn", "storage", "엣지 미스 시 원본 조회", "sync", 970]],
      "엣지 적중이면 CDN이 바로 반환. 미스이면 원본 파일을 받아 엣지에서 응답");
  }
  if (stage >= 5) {
    nodes.push(["broker", 1, 6], ["worker", 1, 7]);
    const uploadPrefix = prefix.map((link, index) =>
      index === 0 ? [link[0], link[1], "POST /uploads"] as Link : link
    );
    const upload: Link[] = stage >= 7
      ? [...uploadPrefix.slice(0, -1), ["gateway", "media", "/uploads → 미디어"], ["media", "mediaDb", "작업 상태 기록"]]
      : uploadPrefix;
    addPath("업로드 · 비동기 변환", [
      ...upload, [stage >= 7 ? "media" : "app", "broker", "작업 접수 · 202 응답", "event", 645],
      ["broker", "worker", "변환 작업 전달", "event"], ["worker", "storage", "원본 읽기 · 변환 파일 기록"],
    ], "영속적으로 접수한 뒤 HTTP 202 반환. 워커 처리는 응답 이후에도 독립 진행");
  }
  if (stage >= 6) {
    nodes.push(["replica", 0, 6]);
    addPath("쓰기와 복제", [
      ...prefix.map((link, index): Link => index === 0 ? [link[0], link[1], "POST /posts"] : link),
      ["app", "db", "Primary에 게시물 커밋"], ["db", "replica", "DB 변경 로그 전달", "replication"],
    ], "커밋 후 응답. Replica의 반영 시점에는 지연이 생길 수 있음");
  }
  if (stage >= 7) {
    nodes.push(["media", 2, 4, stage >= 8 ? "Media Pod" : undefined], ["mediaDb", 2, 5]);
  }
  if (stage >= 8) {
    nodes.push(["control", 0, 2]);
    addPath("배포 제어", [["control", "appB", "새 버전 배포 · 준비 상태 확인", "control"], ["control", "app", "준비된 복제본으로 교체", "control", 343]],
      "제어 계층이 준비 상태를 확인하며 복제본을 교체. API 요청 경로는 그대로 유지");
  }
  if (stage >= 9) {
    nodes.push(["policy", 2, 2]);
    addPath("차단 요청", [["client", "waf", "WAF 규칙에 일치하는 요청 감지"]],
      "WAF에서 차단 응답 반환. 요청은 로드 밸런서와 앱에 도달하지 않음");
    addPath("워크로드 제어", [["policy", "media", "서비스 ID·인증서 배포", "control"], ["policy", "app", "워크로드 정책 적용", "control", 657]],
      "서비스 간 통신의 인증과 인가 정책을 적용. 내부 위치만으로 접근 권한을 부여하지 않음");
  }
  if (stage >= 10) {
    nodes.push(["regionBEdge", 1, 9], ["regionBApp", 1, 10], ["regionBReplica", 2, 10]);
    addPath("리전 B 읽기", [
      ["client", "regionBEdge", "Geo DNS가 B 주소를 반환한 경우", "sync", 23],
      ["regionBEdge", "regionBApp", "지역 내 API 라우팅"], ["regionBApp", "regionBReplica", "지역 복제본 조회"],
    ], "리전 B가 읽기에 응답. 쓰기는 예시의 단일 쓰기 소유자 A로 전송");
    addPath("리전 간 복제", [["db", "regionBReplica", "리전 A → B 변경 로그", "replication", 689]],
      "B의 복제본이 변경을 재생. 장애 승격 전까지 A가 쓰기 소유");
  }
  if (stage >= 11) {
    nodes.push(["search", 0, 7], ["stream", 0, 8], ["warehouse", 2, 8]);
    addPath("검색 요청", [
      ...prefix.map((link, index): Link => index === 0 ? [link[0], link[1], "GET /search · HTTP 검사"] : link),
      ["app", "search", "검색 API의 읽기 모델 조회", "sync", 308],
    ], "검색 인덱스에서 읽고 응답. 최근 변경이 인덱스에 반영되기 전에는 결과에 포함되지 않을 수 있음");
    addPath("검색·분석 갱신", [
      ["db", "stream", "커밋된 변경 이벤트 수집", "event", 369],
      ["stream", "search", "검색 문서 갱신", "event"],
      ["stream", "warehouse", "분석 데이터 적재", "event"],
    ], "인덱스와 분석 저장소가 독립적으로 반영. 운영 API는 적재 완료를 기다리지 않음");
  }

  // Keep the route of a repeated link consistent across scenario selections.
  const uniqueLinks = new Map<string, Link>();
  for (const link of links) uniqueLinks.set(linkId(link), link);
  return { nodes, links: [...uniqueLinks.values()], paths };
}

export function linkId([from, to, , kind = "sync"]: Link) {
  return `${from}-${to}-${kind}`;
}

export const columnCenters = [166, 500, 834];
export const rowHeight = 90;
export const nodeHeight = 56;
const halfWidth = 128;

export function infrastructureLinkPath(from: Slot, to: Slot, rail?: number) {
  const [fromCol, fromY] = from;
  const [toCol, toY] = to;
  const x1 = columnCenters[fromCol];
  const x2 = columnCenters[toCol];
  const down = toY > fromY ? 1 : -1;
  if (fromY === toY && Math.abs(fromCol - toCol) === 1) {
    const right = Math.sign(x2 - x1);
    return `M ${x1 + right * halfWidth} ${fromY} H ${x2 - right * halfWidth}`;
  }
  if (fromY === toY) {
    const y = fromY + nodeHeight / 2;
    return `M ${x1} ${y} V ${y + 13} H ${x2} V ${y}`;
  }
  const y1 = fromY + down * nodeHeight / 2;
  const y2 = toY - down * nodeHeight / 2;
  if (rail !== undefined) {
    return `M ${x1} ${y1} V ${y1 + down * 11} H ${rail} V ${y2 - down * 11} H ${x2} V ${y2}`;
  }
  const mid = (y1 + y2) / 2;
  return `M ${x1} ${y1} V ${mid} H ${x2} V ${y2}`;
}
