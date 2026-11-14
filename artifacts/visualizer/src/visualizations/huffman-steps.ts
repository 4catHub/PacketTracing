import { buildHuffman, type HuffmanNode } from "./huffman-model";
export interface Step {
  phase: string;
  message: string;
  counts: Record<string, number>;
  queue: HuffmanNode[];
  active: number[];
  selected: HuffmanNode[];
  tree?: HuffmanNode;
  codes: Record<string, string>;
  cursor: number;
  bits: string;
  bitCursor: number;
  decoded: string;
  path: number[];
  line: number;
}
export const CODE = [
  "for symbol in input: count[symbol]++",
  "queue = leaves(count)",
  "while queue.size > 1:",
  "  left, right = queue.popMin(), queue.popMin()",
  "  parent = node(left.weight + right.weight)",
  "  parent.left = left; parent.right = right",
  "  queue.push(parent)",
  "codes = paths(root, left=0, right=1)",
  "for symbol in input: bits += codes[symbol]",
  "for bit in bits: node = child(node, bit)",
  "  if leaf: output += node.symbol; node = root",
];
export function makeSteps(input: string): Step[] {
  const model = buildHuffman(input),
    steps: Step[] = [];
  let counts: Record<string, number> = {},
    queue: HuffmanNode[] = [],
    active: number[] = [],
    selected: HuffmanNode[] = [],
    tree: HuffmanNode | undefined,
    codes: Record<string, string> = {},
    cursor = -1,
    bits = "",
    bitCursor = -1,
    decoded = "",
    path: number[] = [],
    line = 0;
  const push = (phase: string, message: string) =>
    steps.push({
      phase,
      message,
      counts: { ...counts },
      queue: [...queue],
      active: [...active],
      selected: [...selected],
      tree,
      codes: { ...codes },
      cursor,
      bits,
      bitCursor,
      decoded,
      path: [...path],
      line,
    });
  push(
    "시작",
    input
      ? "입력 문자열에서 문자별 빈도를 집계합니다."
      : "입력이 없어 트리와 비트열을 만들지 않습니다.",
  );
  if (!input) return steps;
  for (let i = 0; i < input.length; i++) {
    cursor = i;
    counts[input[i]] = (counts[input[i]] || 0) + 1;
    line = 1;
    push("빈도 집계", `${input[i]}의 빈도를 ${counts[input[i]]}로 갱신합니다.`);
  }
  cursor = -1;
  queue = model.merges[0]?.before ?? (model.root ? [model.root] : []);
  line = 2;
  push("큐 초기화", "빈도순 우선순위 큐에 각 기호를 넣습니다.");
  for (const merge of model.merges) {
    queue = merge.before;
    active = [merge.left.id, merge.right.id];
    line = 4;
    push(
      "두 노드 선택",
      `최소 빈도 ${merge.left.weight}와 ${merge.right.weight}를 선택합니다.`,
    );
    selected = [merge.left, merge.right];
    queue = merge.before.slice(2);
    push(
      "큐에서 추출",
      `선택한 ${merge.left.weight}와 ${merge.right.weight}를 큐에서 꺼냅니다.`,
    );
    tree = merge.parent;
    line = 5;
    push(
      "부모 생성",
      `${merge.left.weight} + ${merge.right.weight} = ${merge.parent.weight}. 두 서브트리를 연결합니다.`,
    );
    queue = merge.after;
    selected = [];
    active = [merge.parent.id];
    line = 7;
    push(
      "재삽입",
      `합계 ${merge.parent.weight}인 서브트리를 다시 큐에 넣습니다.`,
    );
  }
  tree = model.root;
  queue = tree ? [tree] : [];
  active = [];
  line = 8;
  push(
    "트리 완성",
    "큐에 루트 하나가 남았습니다. 왼쪽 0, 오른쪽 1 경로로 코드를 만듭니다.",
  );
  function nodePath(n: HuffmanNode, s: string, acc: number[]): number[] {
    if (n.symbol === s) return [...acc, n.id];
    for (const c of [n.left, n.right])
      if (c) {
        const p = nodePath(c, s, [...acc, n.id]);
        if (p.length) return p;
      }
    return [];
  }
  for (const symbol of Object.keys(model.codes).sort()) {
    codes[symbol] = model.codes[symbol];
    path = tree ? nodePath(tree, symbol, []) : [];
    push(
      "코드 생성",
      `${symbol}: ${model.codes[symbol]} · 루트에서 리프까지의 경로`,
    );
  }
  path = [];
  for (let i = 0; i < input.length; i++) {
    cursor = i;
    bits += model.codes[input[i]];
    path = tree ? nodePath(tree, input[i], []) : [];
    line = 9;
    push(
      "인코딩",
      `${input[i]} → ${model.codes[input[i]]}를 비트열에 이어 붙입니다.`,
    );
  }
  cursor = -1;
  path = tree ? [tree.id] : [];
  let current: HuffmanNode | undefined = tree;
  line = 10;
  push("디코딩 준비", "첫 비트부터 트리를 따라 이동합니다.");
  for (let i = 0; i < bits.length; i++) {
    bitCursor = i;
    const bit = bits[i];
    if (tree?.symbol !== undefined) {
      decoded += tree.symbol;
      path = [tree.id];
      line = 11;
      push("디코딩", `단일 기호 규칙: ${bit} → ${tree.symbol}`);
      continue;
    }
    current = bit === "0" ? current?.left : current?.right;
    if (!current) throw new Error("invalid path");
    path = [...path, current.id];
    line = 10;
    push(
      "디코딩",
      `${bit}: ${bit === "0" ? "왼쪽" : "오른쪽"} 가지로 이동합니다.`,
    );
    if (current.symbol !== undefined) {
      decoded += current.symbol;
      line = 11;
      push("리프 도착", `${current.symbol} 출력 후 루트로 돌아갑니다.`);
      current = tree;
      path = tree ? [tree.id] : [];
    }
  }
  active = [];
  path = [];
  line = 0;
  push(
    "복원 완료",
    decoded === input ? "원문과 복원 결과가 일치합니다." : "복원 결과 불일치",
  );
  return steps;
}
