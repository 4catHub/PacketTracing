export const INPUT = [4, 2, -1, 5, 3, 6, -2, 7];
export const RANGE = { left: 1, right: 6 };
export const UPDATE = { index: 2, value: 4 };

export type Mode = "build" | "query" | "update";
export type NodeDecision = "split" | "take" | "skip";

interface TreeNode {
  id: number;
  left: number;
  right: number;
  depth: number;
}

function makeNodes(left: number, right: number, id = 1, depth = 0): TreeNode[] {
  const node = { id, left, right, depth };
  if (left === right) return [node];

  const mid = Math.floor((left + right) / 2);
  return [
    node,
    ...makeNodes(left, mid, 2 * id, depth + 1),
    ...makeNodes(mid + 1, right, 2 * id + 1, depth + 1),
  ];
}

export const NODES = makeNodes(0, INPUT.length - 1);
const NODES_BY_ID = new Map(NODES.map((node) => [node.id, node]));
const DEPTH = Math.max(...NODES.map((node) => node.depth));

function queryVisits(id: number): { node: TreeNode; decision: NodeDecision }[] {
  const node = NODES_BY_ID.get(id)!;
  const { left, right } = RANGE;
  if (node.right < left || right < node.left)
    return [{ node, decision: "skip" }];
  if (left <= node.left && node.right <= right)
    return [{ node, decision: "take" }];
  return [
    { node, decision: "split" },
    ...queryVisits(2 * id),
    ...queryVisits(2 * id + 1),
  ];
}

const QUERY_VISITS = queryVisits(1);

interface Step {
  title: string;
  detail: string;
  input: number[];
  prefix: (number | null)[];
  tree: (number | null)[];
  activePrefix: number[];
  activeNodes: number[];
  changedPrefix: number[];
  changedNodes: number[];
  taken: number[];
  skipped: number[];
  decision?: NodeDecision;
  prefixResult?: number;
  treeResult?: number;
}

function prefixSums(input: number[]) {
  const prefix = [0];
  input.forEach((value, i) => prefix.push(prefix[i] + value));
  return prefix;
}

function treeSums(input: number[]) {
  const tree: number[] = [];
  for (const node of [...NODES].reverse()) {
    const { id, left, right } = node;
    tree[id] = left === right ? input[left] : tree[2 * id] + tree[2 * id + 1];
  }
  return tree;
}

export function interval(left: number, right: number) {
  return `[${left}, ${right}]`;
}

function addends(values: number[]) {
  return values.map((value) => (value < 0 ? `(${value})` : value)).join(" + ");
}

export function createSteps(mode: Mode): Step[] {
  const building = mode === "build";
  const initial: Step = {
    title: "",
    detail: "",
    input: INPUT,
    prefix: building ? [0, ...INPUT.map(() => null)] : prefixSums(INPUT),
    tree: building ? Array(NODES.length + 1).fill(null) : treeSums(INPUT),
    activePrefix: [],
    activeNodes: [],
    changedPrefix: [],
    changedNodes: [],
    taken: [],
    skipped: [],
  };
  const steps: Step[] = [];
  let current = initial;

  function record(title: string, detail: string, changes: Partial<Step> = {}) {
    current = {
      ...current,
      title,
      detail,
      activePrefix: [],
      activeNodes: [],
      decision: undefined,
      ...changes,
    };
    steps.push(current);
  }

  if (building) {
    record(
      "원본 배열에서 시작",
      "P[0]은 원소를 하나도 더하지 않은 값 0입니다.",
      { activePrefix: [0] },
    );
    const prefix = [0];
    INPUT.forEach((value, i) => {
      prefix.push(prefix[i] + value);
      record(
        `누적합 P[${i + 1}] 채우기`,
        `P[${i + 1}] = P[${i}] + A[${i}] = ${addends([prefix[i], value])} = ${prefix[i + 1]}`,
        {
          prefix: [...prefix, ...INPUT.slice(i + 1).map(() => null)],
          activePrefix: [i + 1],
        },
      );
    });

    const tree = [...initial.tree];
    for (let depth = DEPTH; depth >= 0; depth--) {
      const level = NODES.filter((node) => node.depth === depth);
      for (const { id, left } of level) {
        tree[id] =
          depth === DEPTH ? INPUT[left] : tree[2 * id]! + tree[2 * id + 1]!;
      }
      const { id, left, right } = level[0];
      record(
        depth === DEPTH ? "트리의 리프 채우기" : "두 자식의 합으로 부모 채우기",
        depth === DEPTH
          ? "각 리프에 같은 인덱스의 배열 값을 넣습니다."
          : `${interval(left, right)} = ${addends([tree[2 * id]!, tree[2 * id + 1]!])} = ${tree[id]}`,
        { tree: [...tree], activeNodes: level.map((node) => node.id) },
      );
    }
    record(
      "준비 완료",
      `P[${INPUT.length}]과 트리의 루트가 모두 전체 합 ${prefix[INPUT.length]}을 저장합니다.`,
    );
    return steps;
  }

  const { left, right } = RANGE;
  const rangeLabel = interval(left, right);
  if (mode === "query") {
    record(
      "조회할 범위 확인",
      `${rangeLabel}은 배열 인덱스 ${left}부터 ${right}까지를 모두 포함합니다.`,
    );
    const start = current.prefix[left]!;
    const end = current.prefix[right + 1]!;
    record(
      "누적합 두 칸 빼기",
      `P[${right + 1}] − P[${left}] = ${end} − ${start} = ${end - start}`,
      { activePrefix: [left, right + 1], prefixResult: end - start },
    );

    const taken: number[] = [];
    const skipped: number[] = [];
    let total = 0;
    for (const { node, decision } of QUERY_VISITS) {
      const { id } = node;
      const label = interval(node.left, node.right);
      const activeNodes = [id];
      if (decision === "skip") {
        skipped.push(id);
        record(
          "범위 밖 · 건너뛰기",
          `${label}은 ${rangeLabel}과 겹치지 않습니다.`,
          {
            activeNodes,
            decision: "skip",
            skipped: [...skipped],
          },
        );
      } else if (decision === "take") {
        const value = current.tree[id]!;
        const before = total;
        total += value;
        taken.push(id);
        record(
          "완전히 포함 · 합에 추가",
          `${label}의 합을 더합니다. ${addends([before, value])} = ${total}`,
          {
            activeNodes,
            decision: "take",
            taken: [...taken],
            treeResult: total,
          },
        );
      } else {
        record(
          "일부만 겹침 · 자식으로 이동",
          `${label}을 나눠 두 자식 구간을 확인합니다.`,
          {
            activeNodes,
            decision: "split",
          },
        );
      }
    }
    record(
      "두 방식의 결과가 일치",
      `서로 겹치지 않는 트리 구간 ${taken.length}개의 합도 ${total}입니다.`,
    );
    return steps;
  }

  const { index, value } = UPDATE;
  const delta = value - INPUT[index];
  const input = [...INPUT];
  input[index] = value;
  record(
    "변경할 원소 확인",
    `A[${index}]을 ${INPUT[index]}에서 ${value}로 바꿉니다.`,
  );
  record(
    "원본 배열 갱신",
    `A[${index}]이 ${delta}만큼 증가했습니다. 두 자료구조에도 이 변경을 반영합니다.`,
    { input },
  );

  const prefix = [...current.prefix];
  const changedPrefix: number[] = [];
  for (let i = index + 1; i < prefix.length; i++) {
    const before = prefix[i]!;
    prefix[i] = before + delta;
    changedPrefix.push(i);
    record(
      "누적합의 뒤쪽 칸 갱신",
      `P[${i}] = ${addends([before, delta])} = ${prefix[i]}`,
      {
        prefix: [...prefix],
        activePrefix: [i],
        changedPrefix: [...changedPrefix],
      },
    );
  }

  const tree = [...current.tree];
  const changedNodes: number[] = [];
  const leaf = NODES.find(
    (node) => node.left === index && node.right === index,
  )!;
  for (let id = leaf.id; id >= 1; id = Math.floor(id / 2)) {
    const node = NODES_BY_ID.get(id)!;
    const label = interval(node.left, node.right);
    tree[id] = id === leaf.id ? value : tree[2 * id]! + tree[2 * id + 1]!;
    changedNodes.push(id);
    record(
      id === leaf.id ? "트리의 리프 갱신" : "트리의 부모 다시 계산",
      id === leaf.id
        ? `${label}의 값을 ${value}로 바꿉니다.`
        : `${label} = ${addends([tree[2 * id]!, tree[2 * id + 1]!])} = ${tree[id]}`,
      { tree: [...tree], activeNodes: [id], changedNodes: [...changedNodes] },
    );
  }

  const prefixResult = prefix[right + 1]! - prefix[left]!;
  const treeResult = QUERY_VISITS.reduce(
    (sum, { node, decision }) =>
      decision === "take" ? sum + tree[node.id]! : sum,
    0,
  );
  record(
    "갱신 완료",
    `누적합 ${changedPrefix.length}칸과 트리 ${changedNodes.length}개 노드를 갱신했습니다. ${rangeLabel}의 새 합은 ${prefixResult}입니다.`,
    { prefixResult, treeResult },
  );
  return steps;
}
