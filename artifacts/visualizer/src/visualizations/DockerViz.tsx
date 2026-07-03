import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";

const PHASE_DURATION = 6000; // 6 seconds per phase

const STEPS = [
  {
    title: "1. 배포 과정 (Deployment Process)",
    traditionalTitle: "전통적 패키지 배포",
    traditionalDesc: "서버에 직접 라이브러리 및 런타임을 구성합니다. 다른 앱과의 라이브러리 충돌(예: Python 2.7 vs 3.11)이나 호스트 환경의 불일치로 인해 로컬에서 잘 작동하던 코드가 배포 과정에서 예상치 못한 오류를 일으키는 현상이 빈번합니다.",
    dockerTitle: "Docker 컨테이너 배포",
    dockerDesc: "애플리케이션 소스코드와 실행에 필요한 모든 의존성을 단일 이미지로 완전히 격리하여 패키징합니다. 운영 환경에서는 오직 docker run 명령어 한 줄만으로 로컬과 100% 일치하는 환경을 즉각 실행합니다.",
  },
  {
    title: "2. 로그 분석 (Log Analysis)",
    traditionalTitle: "분산 파일 로그 관리",
    traditionalDesc: "각 애플리케이션마다 다른 경로에 로그를 저장하므로 (/var/log/app_a.log, /var/log/app_b.log) 개발자가 개별 서버에 SSH로 직접 접속하여 산재된 로그 파일들을 찾아다니며 tail 명령어로 수동 분석해야 합니다.",
    dockerTitle: "컨테이너 표준 출력 수집",
    dockerDesc: "컨테이너 내부의 모든 출력을 stdout/stderr 스트림으로 표준화하여 수집합니다. 운영 도구나 개발자는 단순히 docker logs 명령어를 사용해 개별 컨테이너 로그를 즉시 통합 조회할 수 있습니다.",
  },
  {
    title: "3. 헬스체크 (Health Checks)",
    traditionalTitle: "수동 프로세스 감시",
    traditionalDesc: "프로세스가 중단되거나 지연 응답 등의 비정상 상태에 빠져도 시스템이 이를 자동으로 감지하여 복구하기 어렵습니다. 자동 재기동 스크립트를 별도로 준비하지 않는 한, 관리자가 장애를 발견하고 대처할 때까지 장애 시간이 길어집니다.",
    dockerTitle: "Docker 엔진 자가 치유",
    dockerDesc: "Dockerfile 내에 HEALTHCHECK 문법으로 정의된 주기적 헬스 체크를 기반으로 Docker 데몬이 컨테이너의 정상 작동 여부를 직접 진단합니다. 비정상 상태가 감지되면 시스템이 스스로 자동 재시작(Self-Healing)을 수행합니다.",
  },
  {
    title: "4. 볼륨 관리 (Volume Management)",
    traditionalTitle: "호스트 내 디스크 파편화",
    traditionalDesc: "애플리케이션이 생성하는 업로드 파일, 설정 파일, 데이터베이스 데이터 등이 호스트 서버 파일시스템 내부에 산재되어 적재됩니다. 서버 교체나 백업 시 어떤 데이터가 어디에 보존되어 있는지 파편화되어 관리가 복잡해집니다.",
    dockerTitle: "격리형 볼륨 마운트",
    dockerDesc: "호스트 시스템과 컨테이너가 논리적으로 분리된 전용 볼륨을 마운트하여 관리합니다. 컨테이너가 수정, 삭제, 재생성되더라도 영구 데이터는 독립된 볼륨 영역에 안전하게 보존되며 이관과 백업이 용이합니다.",
  },
];

export default function DockerViz() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  // Auto-play cycling logic with 50ms interval for smooth progress bar transition
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 50;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev + intervalTime >= PHASE_DURATION) {
          setActiveStep((step) => (step + 1) % STEPS.length);
          return 0;
        }
        return prev + intervalTime;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleSelectPhase = (index: number) => {
    setActiveStep(index);
    setElapsed(0);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const currentStep = STEPS[activeStep];

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors duration-300">
      
      {/* HUD Control Banner */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-4 space-y-3 shadow-inner">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Controls: Play/Pause and Selector Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
              aria-label={isPlaying ? "Pause auto-cycle" : "Play auto-cycle"}
            >
              {isPlaying ? (
                <Pause size={16} className="fill-slate-700 dark:fill-slate-300 stroke-none" />
              ) : (
                <Play size={16} className="fill-slate-700 dark:fill-slate-300 stroke-none" />
              )}
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-250 dark:border-slate-800">
              {STEPS.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPhase(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    activeStep === idx
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {idx + 1}. {step.title.split(" (")[0].replace(/^\d+\.\s*/, "")}
                </button>
              ))}
            </div>
          </div>

          {/* Phase Title Indicator */}
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {currentStep.title}
          </div>
        </div>

        {/* Transition Countdown Progress Bar */}
        <div className="relative w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-slate-700 dark:bg-slate-300 transition-all duration-75"
            style={{ width: `${(elapsed / PHASE_DURATION) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Unified Visualization Diagram (Single SVG Canvas) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm overflow-hidden flex items-center justify-center">
        <svg viewBox="0 0 900 370" className="w-full h-auto max-w-full text-slate-900 dark:text-slate-100">
          
          {/* Middle Divider */}
          <line
            x1="450"
            y1="10"
            x2="450"
            y2="360"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Top Headers */}
          <text
            x="225"
            y="30"
            textAnchor="middle"
            className="text-sm font-bold fill-rose-600 dark:fill-rose-400"
          >
            전통적 인프라 (Non-Docker)
          </text>
          <text
            x="675"
            y="30"
            textAnchor="middle"
            className="text-sm font-bold fill-emerald-650 dark:fill-emerald-450"
          >
            Docker 컨테이너 환경
          </text>

          {/* Dynamic SVG Visuals based on activeStep */}
          <AnimatePresence mode="wait">
            
            {/* Step 0: Deployment Process */}
            {activeStep === 0 && (
              <g key="svg-step-deployment">
                {/* TRADITIONAL (LEFT) */}
                {/* Local Developer PC */}
                <rect x="30" y="130" width="140" height="80" rx="6" className="fill-slate-50 dark:fill-slate-850 stroke-slate-250 dark:stroke-slate-750" strokeWidth="1" />
                <text x="100" y="162" textAnchor="middle" className="text-[13px] font-semibold fill-slate-700 dark:fill-slate-350">💻 Local PC</text>
                <text x="100" y="185" textAnchor="middle" className="text-[11px] fill-slate-400 font-mono">Python 3.11</text>

                {/* VM Server */}
                <rect x="220" y="70" width="200" height="270" rx="8" className="fill-rose-500/[0.02] stroke-rose-250 dark:stroke-rose-900/30" strokeWidth="1.5" />
                <text x="320" y="95" textAnchor="middle" className="text-[13px] font-bold fill-rose-600 dark:fill-rose-400">VM Server (Host)</text>
                
                {/* App A */}
                <rect x="235" y="115" width="170" height="70" rx="4" className="fill-slate-50/60 dark:fill-slate-900/60 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <text x="320" y="145" textAnchor="middle" className="text-[12px] font-medium fill-slate-700 dark:fill-slate-300">App A</text>
                <text x="320" y="165" textAnchor="middle" className="text-[10px] fill-slate-500 font-mono">Python 2.7</text>

                {/* App B (Failed Deployment due to Python version conflict) */}
                <rect x="235" y="200" width="170" height="120" rx="4" className="fill-rose-50/50 dark:fill-rose-950/20 stroke-rose-450 dark:stroke-rose-800/60" strokeWidth="1" />
                <text x="320" y="228" textAnchor="middle" className="text-[12px] font-bold fill-rose-700 dark:fill-rose-400">App B (Deploy)</text>
                <text x="320" y="252" textAnchor="middle" className="text-[12px] font-bold fill-rose-600 dark:fill-rose-400">⚠️ Conflict</text>
                <text x="320" y="278" textAnchor="middle" className="text-[10px] fill-rose-700 dark:fill-rose-400 font-mono">Host: Py 2.7</text>
                <text x="320" y="298" textAnchor="middle" className="text-[9.5px] fill-slate-400">Required: Py 3.11</text>

                {/* Flow Animation (Code push to VM Server) */}
                <motion.circle
                  key={`dep-trad-particle-${activeStep}`}
                  cx={170}
                  cy={170}
                  r={4}
                  className="fill-rose-500"
                  animate={{ cx: [170, 235], cy: [170, 260], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />


                {/* DOCKER (RIGHT) */}
                {/* Local Developer PC */}
                <rect x="475" y="130" width="140" height="80" rx="6" className="fill-slate-50 dark:fill-slate-850 stroke-slate-250 dark:stroke-slate-750" strokeWidth="1" />
                <text x="545" y="162" textAnchor="middle" className="text-[13px] font-semibold fill-slate-700 dark:fill-slate-350">💻 Local PC</text>
                <text x="545" y="185" textAnchor="middle" className="text-[11px] fill-emerald-600 dark:fill-emerald-400 font-mono">docker build</text>

                {/* Registry Container */}
                <rect x="635" y="50" width="110" height="60" rx="4" className="fill-slate-50 dark:fill-slate-850 stroke-slate-250 dark:stroke-slate-750" strokeWidth="1" />
                <text x="690" y="76" textAnchor="middle" className="text-[12px] font-bold fill-slate-600 dark:fill-slate-400">📦 Registry</text>
                <text x="690" y="96" textAnchor="middle" className="text-[10px] font-mono fill-emerald-600 dark:fill-emerald-400">image v1.0</text>

                {/* Docker Host */}
                <rect x="765" y="70" width="115" height="270" rx="8" className="fill-emerald-500/[0.02] stroke-emerald-250 dark:stroke-emerald-900/30" strokeWidth="1.5" />
                <text x="822.5" y="95" textAnchor="middle" className="text-[13px] font-bold fill-emerald-650 dark:fill-emerald-400">Docker Host</text>

                {/* Container A (Py 2.7) */}
                <rect x="775" y="115" width="95" height="75" rx="4" className="fill-emerald-50/20 dark:fill-emerald-950/10 stroke-emerald-500/50" strokeWidth="1" />
                <text x="822.5" y="142" textAnchor="middle" className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300">Container A</text>
                <text x="822.5" y="162" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Python 2.7 ✓</text>

                {/* Container B (Py 3.11) */}
                <rect x="775" y="205" width="95" height="85" rx="4" className="fill-emerald-50/20 dark:fill-emerald-950/10 stroke-emerald-500" strokeWidth="1.2" />
                <text x="822.5" y="232" textAnchor="middle" className="text-[11px] font-bold fill-emerald-700 dark:fill-emerald-400">Container B</text>
                <text x="822.5" y="252" textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">Python 3.11 ✓</text>
                <text x="822.5" y="272" textAnchor="middle" className="text-[9.5px] fill-emerald-600 dark:fill-emerald-400 font-semibold font-mono">Clean Run</text>

                {/* Flow Animation (Build to Registry, and Pull to Host) */}
                <motion.circle
                  key={`dep-doc-particle-1-${activeStep}`}
                  cx={615}
                  cy={170}
                  r={4}
                  className="fill-emerald-500"
                  animate={{ cx: [615, 635], cy: [170, 80], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  key={`dep-doc-particle-2-${activeStep}`}
                  cx={690}
                  cy={110}
                  r={4}
                  className="fill-emerald-500"
                  animate={{ cx: [690, 775], cy: [110, 247], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                />
              </g>
            )}

            {/* Step 1: Log Analysis */}
            {activeStep === 1 && (
              <g key="svg-step-logs">
                {/* TRADITIONAL (LEFT) */}
                {/* Scattered log files */}
                <rect x="20" y="60" width="165" height="70" rx="4" className="fill-rose-50/30 dark:fill-rose-950/10 stroke-rose-200 dark:stroke-rose-800/40" strokeWidth="1" />
                <text x="102.5" y="88" textAnchor="middle" className="text-[11px] font-mono fill-rose-700 dark:fill-rose-400">/var/log/app_a.log</text>
                <text x="102.5" y="110" textAnchor="middle" className="text-[10px] fill-slate-400">DB connection active</text>

                <rect x="20" y="145" width="165" height="70" rx="4" className="fill-rose-50/30 dark:fill-rose-950/10 stroke-rose-200 dark:stroke-rose-800/40" strokeWidth="1" />
                <text x="102.5" y="173" textAnchor="middle" className="text-[11px] font-mono fill-rose-700 dark:fill-rose-400">/var/log/app_b.log</text>
                <text x="102.5" y="195" textAnchor="middle" className="text-[10px] fill-rose-650">ERR: API port block</text>

                <rect x="20" y="230" width="165" height="70" rx="4" className="fill-rose-50/30 dark:fill-rose-950/10 stroke-rose-200 dark:stroke-rose-800/40" strokeWidth="1" />
                <text x="102.5" y="258" textAnchor="middle" className="text-[11px] font-mono fill-rose-700 dark:fill-rose-400">/var/log/nginx.log</text>
                <text x="102.5" y="280" textAnchor="middle" className="text-[10px] fill-rose-650">502 Bad Gateway</text>

                {/* Developer terminal console */}
                <rect x="215" y="55" width="210" height="270" rx="6" className="fill-slate-950 stroke-slate-800" strokeWidth="1.5" />
                <text x="228" y="83" className="text-[11px] fill-slate-400 font-mono">$ ssh dev-server</text>
                <text x="228" y="108" className="text-[11px] fill-slate-400 font-mono">$ tail -f /var/log/app_a.log</text>
                <text x="228" y="128" className="text-[10px] fill-slate-500 font-mono">15:27:00 [DB] OK</text>
                <text x="228" y="155" className="text-[11px] fill-slate-400 font-mono">$ tail -f /var/log/app_b.log</text>
                <text x="228" y="175" className="text-[10px] fill-rose-450 font-mono">15:27:01 [ERR] Port blocked</text>
                <text x="228" y="203" className="text-[11px] fill-slate-400 font-mono">$ cat /var/log/nginx.log</text>
                <text x="228" y="223" className="text-[10px] fill-rose-450 font-mono">15:27:02 [ERR] 502 Gateway</text>
                <text x="228" y="255" className="text-[11px] fill-rose-500/80 font-bold font-mono">⚠️ Dev must search paths</text>

                {/* Dashed Red search lines */}
                <line x1="185" y1="95" x2="215" y2="120" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
                <line x1="185" y1="180" x2="215" y2="165" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
                <line x1="185" y1="265" x2="215" y2="210" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />


                {/* DOCKER (RIGHT) */}
                {/* Isolated Containers streaming logs */}
                <rect x="475" y="70" width="140" height="75" rx="4" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="1" />
                <text x="545" y="98" textAnchor="middle" className="text-[12px] font-bold fill-slate-700 dark:fill-slate-350">Container A</text>
                <text x="545" y="120" textAnchor="middle" className="text-[10px] fill-emerald-600 dark:fill-emerald-400 font-mono">stdout: API active</text>

                <rect x="475" y="200" width="140" height="75" rx="4" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="1" />
                <text x="545" y="228" textAnchor="middle" className="text-[12px] font-bold fill-slate-700 dark:fill-slate-350">Container B</text>
                <text x="545" y="250" textAnchor="middle" className="text-[10px] fill-emerald-600 dark:fill-emerald-400 font-mono">stdout: DB ready</text>

                {/* Central Docker Engine collector */}
                <rect x="645" y="130" width="105" height="85" rx="6" className="fill-slate-50 dark:fill-slate-850 stroke-slate-250 dark:stroke-slate-750" strokeWidth="1" />
                <text x="697.5" y="162" textAnchor="middle" className="text-[13px] font-bold fill-slate-700 dark:fill-slate-300">Docker</text>
                <text x="697.5" y="185" textAnchor="middle" className="text-[10.5px] fill-emerald-600 font-mono">Log Collector</text>

                {/* Unified Terminal display */}
                <rect x="770" y="55" width="115" height="270" rx="6" className="fill-slate-950 stroke-slate-800" strokeWidth="1.5" />
                <text x="778" y="80" className="text-[10px] fill-emerald-400 font-mono">$ docker logs -f</text>
                <text x="778" y="105" className="text-[9px] fill-slate-300 font-mono">A | API active</text>
                <text x="778" y="125" className="text-[9px] fill-slate-300 font-mono">B | DB ready</text>
                <text x="778" y="145" className="text-[9px] fill-slate-300 font-mono">A | GET /health 200</text>
                <text x="778" y="165" className="text-[9px] fill-slate-350 font-mono">B | pool limit check</text>
                <text x="778" y="210" className="text-[9.5px] fill-emerald-450 font-bold font-mono">✓ Unified log</text>
                <text x="778" y="230" className="text-[9.5px] fill-emerald-450 font-bold font-mono">✓ Single stream</text>

                {/* Flow Animation (Logs piped to Docker daemon and terminal) */}
                <motion.circle
                  key={`log-doc-flow-a-${activeStep}`}
                  cx={615}
                  cy={107}
                  r={3}
                  className="fill-emerald-500"
                  animate={{ cx: [615, 645], cy: [107, 172], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  key={`log-doc-flow-b-${activeStep}`}
                  cx={615}
                  cy={237}
                  r={3}
                  className="fill-emerald-500"
                  animate={{ cx: [615, 645], cy: [237, 172], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  key={`log-doc-flow-daemon-${activeStep}`}
                  cx={750}
                  cy={172}
                  r={3}
                  className="fill-emerald-500"
                  animate={{ cx: [750, 770], cy: [172, 172], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />
              </g>
            )}

            {/* Step 2: Health Check */}
            {activeStep === 2 && (
              <g key="svg-step-health">
                {/* TRADITIONAL (LEFT) */}
                {/* App Process Crashed */}
                <rect x="30" y="80" width="180" height="120" rx="6" className="fill-rose-500/10 stroke-rose-500" strokeWidth="1" />
                <text x="120" y="110" textAnchor="middle" className="text-[13px] fill-slate-700 dark:fill-slate-350">App (PID 9122)</text>
                <text x="120" y="140" textAnchor="middle" className="text-[15px] font-bold fill-rose-600">🔴 Frozen</text>
                <text x="120" y="165" textAnchor="middle" className="text-[10.5px] fill-slate-400">Process hangs on 80</text>
                <text x="120" y="185" textAnchor="middle" className="text-[10.5px] fill-slate-400">Response timeout</text>

                {/* Inactive System Monitor */}
                <rect x="240" y="80" width="180" height="120" rx="6" className="fill-slate-50 dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <text x="330" y="110" textAnchor="middle" className="text-[13px] font-bold fill-slate-660 dark:fill-slate-400">System Monitor</text>
                <text x="330" y="140" textAnchor="middle" className="text-[12px] font-bold fill-rose-600 dark:fill-rose-450">⚠️ Warning Alert</text>
                <text x="330" y="165" textAnchor="middle" className="text-[10.5px] fill-slate-500">No auto-healing</text>
                <text x="330" y="185" textAnchor="middle" className="text-[10.5px] fill-slate-500">Manual restart needed</text>

                {/* downtime warning panel */}
                <rect x="30" y="220" width="390" height="95" rx="6" className="fill-rose-50/20 dark:fill-rose-950/10 stroke-rose-200 dark:stroke-rose-900/30" strokeWidth="1" />
                <text x="225" y="248" textAnchor="middle" className="text-[13px] font-bold fill-rose-700 dark:fill-rose-400">서비스 중단 상태 (Downtime)</text>
                <text x="225" y="272" textAnchor="middle" className="text-[10.5px] fill-slate-500">
                  <tspan x="225" dy="0">담당자가 알림 수신 후 직접 SSH에 진입할 때까지</tspan>
                  <tspan x="225" dy="18">서버가 중단 상태로 방치됩니다 (수동 복구 필요).</tspan>
                </text>

                {/* Alarm Pulse animation */}
                <motion.line
                  key={`hc-trad-alarm-${activeStep}`}
                  x1={210}
                  y1={140}
                  x2={240}
                  y2={140}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />


                {/* DOCKER (RIGHT) */}
                {/* Unhealthy Container to Self-Healing */}
                <rect x="480" y="80" width="180" height="120" rx="6" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="1" />
                <text x="570" y="110" textAnchor="middle" className="text-[13px] font-bold fill-slate-700 dark:fill-slate-350">Container A</text>
                <text x="570" y="140" textAnchor="middle" className="text-[13.5px] font-bold fill-emerald-650 dark:fill-emerald-450">🟢 Auto Healing</text>
                <text x="570" y="165" textAnchor="middle" className="text-[10.5px] fill-slate-400 font-mono">HEALTHCHECK:</text>
                <text x="570" y="185" textAnchor="middle" className="text-[9px] font-mono fill-emerald-600 dark:fill-emerald-400">CMD curl -f http://localhost/</text>

                {/* Docker daemon watching */}
                <rect x="690" y="80" width="180" height="120" rx="6" className="fill-slate-50 dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <text x="780" y="110" textAnchor="middle" className="text-[13px] font-bold fill-slate-650 dark:fill-slate-400">Docker Daemon</text>
                <text x="780" y="140" textAnchor="middle" className="text-[12px] font-bold fill-emerald-600 dark:fill-emerald-450">✓ Auto Watchdog</text>
                <text x="780" y="165" textAnchor="middle" className="text-[10.5px] fill-slate-500">Detects failure status</text>
                <text x="780" y="185" textAnchor="middle" className="text-[10.5px] fill-slate-500">Triggers container restart</text>

                {/* self-healing indicator panel */}
                <rect x="480" y="220" width="390" height="95" rx="6" className="fill-emerald-500/[0.02] stroke-emerald-250 dark:stroke-emerald-900/30" strokeWidth="1" />
                <text x="675" y="248" textAnchor="middle" className="text-[13px] font-bold fill-emerald-700 dark:fill-emerald-400">자가 복구 완료 (Self-Healing Success)</text>
                <text x="675" y="272" textAnchor="middle" className="text-[10.5px] fill-slate-500">
                  <tspan x="675" dy="0">컨테이너 비정상 상태 감지 시, Docker 데몬이</tspan>
                  <tspan x="675" dy="18">수초 이내에 해당 격리 프로세스를 자동 재기동합니다.</tspan>
                </text>

                {/* Heartbeat pulse animation */}
                <motion.path
                  key={`hc-doc-pulse-${activeStep}`}
                  d="M 660 140 L 668 140 L 672 125 L 676 155 L 680 135 L 684 145 L 688 140 L 690 140"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="30"
                  animate={{ strokeDashoffset: [60, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </g>
            )}

            {/* Step 3: Volume Management */}
            {activeStep === 3 && (
              <g key="svg-step-volume">
                {/* TRADITIONAL (LEFT) */}
                {/* App Service writing to host disk */}
                <rect x="30" y="110" width="140" height="90" rx="4" className="fill-slate-50 dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <text x="100" y="148" textAnchor="middle" className="text-[13px] font-bold fill-slate-700 dark:fill-slate-350">App Service</text>
                <text x="100" y="170" textAnchor="middle" className="text-[10.5px] fill-slate-400 font-mono">Local Disk I/O</text>

                {/* Cluttered Host Directory */}
                <rect x="215" y="70" width="210" height="245" rx="6" className="fill-rose-500/[0.02] stroke-rose-250 dark:stroke-rose-900/30" strokeWidth="1.5" />
                <text x="320" y="98" textAnchor="middle" className="text-[13px] font-bold fill-rose-700 dark:fill-rose-400">Host File System</text>

                {/* Files scattered in paths */}
                <rect x="225" y="115" width="190" height="45" rx="3" className="fill-rose-50/50 dark:fill-rose-950/20 stroke-rose-450" strokeWidth="1" />
                <text x="320" y="141" textAnchor="middle" className="text-[10.5px] font-mono fill-rose-800 dark:fill-rose-400">/var/www/uploads/img.jpg</text>

                <rect x="225" y="175" width="190" height="45" rx="3" className="fill-rose-50/50 dark:fill-rose-950/20 stroke-rose-450" strokeWidth="1" />
                <text x="320" y="201" textAnchor="middle" className="text-[10.5px] font-mono fill-rose-800 dark:fill-rose-400">/etc/app/config.json</text>

                <rect x="225" y="235" width="190" height="45" rx="3" className="fill-rose-50/50 dark:fill-rose-950/20 stroke-rose-450" strokeWidth="1" />
                <text x="320" y="261" textAnchor="middle" className="text-[10.5px] font-mono fill-rose-800 dark:fill-rose-400">/var/lib/mysql/ibdata1</text>

                {/* Writing particle animation */}
                <motion.circle
                  key={`vol-trad-flow-1-${activeStep}`}
                  cx={170}
                  cy={140}
                  r={3.5}
                  className="fill-rose-400"
                  animate={{ cx: [170, 225], cy: [140, 138], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  key={`vol-trad-flow-2-${activeStep}`}
                  cx={170}
                  cy={160}
                  r={3.5}
                  className="fill-rose-400"
                  animate={{ cx: [170, 225], cy: [160, 198], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                {/* DOCKER (RIGHT) */}
                {/* Isolated Container with Mount */}
                <rect x="475" y="100" width="140" height="110" rx="6" className="fill-emerald-500/10 stroke-emerald-500" strokeWidth="1" />
                <text x="545" y="135" textAnchor="middle" className="text-[13px] font-bold fill-slate-700 dark:fill-slate-350">Container A</text>
                <text x="545" y="160" textAnchor="middle" className="text-[10.5px] fill-slate-400">Mount Target:</text>
                <text x="545" y="185" textAnchor="middle" className="text-[12px] font-mono fill-emerald-650 dark:fill-emerald-400">/app/data</text>

                {/* Standard Docker Volume */}
                <rect x="720" y="100" width="150" height="110" rx="6" className="fill-slate-50 dark:fill-slate-850 stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
                <text x="795" y="130" textAnchor="middle" className="text-[13px] font-bold fill-slate-650 dark:fill-slate-400">Docker Volume</text>
                <text x="795" y="158" textAnchor="middle" className="text-[12px] font-bold fill-emerald-650 dark:fill-emerald-450">my_shared_vol</text>
                <text x="795" y="185" textAnchor="middle" className="text-[11px] fill-emerald-600 font-semibold">✓ Safe on delete</text>

                {/* Bridging line with text */}
                <line x1={615} y1={155} x2={720} y2={155} stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />
                <text x="667.5" y="147" textAnchor="middle" className="text-[9.5px] fill-emerald-650 font-bold font-mono">Mount (-v)</text>

                {/* Persistent Data info panel */}
                <rect x="475" y="225" width="395" height="95" rx="6" className="fill-emerald-500/[0.02] stroke-emerald-250 dark:stroke-emerald-900/30" strokeWidth="1" />
                <text x="672.5" y="253" textAnchor="middle" className="text-[13px] font-bold fill-emerald-700 dark:fill-emerald-400">데이터 보존 (Data Persistence)</text>
                <text x="672.5" y="275" textAnchor="middle" className="text-[10.5px] fill-slate-500">
                  <tspan x="672.5" dy="0">docker rm으로 컨테이너를 삭제해도 볼륨 데이터는 안전하며,</tspan>
                  <tspan x="672.5" dy="18">새 컨테이너 실행 시 동일 볼륨을 연결하여 데이터를 복구합니다.</tspan>
                </text>

                {/* Volume write particle animation */}
                <motion.circle
                  key={`vol-doc-flow-${activeStep}`}
                  cx={615}
                  cy={155}
                  r={3.5}
                  className="fill-emerald-500"
                  animate={{ cx: [615, 720], cy: [155, 155], opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </g>
            )}
          </AnimatePresence>
        </svg>
      </div>

      {/* Detailed Description Cards stacked vertically */}
      <div className="space-y-4">
        
        {/* Traditional Infrastructure Card */}
        <div className="bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-5 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-450 font-semibold text-sm">
            <span>❌ Traditional Infrastructure:</span>
            <span className="font-medium text-xs text-rose-600/80 dark:text-rose-400/80">
              {currentStep.traditionalTitle}
            </span>
          </div>
          <p className="text-slate-650 dark:text-slate-350 text-sm leading-relaxed">
            {currentStep.traditionalDesc}
          </p>
        </div>

        {/* Dockerized Environment Card */}
        <div className="bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-5 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-450 font-semibold text-sm">
            <span>🐳 Dockerized Environment:</span>
            <span className="font-medium text-xs text-emerald-600/80 dark:text-emerald-400/80">
              {currentStep.dockerTitle}
            </span>
          </div>
          <p className="text-slate-650 dark:text-slate-350 text-sm leading-relaxed">
            {currentStep.dockerDesc}
          </p>
        </div>

      </div>

    </div>
  );
}
