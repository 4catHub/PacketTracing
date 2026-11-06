import { ArrowRight, CircleX } from "lucide-react";
import type { ReactNode } from "react";

export type StageTone = "neutral" | "blue" | "warning" | "danger" | "safe";

const tones: Record<StageTone, string> = {
  neutral: "text-muted-foreground",
  blue: "text-blue-700 dark:text-blue-300",
  warning: "text-amber-700 dark:text-amber-300",
  danger: "text-rose-700 dark:text-rose-300",
  safe: "text-emerald-700 dark:text-emerald-300",
};

export interface StageIllustration {
  objects: {
    mark: ReactNode;
    label: string;
    detail: string;
    tone?: StageTone;
    next?: "arrow" | "blocked";
  }[];
}

export default function AttackStageIllustration({
  illustration,
  overview,
}: {
  illustration: StageIllustration;
  overview: boolean;
}) {
  return (
    <figure
      className="min-h-44 border-y border-border bg-card px-2 py-3 sm:px-4"
      data-testid="attack-stage-illustration"
    >
      <figcaption className="mb-2 text-xs font-semibold text-muted-foreground">
        {overview ? "전체 경로의 주요 요소" : "현재 장면의 핵심 요소"}
      </figcaption>
      <ol
        className="mx-auto grid max-w-2xl"
        style={{
          gridTemplateColumns: `repeat(${illustration.objects.length}, minmax(0, 1fr))`,
        }}
      >
        {illustration.objects.map(
          ({ mark, label, detail, tone = "neutral", next }) => (
            <li
              key={label}
              className="relative min-w-0 px-1 text-center sm:px-3"
            >
              <div
                aria-hidden="true"
                className={`mx-auto flex h-14 w-full max-w-[92px] items-center justify-center sm:h-[76px] ${tones[tone]}`}
              >
                {mark}
              </div>
              <div className="mt-1 break-keep text-xs font-bold leading-tight text-foreground sm:text-sm">
                {label}
              </div>
              <div className="mt-1 break-keep text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {detail}
              </div>
              {next && (
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-2 top-5 z-10 sm:top-7 ${next === "blocked" ? tones.safe : tones.neutral}`}
                >
                  {next === "blocked" ? (
                    <CircleX size={16} />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </span>
              )}
            </li>
          ),
        )}
      </ol>
    </figure>
  );
}

export const stageIconClass = "size-9 sm:size-12";

export function StageFileStack({
  count,
  crossed = false,
}: {
  count: number;
  crossed?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 96 68"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {Array.from({ length: count }, (_, index) => (
        <g
          key={index}
          transform={`translate(${48 - (count - 1) * 7 + index * 14} ${34 + index * 3})`}
        >
          <path d="M -18 -24 H 8 L 18 -14 V 20 H -18 Z" className="fill-card" />
          <path d="M 8 -24 V -14 H 18 M -10 -5 H 10 M -10 3 H 8 M -10 11 H 4" />
        </g>
      ))}
      {crossed && (
        <g transform="translate(79 48)">
          <circle r="10" className="fill-card" />
          <path d="m -4 -4 8 8 m 0 -8 -8 8" />
        </g>
      )}
    </svg>
  );
}
