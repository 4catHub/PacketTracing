import { useEffect, useId, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  Cpu,
  Headphones,
  LockKeyhole,
  Mic,
  Network,
  RadioTower,
  Volume2,
} from "lucide-react";
import WorkflowFocusedViz, {
  type WorkflowTopologyCanvasProps,
} from "./WorkflowFocusedViz";
import type {
  WorkflowVisualizationSpec,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

const devices = {
  mic: { label: "A의 마이크", detail: "음압 → 전기 신호", Icon: Mic },
  sender: {
    label: "송신 클라이언트 A",
    detail: "ADC · 전처리 · Opus",
    Icon: Cpu,
  },
  gateway: {
    label: "Voice Gateway",
    detail: "세션 · 키 교환",
    Icon: RadioTower,
  },
  sfu: { label: "Discord SFU", detail: "미디어 패킷 중계", Icon: Network },
  receiver: {
    label: "수신 클라이언트 B",
    detail: "지터 버퍼 · Opus",
    Icon: Headphones,
  },
  peer: {
    label: "수신 클라이언트 C",
    detail: "같은 채널의 청취자",
    Icon: Headphones,
  },
  speaker: { label: "B의 스피커", detail: "DAC · 진동판", Icon: Volume2 },
};

type DeviceId = keyof typeof devices;
type Point = readonly [x: number, y: number];
type Link = {
  from: DeviceId;
  to: DeviceId;
  caption: string;
  kind: "control" | "signal" | "media";
  desktop: { path: string; label: Point };
  compact: { path: string; label: Point };
};

const desktop = {
  width: 960,
  height: 435,
  cardWidth: 184,
  cardHeight: 74,
  positions: {
    mic: [136, 101],
    sender: [136, 231],
    gateway: [480, 101],
    sfu: [480, 231],
    receiver: [824, 231],
    peer: [824, 101],
    speaker: [824, 374],
  },
} satisfies {
  width: number;
  height: number;
  cardWidth: number;
  cardHeight: number;
  positions: Record<DeviceId, Point>;
};

const compact = {
  width: 360,
  height: 615,
  cardWidth: 144,
  cardHeight: 68,
  positions: {
    mic: [88, 55],
    sender: [88, 181],
    gateway: [272, 55],
    sfu: [88, 307],
    receiver: [88, 433],
    peer: [272, 307],
    speaker: [88, 559],
  },
} satisfies typeof desktop;

const links: Link[] = [
  {
    from: "sender",
    to: "gateway",
    kind: "control",
    caption: "WebSocket",
    desktop: { path: "M 228 207 H 298 V 101 H 388", label: [301, 81] },
    compact: { path: "M 160 181 H 272 V 89", label: [272, 202] },
  },
  {
    from: "mic",
    to: "sender",
    kind: "signal",
    caption: "아날로그 입력",
    desktop: { path: "M 136 138 V 194", label: [213, 170] },
    compact: { path: "M 88 89 V 147", label: [165, 122] },
  },
  {
    from: "sender",
    to: "sfu",
    kind: "media",
    caption: "RTP / UDP",
    desktop: { path: "M 228 231 H 388", label: [308, 254] },
    compact: { path: "M 88 215 V 273", label: [164, 247] },
  },
  {
    from: "sfu",
    to: "receiver",
    kind: "media",
    caption: "B로 중계",
    desktop: { path: "M 572 231 H 732", label: [652, 254] },
    compact: { path: "M 88 341 V 399", label: [164, 373] },
  },
  {
    from: "sfu",
    to: "peer",
    kind: "media",
    caption: "C로 중계",
    desktop: { path: "M 572 207 H 645 V 101 H 732", label: [652, 81] },
    compact: { path: "M 160 307 H 180 V 260 H 272 V 273", label: [258, 247] },
  },
  {
    from: "receiver",
    to: "speaker",
    kind: "signal",
    caption: "PCM 출력",
    desktop: { path: "M 824 268 V 337", label: [751, 308] },
    compact: { path: "M 88 467 V 525", label: [162, 499] },
  },
];

function span(
  actorId: DeviceId,
  label: string,
  start: number,
  end: number,
  kind: WorkflowWaterfallSpan["kind"] = "work",
): WorkflowWaterfallSpan {
  return {
    actorId,
    label,
    start,
    end,
    kind,
    tone:
      kind === "wait"
        ? "warning"
        : kind === "network"
          ? "secondary"
          : "primary",
  };
}

const spec: WorkflowVisualizationSpec = {
  title: "음성 한 조각이 상대방에게 닿는 경로",
  overviewSummary:
    "A가 말하면 B와 C가 듣습니다. 위쪽 제어 경로에서 통화를 준비하고, 음성은 SFU를 거쳐 수신자별로 전달됩니다. B와 C가 말할 때도 같은 송신 흐름을 따릅니다.",
  autoplayMs: 4600,
  overviewMs: 3200,
  waterfallLabel: "음성 처리 타임라인",
  actors: (Object.keys(devices) as DeviceId[]).map((id) => ({
    id,
    label: devices[id].label,
    x: (desktop.positions[id][0] / desktop.width) * 100,
    y: (desktop.positions[id][1] / desktop.height) * 100,
  })),
  topologyLinks: links,
  steps: [
    {
      title: "채널 참가와 연결 설정",
      summary:
        "각 참가자가 Voice Gateway에 연결합니다. Gateway는 미디어 전송 설정과 DAVE 키 교환을 조율합니다. 그림은 A의 제어 연결을 표시합니다.",
      activeActorIds: ["sender", "gateway"],
      transitions: [
        { from: "sender", to: "gateway", label: "참가 · 세션 설정" },
      ],
      spans: [
        span("sender", "Voice Gateway 접속", 0, 0.3, "network"),
        span("gateway", "세션 · 전송 협의", 0.3, 0.65),
        span("sender", "DAVE 키 준비", 0.65, 1),
      ],
    },
    {
      title: "소리를 PCM 샘플로",
      summary:
        "마이크가 공기 진동을 연속적인 전압으로 바꿉니다. ADC가 전압을 일정 간격으로 읽어 디지털 PCM 샘플을 만듭니다.",
      activeActorIds: ["mic", "sender"],
      transitions: [{ from: "mic", to: "sender", label: "연속 전압" }],
      spans: [
        span("mic", "음압을 전압으로", 0, 0.35),
        span("sender", "ADC 샘플링 · 양자화", 0.35, 1),
      ],
    },
    {
      title: "전처리와 Opus 압축",
      summary:
        "A의 클라이언트는 설정에 따라 에코와 잡음을 줄입니다. Opus가 짧은 PCM 구간을 압축 프레임으로 만듭니다. 그림은 20 ms 구간 예시입니다.",
      activeActorIds: ["sender"],
      spans: [
        span("sender", "에코 · 잡음 억제", 0, 0.38),
        span("sender", "PCM 구간 수집", 0.38, 0.68, "wait"),
        span("sender", "Opus 인코딩", 0.68, 1),
      ],
    },
    {
      title: "암호화한 패킷 송신",
      summary:
        "A가 Opus 프레임을 DAVE로 종단간 암호화하고 RTP 패킷으로 묶습니다. SFU까지의 전송 구간도 별도로 암호화합니다.",
      activeActorIds: ["sender", "sfu"],
      transitions: [{ from: "sender", to: "sfu", label: "암호화된 RTP" }],
      spans: [
        span("sender", "DAVE 프레임 암호화", 0, 0.32),
        span("sender", "RTP 구성 · UDP 전송", 0.32, 0.83, "network"),
        span("sfu", "패킷 수신", 0.83, 1),
      ],
    },
    {
      title: "SFU가 B와 C에 중계",
      summary:
        "SFU가 A의 음성 스트림을 두 수신자에게 각각 전달합니다. 프레임의 DAVE 암호화는 수신자 단말까지 유지됩니다.",
      activeActorIds: ["sfu", "receiver", "peer"],
      transitions: [
        { from: "sfu", to: "receiver", label: "B로 패킷 중계" },
        { from: "sfu", to: "peer", label: "C로 패킷 중계" },
      ],
      spans: [
        span("sfu", "수신자 경로 선택", 0, 0.25),
        span("receiver", "B 쪽 패킷 도착", 0.25, 0.84, "network"),
        span("peer", "C 쪽 패킷 도착", 0.25, 1, "network"),
      ],
    },
    {
      title: "도착 순서를 재생 순서로",
      summary:
        "B는 지터 버퍼로 재생 시각을 맞춥니다. 프레임을 복호화하고 Opus를 PCM으로 디코딩합니다. 재생 시한을 넘긴 조각은 손실 은폐로 메울 수 있습니다.",
      activeActorIds: ["receiver"],
      spans: [
        span("receiver", "지터 버퍼 · 재생 대기", 0, 0.53, "wait"),
        span("receiver", "복호화 · Opus 디코딩", 0.53, 1),
      ],
    },
    {
      title: "스피커에서 다시 소리로",
      summary:
        "DAC가 PCM을 연속적인 전기 신호로 바꿉니다. 스피커 진동판이 공기를 움직여 B에게 소리가 들립니다. C도 자기 장치에서 같은 과정을 거칩니다.",
      activeActorIds: ["receiver", "speaker"],
      transitions: [{ from: "receiver", to: "speaker", label: "디지털 PCM" }],
      spans: [
        span("receiver", "PCM 재생 큐 전달", 0, 0.33),
        span("speaker", "DAC · 아날로그 출력", 0.33, 0.76),
        span("speaker", "진동판으로 소리 재생", 0.76, 1),
      ],
    },
  ],
};

const samplePoints = [
  [8, 18],
  [18, 8],
  [28, 9],
  [38, 18],
  [48, 28],
  [58, 29],
  [68, 18],
  [78, 8],
  [88, 9],
  [98, 18],
];
const waveform = "M 8 18 C 18 3 28 3 38 18 S 58 33 68 18 S 88 3 98 18";
const signalSequence = [
  ["WebSocket 제어", "미디어 경로 · DAVE 키"],
  ["아날로그 전압", "디지털 PCM"],
  ["PCM 20 ms · 960샘플/채널", "Opus 프레임"],
  ["DAVE로 보호된 Opus", "RTP 패킷 · UDP"],
  ["A의 패킷 #102", "B와 C에 각각 전달"],
  ["도착 101 · 103 · 102", "재생 101 · 102 · 103"],
  ["디지털 PCM", "아날로그 출력"],
] as const;

function SignalSample({ digital }: { digital: boolean }) {
  return (
    <svg
      className="mx-auto h-8 w-full max-w-28 text-primary"
      viewBox="0 0 106 36"
      aria-hidden="true"
    >
      <path d="M 4 18 H 102" className="stroke-border" strokeDasharray="2 3" />
      {digital ? (
        samplePoints.map(([x, y]) => (
          <g key={x}>
            <path d={`M ${x} 18 V ${y}`} stroke="currentColor" opacity=".5" />
            <circle cx={x} cy={y} r="2" fill="currentColor" />
          </g>
        ))
      ) : (
        <path d={waveform} fill="none" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}

function SignalStrip({ stepIndex }: { stepIndex: number | null }) {
  const sequence =
    stepIndex === null
      ? ["마이크 입력", "스피커 재생"]
      : signalSequence[stepIndex];
  const showSamples = stepIndex === 1 || stepIndex === 6;

  return (
    <div className="grid min-h-24 grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border bg-card px-3 py-2 text-center sm:px-6">
      {sequence.map((label, index) => (
        <div
          key={index}
          className={`flex min-w-0 flex-col justify-center gap-1 ${index === 1 ? "col-start-3 row-start-1" : ""}`}
        >
          {showSamples && (
            <SignalSample
              digital={stepIndex === 1 ? index === 1 : index === 0}
            />
          )}
          <span className="text-xs font-semibold leading-tight text-foreground">
            {label}
          </span>
        </div>
      ))}
      <span
        aria-hidden="true"
        className="col-start-2 row-start-1 text-lg text-primary"
      >
        →
      </span>
    </div>
  );
}

const linkStyles = {
  control: "text-violet-600 dark:text-violet-400",
  signal: "text-amber-700 dark:text-amber-400",
  media: "text-blue-600 dark:text-blue-400",
};

function VoiceTopology({
  spec,
  stepIndex,
  playing,
  selectFrame,
}: WorkflowTopologyCanvasProps) {
  const [isCompact, setCompact] = useState(
    () => window.matchMedia("(max-width: 640px)").matches,
  );
  const reducedMotion = useReducedMotion();
  const canvas = useRef<SVGSVGElement>(null);
  const arrowId = useId();
  const layout = isCompact ? compact : desktop;
  const step = stepIndex === null ? undefined : spec.steps[stepIndex];

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (playing) canvas.current?.unpauseAnimations();
    else canvas.current?.pauseAnimations();
  }, [playing, stepIndex, isCompact]);

  return (
    <div className="bg-background">
      <svg
        ref={canvas}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="block w-full"
        role="img"
        aria-label={`디스코드 음성 경로. ${step?.title ?? "마이크, 송신자, Voice Gateway, SFU, 수신자 두 명과 스피커"}`}
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="9"
            markerHeight="9"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="context-stroke" />
          </marker>
        </defs>
        {!isCompact && (
          <g
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="14"
            fontWeight="700"
          >
            <text x="136" y="34">
              송신 단말
            </text>
            <text x="480" y="34">
              Discord 인프라
            </text>
            <text x="824" y="34">
              수신 단말
            </text>
          </g>
        )}
        {links.map(({ from, to, kind, caption, ...routes }) => {
          const route = isCompact ? routes.compact : routes.desktop;
          const transition = step?.transitions?.find(
            (entry) => entry.from === from && entry.to === to,
          );
          const label = transition?.label ?? caption;
          return (
            <g
              key={`${from}-${to}`}
              data-voice-link={`${from}-${to}`}
              data-active={Boolean(transition)}
              className={linkStyles[kind]}
            >
              <path
                d={route.path}
                fill="none"
                stroke="currentColor"
                strokeWidth={transition ? 3 : 1.6}
                opacity={transition ? 1 : 0.5}
                strokeDasharray={kind === "control" ? "5 4" : undefined}
                markerStart={
                  kind === "control" ? `url(#${arrowId})` : undefined
                }
                markerEnd={`url(#${arrowId})`}
              />
              <text
                x={route.label[0]}
                y={route.label[1]}
                textAnchor="middle"
                fill="currentColor"
                fontSize={isCompact ? 12 : 13}
                fontWeight={transition ? 750 : 550}
              >
                {label}
              </text>
              {transition && !reducedMotion && (
                <g key={stepIndex} aria-hidden="true">
                  <animateMotion
                    dur="1.6s"
                    repeatCount="indefinite"
                    path={route.path}
                  />
                  {kind === "signal" ? (
                    <circle
                      r="4.5"
                      fill="currentColor"
                      className="stroke-background"
                      strokeWidth="1.5"
                    />
                  ) : (
                    <rect
                      x="-7"
                      y="-4.5"
                      width="14"
                      height="9"
                      rx="2"
                      fill="currentColor"
                      className="stroke-background"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              )}
            </g>
          );
        })}
        {(Object.keys(devices) as DeviceId[]).map((id) => {
          const [x, y] = layout.positions[id];
          const { label, detail, Icon } = devices[id];
          const active = step?.activeActorIds.includes(id) ?? false;
          const left = -layout.cardWidth / 2;
          const top = -layout.cardHeight / 2;
          const captionX = left + 38;
          return (
            <g
              key={id}
              data-voice-device={id}
              data-active={active}
              transform={`translate(${x} ${y})`}
            >
              <rect
                x={left}
                y={top}
                width={layout.cardWidth}
                height={layout.cardHeight}
                rx={id === "mic" || id === "speaker" ? 20 : 10}
                className={`fill-card ${active ? "stroke-primary" : "stroke-border"}`}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <Icon
                x={left + 11}
                y={-10}
                size={19}
                className={active ? "text-primary" : "text-muted-foreground"}
                aria-hidden="true"
              />
              <text
                x={captionX}
                y="-2"
                className="fill-foreground"
                fontSize={isCompact ? 13 : 15}
                fontWeight="750"
              >
                {label}
              </text>
              <text
                x={captionX}
                y="17"
                className="fill-muted-foreground"
                fontSize={isCompact ? 11 : 12}
              >
                {detail}
              </text>
            </g>
          );
        })}
      </svg>
      <SignalStrip stepIndex={stepIndex} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2.5">
        <div
          className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground"
          aria-label="경로 범례"
        >
          <span>
            <span className={linkStyles.control} aria-hidden="true">
              ┄{" "}
            </span>
            제어 연결
          </span>
          <span>
            <span className={linkStyles.signal} aria-hidden="true">
              ↝{" "}
            </span>
            기기 내 신호
          </span>
          <span className="inline-flex items-center gap-1">
            <LockKeyhole
              className={linkStyles.media}
              size={12}
              aria-hidden="true"
            />
            암호화된 미디어
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-foreground">
          단계 선택
          <select
            className="max-w-44 rounded-md border border-border bg-card px-2 py-1 text-xs"
            value={stepIndex ?? ""}
            onChange={(event) =>
              selectFrame(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          >
            <option value="">전체 경로</option>
            {spec.steps.map(({ title }, index) => (
              <option key={title} value={index}>
                {index + 1}. {title}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export default function DiscordVoiceChatViz() {
  return <WorkflowFocusedViz spec={spec} TopologyCanvas={VoiceTopology} />;
}
