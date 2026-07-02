import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "1. 단일 서버 장애 (SPOF)",
    beforeDesc: "K8s 적용 전: 단일 서버 장애 발생 시 전체 서비스가 중단됩니다. 관리자가 새벽에 깨어나 수동으로 서버를 재시작하고 복구할 때까지 수분~수시간의 다운타임이 발생합니다.",
    afterDesc: "K8s 적용 후: 클러스터 내부의 Pod 1개가 다운되더라도, 로드밸런서(Service)가 정상 작동하는 다른 Pod들로 트래픽을 즉시 유도하여 서비스 중단이 전혀 발생하지 않습니다.",
  },
  {
    title: "2. 트래픽 급증 (Traffic Spike)",
    beforeDesc: "K8s 적용 전: 트래픽이 갑자기 몰리면 단일 서버의 CPU/메모리가 고갈되어 서버가 다운됩니다. 새로운 서버를 수동으로 구매하고 네트워크 설정을 하는 데 많은 시간이 걸립니다.",
    afterDesc: "K8s 적용 후: HPA가 실시간으로 노드의 부하를 모니터링합니다. CPU 임계치 초과 시 즉각 신호를 보낼 준비를 하며, 로드밸런서가 현재 가용한 파드들로 요청을 골고루 배분합니다.",
  },
  {
    title: "3. 선언적 배포 (Deployment YAML)",
    beforeDesc: "K8s 적용 전: 서버 사양 변경이나 배포 스크립트를 수동으로 적용합니다. 설정 누락이나 개발/운영 환경 불일치로 인해 예상치 못한 배포 오류가 빈번합니다.",
    afterDesc: "K8s 적용 후: Deployment YAML에 '원하는 상태(Replicas: 3, Image: v1.0)'를 정의하여 마스터 노드에 전송하면, 쿠버네티스가 이를 분석하여 항상 해당 상태를 유지하도록 제어합니다.",
  },
  {
    title: "4. 자가 치유 (Self-Healing)",
    beforeDesc: "K8s 적용 전: 충돌이나 메모리 누수로 프로세스가 죽으면 수동으로 접속해 로그를 보고 프로세스를 재실행해야 합니다. 복구 지연이 서비스 신뢰도를 떨어뜨립니다.",
    afterDesc: "K8s 적용 후: Node의 kubelet이 파드의 비정상을 즉시 감지합니다. 즉시 실패한 파드를 파괴하고, 마스터 노드의 스케줄러와 협력해 수초 내에 새 파드를 자동으로 재스케줄링합니다.",
  },
  {
    title: "5. 자동 스케일아웃 (HPA Scaling)",
    beforeDesc: "K8s 적용 전: 트래픽 부하가 임계치를 넘어도 자동 대처가 불가능하므로, 시스템 오버로드로 먹통이 된 서버를 바라보며 수동 인프라 증설을 기다려야 합니다.",
    afterDesc: "K8s 적용 후: HPA가 CPU 사용률 70% 초과를 감지하고 Replicas를 3개에서 5개로 자동 확장합니다. 동적으로 추가된 새 Pod들이 로드밸런서에 즉시 연결되어 부하가 완화됩니다.",
  },
  {
    title: "6. 무중단 롤링 업데이트 (Rolling Update)",
    beforeDesc: "K8s 적용 전: 새로운 버전 배포 시 기존 프로세스를 종료하고 새 프로세스를 실행해야 하므로 다운타임이 발생하거나, 이중화 구성을 위해 복잡한 수동 스위칭을 해야 합니다.",
    afterDesc: "K8s 적용 후: v1.0 파드를 하나씩 제거하면서 v2.0 파드를 하나씩 순차적으로 띄웁니다. 업데이트 중에도 구버전과 신버전이 교대로 트래픽을 처리하여 중단 없는 서비스를 보장합니다.",
  }
];

export default function K8sViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subStep, setSubStep] = useState(0);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  // Auto play & Substep scheduling logic
  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 5500; // 한 단계를 5.5초 동안 머무르며 서브스텝 연출
    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // 마지막 단계 틱 완료 후 재생 종료 (마지막 단계 지연 보장)
        setIsPlaying(false);
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

    if (activeStep === 3) { // 자가 치유
      t1 = setTimeout(() => setSubStep(1), 1800);
      t2 = setTimeout(() => setSubStep(2), 3600);
    } else if (activeStep === 4) { // HPA 스케일아웃
      t1 = setTimeout(() => setSubStep(1), 1800);
      t2 = setTimeout(() => setSubStep(2), 3600);
    } else if (activeStep === 5) { // 롤링 업데이트
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
    setActiveStep(-1);
    setSubStep(0);
  }, []);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      handleReset();
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete, handleReset]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) setActiveStep((p) => p + 1);
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const progress = ((activeStep + 1) / total) * 100;
  const stepData = activeStep >= 0 ? STEPS[activeStep] : null;

  // Pod 상태 결정 헬퍼 함수
  const getPodStatus = (id: number): { status: "running" | "failed" | "restarting" | "new" | "v2" | "none"; label: string; version: string } => {
    if (activeStep < 0) {
      return { status: "running", label: "Running", version: "v1.0" };
    }
    if (activeStep === 0) {
      if (id === 1) return { status: "failed", label: "Failed", version: "v1.0" };
      return { status: "running", label: "Running", version: "v1.0" };
    }
    if (activeStep === 1) {
      // 과부하 트래픽 인입 상태
      return { status: "running", label: "CPU 82%", version: "v1.0" };
    }
    if (activeStep === 2) {
      return { status: "running", label: "Running", version: "v1.0" };
    }
    if (activeStep === 3) {
      if (id === 1) {
        if (subStep === 0) return { status: "failed", label: "Failed", version: "v1.0" };
        if (subStep === 1) return { status: "restarting", label: "Restarting", version: "v1.0" };
        return { status: "running", label: "Running", version: "v1.0" };
      }
      return { status: "running", label: "Running", version: "v1.0" };
    }
    if (activeStep === 4) {
      if (id <= 3) {
        if (subStep === 0) return { status: "running", label: "CPU 94% 🔥", version: "v1.0" };
        return { status: "running", label: "CPU 45% ✓", version: "v1.0" };
      }
      // Pod 4, 5 (HPA 확장본)
      if (subStep === 0) return { status: "none", label: "", version: "" };
      if (subStep === 1) return { status: "new", label: "Scaling Up", version: "v1.0" };
      return { status: "running", label: "Running", version: "v1.0" };
    }
    if (activeStep === 5) {
      // 롤링 업데이트
      if (subStep === 0) {
        if (id === 1) return { status: "restarting", label: "Updating", version: "v2.0" };
        return { status: "running", label: "Running", version: "v1.0" };
      }
      if (subStep === 1) {
        if (id === 1) return { status: "v2", label: "Running", version: "v2.0" };
        if (id === 2 || id === 3) return { status: "restarting", label: "Updating", version: "v2.0" };
        return { status: "running", label: "Running", version: "v1.0" };
      }
      if (subStep === 2) {
        if (id <= 3) return { status: "v2", label: "Running", version: "v2.0" };
        if (id === 4 || id === 5) return { status: "restarting", label: "Updating", version: "v2.0" };
        return { status: "running", label: "Running", version: "v1.0" };
      }
      return { status: "v2", label: "Running", version: "v2.0" };
    }
    return { status: "running", label: "Running", version: "v1.0" };
  };

  // K8s 활성 패킷 목적지 정보
  const getActivePodDestinations = () => {
    if (activeStep < 0) {
      return [
        { x: 252.5, y: 132.5, id: 1 },
        { x: 252.5, y: 187.5, id: 2 },
        { x: 252.5, y: 242.5, id: 3 },
      ];
    }
    if (activeStep === 0) {
      return [
        { x: 252.5, y: 187.5, id: 2 },
        { x: 252.5, y: 242.5, id: 3 },
      ];
    }
    if (activeStep === 1 || activeStep === 2) {
      return [
        { x: 252.5, y: 132.5, id: 1 },
        { x: 252.5, y: 187.5, id: 2 },
        { x: 252.5, y: 242.5, id: 3 },
      ];
    }
    if (activeStep === 3) {
      if (subStep === 0 || subStep === 1) {
        return [
          { x: 252.5, y: 187.5, id: 2 },
          { x: 252.5, y: 242.5, id: 3 },
        ];
      }
      return [
        { x: 252.5, y: 132.5, id: 1 },
        { x: 252.5, y: 187.5, id: 2 },
        { x: 252.5, y: 242.5, id: 3 },
      ];
    }
    if (activeStep === 4) {
      if (subStep === 0 || subStep === 1) {
        return [
          { x: 252.5, y: 132.5, id: 1 },
          { x: 252.5, y: 187.5, id: 2 },
          { x: 252.5, y: 242.5, id: 3 },
        ];
      }
      return [
        { x: 252.5, y: 132.5, id: 1 },
        { x: 252.5, y: 187.5, id: 2 },
        { x: 252.5, y: 242.5, id: 3 },
        { x: 332.5, y: 157.5, id: 4 },
        { x: 332.5, y: 212.5, id: 5 },
      ];
    }
    if (activeStep === 5) {
      if (subStep === 0) {
        return [
          { x: 252.5, y: 187.5, id: 2 },
          { x: 252.5, y: 242.5, id: 3 },
          { x: 332.5, y: 157.5, id: 4 },
          { x: 332.5, y: 212.5, id: 5 },
        ];
      }
      if (subStep === 1) {
        return [
          { x: 252.5, y: 132.5, id: 1 },
          { x: 332.5, y: 157.5, id: 4 },
          { x: 332.5, y: 212.5, id: 5 },
        ];
      }
      if (subStep === 2) {
        return [
          { x: 252.5, y: 132.5, id: 1 },
          { x: 252.5, y: 187.5, id: 2 },
          { x: 252.5, y: 242.5, id: 3 },
        ];
      }
      return [
        { x: 252.5, y: 132.5, id: 1 },
        { x: 252.5, y: 187.5, id: 2 },
        { x: 252.5, y: 242.5, id: 3 },
        { x: 332.5, y: 157.5, id: 4 },
        { x: 332.5, y: 212.5, id: 5 },
      ];
    }
    return [];
  };

  // Pod 그리기 컴포넌트 (텍스트 크기 확대)
  const renderPodNode = (id: number, x: number, y: number) => {
    const { status, label, version } = getPodStatus(id);
    if (status === "none") return null;

    let strokeColor = "#10b981";
    let fillGrad = "url(#gradHealthy)";
    let textColor = "text-emerald-600 dark:text-emerald-400";
    let badgeText = "🟢";

    if (status === "failed") {
      strokeColor = "#ef4444";
      fillGrad = "url(#gradCrashed)";
      textColor = "text-red-600 dark:text-red-400";
      badgeText = "🔴";
    } else if (status === "restarting") {
      strokeColor = "#f59e0b";
      fillGrad = "url(#gradWarning)";
      textColor = "text-amber-600 dark:text-amber-400";
      badgeText = "🟡";
    } else if (status === "new") {
      strokeColor = "#3b82f6";
      fillGrad = "url(#gradInfo)";
      textColor = "text-blue-600 dark:text-blue-400";
      badgeText = "🔵";
    } else if (status === "v2") {
      strokeColor = "#8b5cf6";
      fillGrad = "url(#gradV2)";
      textColor = "text-violet-600 dark:text-violet-400";
      badgeText = "🟣";
    }

    return (
      <motion.g
        key={`pod-${id}-${status}-${activeStep}-${subStep}`}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <rect
          x={x}
          y={y}
          width={65}
          height={45}
          rx={6}
          fill={fillGrad}
          stroke={strokeColor}
          strokeWidth={1.5}
          filter="url(#shadow)"
        />
        <text x={x + 6} y={y + 18} className="text-xs select-none">{badgeText}</text>
        <text x={x + 21} y={y + 17} className="text-[11px] font-bold fill-foreground select-none">
          Pod {id}
        </text>
        <text x={x + 32.5} y={y + 29} textAnchor="middle" className={`text-[9.5px] font-bold select-none ${textColor}`}>
          {label}
        </text>
        <text x={x + 32.5} y={y + 39} textAnchor="middle" className="text-[8.5px] font-mono fill-muted-foreground select-none">
          {version}
        </text>
      </motion.g>
    );
  };

  // 왼쪽 VM 단일 서버 렌더링 (텍스트 크기 확대)
  const renderLeftVM = () => {
    let strokeColor = "#10b981";
    let fillGrad = "url(#gradHealthy)";
    let textColor = "text-emerald-600 dark:text-emerald-400";
    let statusText = "🟢 Healthy";
    let descText = "Single Process";
    let isCrashed = false;
    let isOverload = false;
    let isOffline = false;

    if (activeStep === 0 || activeStep === 3) {
      strokeColor = "#ef4444";
      fillGrad = "url(#gradCrashed)";
      textColor = "text-red-600 dark:text-red-400";
      statusText = "🔴 CRASHED";
      descText = "SPOF Down";
      isCrashed = true;
    } else if (activeStep === 1 || activeStep === 4) {
      strokeColor = "#ef4444";
      fillGrad = "url(#gradCrashed)";
      textColor = "text-red-600 dark:text-red-400";
      statusText = "🔥 OVERLOAD";
      descText = "CPU: 100% (Hang)";
      isOverload = true;
    } else if (activeStep === 5) {
      strokeColor = "#6b7280";
      fillGrad = "none";
      textColor = "text-gray-500 dark:text-gray-400";
      statusText = "🔌 OFFLINE";
      descText = "Updating v2.0...";
      isOffline = true;
    }

    return (
      <g key={`left-vm-${activeStep}`}>
        <rect
          x={235}
          y={110}
          width={120}
          height={100}
          rx={10}
          fill={isOffline ? "rgba(107, 114, 128, 0.1)" : fillGrad}
          stroke={strokeColor}
          strokeWidth={2}
          filter="url(#shadow)"
        />
        <text x={295} y={138} textAnchor="middle" className="text-2xl select-none">🖥️</text>
        <text x={295} y={158} textAnchor="middle" className="text-[12px] font-extrabold fill-foreground select-none">
          Legacy Server
        </text>
        <text x={295} y={178} textAnchor="middle" className={`text-[11px] font-bold select-none ${textColor}`}>
          {statusText}
        </text>
        <text x={295} y={194} textAnchor="middle" className="text-[9.5px] fill-muted-foreground font-mono select-none">
          {descText}
        </text>

        {isCrashed && (
          <motion.text
            x={295}
            y={95}
            textAnchor="middle"
            className="text-2xl fill-yellow-400 select-none"
            animate={{ scale: [1, 1.25, 1], y: [95, 92, 95] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            ⚡
          </motion.text>
        )}

        {activeStep === 3 && (
          <g>
            <circle cx={295} cy={245} r={12} className="fill-amber-500/10 stroke-amber-500/30 stroke-1" />
            <text x={295} y={249} textAnchor="middle" className="text-sm select-none">👨‍💻</text>
            <text x={295} y={268} textAnchor="middle" className="text-[9px] fill-amber-500 font-bold font-mono animate-pulse select-none">수동 복구 대기 중...</text>
          </g>
        )}

        {activeStep === 4 && (
          <g>
            <rect x={240} y={235} width={110} height={20} rx="4" className="fill-red-500/10 stroke-red-500/30 stroke-1" />
            <text x={295} y={247} textAnchor="middle" className="text-[9px] fill-red-500 font-bold font-mono animate-pulse select-none">⚠️ 자동 확장 기능 없음</text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-prev"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "시뮬레이션 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          <ChevronRight size={16} />
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : `총 ${total}단계 (대기 중)`}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Visual Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Traditional VM / Bare-metal */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                ❌ K8s 적용 전 (Legacy Infrastructure)
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                단일 장애점 (SPOF) 위험 노출
              </span>
            </div>

            {/* SVG Workspace */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 400 320" className="w-full h-auto">
                <defs>
                  <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.1" />
                  </filter>
                  <linearGradient id="gradHealthy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.15" />
                    <stop offset="100%" stop-color="#047857" stop-opacity="0.03" />
                  </linearGradient>
                  <linearGradient id="gradCrashed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.15" />
                    <stop offset="100%" stop-color="#b91c1c" stop-opacity="0.03" />
                  </linearGradient>
                </defs>

                <rect x="0" y="0" width="400" height="320" fill="none" />

                {/* Legacy host enclosure */}
                <rect x="220" y="80" width="150" height="200" rx="12" className="fill-none stroke-red-500/20 stroke-1 stroke-dashed" />
                <text x="295" y="98" textAnchor="middle" className="text-[10.5px] font-bold fill-red-500/50 uppercase tracking-wider select-none">VM HOST ENDPOINT</text>

                {/* Client Node */}
                <rect x="30" y="135" width="70" height="50" rx="8" className="fill-card stroke-border" />
                <text x="65" y="160" textAnchor="middle" className="text-xl select-none">💻</text>
                <text x="65" y="176" textAnchor="middle" className="text-[9px] font-bold fill-foreground select-none">Client</text>

                {/* Network Line */}
                <line
                  x1={100}
                  y1={160}
                  x2={235}
                  y2={160}
                  stroke={activeStep === 5 ? "#9ca3af" : "#f87171"}
                  strokeWidth="1.5"
                  strokeDasharray={activeStep === 5 ? "4 4" : "none"}
                />

                {/* Traffic Packets */}
                {activeStep < 0 && (
                  <motion.circle
                    key="packet-legacy-init"
                    cx={100}
                    cy={160}
                    r={3.5}
                    className="fill-emerald-500"
                    animate={{ cx: [100, 235], opacity: [1, 1, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {activeStep === 0 && (
                  <g key="packet-legacy-step0">
                    <motion.circle
                      cx={100}
                      cy={160}
                      r={3.5}
                      className="fill-red-500"
                      animate={{
                        cx: [100, 160, 160],
                        cy: [160, 160, 200],
                        opacity: [1, 1, 0]
                      }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    />
                    <text x={160} y={150} textAnchor="middle" className="text-[10px] fill-red-500 font-bold select-none">❌ Connection Refused</text>
                  </g>
                )}

                {(activeStep === 1 || activeStep === 4) && (
                  <g key="packet-legacy-step1-4">
                    {[0, 0.4, 0.8, 1.2].map((delay) => (
                      <motion.circle
                        key={delay}
                        cx={100}
                        cy={160}
                        r={3.5}
                        className="fill-red-500"
                        animate={{
                          cx: [100, 210, 210],
                          cy: [160, 160, 185],
                          opacity: [1, 1, 0]
                        }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: delay, ease: "linear" }}
                      />
                    ))}
                    <text x={167} y={150} textAnchor="middle" className="text-[10px] fill-red-500 font-bold animate-pulse select-none">⚠️ High Latency / Timeout</text>
                  </g>
                )}

                {activeStep === 3 && (
                  <g key="packet-legacy-step3">
                    <motion.circle
                      cx={100}
                      cy={160}
                      r={3.5}
                      className="fill-red-500"
                      animate={{
                        cx: [100, 160, 160],
                        cy: [160, 160, 200],
                        opacity: [1, 1, 0]
                      }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    />
                    <text x={160} y={150} textAnchor="middle" className="text-[10px] fill-red-500 font-bold select-none">❌ Server Dead</text>
                  </g>
                )}

                {activeStep === 5 && (
                  <g key="packet-legacy-step5">
                    <text x={167} y={150} textAnchor="middle" className="text-[10px] fill-gray-500 font-bold select-none">🔌 Offline for Deployment</text>
                    <text x={65} y={193} textAnchor="middle" className="text-[9px] fill-red-500 font-bold animate-pulse select-none">Connection Timeout</text>
                  </g>
                )}

                {/* Legacy Server chassis */}
                {renderLeftVM()}
              </svg>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stepData && (
              <motion.p
                key={activeStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-4 bg-red-50/20 dark:bg-red-950/5 p-4 rounded-2xl border border-red-100 dark:border-red-900/40"
              >
                {stepData.beforeDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Kubernetes Cluster */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ✅ K8s 적용 후 (Orchestrated Cluster)
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                자가 복구 및 자동 확장 지원
              </span>
            </div>

            {/* SVG Workspace */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 400 320" className="w-full h-auto">
                <defs>
                  <linearGradient id="gradHealthy" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#047857" stop-opacity="0.05" />
                  </linearGradient>
                  <linearGradient id="gradCrashed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ef4444" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#b91c1c" stop-opacity="0.05" />
                  </linearGradient>
                  <linearGradient id="gradWarning" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#b45309" stop-opacity="0.05" />
                  </linearGradient>
                  <linearGradient id="gradInfo" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.05" />
                  </linearGradient>
                  <linearGradient id="gradV2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="#6d28d9" stop-opacity="0.05" />
                  </linearGradient>
                </defs>

                <rect x="0" y="0" width="400" height="320" fill="none" />

                {/* K8s Boundary Box */}
                <rect x="100" y="80" width="285" height="230" rx="12" className="fill-none stroke-emerald-500/20 stroke-1 stroke-dashed" />
                <text x="242.5" y="98" textAnchor="middle" className="text-[10.5px] font-bold fill-emerald-500/50 uppercase tracking-wider select-none">☸️ KUBERNETES BOUNDARY</text>

                {/* Client Node */}
                <rect x="20" y="135" width="65" height="50" rx="8" className="fill-card stroke-border" />
                <text x="52.5" y="160" textAnchor="middle" className="text-xl select-none">💻</text>
                <text x="52.5" y="176" textAnchor="middle" className="text-[9px] font-bold fill-foreground select-none">Client</text>

                {/* Control Plane (Master Node) */}
                <rect x="130" y="12" width="180" height="58" rx="8" className="fill-card stroke-primary/30" />
                <text x="220" y="24" textAnchor="middle" className="text-[11px] font-extrabold fill-primary/80 uppercase select-none">🧠 Control Plane (Master)</text>
                
                {/* Master Component Sub-boxes */}
                <rect x="138" y="34" width="78" height="30" rx="4" className="fill-muted/40 stroke-border" />
                <text x="177" y="45" textAnchor="middle" className="text-[9.5px] font-bold fill-foreground select-none">API Server</text>
                <text x="177" y="56" textAnchor="middle" className="text-[8px] font-mono fill-muted-foreground select-none">Active</text>

                <rect x="224" y="34" width="78" height="30" rx="4" className="fill-muted/40 stroke-border" />
                <text x="263" y="45" textAnchor="middle" className="text-[9.5px] font-bold fill-foreground select-none">HPA Ctrl</text>
                <text x="263" y="56" textAnchor="middle" className="text-[8px] font-mono fill-muted-foreground select-none">
                  {activeStep === 4 ? "Active" : "Standby"}
                </text>

                {/* Service / Load Balancer */}
                <rect x="120" y="140" width="70" height="50" rx="8" className="fill-card stroke-emerald-500/50" />
                <text x="155" y="163" textAnchor="middle" className="text-xl select-none">⚖️</text>
                <text x="155" y="180" textAnchor="middle" className="text-[10px] font-extrabold fill-foreground select-none">Service (LB)</text>

                {/* Connection lines from Client -> Service */}
                <line x1={85} y1={160} x2={120} y2={160} stroke="#10b981" strokeWidth="1.5" />

                {/* Connection lines from Service -> Pods */}
                <line x1={190} y1={165} x2={220} y2={132.5} stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                <line x1={190} y1={165} x2={220} y2={187.5} stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                <line x1={190} y1={165} x2={220} y2={242.5} stroke="#34d399" strokeWidth="1" strokeDasharray="2 2" />
                {activeStep === 4 && subStep >= 2 && (
                  <>
                    <line x1={190} y1={165} x2={300} y2={157.5} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={190} y1={165} x2={300} y2={212.5} stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                  </>
                )}

                {/* Deployment YAML File Transmission Animation */}
                {activeStep === 2 && (
                  <motion.g
                    key="yaml-fly"
                    initial={{ x: 52.5, y: 160, scale: 0.5, opacity: 0 }}
                    animate={{
                      x: [52.5, 120, 177],
                      y: [160, 90, 46],
                      scale: [0.5, 0.9, 0.7],
                      opacity: [0, 1, 1, 0]
                    }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <rect x={-10} y={-14} width={20} height={26} rx={2} fill="#fff" stroke="#3b82f6" strokeWidth={1.5} filter="url(#shadow)" />
                    <line x1={-6} y1={-8} x2={6} y2={-8} stroke="#3b82f6" strokeWidth={1} />
                    <line x1={-6} y1={-3} x2={3} y2={-3} stroke="#3b82f6" strokeWidth={1} />
                    <line x1={-6} y1={2} x2={0} y2={2} stroke="#3b82f6" strokeWidth={1} />
                    <text x={0} y={10} textAnchor="middle" className="text-[5.5px] fill-blue-500 font-bold font-mono select-none">YAML</text>
                  </motion.g>
                )}

                {/* Self-Healing Signals (Kubelet <-> API Server) */}
                {activeStep === 3 && subStep === 1 && (
                  <>
                    {/* Failed Pod 1 -> API Server (Report) */}
                    <motion.path
                      key="report-path"
                      d="M 220 120 Q 165 80 177 48"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                      animate={{ strokeDashoffset: [20, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                    {/* API Server -> Pod 1 (Re-create directive) */}
                    <motion.path
                      key="recreate-path"
                      d="M 177 48 Q 200 90 220 125"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.8"
                      strokeDasharray="5 3"
                      animate={{ strokeDashoffset: [-25, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </>
                )}

                {/* HPA Scaling Signal (HPA Ctrl -> Pod 4, 5) */}
                {activeStep === 4 && subStep === 1 && (
                  <g key="hpa-signals">
                    <motion.path
                      d="M 263 48 Q 285 90 305 135"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      animate={{ strokeDashoffset: [-20, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.path
                      d="M 263 48 Q 310 100 315 190"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                      animate={{ strokeDashoffset: [-20, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    />
                  </g>
                )}

                {/* Traffic Packets Flowing to Pods */}
                {getActivePodDestinations().map((dest, index) => {
                  const delay = index * 0.45;
                  // 롤링 업데이트 시 v2 패킷(보라색)과 v1 패킷(초록색) 대조
                  let color = "#10b981";
                  if (activeStep === 5) {
                    if (subStep === 0 && dest.id === 1) color = "#8b5cf6";
                    else if (subStep === 1 && dest.id <= 3) color = "#8b5cf6";
                    else if (subStep >= 2) color = "#8b5cf6";
                  }
                  
                  return (
                    <motion.circle
                      key={`packet-k8s-${dest.id}-${index}-${activeStep}-${subStep}`}
                      cx={52.5}
                      cy={160}
                      r={3}
                      fill={color}
                      animate={{
                        cx: [52.5, 155, dest.x],
                        cy: [160, 165, dest.y],
                        opacity: [1, 1, 0.8, 0]
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        delay: delay,
                        ease: "easeInOut"
                      }}
                    />
                  );
                })}

                {/* Render Worker Node Pods */}
                {renderPodNode(1, 220, 110)}
                {renderPodNode(2, 220, 165)}
                {renderPodNode(3, 220, 220)}
                {renderPodNode(4, 300, 135)}
                {renderPodNode(5, 300, 190)}
              </svg>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {stepData && (
              <motion.p
                key={activeStep}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-4 bg-emerald-50/20 dark:bg-emerald-950/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40"
              >
                {stepData.afterDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
