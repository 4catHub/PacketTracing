import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BIT_COUNT,
  BLOOM_CODE,
  PRODUCTS,
  SCENARIOS,
  generateBloomSteps,
  makeBits,
  positions,
} from "../src/visualizations/bloom-filter-model";

test("seeded filter and collision examples match independent hand trace", () => {
  assert.deepEqual(positions("product:101"), [9, 15, 17]);
  assert.deepEqual(positions("product:202"), [19, 7, 22]);
  assert.deepEqual(positions("product:303"), [17, 22, 21]);
  assert.deepEqual(
    makeBits(PRODUCTS).flatMap((bit, i) => (bit ? [i] : [])),
    [7, 9, 15, 17, 19, 21, 22],
  );
  assert.deepEqual(positions(SCENARIOS["false-positive"].item), [19, 9, 15]);
});

test("insertion preserves shared bits, including repeated hash positions", () => {
  const steps = generateBloomSteps("insert");
  assert.deepEqual(positions(SCENARIOS.insert.item), [17, 17, 13]);
  for (const [i, step] of steps.entries()) {
    assert.equal(step.bits.length, BIT_COUNT);
    if (i)
      for (let j = 0; j < BIT_COUNT; j++)
        assert.ok(step.bits[j] >= steps[i - 1].bits[j]);
  }
  assert.deepEqual(
    steps.at(-1)!.bits,
    makeBits([...PRODUCTS, SCENARIOS.insert.item]),
  );
  assert.equal(steps.at(-1)!.verdict, "added");
  assert.equal(steps.filter((s) => s.phase === "write").length, 3);
});

test("negative query stops on the first zero and never accesses cache or DB", () => {
  const steps = generateBloomSteps("absent");
  assert.deepEqual(steps.at(-1)!.checked, [13]);
  assert.equal(steps.at(-1)!.verdict, "absent");
  assert.equal(steps.at(-1)!.database, "skipped");
  assert.ok(steps.every((s) => s.phase !== "cache" && s.phase !== "database"));
});

test("a positive filter result always reaches the authoritative DB on a cache miss", () => {
  for (const mode of ["present", "false-positive"] as const) {
    const steps = generateBloomSteps(mode);
    const final = steps.at(-1)!;
    assert.equal(final.verdict, "maybe");
    assert.equal(final.cacheMiss, true);
    assert.equal(final.database, mode === "present" ? "found" : "not-found");
    assert.deepEqual(final.bits, makeBits(PRODUCTS));
    assert.equal(final.checked.length, 3);
    assert.ok(steps.some((s) => s.phase === "database"));
  }
});

test("inserted values never produce false negatives over a larger input set", () => {
  const items = Array.from({ length: 500 }, (_, i) => `product:${i}`);
  const bits = makeBits(items);
  for (const item of items)
    assert.ok(positions(item).every((index) => bits[index] === 1));
});

test("snapshots are independent, deterministic and code highlights stay in range", () => {
  for (const mode of Object.keys(SCENARIOS) as (keyof typeof SCENARIOS)[]) {
    const steps = generateBloomSteps(mode);
    assert.deepEqual(steps, generateBloomSteps(mode));
    assert.ok(
      steps.every((s) => s.codeLine >= 0 && s.codeLine <= BLOOM_CODE.length),
    );
    steps.at(-1)!.bits[0] = 99;
    assert.equal(steps[0].bits[0], 0);
    assert.equal(generateBloomSteps(mode)[0].bits[0], 0);
  }
});
