import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

type Side = "sender" | "receiver";
type LayerId = "application" | "transport" | "internet" | "access";
type PacketPart = "file" | "tls" | "tcp" | "ip" | "frame";

type FlowStep = {
  side: Side;
  layer?: LayerId;
  status: string;
  unit: string;
  packet: PacketPart[];
  point: { x: number; y: number };
  moment?: "attach" | "open";
};

const LAYERS: Array<{ id: LayerId; tcpip: string; osi: string; color: string }> = [
  { id: "application", tcpip: "Application", osi: "OSI 5 · 6 · 7", color: "#2563eb" },
  { id: "transport", tcpip: "Transport", osi: "OSI 4", color: "#f97316" },
  { id: "internet", tcpip: "Internet", osi: "OSI 3", color: "#7c3aed" },
  { id: "access", tcpip: "Network Access", osi: "OSI 1 · 2", color: "#0f766e" },
];

const FLOW: FlowStep[] = [
  { side: "sender", status: "OSI/TCP-IP 안내 파일 첨부", unit: "File chunk", packet: ["file"], point: { x: 110, y: 98 }, moment: "attach" },
  { side: "sender", layer: "application", status: "메신저 요청 · TLS 보호", unit: "TLS record", packet: ["tls", "file"], point: { x: 142, y: 164 } },
  { side: "sender", layer: "transport", status: "파일 조각에 순서 부여", unit: "TCP segment", packet: ["tcp", "tls", "file"], point: { x: 142, y: 234 } },
  { side: "sender", layer: "internet", status: "목적지 IP와 경로 결정", unit: "IP packet", packet: ["ip", "tcp", "tls", "file"], point: { x: 142, y: 304 } },
  { side: "sender", layer: "access", status: "Wi‑Fi 프레임으로 전송", unit: "Wi‑Fi frame", packet: ["frame", "ip", "tcp", "tls", "file"], point: { x: 480, y: 451 } },
  { side: "receiver", layer: "access", status: "수신 링크에서 프레임 도착", unit: "Wi‑Fi frame", packet: ["frame", "ip", "tcp", "tls", "file"], point: { x: 818, y: 375 } },
  { side: "receiver", layer: "internet", status: "수신자 IP 확인", unit: "IP packet", packet: ["ip", "tcp", "tls", "file"], point: { x: 818, y: 304 } },
  { side: "receiver", layer: "transport", status: "TCP 세그먼트 재조립", unit: "TCP segment", packet: ["tcp", "tls", "file"], point: { x: 818, y: 234 } },
  { side: "receiver", layer: "application", status: "메신저에 파일 수신", unit: "TLS record", packet: ["tls", "file"], point: { x: 818, y: 164 } },
  { side: "receiver", status: "OSI/TCP-IP 안내 파일 열기", unit: "Restored file", packet: ["file"], point: { x: 850, y: 98 }, moment: "open" },
];

const PARTS: Record<PacketPart, { short: string; color: string; width: number }> = {
  frame: { short: "FRAME", color: "#0f766e", width: 62 },
  ip: { short: "PACKET", color: "#7c3aed", width: 72 },
  tcp: { short: "SEGMENT", color: "#f97316", width: 78 },
  tls: { short: "RECORD", color: "#2563eb", width: 68 },
  file: { short: "CHUNK", color: "#16a34a", width: 64 },
};

export default function MessengerFileTransferViz() {
  const [activeStep, setActiveStep] = useState(0);
  const step = FLOW[activeStep];
  const activeLayer = useMemo(() => LAYERS.find((layer) => layer.id === step.layer), [step.layer]);
  const isReceiving = step.side === "receiver";

  useEffect(() => {
    const delay = activeStep === FLOW.length - 1 ? 3000 : 2200;
    const timer = window.setTimeout(() => setActiveStep((current) => (current + 1) % FLOW.length), delay);
    return () => window.clearTimeout(timer);
  }, [activeStep]);

  return (
    <section className="relative left-1/2 w-[calc(100vw-2rem)] max-w-[1180px] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm" data-testid="messenger-file-transfer-viz">
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/20 px-4 py-3 text-xs font-semibold text-muted-foreground sm:px-5">
        <span className="inline-flex h-2 w-2 rounded-full bg-primary" /> OSI 7계층 ↔ TCP/IP 4계층 · 메신저 파일 전송
      </div>

      <div className="p-3 sm:p-7">
        <svg viewBox="0 0 960 520" role="img" aria-label="발신자와 수신자의 TCP IP 계층을 통과하는 사내 메신저 파일 전송 과정" className="block w-full select-none overflow-visible">
          <defs>
            <filter id="packet-shadow" x="-50%" y="-80%" width="200%" height="260%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.2" />
            </filter>
          </defs>

          <text x="142" y="31" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="14" fontWeight="800">👩🏻‍💻 민지 · 발신</text>
          <text x="818" y="31" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="14" fontWeight="800">👨🏻‍💻 준호 · 수신</text>

          <MessageMoment side="sender" active={step.moment === "attach"} />
          <MessageMoment side="receiver" active={step.moment === "open"} />
          <LayerStack side="sender" activeLayer={step.side === "sender" ? step.layer : undefined} faded={isReceiving} />
          <LayerStack side="receiver" activeLayer={step.side === "receiver" ? step.layer : undefined} faded={!isReceiving} />

          <path d="M 142 425 C 260 425, 350 451, 430 451" fill="none" stroke="currentColor" className="text-teal-300 dark:text-teal-800" strokeWidth="3" strokeDasharray="5 7" />
          <path d="M 530 451 C 610 451, 700 425, 818 425" fill="none" stroke="currentColor" className="text-teal-300 dark:text-teal-800" strokeWidth="3" strokeDasharray="5 7" />

          <ScenarioPanel step={step} activeLayer={activeLayer} />
          <ServerNode />

          <motion.g initial={false} animate={{ x: step.point.x, y: step.point.y }} transition={{ type: "spring", stiffness: 56, damping: 16 }}>
            <Packet parts={step.packet} />
          </motion.g>
        </svg>
      </div>
    </section>
  );
}

function LayerStack({ side, activeLayer, faded }: { side: Side; activeLayer?: LayerId; faded: boolean }) {
  const x = side === "sender" ? 30 : 706;
  const direction = side === "sender" ? "캡슐화 ↓" : "역캡슐화 ↑";

  return <g>
    <text x={x + 112} y="112" textAnchor="middle" fill="currentColor" className="fill-muted-foreground" fontSize="10" fontWeight="700">{direction}</text>
    {LAYERS.map((layer, index) => {
      const y = 135 + index * 70;
      const isActive = activeLayer === layer.id;
      return <motion.g key={`${side}-${layer.id}`} animate={{ opacity: faded ? 0.42 : 1 }} transition={{ duration: 0.35 }}>
        <rect x={x} y={y} width="224" height="58" rx="13" fill="hsl(var(--card))" stroke={isActive ? layer.color : "hsl(var(--border))"} strokeWidth={isActive ? 2.5 : 1.2} />
        {isActive && <motion.rect initial={{ opacity: 0 }} animate={{ opacity: 0.12 }} x={x} y={y} width="224" height="58" rx="13" fill={layer.color} />}
        <rect x={x + 12} y={y + 12} width="6" height="34" rx="3" fill={layer.color} opacity={isActive ? 1 : 0.42} />
        <text x={x + 32} y={y + 27} fill="currentColor" className={isActive ? "fill-foreground" : "fill-muted-foreground"} fontSize="12" fontWeight="800">{layer.tcpip}</text>
        <text x={x + 32} y={y + 43} fill="currentColor" className="fill-muted-foreground" fontSize="9.5">{layer.osi}</text>
        {isActive && <text x={x + 205} y={y + 34} textAnchor="end" fill={layer.color} fontSize="13" fontWeight="800">●</text>}
      </motion.g>;
    })}
  </g>;
}

function MessageMoment({ side, active }: { side: Side; active: boolean }) {
  const x = side === "sender" ? 110 : 850;
  const label = side === "sender" ? "💬  osi-7-tcpip-4-layers.pdf 첨부" : "📄  osi-7-tcpip-4-layers.pdf 열기";
  return <motion.g animate={{ opacity: active ? 1 : 0.38, scale: active ? 1 : 0.96 }} transition={{ duration: 0.3 }}>
    <rect x={x - 86} y="57" width="172" height="35" rx="11" fill="hsl(var(--muted))" stroke={active ? "#16a34a" : "hsl(var(--border))"} strokeWidth={active ? 1.8 : 1} />
    <text x={x} y="79" textAnchor="middle" fill="currentColor" className="fill-muted-foreground" fontSize="7.2" fontWeight="700">{label}</text>
  </motion.g>;
}

function ScenarioPanel({ step, activeLayer }: { step: FlowStep; activeLayer?: { color: string } }) {
  return <g transform="translate(280, 120)">
    <rect width="400" height="225" rx="20" fill="hsl(var(--muted))" stroke={activeLayer?.color ?? "hsl(var(--border))"} strokeWidth="1.5" />
    <text x="200" y="34" textAnchor="middle" fill="currentColor" className="fill-muted-foreground" fontSize="12" fontWeight="800">CURRENT TRANSFER STATE</text>
    <motion.text key={step.status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} x="200" y="68" textAnchor="middle" fill="currentColor" className="fill-foreground" fontSize="16" fontWeight="800">{step.status}</motion.text>
    <line x1="22" y1="88" x2="378" y2="88" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="200" y="120" textAnchor="middle" fill={activeLayer?.color ?? "hsl(var(--muted-foreground))"} fontSize="14" fontWeight="800">{step.unit}</text>
    <DataUnitStrip parts={step.packet} x={200} y={154} />
    <text x="200" y="197" textAnchor="middle" fill="currentColor" className="fill-muted-foreground" fontSize="11">색상은 바깥으로 추가되는 데이터 단위를 뜻합니다</text>
  </g>;
}

function ServerNode() {
  return <g transform="translate(480, 451)">
    <circle r="38" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1.5" />
    <text x="0" y="-4" textAnchor="middle" fontSize="21">💬</text>
    <text x="0" y="14" textAnchor="middle" fill="currentColor" className="fill-muted-foreground" fontSize="8.5" fontWeight="700">FILE SERVER</text>
  </g>;
}

function Packet({ parts }: { parts: PacketPart[] }) {
  return <g filter="url(#packet-shadow)">
    {parts.map((part, index) => {
      const width = 106 - index * 12;
      const height = 42 - index * 4;
      const spec = PARTS[part];
      return <motion.g key={part} initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.06 }}>
        <rect x={-width / 2} y={-height / 2} width={width} height={height} rx="9" fill={spec.color} />
        {index === parts.length - 1 && <text x="0" y="3.5" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="9" fontWeight="800">{spec.short}</text>}
      </motion.g>;
    })}
  </g>;
}

function DataUnitStrip({ parts, x, y }: { parts: PacketPart[]; x: number; y: number }) {
  const width = parts.reduce((sum, part) => sum + PARTS[part].width, 0);
  let cursor = x - width / 2;
  return <g>
    {parts.map((part) => {
      const spec = PARTS[part];
      const center = cursor + spec.width / 2;
      cursor += spec.width;
      return <g key={part}>
        <rect x={center - spec.width / 2} y={y - 14} width={spec.width - 2} height="28" rx="5" fill={spec.color} />
        <text x={center} y={y + 3.5} textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize={part === "tcp" ? "8" : "9"} fontWeight="800">{spec.short}</text>
      </g>;
    })}
  </g>;
}
