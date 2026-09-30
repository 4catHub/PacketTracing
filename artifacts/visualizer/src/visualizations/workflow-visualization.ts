export type WorkflowMotionTone = "auto" | "restrained" | "friendly" | "playful";

export type WorkflowSubjectRisk = "normal" | "sensitive" | "critical";

export interface WorkflowActor {
  id: string;
  label: string;
  detail?: string;
  x: number;
  y: number;
  accentClass?: string;
}

export interface WorkflowTransition {
  from: string;
  to: string;
  label: string;
  kind?: "request" | "response" | "event" | "state";
}

export interface WorkflowWaterfallSpan {
  label: string;
  start: number;
  end: number;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger";
}

export interface WorkflowVisualizationStep {
  title: string;
  summary: string;
  focusActorId: string;
  transitions?: WorkflowTransition[];
  spans: WorkflowWaterfallSpan[];
  playfulHint?: string;
}

export interface WorkflowVisualizationSpec {
  title: string;
  actors: WorkflowActor[];
  steps: WorkflowVisualizationStep[];
  motionTone?: WorkflowMotionTone;
  subjectRisk?: WorkflowSubjectRisk;
  beginnerFriendly?: boolean;
  analogyDriven?: boolean;
  autoplayMs?: number;
  waterfallLabel?: string;
}

export function resolveWorkflowMotionTone(
  spec: WorkflowVisualizationSpec,
): Exclude<WorkflowMotionTone, "auto"> {
  if (spec.motionTone && spec.motionTone !== "auto") {
    return spec.motionTone;
  }

  if (spec.subjectRisk === "sensitive" || spec.subjectRisk === "critical") {
    return "restrained";
  }

  if (spec.beginnerFriendly && spec.analogyDriven) {
    return "playful";
  }

  return "friendly";
}

export function clampWorkflowSpan(value: number): number {
  return Math.max(0, Math.min(1, value));
}
