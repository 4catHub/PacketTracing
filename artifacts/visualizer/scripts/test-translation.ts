import assert from "node:assert/strict";
import {
  translationExamples,
  translationSpec,
  generationState,
} from "../src/visualizations/translation-model";
import { validateWorkflowSpec } from "../src/visualizations/workflow-visualization";

for (const example of Object.values(translationExamples)) {
  const spec = translationSpec(example);
  assert.deepEqual(validateWorkflowSpec(spec), [], example.label);
  assert.equal(spec.steps.length, example.targetTokens.length + 6);
  assert.equal(example.focus.length, example.targetTokens.length);
  example.focus
    .flat()
    .forEach((index) =>
      assert.ok(index >= 0 && index < example.sourceTokens.length),
    );
  for (const index of [null, 0, 1, 2, 3]) {
    assert.deepEqual(generationState(example, index), {
      generated: 0,
      currentToken: null,
      ended: false,
      delivered: false,
    });
  }
  example.targetTokens.forEach((_, index) => {
    const state = generationState(example, index + 4);
    assert.equal(state.generated, index + 1);
    assert.equal(state.currentToken, index);
    assert.equal(state.ended, false);
    assert.equal(state.delivered, false);
    assert.deepEqual(spec.steps[index + 4].activeActorIds, [
      "encoder",
      "decoder",
    ]);
  });
  const eos = generationState(example, example.targetTokens.length + 4);
  assert.equal(eos.generated, example.targetTokens.length);
  assert.equal(eos.currentToken, null);
  assert.ok(eos.ended && !eos.delivered, "EOS precedes detokenization");
  const done = generationState(example, spec.steps.length - 1);
  assert.ok(done.ended && done.delivered);
  assert.equal(spec.steps.at(-1)?.message?.code, example.target);
  assert.equal(
    generationState(example, null).generated,
    0,
    "new loop discards old output",
  );
}
assert.deepEqual(
  translationExamples["ko-en"].focus[1],
  [4],
  "English verb references source verb near the end",
);
assert.deepEqual(
  translationExamples["en-ko"].focus[4],
  [1],
  "Korean verb references English verb near the start",
);
console.log(
  "Translation: both directions, full generation, EOS, completion, loop reset and actor references passed",
);
