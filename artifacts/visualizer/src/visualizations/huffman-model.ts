export interface HuffmanNode {
  id: number;
  weight: number;
  minSymbol: string;
  symbol?: string;
  left?: HuffmanNode;
  right?: HuffmanNode;
}

export interface HuffmanMerge {
  before: HuffmanNode[];
  left: HuffmanNode;
  right: HuffmanNode;
  parent: HuffmanNode;
  after: HuffmanNode[];
}

/** Deterministic teaching model. Inputs are uppercase ASCII symbols. */
export function buildHuffman(input: string) {
  if (!/^[A-Z]*$/.test(input))
    throw new Error("대문자 A–Z만 사용할 수 있습니다.");
  const frequencies: Record<string, number> = {};
  for (const char of input) frequencies[char] = (frequencies[char] ?? 0) + 1;
  let nextId = 0;
  const compare = (a: HuffmanNode, b: HuffmanNode) =>
    a.weight - b.weight ||
    (a.minSymbol < b.minSymbol ? -1 : a.minSymbol > b.minSymbol ? 1 : 0) ||
    a.id - b.id;
  const queue: HuffmanNode[] = Object.keys(frequencies)
    .sort()
    .map((symbol) => ({
      id: nextId++,
      weight: frequencies[symbol],
      minSymbol: symbol,
      symbol,
    }))
    .sort(compare);
  const merges: HuffmanMerge[] = [];
  while (queue.length > 1) {
    const before = [...queue];
    const left = queue.shift()!;
    const right = queue.shift()!;
    const parent: HuffmanNode = {
      id: nextId++,
      weight: left.weight + right.weight,
      minSymbol:
        left.minSymbol < right.minSymbol ? left.minSymbol : right.minSymbol,
      left,
      right,
    };
    queue.push(parent);
    queue.sort(compare);
    merges.push({ before, left, right, parent, after: [...queue] });
  }
  const root = queue[0];
  const codes: Record<string, string> = {};
  function walk(node: HuffmanNode, path: string) {
    if (node.symbol !== undefined) {
      codes[node.symbol] = path || "0";
      return;
    }
    if (node.left) walk(node.left, path + "0");
    if (node.right) walk(node.right, path + "1");
  }
  if (root) walk(root, "");
  const bits = [...input].map((c) => codes[c]).join("");
  return { frequencies, root, codes, bits, merges };
}

export function decodeHuffman(bits: string, root?: HuffmanNode): string {
  if (!/^[01]*$/.test(bits)) throw new Error("비트열에는 0과 1만 허용됩니다.");
  if (!root) {
    if (bits) throw new Error("빈 트리로 복원할 수 없습니다.");
    return "";
  }
  if (root.symbol !== undefined) {
    if (bits.includes("1")) throw new Error("단일 기호 코드는 0입니다.");
    return root.symbol.repeat(bits.length);
  }
  let node = root;
  let output = "";
  for (const bit of bits) {
    const next = bit === "0" ? node.left : node.right;
    if (!next) throw new Error("잘못된 비트 경로입니다.");
    node = next;
    if (node.symbol !== undefined) {
      output += node.symbol;
      node = root;
    }
  }
  if (node !== root) throw new Error("완성되지 않은 비트열입니다.");
  return output;
}
