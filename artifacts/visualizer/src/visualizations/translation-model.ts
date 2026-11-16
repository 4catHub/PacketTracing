import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
} from "./workflow-visualization";

export type TranslationDirection = "ko-en" | "en-ko";
export interface TranslationExample {
  direction: TranslationDirection;
  label: string;
  source: string;
  target: string;
  sourceTokens: string[];
  targetTokens: string[];
  // Conceptual alignments, not attention extracted from a trained model.
  focus: number[][];
  alternatives: string[];
}
export const translationExamples: Record<
  TranslationDirection,
  TranslationExample
> = {
  "ko-en": {
    direction: "ko-en",
    label: "한국어 → 영어",
    source: "나는 사과를 먹는다.",
    target: "I eat apples.",
    sourceTokens: ["나", "는", "사과", "를", "먹는다", "."],
    targetTokens: ["I", "eat", "apples", "."],
    focus: [[0, 1], [4], [2, 3], [5]],
    alternatives: ["You", "like", "fruit", "!"],
  },
  "en-ko": {
    direction: "en-ko",
    label: "영어 → 한국어",
    source: "I eat apples.",
    target: "나는 사과를 먹는다.",
    sourceTokens: ["I", "eat", "apples", "."],
    targetTokens: ["나", "는", "사과", "를", "먹는다", "."],
    focus: [[0], [0], [2], [2], [1], [3]],
    alternatives: ["우리", "가", "과일", "와", "좋아한다", "!"],
  },
};
export function generationState(
  example: TranslationExample,
  stepIndex: number | null,
) {
  const index = stepIndex ?? -1;
  const generated = Math.max(
    0,
    Math.min(example.targetTokens.length, index - 3),
  );
  return {
    generated,
    currentToken:
      index >= 4 && index < 4 + example.targetTokens.length ? index - 4 : null,
    ended: index >= 4 + example.targetTokens.length,
    delivered: index >= 5 + example.targetTokens.length,
  };
}
export function translationSpec(
  example: TranslationExample,
): WorkflowVisualizationSpec {
  const step = (
    title: string,
    summary: string,
    ids: string[],
    output: string,
  ): WorkflowVisualizationStep => ({
    title,
    summary,
    activeActorIds: ids,
    transitions:
      ids.length === 2
        ? [{ from: ids[0], to: ids[1], label: title, kind: "state" }]
        : [],
    spans: ids.map((actorId, i) => ({
      actorId,
      label: i === ids.length - 1 ? title : "입력 표현 제공",
      start: i / ids.length,
      end: (i + 1) / ids.length,
    })),
    message: { label: "현재 데이터 · 교육용 고정 예제", code: output },
  });
  return {
    title: "번역 작업대 · 문장에서 문장으로",
    motionTone: "friendly",
    autoplayMs: 4200,
    overviewMs: 3200,
    overviewSummary:
      "Encoder–Decoder Transformer의 추론 과정입니다. 원문을 수치화하고 문맥을 반영한 뒤, 목표 언어의 토큰을 하나씩 생성합니다.",
    waterfallLabel: "현재 연산의 순서 · 설명용 상대 비중, 실측 시간 아님",
    actors: [
      { id: "input", label: "원문", x: 15, y: 20 },
      { id: "tokenizer", label: "토크나이저", x: 50, y: 20 },
      { id: "embedding", label: "임베딩", x: 85, y: 20 },
      { id: "encoder", label: "인코더", x: 85, y: 80 },
      { id: "decoder", label: "디코더", x: 50, y: 80 },
      { id: "output", label: "출력", x: 15, y: 80 },
    ],
    topologyLinks: [
      { from: "input", to: "tokenizer" },
      { from: "tokenizer", to: "embedding" },
      { from: "embedding", to: "encoder" },
      { from: "encoder", to: "decoder" },
      { from: "decoder", to: "output" },
    ],
    steps: [
      step(
        "원문과 목표 언어",
        "입력 문장과 번역 방향을 정합니다. 자동 언어 감지는 서비스의 선택 기능이며 필수 모델 연산은 아닙니다.",
        ["input"],
        example.source,
      ),
      step(
        "문장을 토큰으로 분할",
        "토크나이저가 문장을 ID의 나열로 바꿉니다. 화면의 조각과 ID는 설명용이며 실제 분할은 모델마다 다릅니다.",
        ["input", "tokenizer"],
        example.sourceTokens.join(" | "),
      ),
      step(
        "ID를 벡터로 변환",
        "임베딩을 조회하고 위치 정보를 반영합니다. 벡터의 각 칸에 주어·동사 같은 고정 이름이 붙어 있는 것은 아닙니다.",
        ["tokenizer", "embedding"],
        "토큰 ID → 임베딩 벡터 + 위치 정보",
      ),
      step(
        "원문 안에서 문맥 반영",
        "Self-Attention으로 원문 토큰 사이의 정보를 섞습니다. 원문 위치마다 문맥 벡터가 남고, 하나의 문장 코드로 압축되는 것은 아닙니다.",
        ["embedding", "encoder"],
        "원문 토큰 수 × 은닉 차원의 문맥 표현",
      ),
      ...example.targetTokens.map((token, i) =>
        step(
          `다음 토큰 생성 · ${token}`,
          `이미 생성한 접두사와 원문 문맥으로 다음 후보를 계산합니다. ${i === 1 && example.direction === "ko-en" ? "원문 뒤의 ‘먹는다’를 참고해 eat를 먼저 생성하므로 어순이 달라집니다." : "Cross-Attention은 원문 전체를 가중 참조하며 한 단어만 고르는 연산이 아닙니다."}`,
          ["encoder", "decoder"],
          `${i === 0 ? "<BOS>" : example.targetTokens.slice(0, i).join(" | ")} → ${token}\n선택한 토큰을 접두사에 추가 → 다음 연산에 재입력`,
        ),
      ),
      step(
        "종료 토큰 선택",
        "이 예제는 <EOS>를 선택해 생성을 끝냅니다. 서비스는 최대 출력 길이 같은 종료 제한도 둘 수 있습니다.",
        ["decoder"],
        example.targetTokens.join(" | ") + " | <EOS>",
      ),
      step(
        "토큰을 문장으로 복원",
        "출력 토큰 ID를 텍스트로 복원하고 특수 토큰을 제거합니다. 띄어쓰기와 문장부호를 포함한 번역문을 표시합니다.",
        ["decoder", "output"],
        example.target,
      ),
    ],
  };
}
