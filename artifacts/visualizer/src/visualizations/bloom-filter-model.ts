// Small, deterministic teaching filter; Redis uses its own hashing and sizing.
export const BIT_COUNT = 24;
export const HASH_COUNT = 3;
export const PRODUCTS = ["product:101", "product:202", "product:303"];
export type BloomMode = "insert" | "absent" | "present" | "false-positive";
export type BloomPhase =
  | "initial"
  | "hash"
  | "write"
  | "check"
  | "verdict"
  | "cache"
  | "database"
  | "response";

export const SCENARIOS: Record<
  BloomMode,
  { label: string; item: string; summary: string }
> = {
  insert: {
    label: "삽입",
    item: "product:404",
    summary: "같은 비트를 다시 설정해도 1 유지",
  },
  absent: {
    label: "확실히 없음",
    item: "product:500",
    summary: "0을 만나면 DB 조회 생략",
  },
  present: {
    label: "존재 가능",
    item: "product:101",
    summary: "모두 1이어도 실제 데이터 확인",
  },
  "false-positive": {
    label: "오탐",
    item: "product:506",
    summary: "다른 상품들이 설정한 비트와 충돌",
  },
};

export function hashValue(item: string, lane: number): number {
  let hash = [2166136261, 3335557771, 1122334455][lane];
  for (const char of item)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507) >>> 0;
  return (hash ^ (hash >>> 13)) >>> 0;
}

export function positions(item: string): number[] {
  return Array.from(
    { length: HASH_COUNT },
    (_, lane) => hashValue(item, lane) % BIT_COUNT,
  );
}

export function makeBits(items: readonly string[]): number[] {
  const bits = Array<number>(BIT_COUNT).fill(0);
  for (const item of items)
    for (const index of positions(item)) bits[index] = 1;
  return bits;
}

export interface BloomStep {
  phase: BloomPhase;
  bits: number[];
  lane: number | null;
  checked: number[];
  codeLine: number;
  message: string;
  verdict: "pending" | "added" | "absent" | "maybe";
  database: "idle" | "skipped" | "found" | "not-found";
  cacheMiss: boolean;
}

// The exact same pseudocode lines are highlighted by the generated snapshots.
export const BLOOM_CODE = [
  "positions = hashes(item) % m",
  "if operation == ADD:",
  "  for index in positions:",
  "    bits[index] = 1",
  "  return ADDED",
  "for index in positions:",
  "  if bits[index] == 0:",
  "    return DEFINITELY_ABSENT",
  "return MAYBE_PRESENT",
];

export function generateBloomSteps(mode: BloomMode): BloomStep[] {
  const item = SCENARIOS[mode].item;
  const indexes = positions(item);
  const bits = makeBits(PRODUCTS);
  let checked: number[] = [];
  let verdict: BloomStep["verdict"] = "pending";
  let database: BloomStep["database"] = "idle";
  let cacheMiss = false;
  const steps: BloomStep[] = [];
  const push = (
    phase: BloomPhase,
    message: string,
    codeLine = 0,
    lane: number | null = null,
  ) => {
    steps.push({
      phase,
      bits: [...bits],
      lane,
      checked: [...checked],
      codeLine,
      message,
      verdict,
      database,
      cacheMiss,
    });
  };

  push(
    "initial",
    "상품 101·202·303을 반영한 동일한 필터에서 시작. 재생이 반복되면 이 상태로 복원.",
  );
  if (mode === "insert") {
    for (const [lane, index] of indexes.entries()) {
      push("hash", `h${lane + 1}(${item}) % ${BIT_COUNT} = ${index}`, 1, lane);
      const before = bits[index];
      bits[index] = 1;
      checked = [...checked, index];
      push(
        "write",
        `bits[${index}]: ${before} → 1${before ? " · 이미 1인 비트는 그대로 유지" : " · 새로운 비트 설정"}`,
        4,
        lane,
      );
    }
    verdict = "added";
    push(
      "verdict",
      "상품 404의 해시 위치 반영 완료. 원문이나 상품 데이터는 필터에 저장하지 않음.",
      5,
    );
    return steps;
  }

  for (const [lane, index] of indexes.entries()) {
    push("hash", `h${lane + 1}(${item}) % ${BIT_COUNT} = ${index}`, 1, lane);
    checked = [...checked, index];
    push("check", `bits[${index}] = ${bits[index]} 확인`, 7, lane);
    if (bits[index] === 0) {
      verdict = "absent";
      database = "skipped";
      push(
        "verdict",
        "0인 비트를 발견. 이 필터에 추가된 적 없는 ID이므로 나머지 비트 검사 중단.",
        8,
        lane,
      );
      push(
        "response",
        "필터가 최신·정상이라는 전제에서 404 응답. 캐시와 DB 조회 모두 생략.",
      );
      return steps;
    }
  }

  verdict = "maybe";
  push(
    "verdict",
    "세 위치 모두 1 → 존재 가능. 실제 존재를 확정하거나 DB 결과를 대신할 수 없음.",
    9,
  );
  cacheMiss = true;
  push(
    "cache",
    "Redis 상품 캐시 GET → MISS. 예제에서는 두 조회 시나리오 모두 캐시가 비어 있음.",
  );
  const found = PRODUCTS.includes(item);
  database = found ? "found" : "not-found";
  push(
    "database",
    found
      ? "DB SELECT → 상품 101 발견. 필터의 존재 가능 판정과 실제 데이터가 일치."
      : "DB SELECT → 상품 506 없음. 다른 상품의 비트가 겹쳐 발생한 오탐 확인.",
  );
  push(
    "response",
    found
      ? "상품 데이터 반환 (200). 조회 결과는 일반 상품 캐시에 저장 가능."
      : "상품 없음 반환 (404). 오탐은 DB 조회를 한 번 더 유발할 뿐, 가짜 상품을 반환하지 않음.",
  );
  return steps;
}
