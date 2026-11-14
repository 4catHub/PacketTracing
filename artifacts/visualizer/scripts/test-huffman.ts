import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildHuffman,
  decodeHuffman,
} from "../src/visualizations/huffman-model";
import { makeSteps } from "../src/visualizations/huffman-steps";

test("fixed example and deterministic tie rules", () => {
  const m = buildHuffman("ABRACADABRA");
  assert.deepEqual(m.codes, {
    A: "0",
    R: "10",
    B: "110",
    C: "1110",
    D: "1111",
  });
  assert.equal(m.bits, "01101001110011110110100");
  assert.deepEqual(
    m.merges.map((x) => x.parent.weight),
    [2, 4, 6, 11],
  );
  assert.equal(m.root?.weight, 11);
});
test("round trip and prefix free for representative inputs", () => {
  for (const s of ["ABRACADABRA", "ABCDABCD", "AAAAAA", "", "BANANA"]) {
    const m = buildHuffman(s);
    assert.equal(decodeHuffman(m.bits, m.root), s);
    for (const [a, x] of Object.entries(m.codes))
      for (const [b, y] of Object.entries(m.codes))
        if (a !== b) assert.equal(y.startsWith(x), false);
    for (const merge of m.merges) {
      assert.equal(merge.parent.weight, merge.left.weight + merge.right.weight);
      assert.equal(merge.after.length, merge.before.length - 1);
      assert.equal(
        merge.before.reduce((a, n) => a + n.weight, 0),
        s.length,
      );
    }
  }
});
test("snapshots reflect actual encoding, decoding and independent counts", () => {
  for (const input of ["ABRACADABRA", "ABCDABCD", "AAAAAA", ""]) {
    const states = makeSteps(input),
      result = states.at(-1)!;
    assert.equal(result.bits, buildHuffman(input).bits);
    assert.equal(result.decoded, input);
    assert.deepEqual(states, makeSteps(input));
    if (input) {
      assert.notEqual(states[0].counts, states[1].counts);
      assert.equal(
        states.filter((s) => s.phase === "인코딩").length,
        input.length,
      );
    }
  }
});
test("invalid bitstreams are rejected", () => {
  const m = buildHuffman("ABRACADABRA");
  assert.throws(() => decodeHuffman("X", m.root));
  assert.throws(() => decodeHuffman("1", m.root));
  assert.throws(() => decodeHuffman("1", buildHuffman("AAAA").root));
  assert.throws(() => decodeHuffman("0"));
});
test('selected nodes leave the queue before their parent is inserted', () => {
  const steps = makeSteps('ABRACADABRA');
  for (const [index, step] of steps.entries()) {
    if (step.phase !== '큐에서 추출') continue;
    assert.equal(step.selected.length, 2);
    assert.ok(step.selected.every(node => !step.queue.some(item => item.id === node.id)));
    assert.equal(steps[index - 1].queue.length, step.queue.length + 2);
    const parent = steps[index + 1].tree!;
    assert.equal(parent.weight, step.selected[0].weight + step.selected[1].weight);
    assert.equal(steps[index + 2].queue.length, step.queue.length + 1);
  }
});
