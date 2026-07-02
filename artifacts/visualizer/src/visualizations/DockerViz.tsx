import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  {
    title: "1. 배포 과정 (Deployment Process)",
    traditionalDesc: "전통적인 수동 배포: 서버에 직접 소스 코드와 필요한 런타임을 구성합니다. 라이브러리 버전 충돌(Python 2.7 vs 3.11)이나 환경적 불일치로 배포가 자주 깨집니다.",
    dockerDesc: "Docker 배포: 의존성과 소스코드를 통째로 이미지로 빌드하여 레지스트리에 보관합니다. 운영 서버는 단 한 줄의 docker run 명령으로 로컬과 100% 동일한 환경을 띄웁니다.",
  },
  {
    title: "2. 유지보수: 로그 분석 (Log Analysis)",
    traditionalDesc: "전통적 로그 관리: 각 애플리케이션마다 로그 생성 경로가 다르므로 (/var/log/app_a.log, /var/log/app_b.log) 개발자는 각기 다른 파일을 직접 찾아다니며 tail 명령어를 수동으로 모니터링해야 합니다.",
    dockerDesc: "Docker 로그 관리: 모든 컨테이너 내부의 로그가 표준 출력(stdout/stderr)으로 단일화되어 수집됩니다. 개발자는 단지 docker logs <name> 명령어 하나만으로 즉각 확인이 가능합니다.",
  },
  {
    title: "3. 유지보수: 헬스체크 (Health Checks)",
    traditionalDesc: "전통적 상태 모니터링: 프로세스가 멈추거나 포트 응답이 지연되는 장애 발생 시, 자동 재시작 등의 처리를 하려면 별도의 크론탭 스크립트나 모니터링 데몬을 수동으로 작성해 올려야 합니다.",
    dockerDesc: "Docker 헬스체크: Dockerfile 내 HEALTHCHECK 선언에 따라 Docker 데몬이 실시간 주기로 컨테이너 상태를 직접 감시하고, 비정상 감지 시 컨테이너 재시작 등 자동 복구 작업을 수행합니다.",
  },
  {
    title: "4. 유지보수: 볼륨 관리 (Volume Management)",
    traditionalDesc: "전통적 파일 관리: 애플리케이션이 업로드하는 임시 데이터나 설정 파일이 호스트 파일시스템 곳곳에 뒤섞입니다. 서버를 이전하거나 백업 및 환경 정리를 하기가 대단히 곤란합니다.",
    dockerDesc: "Docker 볼륨 격리: 컨테이너와 완벽히 격리된 독립형 볼륨(docker volume)을 생성하여 마운트합니다. 컨테이너가 삭제되더라도 영구 데이터는 안전하게 보존되며 백업/이관이 극히 간편합니다.",
  },
];

export default function DockerViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  // Auto play logic
  useEffect(() => {
    if (!isPlaying) return;
    if (isComplete) {
      setIsPlaying(false);
      return;
    }
    const t = setTimeout(() => setActiveStep((p) => p + 1), 3500);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep, isComplete]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
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
          {`<`}
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "비교 시작" : "계속"}
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground disabled:opacity-40 transition-colors"
          data-testid="button-next"
        >
          {`>`}
        </button>
        <div className="flex-1 space-y-1">
          <div className="text-xs sm:text-sm text-muted-foreground font-medium">
            {activeStep >= 0 ? `단계 ${activeStep + 1} / ${total} — ${STEPS[activeStep].title}` : `총 ${total}단계`}
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

      {/* Visual Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Traditional VM / Bare-metal */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                ❌ 전통적 인프라 (Non-Docker)
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                버전 공유 및 파편화
              </span>
            </div>

            {/* 100% SVG for Traditional */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 400 280" className="w-full h-auto">
                <rect x="0" y="0" width="400" height="280" fill="none" />

                {/* Initial / Default state before comparisons start */}
                {activeStep < 0 && (
                  <g>
                    {/* Host server box */}
                    <rect x="60" y="30" width="280" height="220" rx="10" className="fill-muted/20 stroke-red-200 dark:stroke-red-900/50 stroke-1 stroke-dashed" />
                    <text x="200" y="60" textAnchor="middle" className="text-[10px] font-bold fill-red-500 uppercase tracking-wide">HOST OPERATING SYSTEM</text>
                    
                    {/* Shared libraries block */}
                    <rect x="90" y="80" width="220" height="50" rx="6" className="fill-red-100/50 dark:fill-red-900/20 stroke-red-300 dark:stroke-red-800/40 stroke-1" />
                    <text x="200" y="100" textAnchor="middle" className="text-xs font-bold fill-red-800 dark:fill-red-400">Shared OS / Runtimes</text>
                    <text x="200" y="118" textAnchor="middle" className="text-[9px] fill-muted-foreground font-mono">Python 2.7 vs Python 3.11 충돌</text>

                    {/* Apps */}
                    <rect x="90" y="150" width="100" height="50" rx="6" className="fill-card stroke-border" />
                    <text x="140" y="175" textAnchor="middle" className="text-[11px] font-bold fill-foreground">App A</text>
                    <text x="140" y="190" textAnchor="middle" className="text-[8px] fill-muted-foreground">Python 2.7</text>

                    <rect x="210" y="150" width="100" height="50" rx="6" className="fill-card stroke-border" />
                    <text x="260" y="175" textAnchor="middle" className="text-[11px] font-bold fill-foreground">App B</text>
                    <text x="260" y="190" textAnchor="middle" className="text-[8px] fill-muted-foreground">Python 3.11</text>
                  </g>
                )}

                {/* Step 0: Deployment Process */}
                {activeStep === 0 && (
                  <g>
                    {/* Developer PC */}
                    <rect x="20" y="120" width="80" height="50" rx="8" className="fill-card stroke-border" />
                    <text x="60" y="145" textAnchor="middle" className="text-lg">💻</text>
                    <text x="60" y="160" textAnchor="middle" className="text-[9px] font-bold fill-foreground">Local PC</text>

                    {/* VM Server */}
                    <rect x="220" y="60" width="150" height="170" rx="8" className="fill-muted/20 stroke-red-300 dark:stroke-red-900/50 stroke-1 stroke-dashed" />
                    <text x="295" y="80" textAnchor="middle" className="text-[9px] font-bold fill-red-500 tracking-wide">VM SERVER</text>

                    {/* Sized boxes inside VM */}
                    <rect x="235" y="100" width="120" height="40" rx="4" className="fill-card stroke-red-200 dark:stroke-red-900/30" />
                    <text x="295" y="120" textAnchor="middle" className="text-[9px] fill-red-600 dark:fill-red-400 font-mono">apt install python</text>
                    <text x="295" y="132" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">pip install -r req.txt</text>

                    <rect x="235" y="150" width="120" height="60" rx="4" className="fill-red-100/50 dark:fill-red-950/20 stroke-red-400 dark:stroke-red-800/40" />
                    <text x="295" y="172" textAnchor="middle" className="text-[10px] font-bold fill-red-700 dark:fill-red-400">⚠️ 버전 충돌</text>
                    <text x="295" y="186" textAnchor="middle" className="text-[8px] fill-muted-foreground">Python 버전 호환 실패</text>

                    {/* Code flow animation - Animating cx/cy properly to target VM left boundary */}
                    <motion.circle
                      key="trad-deploy-flow"
                      cx={100}
                      cy={145}
                      r={4}
                      className="fill-red-500"
                      animate={{ cx: [100, 220], cy: [145, 145] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </g>
                )}

                {/* Step 1: Log Analysis */}
                {activeStep === 1 && (
                  <g>
                    {/* Log Files Scattered - Sized up to 145 width */}
                    <rect x="20" y="60" width="145" height="60" rx="6" className="fill-card stroke-border" />
                    <text x="92.5" y="80" textAnchor="middle" className="text-[10px] font-bold fill-foreground">/var/log/app_a.log</text>
                    <text x="92.5" y="95" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">[ERROR] port 80 blocked</text>
                    <text x="92.5" y="108" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">2026-07-02 12:00:01</text>

                    <rect x="20" y="150" width="145" height="60" rx="6" className="fill-card stroke-border" />
                    <text x="92.5" y="170" textAnchor="middle" className="text-[10px] font-bold fill-foreground">/var/log/app_b.log</text>
                    <text x="92.5" y="185" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">127.0.0.1 - - GET /api</text>
                    <text x="92.5" y="198" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">HTTP/1.1 500 Error</text>

                    {/* Developer Terminal Box - Sized up to 145 width */}
                    <rect x="230" y="100" width="145" height="80" rx="6" className="fill-slate-900 stroke-slate-800 stroke-2" />
                    <text x="237" y="120" className="text-[7.5px] fill-slate-400 font-mono">$ ssh server -t "tail -f ..."</text>
                    <text x="237" y="135" className="text-[7px] fill-red-400 font-mono">Connection reset by peer</text>
                    <text x="237" y="150" className="text-[7.5px] fill-slate-400 font-mono">$ cat /var/log/nginx/error.log</text>
                    <text x="237" y="165" className="text-[7px] fill-yellow-400 font-mono">Warning: files are scattered</text>

                    {/* Manual lines of searching */}
                    <line x1="165" y1="90" x2="230" y2="120" stroke="currentColor" strokeDasharray="3 3" className="text-red-500/60 animate-pulse" />
                    <line x1="165" y1="180" x2="230" y2="160" stroke="currentColor" strokeDasharray="3 3" className="text-red-500/60 animate-pulse" />
                  </g>
                )}

                {/* Step 2: Health Check */}
                {activeStep === 2 && (
                  <g>
                    {/* App Process */}
                    <rect x="60" y="100" width="120" height="75" rx="8" className="fill-red-100/50 dark:fill-red-950/20 stroke-red-400 dark:stroke-red-800" />
                    <text x="120" y="125" textAnchor="middle" className="text-lg">🔴</text>
                    <text x="120" y="145" textAnchor="middle" className="text-[10px] font-bold fill-red-700 dark:fill-red-400">Process Frozen</text>
                    <text x="120" y="158" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">Port 8080 Hangs</text>

                    {/* Monitoring system missing or failing */}
                    <rect x="240" y="100" width="120" height="75" rx="8" className="fill-card stroke-border" />
                    <text x="300" y="125" textAnchor="middle" className="text-lg">⚠️</text>
                    <text x="300" y="145" textAnchor="middle" className="text-[10px] font-bold fill-muted-foreground">No Auto-Restart</text>
                    <text x="300" y="158" textAnchor="middle" className="text-[7px] fill-red-500 font-bold font-mono">Requires Manual SSH Check</text>

                    {/* Inactive connection line */}
                    <line x1="180" y1="137" x2="240" y2="137" stroke="currentColor" className="text-border" strokeWidth="2" strokeDasharray="2 2" />
                  </g>
                )}

                {/* Step 3: Volume Management */}
                {activeStep === 3 && (
                  <g>
                    {/* VM App */}
                    <rect x="50" y="100" width="110" height="60" rx="6" className="fill-card stroke-border" />
                    <text x="105" y="130" textAnchor="middle" className="text-xs font-bold fill-foreground">App Service</text>
                    <text x="105" y="145" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">Writes to local paths</text>

                    {/* Host FS clutter - Increased width to 160 */}
                    <rect x="210" y="60" width="160" height="150" rx="8" className="fill-muted/20 stroke-red-300 dark:stroke-red-900/40" />
                    <text x="290" y="80" textAnchor="middle" className="text-[9px] font-bold fill-red-500">HOST FILESYSTEM</text>

                    {/* Sized boxes and shorter names */}
                    <rect x="220" y="95" width="140" height="30" rx="4" className="fill-red-100/50 dark:fill-red-950/20 stroke-red-300 dark:stroke-red-800/40" />
                    <text x="290" y="113" textAnchor="middle" className="text-[8px] fill-red-800 dark:fill-red-400 font-mono">uploads/file.png</text>

                    <rect x="220" y="135" width="140" height="30" rx="4" className="fill-red-100/50 dark:fill-red-950/20 stroke-red-300 dark:stroke-red-800/40" />
                    <text x="290" y="153" textAnchor="middle" className="text-[8px] fill-red-800 dark:fill-red-400 font-mono">myapp/config.yaml</text>

                    <rect x="220" y="170" width="140" height="30" rx="4" className="fill-red-100/50 dark:fill-red-950/20 stroke-red-300 dark:stroke-red-800/40" />
                    <text x="290" y="188" textAnchor="middle" className="text-[8px] fill-red-800 dark:fill-red-400 font-mono">cache_db.tmp</text>

                    {/* Writing animation - Fixed cy property animation */}
                    <motion.circle
                      key="trad-vol-flow"
                      cx={160}
                      cy={130}
                      r={3}
                      className="fill-red-500"
                      animate={{ cx: [160, 220], cy: [130, 110] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.circle
                      key="trad-vol-flow-2"
                      cx={160}
                      cy={130}
                      r={3}
                      className="fill-red-400"
                      animate={{ cx: [160, 220], cy: [130, 150] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </g>
                )}
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
                {stepData.traditionalDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Docker Container */}
        <div className="border border-border rounded-2xl p-4 bg-muted/5 flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                ✅ Docker 적용 환경
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                컨테이너 격리 및 표준화
              </span>
            </div>

            {/* 100% SVG for Docker */}
            <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
              <svg viewBox="0 0 400 280" className="w-full h-auto">
                <rect x="0" y="0" width="400" height="280" fill="none" />

                {/* Initial / Default state before comparisons start */}
                {activeStep < 0 && (
                  <g>
                    {/* Docker Engine Box */}
                    <rect x="60" y="30" width="280" height="220" rx="10" className="fill-muted/20 stroke-emerald-200 dark:stroke-emerald-900/50 stroke-1 stroke-dashed" />
                    <text x="200" y="50" textAnchor="middle" className="text-[10px] font-bold fill-emerald-500 uppercase tracking-wide">🐳 DOCKER DAEMON (HOST PORT ISOLATION)</text>
                    
                    {/* Containers (Isolated) */}
                    <g>
                      <rect x="80" y="70" width="110" height="70" rx="8" className="fill-card stroke-emerald-400 stroke-2" />
                      <rect x="80" y="70" width="110" height="15" className="fill-emerald-500/10 rounded-t-[7px]" />
                      <text x="95" y="82" className="text-[7px] font-bold fill-emerald-700">Container A</text>
                      <text x="135" y="105" textAnchor="middle" className="text-[10px] font-bold fill-foreground">App A</text>
                      <text x="135" y="122" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">Python 2.7 ✓</text>
                    </g>

                    <g>
                      <rect x="210" y="70" width="110" height="70" rx="8" className="fill-card stroke-emerald-400 stroke-2" />
                      <rect x="210" y="70" width="110" height="15" className="fill-emerald-500/10 rounded-t-[7px]" />
                      <text x="225" y="82" className="text-[7px] font-bold fill-emerald-700">Container B</text>
                      <text x="265" y="105" textAnchor="middle" className="text-[10px] font-bold fill-foreground">App B</text>
                      <text x="265" y="122" textAnchor="middle" className="text-[8px] fill-muted-foreground font-mono">Python 3.11 ✓</text>
                    </g>

                    {/* Shared OS layer */}
                    <rect x="80" y="165" width="240" height="60" rx="6" className="fill-emerald-50/50 dark:fill-emerald-950/20 stroke-emerald-300 dark:stroke-emerald-800/40" />
                    <text x="200" y="185" textAnchor="middle" className="text-xs font-bold fill-emerald-800 dark:fill-emerald-400">Docker Engine</text>
                    <text x="200" y="205" textAnchor="middle" className="text-[9px] fill-muted-foreground">Host OS Kernel 공유 (프로세스 격리로 가볍고 빠름)</text>
                  </g>
                )}

                {/* Step 0: Deployment Process */}
                {activeStep === 0 && (
                  <g>
                    {/* Developer PC */}
                    <rect x="20" y="120" width="80" height="50" rx="8" className="fill-card stroke-border" />
                    <text x="60" y="145" textAnchor="middle" className="text-lg">💻</text>
                    <text x="60" y="160" textAnchor="middle" className="text-[9px] font-bold fill-foreground">docker build</text>

                    {/* Image Registry */}
                    <rect x="160" y="40" width="80" height="50" rx="6" className="fill-card stroke-emerald-500/40" />
                    <text x="200" y="65" textAnchor="middle" className="text-lg">📦</text>
                    <text x="200" y="80" textAnchor="middle" className="text-[9px] font-bold fill-foreground">Registry</text>

                    {/* Target Server */}
                    <rect x="290" y="120" width="80" height="80" rx="8" className="fill-emerald-500/10 stroke-emerald-500 stroke-2" />
                    <rect x="290" y="120" width="80" height="15" className="fill-emerald-500/20 rounded-t-[7px]" />
                    <text x="330" y="150" textAnchor="middle" className="text-xs">🐳</text>
                    <text x="330" y="170" textAnchor="middle" className="text-[8px] font-bold fill-foreground">Run Container</text>
                    <text x="330" y="185" textAnchor="middle" className="text-[7px] fill-emerald-600 dark:fill-emerald-400 font-mono">100% 환경 일치</text>

                    {/* Deploy animations - Fixed cy property animation */}
                    {/* Local to Registry */}
                    <motion.circle
                      key="doc-deploy-flow-1"
                      cx={100}
                      cy={145}
                      r={4}
                      className="fill-emerald-500"
                      animate={{ cx: [100, 160], cy: [145, 65] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    {/* Registry to Server */}
                    <motion.circle
                      key="doc-deploy-flow-2"
                      cx={240}
                      cy={65}
                      r={4}
                      className="fill-emerald-500"
                      animate={{ cx: [240, 290], cy: [65, 160] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
                    />
                  </g>
                )}

                {/* Step 1: Log Analysis */}
                {activeStep === 1 && (
                  <g>
                    {/* Container streaming stdout - Spaced symmetrically: x=30, width=100 (ends 130) */}
                    <rect x="30" y="90" width="100" height="60" rx="8" className="fill-card stroke-emerald-500 stroke-2" />
                    <text x="80" y="120" textAnchor="middle" className="text-lg">🐳</text>
                    <text x="80" y="140" textAnchor="middle" className="text-[8px] font-semibold fill-foreground">stdout / stderr</text>

                    {/* Docker Engine Gathering Logs - Spaced symmetrically: x=165, width=70 (ends 235) */}
                    <rect x="165" y="97" width="70" height="46" rx="4" className="fill-emerald-50/80 dark:fill-emerald-950/20 stroke-emerald-300 dark:stroke-emerald-800" />
                    <text x="200" y="125" textAnchor="middle" className="text-[8.5px] font-bold fill-emerald-700">Docker Daemon</text>

                    {/* Developer Terminal Box - Spaced symmetrically: x=270, width=100 */}
                    <rect x="270" y="80" width="100" height="80" rx="6" className="fill-slate-900 stroke-slate-800 stroke-2" />
                    <text x="276" y="100" className="text-[7.5px] fill-emerald-400 font-mono">$ docker logs app</text>
                    <text x="276" y="115" className="text-[6.5px] fill-slate-300 font-mono">12:00:01 [INFO] Init</text>
                    <text x="276" y="125" className="text-[6.5px] fill-slate-300 font-mono">12:00:02 [INFO] Ready</text>
                    <text x="276" y="135" className="text-[6.5px] fill-emerald-400 font-mono">✓ 로그 단일화 완료</text>

                    {/* Flowing animated lines with arrowheads - Distance 35px each */}
                    <motion.path
                      key="log-flow-path-1"
                      d="M 130 120 L 165 120"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      fill="none"
                      animate={{ strokeDashoffset: [-20, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    />
                    <polygon points="161,116 167,120 161,124" className="fill-emerald-500" />

                    <motion.path
                      key="log-flow-path-2"
                      d="M 235 120 L 270 120"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                      fill="none"
                      animate={{ strokeDashoffset: [-20, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    />
                    <polygon points="266,116 272,120 266,124" className="fill-emerald-500" />
                  </g>
                )}

                {/* Step 2: Health Check */}
                {activeStep === 2 && (
                  <g>
                    {/* Container Process */}
                    <rect x="70" y="90" width="110" height="80" rx="8" className="fill-card stroke-emerald-500 stroke-2" />
                    <rect x="70" y="90" width="110" height="15" className="fill-emerald-500/10 rounded-t-[7px]" />
                    <text x="125" y="125" textAnchor="middle" className="text-xl">🐳</text>
                    <text x="125" y="150" textAnchor="middle" className="text-[9px] font-bold fill-foreground">App Container</text>
                    <text x="125" y="162" textAnchor="middle" className="text-[7px] fill-muted-foreground font-mono">HEALTHCHECK CMD...</text>

                    {/* Docker Engine Supervising */}
                    <rect x="240" y="90" width="100" height="80" rx="8" className="fill-emerald-50/50 dark:fill-emerald-950/20 stroke-emerald-400 dark:stroke-emerald-800" />
                    <text x="290" y="112" textAnchor="middle" className="text-[10px] font-bold fill-emerald-800 dark:fill-emerald-400">Docker Daemon</text>
                    <text x="290" y="132" textAnchor="middle" className="text-[7px] fill-muted-foreground">감시 및 복구</text>
                    
                    {/* Automatic recovery text flash */}
                    <motion.text
                      key="heal-flash-text"
                      x="290"
                      y="155"
                      textAnchor="middle"
                      className="text-[8px] font-bold fill-emerald-600 dark:fill-emerald-400"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ✓ Auto-Restart OK
                    </motion.text>

                    {/* Pulsing heartbeat line */}
                    <motion.path
                      key="heartbeat-line"
                      d="M 180 130 L 195 130 L 200 115 L 205 145 L 210 125 L 215 135 L 220 130 L 240 130"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      animate={{ strokeDashoffset: [100, 0] }}
                      strokeDasharray="15 5"
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                  </g>
                )}

                {/* Step 3: Volume Management */}
                {activeStep === 3 && (
                  <g>
                    {/* Container App - Aligned to y=90, h=70 */}
                    <rect x="60" y="90" width="100" height="70" rx="8" className="fill-card stroke-emerald-500 stroke-2" />
                    <rect x="60" y="90" width="100" height="15" className="fill-emerald-500/10 rounded-t-[7px]" />
                    <text x="110" y="125" textAnchor="middle" className="text-xl">🐳</text>
                    <text x="110" y="145" textAnchor="middle" className="text-[8px] font-bold fill-foreground">Writes to /app/data</text>

                    {/* Isolated Docker Volume Box - Aligned to y=90, h=70 and widened to 110 */}
                    <rect x="240" y="90" width="110" height="70" rx="8" className="fill-emerald-500/10 stroke-emerald-500 stroke-2 stroke-dashed" />
                    <text x="295" y="120" textAnchor="middle" className="text-sm">📁</text>
                    <text x="295" y="138" textAnchor="middle" className="text-[8px] font-bold fill-foreground">Docker Volume</text>
                    <text x="295" y="150" textAnchor="middle" className="text-[7px] fill-emerald-600 font-mono">(영구 데이터 보존)</text>

                    {/* Mount mapping straight line */}
                    <line x1="160" y1="125" x2="240" y2="125" stroke="#10b981" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="200" y="117" textAnchor="middle" className="text-[6px] fill-emerald-600 font-bold">Mount (-v)</text>
                  </g>
                )}
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
                {stepData.dockerDesc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
