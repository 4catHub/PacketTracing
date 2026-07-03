import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { contentData } from "@/data/content";

// TAB labels for user to switch scenarios directly
const TAB_LABELS = [
  "SPOF (Legacy)",
  "Spike (Legacy)",
  "YAML Deploy",
  "Self-Healing",
  "HPA Scaling",
  "Rolling Update"
];

// Rich, detailed descriptions for each step to supplement the concise steps in content.ts
const STEP_DETAILS = [
  "쿠버네티스가 적용되기 전, 단일 호스트 서버로 서비스를 운영하는 구조입니다. 이 상황에서 서버 프로세스 장애나 하드웨어 장애(SPOF)가 발생하면, 트래픽을 처리할 대체 서버가 없으므로 전체 서비스가 즉시 중단(Down)됩니다. 관리자가 수동으로 개입하여 복구하기 전까지 긴 다운타임이 발생합니다.",
  "트래픽이 급증(Traffic Spike)하여 단일 legacy 서버의 자원(CPU/RAM)이 고갈되는 시나리오입니다. 자동 복구나 스케일아웃 메커니즘이 없으므로 부하 분산이 되지 않아 응답 지연(High Latency) 및 타임아웃이 발생하고 서버가 완전히 다운될 위험에 노출됩니다.",
  "Kubernetes 클러스터를 구축하고 선언적 명세(Deployment YAML)를 API 서버에 전달하는 단계입니다. 마스터 노드의 Control Plane이 원하는 상태(Replicas: 3)를 수신하고, 이에 따라 워커 노드에 3개의 동일한 Pod를 자동으로 생성하여 서비스를 개시합니다.",
  "동작 중인 Pod 1개에 장애가 발생한 상황입니다. Kubernetes의 kubelet이 장애를 즉시 감지하여 Control Plane에 보고하고, 마스터 노드는 즉각 해당 Pod를 제거한 뒤 새로운 Pod를 재생성(Self-Healing)합니다. 복구되는 동안 Service(로드밸런서)는 정상 작동 중인 타 Pod들로 트래픽을 자동 우회하여 다운타임을 제로(Zero)로 만듭니다.",
  "트래픽 급증을 HPA(Horizontal Pod Autoscaler)가 실시간 모니터링하는 과정입니다. Pod들의 평균 CPU 사용량이 설정 임계치(70%)를 초과하면, HPA 컨트롤러가 복제본(Replicas) 개수를 3개에서 5개로 자동 확장(Scale-out)합니다. 신규 Pod들이 실행 완료되면 로드밸런서가 부하를 넓게 분산시켜 전체 클러스터 상태가 다시 안정화됩니다.",
  "애플리케이션을 v1.0에서 v2.0으로 무중단 업데이트(Rolling Update)하는 과정입니다. 기존 Pod를 순차적으로 1개씩 제거하면서 신규 v2.0 Pod를 띄웁니다. 업데이트 중에도 구버전과 신버전이 공존하며 트래픽을 지속 처리하므로 사용자 연결 중단 없이 안전하게 최신 버전을 배포할 수 있습니다."
];

interface NodeMetric {
  name: string;
  status: "Running" | "Failed" | "Restarting" | "Pending" | "Terminating" | "None";
  version: string;
  cpu: string;
  ram: string;
  isK8s: boolean;
}

export default function K8sViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [subStep, setSubStep] = useState(0);

  // Sync with steps from content.ts
  const k8sContent = contentData.find((item) => item.slug === "k8s-before-after");
  const steps = k8sContent?.steps ?? [];
  const total = steps.length;

  // Auto play & Substep scheduling logic
  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 5500; // 5.5 seconds per step
    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // Auto-cycle back to step 0 after last step (End-of-Loop Step Dwell)
        setActiveStep(0);
      }
    }, stepDuration);

    return () => clearTimeout(t);
  }, [isPlaying, activeStep, total]);

  // Substep animation timer within each activeStep
  useEffect(() => {
    setSubStep(0);
    let t1: NodeJS.Timeout | undefined;
    let t2: NodeJS.Timeout | undefined;
    let t3: NodeJS.Timeout | undefined;

    if (activeStep === 3) { // Self-Healing
      t1 = setTimeout(() => setSubStep(1), 1800);
      t2 = setTimeout(() => setSubStep(2), 3600);
    } else if (activeStep === 4) { // HPA Scaling
      t1 = setTimeout(() => setSubStep(1), 1800);
      t2 = setTimeout(() => setSubStep(2), 3600);
    } else if (activeStep === 5) { // Rolling Update
      t1 = setTimeout(() => setSubStep(1), 1300);
      t2 = setTimeout(() => setSubStep(2), 2600);
      t3 = setTimeout(() => setSubStep(3), 3900);
    }

    return () => {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      if (t3) clearTimeout(t3);
    };
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(0);
    setSubStep(0);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
      setSubStep(0);
    }
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep > 0) {
      setActiveStep((p) => p - 1);
      setSubStep(0);
    }
  }, [activeStep]);

  // Helper to determine pod / legacy server metrics for HUD
  const getNodeMetrics = (step: number, subStep: number): NodeMetric[] => {
    if (step === 0) {
      return [
        { name: "Legacy Server", status: "Failed", version: "v1.0", cpu: "0%", ram: "0%", isK8s: false }
      ];
    }
    if (step === 1) {
      return [
        { name: "Legacy Server", status: "Failed", version: "v1.0", cpu: "100% 🔥", ram: "98%", isK8s: false }
      ];
    }
    
    const list: NodeMetric[] = [];
    
    // Pod 1
    let p1: NodeMetric = { name: "Pod 1", status: "Running", version: "v1.0", cpu: "28%", ram: "42%", isK8s: true };
    if (step === 3) {
      if (subStep === 0) p1 = { name: "Pod 1", status: "Failed", version: "v1.0", cpu: "0%", ram: "0%", isK8s: true };
      else if (subStep === 1) p1 = { name: "Pod 1", status: "Restarting", version: "v1.0", cpu: "0%", ram: "10%", isK8s: true };
      else p1 = { name: "Pod 1", status: "Running", version: "v1.0", cpu: "15%", ram: "35%", isK8s: true };
    } else if (step === 4) {
      if (subStep === 0) p1 = { name: "Pod 1", status: "Running", version: "v1.0", cpu: "94% 🔥", ram: "85%", isK8s: true };
      else p1 = { name: "Pod 1", status: "Running", version: "v1.0", cpu: "42%", ram: "55%", isK8s: true };
    } else if (step === 5) {
      if (subStep === 0) p1 = { name: "Pod 1", status: "Terminating", version: "v1.0", cpu: "0%", ram: "0%", isK8s: true };
      else p1 = { name: "Pod 1", status: "Running", version: "v2.0", cpu: "20%", ram: "45%", isK8s: true };
    }
    list.push(p1);

    // Pod 2
    let p2: NodeMetric = { name: "Pod 2", status: "Running", version: "v1.0", cpu: "32%", ram: "45%", isK8s: true };
    if (step === 3) {
      p2 = { name: "Pod 2", status: "Running", version: "v1.0", cpu: subStep < 2 ? "48%" : "32%", ram: "52%", isK8s: true };
    } else if (step === 4) {
      if (subStep === 0) p2 = { name: "Pod 2", status: "Running", version: "v1.0", cpu: "91% 🔥", ram: "82%", isK8s: true };
      else p2 = { name: "Pod 2", status: "Running", version: "v1.0", cpu: "46%", ram: "58%", isK8s: true };
    } else if (step === 5) {
      if (subStep === 0) p2 = { name: "Pod 2", status: "Running", version: "v1.0", cpu: "30%", ram: "48%", isK8s: true };
      else if (subStep === 1) p2 = { name: "Pod 2", status: "Terminating", version: "v1.0", cpu: "0%", ram: "0%", isK8s: true };
      else p2 = { name: "Pod 2", status: "Running", version: "v2.0", cpu: "24%", ram: "47%", isK8s: true };
    }
    list.push(p2);

    // Pod 3
    let p3: NodeMetric = { name: "Pod 3", status: "Running", version: "v1.0", cpu: "25%", ram: "40%", isK8s: true };
    if (step === 3) {
      p3 = { name: "Pod 3", status: "Running", version: "v1.0", cpu: subStep < 2 ? "45%" : "25%", ram: "50%", isK8s: true };
    } else if (step === 4) {
      if (subStep === 0) p3 = { name: "Pod 3", status: "Running", version: "v1.0", cpu: "96% 🔥", ram: "88%", isK8s: true };
      else p3 = { name: "Pod 3", status: "Running", version: "v1.0", cpu: "48%", ram: "57%", isK8s: true };
    } else if (step === 5) {
      if (subStep === 0) p3 = { name: "Pod 3", status: "Running", version: "v1.0", cpu: "35%", ram: "49%", isK8s: true };
      else if (subStep === 1) p3 = { name: "Pod 3", status: "Terminating", version: "v1.0", cpu: "0%", ram: "0%", isK8s: true };
      else p3 = { name: "Pod 3", status: "Running", version: "v2.0", cpu: "22%", ram: "45%", isK8s: true };
    }
    list.push(p3);

    // Pod 4
    if (step === 4) {
      if (subStep === 1) {
        list.push({ name: "Pod 4", status: "Pending", version: "v1.0", cpu: "0%", ram: "10%", isK8s: true });
      } else if (subStep === 2) {
        list.push({ name: "Pod 4", status: "Running", version: "v1.0", cpu: "40%", ram: "50%", isK8s: true });
      }
    } else if (step === 5) {
      if (subStep <= 1) {
        list.push({ name: "Pod 4", status: "Running", version: "v1.0", cpu: "25%", ram: "42%", isK8s: true });
      } else if (subStep === 2) {
        list.push({ name: "Pod 4", status: "Terminating", version: "v1.0", cpu: "0%", ram: "0%", isK8s: true });
      } else {
        list.push({ name: "Pod 4", status: "Running", version: "v2.0", cpu: "24%", ram: "46%", isK8s: true });
      }
    }

    // Pod 5
    if (step === 4) {
      if (subStep === 1) {
        list.push({ name: "Pod 5", status: "Pending", version: "v1.0", cpu: "0%", ram: "10%", isK8s: true });
      } else if (subStep === 2) {
        list.push({ name: "Pod 5", status: "Running", version: "v1.0", cpu: "43%", ram: "52%", isK8s: true });
      }
    } else if (step === 5) {
      if (subStep <= 1) {
        list.push({ name: "Pod 5", status: "Running", version: "v1.0", cpu: "28%", ram: "44%", isK8s: true });
      } else if (subStep === 2) {
        list.push({ name: "Pod 5", status: "Terminating", version: "v1.0", cpu: "0%", ram: "0%", isK8s: true });
      } else {
        list.push({ name: "Pod 5", status: "Running", version: "v2.0", cpu: "22%", ram: "45%", isK8s: true });
      }
    }

    return list;
  };

  const metrics = getNodeMetrics(activeStep, subStep);

  // Helper to determine destinations for running traffic packets
  const getActiveK8sDestinations = (step: number, subStep: number): { x: number; id: number; version: string }[] => {
    const pods = [
      { x: 75, id: 1, version: step === 5 && subStep >= 1 ? "v2.0" : "v1.0" },
      { x: 180, id: 2, version: step === 5 && subStep >= 2 ? "v2.0" : "v1.0" },
      { x: 285, id: 3, version: step === 5 && subStep >= 2 ? "v2.0" : "v1.0" },
      { x: 390, id: 4, version: step === 5 && subStep >= 3 ? "v2.0" : "v1.0" },
      { x: 495, id: 5, version: step === 5 && subStep >= 3 ? "v2.0" : "v1.0" },
    ];

    if (step === 2) {
      return pods.slice(0, 3);
    }
    if (step === 3) {
      if (subStep === 0 || subStep === 1) {
        return pods.slice(1, 3); // Pod 1 is down
      }
      return pods.slice(0, 3);
    }
    if (step === 4) {
      if (subStep < 2) {
        return pods.slice(0, 3);
      }
      return pods; // all 5 pods active
    }
    if (step === 5) {
      if (subStep === 0) {
        return [pods[1], pods[2], pods[3], pods[4]]; // Pod 1 updating
      }
      if (subStep === 1) {
        return [pods[0], pods[3], pods[4]]; // Pod 2, 3 updating
      }
      if (subStep === 2) {
        return [pods[0], pods[1], pods[2]]; // Pod 4, 5 updating
      }
      return pods; // all updated
    }
    return [];
  };

  const activeDestinations = getActiveK8sDestinations(activeStep, subStep);
  const cleanStepText = (steps[activeStep] ?? "").replace(/\*\*/g, "");

  const renderPodNode = (id: number, x: number, y: number) => {
    const podMetric = metrics.find((m) => m.name === `Pod ${id}`);
    if (!podMetric || podMetric.status === "None") return null;

    const { status, version } = podMetric;

    let rectClass = "fill-emerald-50/70 dark:fill-emerald-950/20 stroke-emerald-400/50 dark:stroke-emerald-500/30";
    let textClass = "fill-emerald-600 dark:fill-emerald-400";
    let badge = "🟢";

    if (status === "Failed") {
      rectClass = "fill-red-50/70 dark:fill-red-950/20 stroke-red-400/50 dark:stroke-red-500/30";
      textClass = "fill-red-600 dark:fill-red-400";
      badge = "🔴";
    } else if (status === "Restarting" || status === "Terminating") {
      rectClass = "fill-amber-50/70 dark:fill-amber-950/20 stroke-amber-400/50 dark:stroke-amber-500/30";
      textClass = "fill-amber-600 dark:fill-amber-400";
      badge = "🟡";
    } else if (status === "Pending") {
      rectClass = "fill-blue-50/70 dark:fill-blue-950/20 stroke-blue-400/50 dark:stroke-blue-500/30";
      textClass = "fill-blue-600 dark:fill-blue-400";
      badge = "🔵";
    } else if (version === "v2.0") {
      rectClass = "fill-purple-50/70 dark:fill-purple-950/20 stroke-purple-400/50 dark:stroke-purple-500/30";
      textClass = "fill-purple-600 dark:fill-purple-400";
      badge = "🟣";
    }

    return (
      <g key={`pod-node-${id}-${status}-${version}-${activeStep}-${subStep}`}>
        <rect
          x={x}
          y={y}
          width={70}
          height={40}
          rx={6}
          className={rectClass}
          strokeWidth={1.5}
          filter="url(#shadow)"
        />
        <text x={x + 35} y={y + 13} textAnchor="middle" className="text-[10px] font-bold fill-foreground select-none">
          Pod {id}
        </text>
        <text x={x + 35} y={y + 24} textAnchor="middle" className={`text-[8px] font-extrabold select-none ${textClass}`}>
          {badge} {status}
        </text>
        <text x={x + 35} y={y + 34} textAnchor="middle" className="text-[8px] font-mono fill-muted-foreground select-none">
          {version}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Scenario Tabs */}
      <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60 overflow-x-auto whitespace-nowrap gap-1">
        {TAB_LABELS.map((label, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsPlaying(false);
              setActiveStep(idx);
              setSubStep(0);
            }}
            className={`flex-1 min-w-[100px] text-center py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeStep === idx
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Controls and Progress Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-border/60 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-muted-foreground"
            title="초기화"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={handlePrev}
            disabled={activeStep <= 0}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:hover:bg-card transition-colors"
            title="이전 단계"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            onClick={handlePlay}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition-opacity"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? "일시정지" : "재생"}</span>
          </button>
          <button
            onClick={handleNext}
            disabled={activeStep >= total - 1}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 disabled:hover:bg-card transition-colors"
            title="다음 단계"
          >
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Progress Info */}
        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
            {activeStep + 1} / {total}
          </div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${((activeStep + 1) / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* SVG Visualization Canvas - Scaled down Y axis by 20% */}
      <div className="relative">
        <svg viewBox="0 0 600 270" className="w-full h-auto rounded-xl border border-border/50 bg-card overflow-hidden">
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-neutral-100 dark:text-neutral-800/40" />
            </pattern>
            {/* Shadow filter */}
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000" floodOpacity="0.06" />
            </filter>
          </defs>

          {/* Background grid with proper rounding */}
          <rect width="100%" height="100%" fill="url(#grid)" rx="12" ry="12" />

          {/* Kubernetes Cluster Boundary */}
          {activeStep >= 2 && (
            <g key="cluster-boundary">
              <rect
                x={20}
                y={64}
                width={560}
                height={192}
                rx={10}
                className="fill-none stroke-emerald-500/10 dark:stroke-emerald-400/10"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text x={35} y={78} className="text-[8px] font-extrabold fill-emerald-500/40 dark:fill-emerald-400/30 uppercase tracking-widest select-none">☸️ K8s Cluster Boundary</text>
            </g>
          )}

          {/* Client Node (Top Center) */}
          <g>
            <rect
              x={260}
              y={16}
              width={80}
              height={36}
              rx={6}
              className="fill-neutral-50/90 dark:fill-neutral-900/90 stroke-neutral-250 dark:stroke-neutral-800"
              strokeWidth={1}
              filter="url(#shadow)"
            />
            <text x={300} y={30} textAnchor="middle" className="text-sm select-none">💻</text>
            <text x={300} y={44} textAnchor="middle" className="text-[9px] font-semibold fill-foreground select-none">Client</text>
          </g>

          {/* Middle Layer */}
          {/* Legacy Mode connection and representation */}
          {activeStep < 2 && (
            <g key="legacy-middle">
              <line
                x1={300}
                y1={52}
                x2={300}
                y2={168}
                strokeWidth={1.5}
                className="stroke-neutral-200 dark:stroke-neutral-800"
              />
              <g opacity={0.6}>
                <rect
                  x={255}
                  y={88}
                  width={90}
                  height={32}
                  rx={5}
                  className="fill-neutral-100/40 dark:fill-neutral-800/40 stroke-neutral-300 dark:stroke-neutral-700"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <text x={300} y={102} textAnchor="middle" className="text-xs select-none">🔌</text>
                <text x={300} y={114} textAnchor="middle" className="text-[8px] fill-muted-foreground select-none">No LoadBalancer</text>
              </g>
            </g>
          )}

          {/* K8s Mode connection, Service and Control Plane */}
          {activeStep >= 2 && (
            <g key="k8s-middle">
              {/* Client -> Service LoadBalancer */}
              <line
                x1={300}
                y1={52}
                x2={300}
                y2={88}
                strokeWidth={1.5}
                className="stroke-neutral-300 dark:stroke-neutral-700"
              />

              {/* Service (LB) */}
              <g>
                <rect
                  x={250}
                  y={88}
                  width={100}
                  height={36}
                  rx={6}
                  className="fill-sky-50/80 dark:fill-sky-950/20 stroke-sky-400/55 dark:stroke-sky-500/40"
                  strokeWidth={1.5}
                  filter="url(#shadow)"
                />
                <text x={300} y={104} textAnchor="middle" className="text-sm select-none">⚖️</text>
                <text x={300} y={117} textAnchor="middle" className="text-[8.5px] font-bold fill-sky-750 dark:fill-sky-400 select-none">Service (LB)</text>
              </g>

              {/* Control Plane (Master) */}
              <g>
                <rect
                  x={410}
                  y={72}
                  width={170}
                  height={56}
                  rx={6}
                  className="fill-indigo-50/40 dark:fill-indigo-950/10 stroke-indigo-200 dark:stroke-indigo-900/60"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <text x={495} y={84} textAnchor="middle" className="text-[8px] font-extrabold fill-indigo-500/80 dark:fill-indigo-400/75 select-none uppercase tracking-wide">🧠 Control Plane</text>
                
                {/* API Server */}
                <g>
                  <rect
                    x={420}
                    y={94}
                    width={70}
                    height={26}
                    rx={3}
                    className="fill-neutral-50/90 dark:fill-neutral-900/90 stroke-neutral-200 dark:stroke-neutral-800"
                    strokeWidth={1}
                  />
                  <text x={455} y={104} textAnchor="middle" className="text-[8px] font-bold fill-foreground select-none">API Server</text>
                  <text x={455} y={114} textAnchor="middle" className="text-[7px] font-mono fill-emerald-500 select-none">● Active</text>
                </g>

                {/* HPA Controller */}
                <g>
                  <rect
                    x={500}
                    y={94}
                    width={70}
                    height={26}
                    rx={3}
                    className={`transition-all duration-300 ${
                      activeStep === 4
                        ? "fill-blue-50/90 dark:fill-blue-950/20 stroke-blue-400/50"
                        : "fill-neutral-50/90 dark:fill-neutral-900/90 stroke-neutral-200 dark:stroke-neutral-800"
                    }`}
                    strokeWidth={1}
                  />
                  <text x={535} y={104} textAnchor="middle" className="text-[8px] font-bold fill-foreground select-none">HPA Ctrl</text>
                  <text x={535} y={114} textAnchor="middle" className={`text-[7px] font-mono select-none ${
                    activeStep === 4 ? "fill-blue-500 font-bold animate-pulse" : "fill-muted-foreground"
                  }`}>
                    {activeStep === 4 ? "● Scaling" : "○ Standby"}
                  </text>
                </g>
              </g>

              {/* Sync line between API Server & Service LB */}
              <line
                x1={350}
                y1={106}
                x2={420}
                y2={106}
                strokeWidth={1}
                strokeDasharray="2 2"
                className="stroke-neutral-300 dark:stroke-neutral-700"
              />

              {/* Service LB -> Pod Connection Lines */}
              <g>
                <line x1={300} y1={124} x2={75} y2={184} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-850" />
                <line x1={300} y1={124} x2={180} y2={184} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-850" />
                <line x1={300} y1={124} x2={285} y2={184} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-850" />
                {((activeStep === 4 && subStep >= 1) || activeStep === 5) && (
                  <>
                    <line x1={300} y1={124} x2={390} y2={184} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-850" />
                    <line x1={300} y1={124} x2={495} y2={184} strokeWidth={1.5} strokeDasharray="3 3" className="stroke-neutral-200 dark:stroke-neutral-850" />
                  </>
                )}
              </g>
            </g>
          )}

          {/* Bottom Layer */}
          {/* Legacy Server (when activeStep < 2) */}
          {activeStep < 2 && (
            <g key="legacy-bottom">
              <rect
                x={240}
                y={168}
                width={120}
                height={52}
                rx={8}
                className="stroke-2 fill-red-50/80 dark:fill-red-950/10 stroke-red-400 dark:stroke-red-800/80"
                filter="url(#shadow)"
              />
              <text x={300} y={185} textAnchor="middle" className="text-lg select-none">🖥️</text>
              <text x={300} y={200} textAnchor="middle" className="text-[9px] font-bold fill-foreground select-none">Legacy Server</text>
              <text x={300} y={211} textAnchor="middle" className="text-[8px] font-mono font-bold fill-red-500 select-none animate-pulse">
                {activeStep === 0 ? "Offline (SPOF)" : "CPU: 100% (Hang)"}
              </text>

              {/* Warning Indicators */}
              {activeStep === 0 && (
                <motion.text
                  key={`warning-s0-${activeStep}`}
                  x={300}
                  y={156}
                  textAnchor="middle"
                  className="text-lg fill-amber-500 select-none"
                  animate={{ scale: [1, 1.2, 1], y: [156, 152, 156] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  ⚡
                </motion.text>
              )}
              {activeStep === 1 && (
                <motion.text
                  key={`warning-s1-${activeStep}`}
                  x={300}
                  y={156}
                  textAnchor="middle"
                  className="text-lg fill-red-500 select-none"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  🔥
                </motion.text>
              )}
            </g>
          )}

          {/* Pod Nodes (when activeStep >= 2) */}
          {activeStep >= 2 && (
            <g key="k8s-bottom">
              {renderPodNode(1, 40, 184)}
              {renderPodNode(2, 145, 184)}
              {renderPodNode(3, 250, 184)}
              {renderPodNode(4, 355, 184)}
              {renderPodNode(5, 460, 184)}
            </g>
          )}

          {/* ────────────────── Packets Flow & Signals ────────────────── */}

          {/* Legacy Mode Flow */}
          {activeStep === 0 && (
            <g key={`legacy-packets-s0-${activeStep}`}>
              {[0, 0.6, 1.2].map((delay) => (
                <motion.circle
                  key={`legacy-p0-${delay}-${activeStep}`}
                  cx={300}
                  cy={52}
                  r={2.5}
                  className="fill-red-400"
                  animate={{
                     cy: [52, 110],
                     opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeIn"
                  }}
                />
              ))}
              <text x={300} y={128} textAnchor="middle" className="text-[8px] fill-red-500 font-semibold select-none">❌ Connection Refused</text>
            </g>
          )}

          {activeStep === 1 && (
            <g key={`legacy-packets-s1-${activeStep}`}>
              {[0, 0.4, 0.8, 1.2, 1.6].map((delay) => (
                <motion.circle
                  key={`legacy-p1-${delay}-${activeStep}`}
                  cx={300}
                  cy={52}
                  r={2.5}
                  className="fill-amber-500"
                  animate={{
                    cy: [52, 168],
                    opacity: [1, 1, 0.2, 0]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: delay,
                    ease: "linear"
                  }}
                />
              ))}
              <text x={300} y={128} textAnchor="middle" className="text-[8px] fill-amber-500 font-semibold animate-pulse select-none">⚠️ High Latency / Timeout</text>
            </g>
          )}

          {/* YAML deployment animation */}
          {activeStep === 2 && (
            <motion.g
              key={`yaml-fly-${activeStep}`}
              initial={{ x: 300, y: 34, scale: 0.5, opacity: 0 }}
              animate={{
                x: [300, 360, 455],
                y: [34, 72, 94],
                scale: [0.5, 0.9, 0.6],
                opacity: [0, 1, 1, 0]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <rect x={-12} y={-15} width={24} height={30} rx={2} className="fill-white dark:fill-neutral-900 stroke-blue-500" strokeWidth={1} filter="url(#shadow)" />
              <line x1={-7} y1={-8} x2={7} y2={-8} stroke="#3b82f6" strokeWidth={1} />
              <line x1={-7} y1={-3} x2={4} y2={-3} stroke="#3b82f6" strokeWidth={1} />
              <line x1={-7} y1={2} x2={1} y2={2} stroke="#3b82f6" strokeWidth={1} />
              <text x={0} y={10} textAnchor="middle" className="text-[5.5px] fill-blue-500 font-bold font-mono select-none">YAML</text>
            </motion.g>
          )}

          {/* K8s Mode Traffic Flow */}
          {activeStep >= 2 && activeDestinations.map((dest, index) => {
            const isV2 = dest.version === "v2.0";
            const packetColor = isV2 ? "fill-purple-500" : "fill-emerald-500";
            
            const delays = [0, 0.6, 1.2];
            const isSpike = activeStep === 4 && subStep === 0;
            const activeDelays = isSpike ? [0, 0.3, 0.6, 0.9, 1.2, 1.5] : delays;
            const duration = isSpike ? 1.0 : 1.8;

            return activeDelays.map((delay) => (
              <motion.circle
                key={`k8s-packet-${dest.id}-${index}-${delay}-${activeStep}-${subStep}`}
                cx={300}
                cy={52}
                r={isSpike ? 2 : 2.5}
                className={packetColor}
                animate={{
                  cx: [300, 300, dest.x],
                  cy: [52, 98, 184],
                  opacity: [1, 1, 0.8, 0]
                }}
                transition={{
                  duration: duration,
                  repeat: Infinity,
                  delay: delay,
                  ease: "easeInOut"
                }}
              />
            ));
          })}

          {/* Self-Healing Signals */}
          {activeStep === 3 && subStep === 1 && (
            <g key={`signals-step3-${activeStep}-${subStep}`}>
              {/* Report Line (Failed Pod 1 -> API Server) */}
              <motion.path
                d="M 75 184 Q 150 128 455 107"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                animate={{ strokeDashoffset: [20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              {/* Recreate directive (API Server -> Pod 1) */}
              <motion.path
                d="M 455 107 Q 150 144 75 184"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.8"
                strokeDasharray="5 3"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </g>
          )}

          {/* HPA Signals */}
          {activeStep === 4 && subStep === 1 && (
            <g key={`signals-step4-${activeStep}-${subStep}`}>
              {/* HPA Ctrl -> Pod 4 */}
              <motion.path
                d="M 535 107 Q 460 136 390 184"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
              {/* HPA Ctrl -> Pod 5 */}
              <motion.path
                d="M 535 107 Q 515 144 495 184"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Description Callout Box */}
      <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            activeStep < 2
              ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450 border border-red-200/20"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-250/20"
          }`}>
            {activeStep < 2 ? "K8s 적용 전 (Legacy)" : "K8s 적용 후 (Cluster)"}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            {activeStep + 1}단계 / {total}
          </span>
        </div>
        <h4 className="text-base sm:text-lg font-bold text-foreground">
          {cleanStepText}
        </h4>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {STEP_DETAILS[activeStep]}
        </p>
      </div>

      {/* HUD Monitor Panel */}
      <div className="border border-border/80 rounded-2xl bg-card shadow-sm overflow-hidden text-sm">
        {/* Panel Title bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/60">
          <div className="flex items-center gap-2 font-semibold">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <span>실시간 인프라 모니터링 (HUD Dashboard)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              HPA: {activeStep >= 2 ? "Enabled (Target 70% CPU)" : "Disabled"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              Replicas: {activeStep >= 2 ? (activeStep === 4 && subStep >= 2 ? "5/5" : activeStep === 3 && subStep < 2 ? "2/3" : activeStep === 5 && subStep === 0 ? "4/5" : activeStep === 5 && (subStep === 1 || subStep === 2) ? "3/5" : "3/3") : "-"}
            </span>
          </div>
        </div>

        {/* Panel Content */}
        <div className="p-4 space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground font-mono uppercase tracking-wider">
                  <th className="py-2 px-3">이름 (Name)</th>
                  <th className="py-2 px-3">상태 (Status)</th>
                  <th className="py-2 px-3">버전 (Version)</th>
                  <th className="py-2 px-3">CPU 사용량</th>
                  <th className="py-2 px-3">RAM 사용량</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 font-mono text-xs">
                {metrics.map((node) => {
                  let statusBadgeColor = "bg-neutral-100 text-neutral-850 dark:bg-neutral-800 dark:text-neutral-300";
                  if (node.status === "Running") statusBadgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-250/20";
                  else if (node.status === "Failed") statusBadgeColor = "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-450 border border-red-250/20";
                  else if (node.status === "Restarting" || node.status === "Terminating") statusBadgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-250/20";
                  else if (node.status === "Pending") statusBadgeColor = "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-250/20";

                  return (
                    <tr key={node.name} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2 px-3 font-semibold text-foreground">{node.name}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${statusBadgeColor}`}>
                          {node.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{node.version}</td>
                      <td className="py-2 px-3 font-bold text-foreground">{node.cpu}</td>
                      <td className="py-2 px-3 text-muted-foreground">{node.ram}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
