export type WorkflowMotionTone = "auto" | "restrained" | "friendly" | "playful";
export type WorkflowSubjectRisk = "normal" | "sensitive" | "critical";
export type WorkflowAccent = "blue" | "cyan" | "violet" | "emerald" | "amber" | "rose";
export type WorkflowTransitionKind = "request" | "response" | "event" | "state";
export type WorkflowSpanKind = "work" | "network" | "wait";
export type WorkflowSpanStatus = "default" | "success" | "warning" | "error";

export interface WorkflowActor {
  id: string;
  label: string;
  detail?: string;
  accent?: WorkflowAccent;
  /** Stable normalized topology position (0..100). It does not change between steps. */
  x: number;
  y: number;
  /** Optional stable narrow-screen position when the desktop projection would overlap labels. */
  compactX?: number;
  compactY?: number;
}

export interface WorkflowTopologyLink {
  from: string;
  to: string;
  label?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  kind?: WorkflowTransitionKind;
  /** Short payload text shown inside the packet marker. Defaults to a kind-specific glyph. */
  payload?: string;
  /** Optional vertical label offset from the path midpoint. Defaults to -14. */
  labelOffsetY?: number;
}

export interface WorkflowWaterfallSpan {
  /** Required when another span refers to this span with parentId. */
  id?: string;
  label: string;
  start: number;
  end: number;
  /** Actor that owns this execution slice. */
  actorId?: string;
  /** Optional parent span used to communicate trace nesting. */
  parentId?: string;
  kind?: WorkflowSpanKind;
  status?: WorkflowSpanStatus;
  bottleneck?: boolean;
  detail?: string;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger";
}

export interface WorkflowVisualizationStep {
  title: string;
  summary: string;
  /** Actors participating in the current interaction/state. Non-active actors remain visible as context. */
  activeActorIds: string[];
  transitions?: WorkflowTransition[];
  spans: WorkflowWaterfallSpan[];
  /** Optional wire message or application payload synchronized with this snapshot. */
  message?: { label: string; code: string };
  playfulHint?: string;
}

export interface WorkflowVisualizationSpec {
  title: string;
  actors: WorkflowActor[];
  /** Persistent structural links shown faintly on every step. */
  topologyLinks?: WorkflowTopologyLink[];
  steps: WorkflowVisualizationStep[];
  motionTone?: WorkflowMotionTone;
  subjectRisk?: WorkflowSubjectRisk;
  beginnerFriendly?: boolean;
  analogyDriven?: boolean;
  autoplayMs?: number;
  overviewMs?: number;
  overviewSummary?: string;
  waterfallLabel?: string;
}

export interface WorkflowSpecIssue {
  path: string;
  message: string;
}

export function resolveWorkflowMotionTone(spec: WorkflowVisualizationSpec): Exclude<WorkflowMotionTone, "auto"> {
  if (spec.motionTone && spec.motionTone !== "auto") return spec.motionTone;
  if (spec.subjectRisk === "sensitive" || spec.subjectRisk === "critical") return "restrained";
  if (spec.beginnerFriendly && spec.analogyDriven) return "playful";
  return "friendly";
}

export function clampWorkflowSpan(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Validate cross-references that TypeScript cannot express inside a workflow spec. */
export function validateWorkflowSpec(spec: WorkflowVisualizationSpec): WorkflowSpecIssue[] {
  const issues: WorkflowSpecIssue[] = [];
  const actorIds = new Set<string>();

  if (!spec.title.trim()) issues.push({ path: "title", message: "제목이 비어 있습니다." });
  if (spec.actors.length === 0) issues.push({ path: "actors", message: "토폴로지 actor가 필요합니다." });
  if (spec.steps.length === 0) issues.push({ path: "steps", message: "워크플로우 단계가 필요합니다." });

  spec.actors.forEach((actor, actorIndex) => {
    const path = `actors[${actorIndex}]`;
    if (actorIds.has(actor.id)) issues.push({ path: `${path}.id`, message: `중복 actor id '${actor.id}'입니다.` });
    actorIds.add(actor.id);
    if (!Number.isFinite(actor.x) || actor.x < 0 || actor.x > 100) {
      issues.push({ path: `${path}.x`, message: "x 좌표는 0..100 범위여야 합니다." });
    }
    if (!Number.isFinite(actor.y) || actor.y < 0 || actor.y > 100) {
      issues.push({ path: `${path}.y`, message: "y 좌표는 0..100 범위여야 합니다." });
    }
    if (actor.compactX !== undefined && (!Number.isFinite(actor.compactX) || actor.compactX < 0 || actor.compactX > 100)) {
      issues.push({ path: `${path}.compactX`, message: "compactX 좌표는 0..100 범위여야 합니다." });
    }
    if (actor.compactY !== undefined && (!Number.isFinite(actor.compactY) || actor.compactY < 0 || actor.compactY > 100)) {
      issues.push({ path: `${path}.compactY`, message: "compactY 좌표는 0..100 범위여야 합니다." });
    }
  });

  (spec.topologyLinks ?? []).forEach((link, linkIndex) => {
    if (!actorIds.has(link.from)) {
      issues.push({ path: `topologyLinks[${linkIndex}].from`, message: `알 수 없는 actor '${link.from}'입니다.` });
    }
    if (!actorIds.has(link.to)) {
      issues.push({ path: `topologyLinks[${linkIndex}].to`, message: `알 수 없는 actor '${link.to}'입니다.` });
    }
  });

  spec.steps.forEach((step, stepIndex) => {
    step.activeActorIds.forEach((actorId, actorIndex) => {
      if (!actorIds.has(actorId)) {
        issues.push({
          path: `steps[${stepIndex}].activeActorIds[${actorIndex}]`,
          message: `알 수 없는 actor '${actorId}'입니다.`,
        });
      }
    });

    (step.transitions ?? []).forEach((transition, transitionIndex) => {
      if (!actorIds.has(transition.from)) {
        issues.push({
          path: `steps[${stepIndex}].transitions[${transitionIndex}].from`,
          message: `알 수 없는 actor '${transition.from}'입니다.`,
        });
      }
      if (!actorIds.has(transition.to)) {
        issues.push({
          path: `steps[${stepIndex}].transitions[${transitionIndex}].to`,
          message: `알 수 없는 actor '${transition.to}'입니다.`,
        });
      }
      if (transition.labelOffsetY !== undefined && !Number.isFinite(transition.labelOffsetY)) {
        issues.push({
          path: `steps[${stepIndex}].transitions[${transitionIndex}].labelOffsetY`,
          message: "labelOffsetY는 유한한 숫자여야 합니다.",
        });
      }
    });

    const spanIds = new Set(step.spans.flatMap((span) => (span.id ? [span.id] : [])));
    if (spanIds.size !== step.spans.filter((span) => span.id).length) {
      issues.push({ path: `steps[${stepIndex}].spans`, message: "span id는 단계 안에서 고유해야 합니다." });
    }

    step.spans.forEach((span, spanIndex) => {
      const path = `steps[${stepIndex}].spans[${spanIndex}]`;
      if (!Number.isFinite(span.start) || !Number.isFinite(span.end) || span.start < 0 || span.end > 1 || span.end < span.start) {
        issues.push({ path, message: "span의 start/end는 0..1 범위이며 end가 start 이상이어야 합니다." });
      }
      if (span.actorId && !actorIds.has(span.actorId)) {
        issues.push({ path: `${path}.actorId`, message: `알 수 없는 actor '${span.actorId}'입니다.` });
      }
      if (span.parentId && !spanIds.has(span.parentId)) {
        issues.push({ path: `${path}.parentId`, message: `알 수 없는 parent span '${span.parentId}'입니다.` });
      }
      if (span.parentId && span.parentId === span.id) {
        issues.push({ path: `${path}.parentId`, message: "span은 자기 자신을 부모로 가질 수 없습니다." });
      }
    });
  });

  return issues;
}
