import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "framer-motion";
import type { WorkflowTopologyCanvasProps } from "./WorkflowFocusedViz";
import type { PdfSource } from "./pdf-conversion-model";

type Box = { x: number; y: number; w: number; h: number };
type Route = {
  from: string;
  to: string;
  d: string;
  x: number;
  y: number;
  label: string;
};
const wide: Record<string, Box> = {
  source: { x: 40, y: 45, w: 200, h: 170 },
  parser: { x: 385, y: 45, w: 230, h: 170 },
  layout: { x: 760, y: 45, w: 200, h: 170 },
  objects: { x: 760, y: 340, w: 200, h: 170 },
  file: { x: 385, y: 340, w: 230, h: 170 },
  viewer: { x: 40, y: 340, w: 200, h: 170 },
  signature: { x: 40, y: 580, w: 920, h: 74 },
};
const narrow: Record<string, Box> = {
  source: { x: 20, y: 35, w: 180, h: 170 },
  parser: { x: 260, y: 35, w: 180, h: 170 },
  layout: { x: 260, y: 310, w: 180, h: 170 },
  objects: { x: 20, y: 310, w: 180, h: 170 },
  file: { x: 20, y: 585, w: 180, h: 170 },
  viewer: { x: 260, y: 585, w: 180, h: 170 },
  signature: { x: 20, y: 835, w: 420, h: 95 },
};
const wideRoutes: Route[] = [
  {
    from: "source",
    to: "parser",
    d: "M240 130 H385",
    x: 312,
    y: 108,
    label: "원본 → 해석",
  },
  {
    from: "parser",
    to: "layout",
    d: "M615 130 H760",
    x: 688,
    y: 108,
    label: "요소 → 좌표",
  },
  {
    from: "layout",
    to: "objects",
    d: "M860 215 V340",
    x: 860,
    y: 278,
    label: "그리기 명령",
  },
  {
    from: "objects",
    to: "file",
    d: "M760 425 H615",
    x: 688,
    y: 403,
    label: "객체 → 파일",
  },
  {
    from: "file",
    to: "viewer",
    d: "M385 425 H240",
    x: 312,
    y: 403,
    label: "명령 → 화면",
  },
  {
    from: "file",
    to: "signature",
    d: "M500 510 V580",
    x: 570,
    y: 548,
    label: "선택 · 서명",
  },
  {
    from: "signature",
    to: "viewer",
    d: "M140 580 V510",
    x: 220,
    y: 548,
    label: "수신자 검증",
  },
];
const narrowRoutes: Route[] = [
  {
    from: "source",
    to: "parser",
    d: "M200 120 H260",
    x: 230,
    y: 98,
    label: "읽기",
  },
  {
    from: "parser",
    to: "layout",
    d: "M350 205 V310",
    x: 350,
    y: 259,
    label: "요소 → 좌표",
  },
  {
    from: "layout",
    to: "objects",
    d: "M260 395 H200",
    x: 230,
    y: 373,
    label: "구성",
  },
  {
    from: "objects",
    to: "file",
    d: "M110 480 V585",
    x: 110,
    y: 535,
    label: "객체 → 파일",
  },
  {
    from: "file",
    to: "viewer",
    d: "M200 670 H260",
    x: 230,
    y: 648,
    label: "열기",
  },
  {
    from: "file",
    to: "signature",
    d: "M110 755 V835",
    x: 110,
    y: 797,
    label: "선택 · 서명",
  },
  {
    from: "signature",
    to: "viewer",
    d: "M350 835 V755",
    x: 350,
    y: 797,
    label: "수신자 검증",
  },
];

function Text({
  x,
  y,
  children,
  small,
  muted,
  center,
}: {
  x: number;
  y: number;
  children: ReactNode;
  small?: boolean;
  muted?: boolean;
  center?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={center ? "middle" : "start"}
      fontSize={small ? "var(--pdf-label-size, 13px)" : 16}
      fontWeight={small ? 500 : 700}
      className={muted ? "fill-muted-foreground" : "fill-foreground"}
    >
      {children}
    </text>
  );
}
function Photo({ x, y, w, h }: Box) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        className="fill-muted stroke-border"
      />
      <circle
        cx={x + w * 0.75}
        cy={y + h * 0.25}
        r={h * 0.1}
        fill="#f59e0b"
        opacity={0.65}
      />
      <path
        d={`M${x + 5} ${y + h - 5} L${x + w * 0.33} ${y + h * 0.35} L${x + w * 0.58} ${y + h * 0.7} L${x + w * 0.72} ${y + h * 0.5} L${x + w - 5} ${y + h - 5} Z`}
        fill="#64748b"
        opacity={0.6}
      />
    </g>
  );
}
function Page({
  x,
  y,
  w,
  h,
  image,
  guides = false,
}: Box & { image: boolean; guides?: boolean }) {
  return (
    <g>
      <path
        d={`M${x} ${y} H${x + w - 16} L${x + w} ${y + 16} V${y + h} H${x} Z`}
        className="fill-background stroke-border"
        strokeWidth={1.5}
      />
      <path
        d={`M${x + w - 16} ${y} V${y + 16} H${x + w}`}
        className="fill-muted stroke-border"
      />
      {image ? (
        <>
          <Photo x={x + 10} y={y + 23} w={w - 20} h={h - 38} />
          <text
            x={x + w / 2}
            y={y + 19}
            textAnchor="middle"
            fontSize={10}
            className="fill-muted-foreground"
          >
            스캔 · JPG
          </text>
        </>
      ) : (
        <>
          <rect
            x={x + 10}
            y={y + 19}
            width={w * 0.57}
            height={5}
            rx={1}
            fill="#3b82f6"
          />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M${x + 10} ${y + 36 + i * 9} h${w - 24 - i * 6}`}
              className="stroke-muted-foreground"
              strokeWidth={2}
            />
          ))}
          <Photo x={x + 10} y={y + 70} w={w * 0.4} h={h - 84} />
          <path
            d={`M${x + w * 0.6} ${y + h - 14} v-19 m12 19 v-30 m12 30 v-40`}
            stroke="#8b5cf6"
            strokeWidth={7}
          />
        </>
      )}
      {guides && (
        <rect
          x={x + 6}
          y={y + 9}
          width={w - 12}
          height={h - 17}
          fill="none"
          stroke="#8b5cf6"
          strokeDasharray="3 3"
        />
      )}
    </g>
  );
}

export default function PdfConversionScene({
  spec,
  stepIndex,
  playing,
  selectFrame,
  source,
  ocr,
  signed,
}: WorkflowTopologyCanvasProps & {
  source: PdfSource;
  ocr: boolean;
  signed: boolean;
}) {
  const [compact, setCompact] = useState(false);
  const svg = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion() ?? false;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (playing) svg.current?.unpauseAnimations();
    else svg.current?.pauseAnimations();
  }, [playing, stepIndex]);
  const boxes = compact ? narrow : wide;
  const routes = compact ? narrowRoutes : wideRoutes;
  const step = stepIndex === null ? null : spec.steps[stepIndex];
  const phase = stepIndex === null ? 0 : stepIndex + 1;
  const image = source === "image";
  const active = (id: string) => step?.activeActorIds.includes(id) ?? false;
  const stroke = (id: string) =>
    active(id) ? "hsl(var(--primary))" : "hsl(var(--border))";
  const title = (id: string, label: string, detail: string) => (
    <>
      <Text x={boxes[id].x} y={boxes[id].y - 14}>
        {label}
      </Text>
      <Text x={boxes[id].x} y={boxes[id].y + boxes[id].h + 22} small muted>
        {detail}
      </Text>
    </>
  );
  const parser = boxes.parser,
    layout = boxes.layout,
    objects = boxes.objects,
    file = boxes.file,
    viewer = boxes.viewer,
    signature = boxes.signature;
  const outputReady = phase >= 5;
  return (
    <div className="bg-background px-1 pb-3">
      <svg
        ref={svg}
        viewBox={`0 0 ${compact ? 460 : 1000} ${compact ? 950 : 680}`}
        className="block w-full"
        role="img"
        aria-label={`PDF 변환 과정: ${step?.title ?? "전체 작업대"}`}
        style={
          { "--pdf-label-size": compact ? "16px" : "13px" } as CSSProperties
        }
        data-testid="pdf-conversion-scene"
        data-phase={phase}
      >
        <defs>
          <marker
            id={`${uid}-arrow`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            markerUnits="userSpaceOnUse"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 Z" fill="context-stroke" />
          </marker>
        </defs>
        {routes
          .filter(
            (route) =>
              signed ||
              (route.from !== "signature" && route.to !== "signature"),
          )
          .map((route, i) => {
            const transition = step?.transitions?.find(
              (t) => t.from === route.from && t.to === route.to,
            );
            const color =
              transition?.kind === "response" ? "#10b981" : "#3b82f6";
            const pathId = `${uid}-route-${i}`;
            // All routes are single horizontal or vertical segments. A paused
            // marker has an explicit position instead of SMIL's initial (0, 0).
            const [startX, startY, end] = route.d
              .match(/-?[\d.]+/g)!
              .map(Number);
            const markerX = route.d.includes("H") ? (startX + end) / 2 : startX;
            const markerY = route.d.includes("V") ? (startY + end) / 2 : startY;
            return (
              <g key={pathId}>
                <path
                  id={pathId}
                  d={route.d}
                  fill="none"
                  className={transition ? undefined : "stroke-border"}
                  stroke={transition ? color : undefined}
                  strokeWidth={transition ? 3 : 2}
                  strokeDasharray={transition ? undefined : "5 5"}
                  markerEnd={`url(#${uid}-arrow)`}
                />
                <rect
                  x={route.x - (compact && [0, 2, 4].includes(i) ? 18 : 61)}
                  y={route.y - 14}
                  width={compact && [0, 2, 4].includes(i) ? 36 : 122}
                  height={22}
                  rx={5}
                  className="fill-background"
                />
                <Text
                  x={route.x}
                  y={route.y + 1}
                  center
                  small
                  muted={!transition}
                >
                  {compact
                    ? route.label
                    : (transition?.label ??
                      (i === 0 ? "원본 → 해석" : route.label))}
                </Text>
                {transition && !reduced && (
                  <g
                    key={`${phase}-${pathId}-${playing}`}
                    transform={
                      playing ? undefined : `translate(${markerX} ${markerY})`
                    }
                  >
                    <rect
                      x={-6}
                      y={-7}
                      width={12}
                      height={14}
                      rx={2}
                      fill={color}
                    />
                    <path
                      d="M-3 -3 H3 M-3 1 H3"
                      stroke="white"
                      strokeWidth={1.2}
                    />
                    {playing && (
                      <animateMotion dur="2.4s" repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    )}
                  </g>
                )}
              </g>
            );
          })}
        <g data-actor-id="source">
          {title(
            "source",
            "원본 파일",
            image ? "픽셀 · 스캔 이미지" : "문단 · 표 · 스타일",
          )}
          <path
            d={`M${boxes.source.x + 9} ${boxes.source.y + 8} h${boxes.source.w - 10} v${boxes.source.h - 3}`}
            fill="none"
            className="stroke-border"
            strokeWidth={3}
          />
          <rect
            {...{
              x: boxes.source.x,
              y: boxes.source.y,
              width: boxes.source.w,
              height: boxes.source.h,
            }}
            rx={3}
            className="fill-card"
            stroke={stroke("source")}
            strokeWidth={active("source") ? 2.5 : 1.5}
          />
          <Page
            x={boxes.source.x + 25}
            y={boxes.source.y + 12}
            w={boxes.source.w - 50}
            h={145}
            image={image}
          />
        </g>
        <g data-actor-id="parser">
          {title(
            "parser",
            "원본 해석기",
            phase >= 1 ? "구조를 읽고 요소 분리" : "원본 형식에 맞춰 읽기",
          )}
          <rect
            x={parser.x}
            y={parser.y}
            width={parser.w}
            height={parser.h}
            rx={8}
            className="fill-card"
            stroke={stroke("parser")}
            strokeWidth={active("parser") ? 2.5 : 1.5}
          />
          <path
            d={`M${parser.x} ${parser.y + 30} h${parser.w}`}
            className="stroke-border"
          />
          <Text x={parser.x + 12} y={parser.y + 21} small muted>
            {image ? "IMAGE DECODER" : "DOCUMENT PARSER"}
          </Text>
          {(image
            ? ["픽셀 데이터", "크기 · 방향", "색상 정보"]
            : ["문단 · 글꼴", "표 · 도형", "삽입 이미지"]
          ).map((label, i) => (
            <g key={label} opacity={phase >= 1 || phase === 0 ? 1 : 0.5}>
              <rect
                x={parser.x + 12}
                y={parser.y + 44 + i * 37}
                width={parser.w - 24}
                height={27}
                rx={3}
                className="fill-background stroke-border"
              />
              <Text x={parser.x + 23} y={parser.y + 63 + i * 37} small>
                {label}
              </Text>
              {phase >= 1 && (
                <text
                  x={parser.x + parser.w - 24}
                  y={parser.y + 63 + i * 37}
                  textAnchor="middle"
                  fill="#10b981"
                  fontSize={14}
                >
                  ✓
                </text>
              )}
            </g>
          ))}
        </g>
        <g data-actor-id="layout">
          {title(
            "layout",
            "페이지 배치",
            phase >= 2 ? "용지 · 여백 · 좌표 확정" : "페이지 크기와 여백",
          )}
          <rect
            x={layout.x}
            y={layout.y}
            width={layout.w}
            height={layout.h}
            rx={3}
            className="fill-card"
            stroke={stroke("layout")}
            strokeWidth={active("layout") ? 2.5 : 1.5}
          />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path
              key={i}
              d={`M${layout.x + 15 + i * 24} ${layout.y + 2} v${i % 2 ? 5 : 9}`}
              className="stroke-muted-foreground"
            />
          ))}
          <g opacity={phase >= 2 || phase === 0 ? 1 : 0.35}>
            <Page
              x={layout.x + 28}
              y={layout.y + 20}
              w={layout.w - 56}
              h={140}
              image={image}
              guides
            />
          </g>
          {phase === 2 && (
            <path
              d={`M${layout.x + 10} ${layout.y + 50} h${layout.w - 20}`}
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
        </g>
        <g data-actor-id="objects">
          {title(
            "objects",
            "PDF 객체 작업대",
            phase >= 4 ? "리소스 준비 · 압축" : "명령과 리소스 참조",
          )}
          <rect
            x={objects.x}
            y={objects.y}
            width={objects.w}
            height={objects.h}
            rx={6}
            className="fill-card"
            stroke={stroke("objects")}
            strokeWidth={active("objects") ? 2.5 : 1.5}
          />
          {(image
            ? [
                "이미지 XObject",
                ocr ? "OCR 텍스트" : "텍스트 없음",
                "페이지 명령",
              ]
            : ["텍스트 · 글꼴", "벡터 경로", "이미지 XObject"]
          ).map((label, i) => (
            <g key={label} opacity={phase >= 3 || phase === 0 ? 1 : 0.4}>
              <path
                d={`M${objects.x + 14} ${objects.y + 15 + i * 42} h${objects.w - 32} v30 h-${objects.w - 32} Z`}
                className="fill-background"
                stroke={
                  image && !ocr && i === 1
                    ? "hsl(var(--border))"
                    : (image
                        ? ["#10b981", "#3b82f6", "#8b5cf6"]
                        : ["#3b82f6", "#8b5cf6", "#10b981"])[i]
                }
                strokeWidth={1.5}
                strokeDasharray={image && !ocr && i === 1 ? "3 3" : undefined}
              />
              <Text
                x={objects.x + 23}
                y={objects.y + 35 + i * 42}
                small
                muted={image && !ocr && i === 1}
              >
                {label}
              </Text>
            </g>
          ))}
          <text
            x={objects.x + objects.w / 2}
            y={objects.y + 158}
            textAnchor="middle"
            fontSize={12}
            className="fill-muted-foreground"
          >
            {phase >= 4
              ? image
                ? "이미지 인코딩 · 압축"
                : "글꼴 서브셋 · 압축"
              : compact
                ? "콘텐츠 → 리소스"
                : "Content → Resources"}
          </text>
        </g>
        <g data-actor-id="file">
          {title(
            "file",
            "저장된 PDF",
            outputReady
              ? compact
                ? "xref로 객체 탐색"
                : "객체 위치를 xref로 탐색"
              : "구조를 기록할 파일",
          )}
          <path
            d={`M${file.x} ${file.y} H${file.x + file.w - 22} L${file.x + file.w} ${file.y + 22} V${file.y + file.h} H${file.x} Z`}
            className="fill-card"
            stroke={stroke("file")}
            strokeWidth={active("file") ? 2.5 : 1.5}
          />
          <path
            d={`M${file.x + file.w - 22} ${file.y} V${file.y + 22} H${file.x + file.w}`}
            className="fill-muted stroke-border"
          />
          <Text x={file.x + 12} y={file.y + 25}>
            %PDF
          </Text>
          {[
            "Catalog → Pages",
            "Page → Contents",
            "Resources · 객체",
            "xref · trailer",
          ].map((label, i) => (
            <g key={label} opacity={outputReady || phase === 0 ? 1 : 0.35}>
              <rect
                x={file.x + 12}
                y={file.y + 37 + i * 29}
                width={file.w - 24}
                height={23}
                rx={3}
                className="fill-background stroke-border"
              />
              <Text x={file.x + 19} y={file.y + 53 + i * 29} small>
                {label}
              </Text>
            </g>
          ))}
        </g>
        <g data-actor-id="viewer">
          {title(
            "viewer",
            "PDF 뷰어",
            phase >= 6
              ? image && !ocr
                ? compact
                  ? "이미지 · 검색 불가"
                  : "이미지 표시 · 글자 검색 없음"
                : "페이지 표시 · 글자 검색"
              : "파일을 읽어 화면에 그리기",
          )}
          <rect
            x={viewer.x}
            y={viewer.y}
            width={viewer.w}
            height={viewer.h - 12}
            rx={6}
            className="fill-card"
            stroke={stroke("viewer")}
            strokeWidth={active("viewer") ? 2.5 : 1.5}
          />
          <path
            d={`M${viewer.x + viewer.w / 2} ${viewer.y + viewer.h - 12} v12 m-30 0 h60`}
            className="stroke-muted-foreground"
            strokeWidth={3}
          />
          <path
            d={`M${viewer.x} ${viewer.y + 22} h${viewer.w}`}
            className="stroke-border"
          />
          <Text x={viewer.x + 10} y={viewer.y + 16} small muted>
            {phase >= 8 ? "서명 검증 · 예시" : "문서.pdf"}
          </Text>
          {phase >= 6 || phase === 0 ? (
            <Page
              x={viewer.x + 35}
              y={viewer.y + 30}
              w={viewer.w - 70}
              h={115}
              image={image}
            />
          ) : (
            <Text
              x={viewer.x + viewer.w / 2}
              y={viewer.y + 91}
              center
              small
              muted
            >
              렌더링 대기
            </Text>
          )}
          {image && ocr && phase >= 6 && (
            <g>
              <rect
                x={viewer.x + 30}
                y={viewer.y + 105}
                width={viewer.w - 60}
                height={25}
                rx={3}
                className="fill-card"
                stroke="#3b82f6"
              />
              <Text x={viewer.x + viewer.w / 2} y={viewer.y + 122} center small>
                검색용 텍스트
              </Text>
            </g>
          )}
          {phase === 8 && (
            <circle
              cx={viewer.x + viewer.w - 18}
              cy={viewer.y + 11}
              r={4}
              fill="#10b981"
            />
          )}
        </g>
        <g data-actor-id="signature" opacity={signed ? 1 : 0.6}>
          <rect
            x={signature.x}
            y={signature.y}
            width={signature.w}
            height={signature.h}
            rx={8}
            className="fill-card"
            stroke={stroke("signature")}
            strokeWidth={active("signature") ? 2.5 : 1.5}
            strokeDasharray={signed ? undefined : "5 5"}
          />
          <path
            d={`M${signature.x + 19} ${signature.y + 20} l15 -6 l15 6 v18 q0 12 -15 18 q-15 -6 -15 -18 Z`}
            fill="none"
            stroke={signed ? "#d97706" : "hsl(var(--muted-foreground))"}
            strokeWidth={2}
          />
          <path
            d={`M${signature.x + 27} ${signature.y + 34} l6 6 l10 -13`}
            fill="none"
            stroke={signed ? "#d97706" : "hsl(var(--muted-foreground))"}
            strokeWidth={2}
          />
          <Text x={signature.x + 64} y={signature.y + 29}>
            {signed ? "선택 · 인증서 기반 전자서명" : "선택 · 변환 후 전자서명"}
          </Text>
          <Text x={signature.x + 64} y={signature.y + 52} small muted>
            {compact
              ? signed
                ? "해시 · 개인키 서명 · 수신자 검증"
                : "위변조 검증이 필요하면 위에서 선택"
              : signed
                ? "최종 PDF → 개인키 기반 서명 → 수신자가 무결성·인증서·변경 상태 확인"
                : "PDF 변환은 모양 보존 · 위변조 검증은 서명과 원본 대조 등 별도 절차"}
          </Text>
          {compact && (
            <Text x={signature.x + 64} y={signature.y + 75} small muted>
              내용 자체의 진실성 보장은 아님
            </Text>
          )}
        </g>
      </svg>
      <div
        role="group"
        aria-label="PDF 변환 단계 선택"
        className="flex flex-wrap gap-1.5 px-3"
      >
        <button
          type="button"
          onClick={() => selectFrame(null)}
          aria-pressed={stepIndex === null}
          className={`rounded-md border px-2.5 py-2 text-xs ${stepIndex === null ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
        >
          전체
        </button>
        {spec.steps.map((s, i) => (
          <button
            type="button"
            key={s.title}
            onClick={() => selectFrame(i)}
            aria-pressed={stepIndex === i}
            className={`rounded-md border px-2.5 py-2 text-xs ${stepIndex === i ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
          >
            {i + 1}.{" "}
            {
              [
                "해석",
                "배치",
                "객체",
                "리소스",
                "저장",
                "열람",
                "서명",
                "검증",
              ][i]
            }
          </button>
        ))}
      </div>
    </div>
  );
}
