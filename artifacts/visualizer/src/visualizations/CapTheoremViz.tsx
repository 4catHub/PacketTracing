import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

const CAP_ROWS = [
  { id: "c", title: "Consistency (C)" },
  { id: "a", title: "Availability (A)" },
  { id: "p", title: "Partition Tolerance (P)" },
  { id: "cp", title: "CP System (C + P)" },
  { id: "ap", title: "AP System (A + P)" },
];

export default function CapTheoremViz({ activeStep }: { activeStep?: number }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [tick, setTick] = useState(0);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTick((prev) => (prev + 1) % 100);
      }, 50); // 5 seconds full cycle
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleReset = () => {
    setTick(0);
  };

  useEffect(() => {
    if (activeStep !== undefined && activeStep >= 0 && activeStep < CAP_ROWS.length) {
      setActiveRowId(CAP_ROWS[activeStep].id);
    } else {
      setActiveRowId(null);
    }
  }, [activeStep]);

  return (
    <div className="w-full flex flex-col gap-4 bg-slate-50 dark:bg-zinc-900 rounded-xl p-4 sm:p-6 overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} className="text-slate-700 dark:text-zinc-200" /> : <Play size={18} className="text-slate-700 dark:text-zinc-200" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
            title="Reset"
          >
            <RotateCcw size={18} className="text-slate-700 dark:text-zinc-200" />
          </button>
        </div>
        <div className="flex gap-2 text-sm overflow-x-auto pb-1 hide-scrollbar">
          {CAP_ROWS.map((row) => (
            <button
              key={row.id}
              onClick={() => setActiveRowId(row.id === activeRowId ? null : row.id)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                activeRowId === row.id
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800"
                  : "bg-slate-100 text-slate-600 dark:bg-zinc-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-600"
              }`}
            >
              {row.title}
            </button>
          ))}
        </div>
      </div>

      <svg width="0" height="0" className="hidden">
        <defs>
          {['slate', 'blue', 'green', 'red', 'orange'].map(c => (
            <marker key={c} id={`arrow-${c}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" className={
                c === 'slate' ? 'fill-slate-300 dark:fill-zinc-600' :
                c === 'blue' ? 'fill-blue-400' :
                c === 'green' ? 'fill-emerald-400' :
                c === 'orange' ? 'fill-orange-400' : 'fill-red-400'
              } />
            </marker>
          ))}
        </defs>
      </svg>

      <div className="flex flex-col gap-4">
        <CapRow type="c" tick={tick} isActive={activeRowId === "c" || activeRowId === null} />
        <CapRow type="a" tick={tick} isActive={activeRowId === "a" || activeRowId === null} />
        <CapRow type="p" tick={tick} isActive={activeRowId === "p" || activeRowId === null} />
        <CapRow type="cp" tick={tick} isActive={activeRowId === "cp" || activeRowId === null} />
        <CapRow type="ap" tick={tick} isActive={activeRowId === "ap" || activeRowId === null} />
      </div>
    </div>
  );
}

function CapRow({ type, tick, isActive }: { type: string; tick: number; isActive: boolean }) {
  if (!isActive) return null;

  const getTitle = () => {
    switch (type) {
      case "c": return "일관성 (Consistency): 모든 노드가 동시 시점에 항상 동일한 최신 데이터(V2)를 반환합니다.";
      case "a": return "가용성 (Availability): 일부 노드가 장애(Down) 상태라도 모든 요청은 항상 비오류 응답을 반환합니다.";
      case "p": return "분할 허용성 (Partition Tolerance): 노드 간 네트워크가 단선되어 통신이 끊겨도 시스템 가동을 유지합니다.";
      case "cp": return "CP 시스템: 네트워크 분할 시 가용성을 포기하고 일관성을 보장합니다 (동기화 안 된 노드 읽기 시 500 에러 차단).";
      case "ap": return "AP 시스템: 네트워크 분할 시 일관성을 유예하고 가용성을 보장합니다 (구버전 데이터 V1이라도 200 OK 반환).";
      default: return "";
    }
  };

  const w = 600;
  const h = 260;
  const cX = 100;
  const nAX = 300;
  const nBX = 500;
  const topY = 40;
  const bottomY = 240;

  const cycle = (tick % 100) / 100;

  return (
    <div className="w-full bg-white dark:bg-zinc-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-700">
      <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-100 mb-4">{getTitle()}</h4>
      <div className="relative w-full overflow-x-auto hide-scrollbar">
        <div className="min-w-[600px] w-full max-w-3xl mx-auto flex justify-center">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto max-h-[400px]">
            {/* Lifelines */}
            <Lifeline x={cX} topY={topY} bottomY={bottomY} label="Client" isClient />
            <Lifeline x={nAX} topY={topY} bottomY={bottomY} label="Node A" isDown={type === "a"} />
            <Lifeline x={nBX} topY={topY} bottomY={bottomY} label="Node B" />

            {/* Partitions */}
            {(type === "p" || type === "cp" || type === "ap") && (
              <PartitionBoundary x={400} topY={topY + 30} bottomY={bottomY} />
            )}

            {/* Animations */}
            {type === "c" && <ConsistencySeq cycle={cycle} cX={cX} nAX={nAX} nBX={nBX} />}
            {type === "a" && <AvailabilitySeq cycle={cycle} cX={cX} nAX={nAX} nBX={nBX} />}
            {type === "p" && <PartitionSeq cycle={cycle} cX={cX} nAX={nAX} nBX={nBX} />}
            {type === "cp" && <CpSeq cycle={cycle} cX={cX} nAX={nAX} nBX={nBX} />}
            {type === "ap" && <ApSeq cycle={cycle} cX={cX} nAX={nAX} nBX={nBX} />}
          </svg>
        </div>
      </div>
    </div>
  );
}

function Lifeline({ x, topY, bottomY, label, isClient = false, isDown = false }: any) {
  const boxW = 70;
  const boxH = 30;
  
  return (
    <g>
      <line 
        x1={x} y1={topY + boxH / 2} 
        x2={x} y2={bottomY} 
        stroke={isDown ? "#ef4444" : "currentColor"} 
        strokeWidth={isDown ? "3" : "2"} 
        strokeDasharray={isDown ? "none" : "4 4"} 
        className={isDown ? "" : "text-slate-300 dark:text-zinc-600"} 
      />
      {isDown && (
        <text x={x} y={topY + boxH + 30} textAnchor="middle" className="fill-red-500 font-bold text-[14px]">
          [DOWN]
        </text>
      )}
      <rect 
        x={x - boxW / 2} y={topY - boxH / 2} 
        width={boxW} height={boxH} rx="4"
        className={isClient ? "fill-blue-100 stroke-blue-500 dark:fill-blue-900" : (isDown ? "fill-red-100 stroke-red-500 dark:fill-red-900" : "fill-emerald-100 stroke-emerald-500 dark:fill-emerald-900")}
        strokeWidth="2"
      />
      <text x={x} y={topY + 1} textAnchor="middle" dominantBaseline="middle" className="text-xs font-semibold fill-slate-800 dark:fill-slate-200">
        {label}
      </text>
    </g>
  );
}

function PartitionBoundary({ x, topY, bottomY }: any) {
  return (
    <g>
      <line x1={x} y1={topY} x2={x} y2={bottomY} stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" />
      <rect x={x - 65} y={topY - 15} width="130" height="24" rx="12" className="fill-red-100 dark:fill-red-900/50 stroke-red-500" strokeWidth="1.5" />
      <text x={x} y={topY - 2} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-red-600 dark:fill-red-400">
        ⚡ Network Partition
      </text>
    </g>
  );
}

function SeqArrow({ x1, x2, y, label, dashed = false, color = "slate", hideLabel = false }: any) {
  const colorMap = {
    slate: "text-slate-300 dark:text-zinc-600",
    blue: "text-blue-400 dark:text-blue-500",
    green: "text-emerald-400 dark:text-emerald-500",
    red: "text-red-400 dark:text-red-500",
    orange: "text-orange-400 dark:text-orange-500"
  };
  const strokeClass = colorMap[color as keyof typeof colorMap] || colorMap.slate;
  
  return (
    <g>
      <line 
        x1={x1} y1={y} x2={x2} y2={y} 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeDasharray={dashed ? "4 4" : "none"} 
        markerEnd={`url(#arrow-${color})`}
        className={strokeClass} 
      />
      {!hideLabel && (
        <text x={(x1 + x2) / 2} y={y - 6} textAnchor="middle" className="text-[10px] font-medium fill-slate-500 dark:fill-slate-400">
          {label}
        </text>
      )}
    </g>
  );
}

function SeqPacket({ x, y, label, color = "blue", show = true }: any) {
  if (!show) return null;
  const colors = {
    blue: "bg-blue-500 text-white",
    green: "bg-emerald-500 text-white",
    red: "bg-red-500 text-white",
    orange: "bg-orange-500 text-white",
  };
  const colorClass = colors[color as keyof typeof colors] || colors.blue;
  return (
    <foreignObject x={x - 35} y={y - 12} width="70" height="24">
      <div className={`flex items-center justify-center w-full h-full text-[10px] font-bold rounded-full ${colorClass} shadow-md border border-white/20`}>
        {label}
      </div>
    </foreignObject>
  );
}

function ConsistencySeq({ cycle, cX, nAX, nBX }: any) {
  const y1 = 80, y2 = 110, y3 = 140, y4 = 170, y5 = 200;
  
  let pX = cX, pY = y1, label = "", color = "blue", show = false;
  if (cycle < 0.2) {
    show = true; pX = cX + (nAX - cX) * (cycle / 0.2); label = "Write(V2)"; pY = y1;
  } else if (cycle < 0.4) {
    show = true; pX = nAX + (nBX - nAX) * ((cycle - 0.2) / 0.2); label = "Sync(V2)"; pY = y2;
  } else if (cycle < 0.6) {
    show = true; pX = nBX - (nBX - nAX) * ((cycle - 0.4) / 0.2); label = "ACK"; color = "green"; pY = y3;
  } else if (cycle < 0.8) {
    show = true; pX = cX + (nBX - cX) * ((cycle - 0.6) / 0.2); label = "Read"; pY = y4;
  } else {
    show = true; pX = nBX - (nBX - cX) * ((cycle - 0.8) / 0.2); label = "200 OK(V2)"; color = "green"; pY = y5;
  }

  return (
    <>
      <SeqArrow x1={cX} x2={nAX} y={y1} label="Write(V2)" />
      <SeqArrow x1={nAX} x2={nBX} y={y2} label="Sync(V2)" />
      <SeqArrow x1={nBX} x2={nAX} y={y3} label="ACK" dashed color="green" />
      <SeqArrow x1={cX} x2={nBX} y={y4} label="Read" />
      <SeqArrow x1={nBX} x2={cX} y={y5} label="200 OK (V2)" dashed color="green" />
      <SeqPacket x={pX} y={pY} label={label} color={color} show={show} />
    </>
  );
}

function AvailabilitySeq({ cycle, cX, nAX, nBX }: any) {
  const y1 = 120, y2 = 180;
  let pX = cX, pY = y1, label = "", color = "blue", show = false;
  if (cycle < 0.5) {
    show = true; pX = cX + (nBX - cX) * (cycle / 0.5); label = "Read"; pY = y1;
  } else {
    show = true; pX = nBX - (nBX - cX) * ((cycle - 0.5) / 0.5); label = "200 OK(V1)"; color = "green"; pY = y2;
  }

  return (
    <>
      <SeqArrow x1={cX} x2={nBX} y={y1} label="Read" />
      <SeqArrow x1={nBX} x2={cX} y={y2} label="200 OK (V1)" dashed color="green" />
      <SeqPacket x={pX} y={pY} label={label} color={color} show={show} />
    </>
  );
}

function PartitionSeq({ cycle, cX, nAX, nBX }: any) {
  const y1 = 120;
  const pBound = 400;
  let pX = nAX, pY = y1, label = "", color = "blue", show = false;
  let showX = false;

  if (cycle < 0.4) {
    show = true; 
    let progress = cycle / 0.4;
    pX = nAX + (pBound - nAX) * progress; 
    label = "Sync(V2)";
    if (progress > 0.95) showX = true;
  } else {
    showX = true;
  }

  return (
    <>
      <SeqArrow x1={nAX} x2={pBound} y={y1} label="Sync(V2)" />
      {showX && <text x={pBound} y={y1 + 5} textAnchor="middle" className="text-xl font-bold fill-red-500">X</text>}
      <SeqPacket x={pX} y={pY} label={label} color={color} show={show} />
    </>
  );
}

function CpSeq({ cycle, cX, nAX, nBX }: any) {
  const y1 = 80, y2 = 120, y3 = 160, y4 = 200;
  const pBound = 400;
  
  let pX = cX, pY = y1, label = "", color = "blue", show = false, showX = false;
  if (cycle < 0.25) {
    show = true; pX = cX + (nAX - cX) * (cycle / 0.25); label = "Write(V2)"; pY = y1;
  } else if (cycle < 0.5) {
    show = true; 
    let prog = (cycle - 0.25) / 0.25;
    pX = nAX + (pBound - nAX) * prog; label = "Sync(V2)"; pY = y2;
    if (prog > 0.95) showX = true;
  } else if (cycle < 0.75) {
    showX = true;
    show = true; pX = cX + (nBX - cX) * ((cycle - 0.5) / 0.25); label = "Read"; pY = y3;
  } else {
    showX = true;
    show = true; pX = nBX - (nBX - cX) * ((cycle - 0.75) / 0.25); label = "500 Error"; color = "red"; pY = y4;
  }

  return (
    <>
      <SeqArrow x1={cX} x2={nAX} y={y1} label="Write(V2)" />
      <SeqArrow x1={nAX} x2={pBound} y={y2} label="Sync(V2)" />
      <SeqArrow x1={cX} x2={nBX} y={y3} label="Read" />
      <SeqArrow x1={nBX} x2={cX} y={y4} label="500 Error" dashed color="red" />
      {showX && <text x={pBound} y={y2 + 5} textAnchor="middle" className="text-xl font-bold fill-red-500">X</text>}
      <SeqPacket x={pX} y={pY} label={label} color={color} show={show} />
    </>
  );
}

function ApSeq({ cycle, cX, nAX, nBX }: any) {
  const y1 = 80, y2 = 120, y3 = 160, y4 = 200;
  const pBound = 400;
  
  let pX = cX, pY = y1, label = "", color = "blue", show = false, showX = false;
  if (cycle < 0.25) {
    show = true; pX = cX + (nAX - cX) * (cycle / 0.25); label = "Write(V2)"; pY = y1;
  } else if (cycle < 0.5) {
    show = true; 
    let prog = (cycle - 0.25) / 0.25;
    pX = nAX + (pBound - nAX) * prog; label = "Sync(V2)"; pY = y2;
    if (prog > 0.95) showX = true;
  } else if (cycle < 0.75) {
    showX = true;
    show = true; pX = cX + (nBX - cX) * ((cycle - 0.5) / 0.25); label = "Read"; pY = y3;
  } else {
    showX = true;
    show = true; pX = nBX - (nBX - cX) * ((cycle - 0.75) / 0.25); label = "200 OK(V1)"; color = "orange"; pY = y4;
  }

  return (
    <>
      <SeqArrow x1={cX} x2={nAX} y={y1} label="Write(V2)" />
      <SeqArrow x1={nAX} x2={pBound} y={y2} label="Sync(V2)" />
      <SeqArrow x1={cX} x2={nBX} y={y3} label="Read" />
      <SeqArrow x1={nBX} x2={cX} y={y4} label="200 OK (V1)" dashed color="orange" />
      {showX && <text x={pBound} y={y2 + 5} textAnchor="middle" className="text-xl font-bold fill-red-500">X</text>}
      <SeqPacket x={pX} y={pY} label={label} color={color} show={show} />
    </>
  );
}
