import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { contentData } from "../data/content";

// 1. contentData에서 'cicd' 데이터 디커플링 및 파싱
const cicdContent = contentData.find((item) => item.slug === "cicd");
const rawSteps = cicdContent?.steps || [];

const steps = rawSteps.map((stepText, idx) => {
  let title = `단계 ${idx + 1}`;
  let desc = stepText;

  if (stepText.includes(" → ")) {
    const parts = stepText.split(" → ");
    title = parts[0];
    desc = parts[1];
  } else if (stepText.includes(" — ")) {
    const parts = stepText.split(" — ");
    title = parts[0];
    desc = parts[1];
  } else if (stepText.includes(": ")) {
    const parts = stepText.split(": ");
    title = parts[0];
    desc = parts[1];
  }

  // 설명 및 제목 내 ** 기호 제거
  title = title.replace(/\*\*/g, "");
  desc = desc.replace(/\*\*/g, "");

  return { title, desc, raw: stepText.replace(/\*\*/g, "") };
});

const total = steps.length;

// 각 단계별 모의 빌드 로그 리스트 생성 함수
const getLogs = (step: number) => {
  const logsList = [
    `[15:46:35] $ git push origin main\nEnumerating objects: 18, done.\nCounting objects: 100% (18/18), done.\nDelta compression using up to 10 threads\nCompressing objects: 100% (10/10), done.\nWriting objects: 100% (12/12), 4.28 KiB | 4.28 MiB/s, done.\nTotal 12 (delta 8), reused 0 (delta 0), pack-reused 0\nTo github.com:org/my-app.git\n   a1b2c3d..e5f6g7h  main -> main\n[Webhook] Delivery 200: GitHub Webhook triggered CI runner successfully.`,
    `[15:46:37] $ npm ci\nadded 842 packages in 4.12s\n$ npm run build\n> my-app@1.0.0 build\n> tsc && vite build\nvite v5.2.0 building for production...\n✓ 284 modules transformed.\ndist/assets/index-B2z8x1A9.js   142.50 kB │ gzip: 45.12 kB\ndist/index.html                   0.82 kB\n✓ built in 2.34s\nBuild output verified: ready.`,
    `[15:46:39] $ npm test\n> my-app@1.0.0 test\n> jest --passWithNoTests\nPASS  src/components/Button.test.tsx (1.2s)\nPASS  src/utils/math.test.ts (0.8s)\nPASS  src/store/auth.test.ts (1.1s)\nTest Suites: 3 passed, 3 total\nTests:       15 passed, 15 total\nTime:        3.42s\nRan all test suites. Unit tests passed!`,
    `[15:46:42] $ npm run lint\nAll files passed linting rules!\n$ trivy image --severity HIGH,CRITICAL my-app:latest\nScanning container vulnerabilities...\nTotal: 0 (High: 0, Critical: 0)\nSecurity check passed! Lint & SAST checks complete.`,
    `[15:46:44] $ docker build -t my-app:e5f6g7h .\nSending build context to Docker daemon  245.5kB\nStep 1/5 : FROM node:20-alpine\nSuccessfully built e5f6g7h\nSuccessfully tagged my-app:e5f6g7h\n$ docker push container-registry.internal/my-app:e5f6g7h\ne5f6g7h: Pushed\nlatest: Pushed\nImage registered in registry!`,
    `[15:46:46] $ helm upgrade --install my-app-staging ./charts --set image.tag=e5f6g7h\nRelease "my-app-staging" has been upgraded.\n$ npx playwright test\n  ✓  [chromium] › home-page.spec.ts (1.5s)\n  ✓  [chromium] › auth.spec.ts (2.1s)\n4 passed (6.8s)\nStaging E2E Verification PASSED!`,
    `[15:46:49] $ helm upgrade --install my-app-prod ./charts --set image.tag=e5f6g7h\nRelease "my-app-prod" has been upgraded.\nWaiting for 3 replicas to be ready...\nPod 1: Running (Healthy)\nPod 2: Running (Healthy)\nPod 3: Running (Healthy)\nSwapping traffic from Blue (v1.0.4) to Green (v1.0.5)...\nProduction roll-out completed successfully! 🎉`
  ];

  if (step < 0) return ["$ system idle. waiting for repository trigger..."];
  return logsList.slice(0, step + 1);
};

// 각 단계별 배포 변수/메타데이터 생성 함수
const getMetadata = (step: number) => {
  return [
    { key: "Pipeline Target", value: "main branch" },
    { key: "Commit Hash", value: "e5f6g7h8 (refactor: core logic)" },
    { key: "Triggered By", value: "git-webhook" },
    { 
      key: "Docker Image", 
      value: step >= 4 ? "registry.internal/my-app:e5f6g7h" : "Pending Build...",
      status: step >= 4 ? "active" : "pending"
    },
    { 
      key: "Image Size", 
      value: step >= 4 ? "42.5 MB" : "N/A",
      status: step >= 4 ? "active" : "pending"
    },
    { 
      key: "Staging URL", 
      value: step >= 5 ? "https://staging.internal.net" : "Offline",
      status: step >= 5 ? "success" : "pending"
    },
    { 
      key: "Production URL", 
      value: step >= 6 ? "https://my-app.com" : "Running v1.0.4",
      status: step >= 6 ? "success" : "default"
    },
  ];
};

export default function CiCdViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDone, setIsDone] = useState(false);
  // Reset handler
  const reset = useCallback(() => {
    setActiveStep(-1);
    setIsPlaying(false);
    setIsDone(false);
  }, []);
  // 자동 순환(Auto-cycling Loop) + 마지막 단계 틱(Dwell) 지연 적용
  useEffect(() => {
    if (!isPlaying) return;

    if (activeStep === total - 1) {
      setIsDone(true);
      const t = setTimeout(() => {
        setIsDone(false);
        setActiveStep(0);
      }, 3500); // 마지막 단계 도달 후 3.5초 대기(Dwell) 후 자동 순환
      return () => clearTimeout(t);
    }

    const stepIdx = activeStep + 1;
    const duration = 2200; // 각 단계별 진행 딜레이
    const t = setTimeout(() => {
      setActiveStep(stepIdx);
      if (stepIdx === total - 1) {
        setIsDone(true);
      }
    }, duration);
    return () => clearTimeout(t);
  }, [isPlaying, activeStep]);
  const handlePlay = useCallback(() => {
    if (activeStep === total - 1) {
      setActiveStep(0);
      setIsPlaying(true);
      setIsDone(false);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [activeStep]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) {
      setActiveStep((p) => p + 1);
      setIsDone(activeStep + 1 === total - 1);
    } else {
      setActiveStep(0);
      setIsDone(false);
    }
  }, [activeStep]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    setIsDone(false);
    if (activeStep > 0) {
      setActiveStep((p) => p - 1);
    } else if (activeStep === 0) {
      setActiveStep(-1);
    } else {
      setActiveStep(total - 1);
      setIsDone(true);
    }
  }, [activeStep]);

  const passedCount = isDone ? total : Math.max(0, activeStep + 1);
  const progress = (passedCount / total) * 100;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-border/60 text-xs">
        <button
          onClick={reset}
          className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-reset"
          title="초기화"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-prev"
          title="이전 단계"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold transition-opacity"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          <span>{isPlaying ? "일시정지" : "재생"}</span>
        </button>
        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg border border-border/80 bg-card hover:bg-muted text-muted-foreground transition-colors"
          data-testid="button-next"
          title="다음 단계"
        >
          <ChevronRight size={13} />
        </button>
        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          <div className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
            {isDone ? "완료" : activeStep >= 0 ? `${activeStep + 1} / ${total}` : "대기"}
          </div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 2-Column Visualization Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: SVG Diagram Area */}
        <div className="relative border border-border/60 rounded-2xl bg-card overflow-hidden">
          <svg viewBox="0 0 500 370" className="w-full h-auto rounded-xl overflow-hidden">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" className="stroke-neutral-200/50 dark:stroke-neutral-800/30" strokeWidth="1" />
              </pattern>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.06" floodColor="#000" />
              </filter>
            </defs>

            {/* Grid Background with proper rounding */}
            <rect width="100%" height="100%" fill="url(#grid)" rx="12" ry="12" />

            {/* Zones */}
            {/* CI Zone */}
            <rect x="15" y="8" width="470" height="232" rx="8" className="fill-blue-50/10 dark:fill-blue-950/5 stroke-blue-200/40 dark:stroke-blue-900/20 stroke-1 stroke-dashed" />
            <text x="25" y="20" className="text-[8px] font-bold fill-blue-400 dark:fill-blue-500 uppercase tracking-widest">CI: Continuous Integration</text>

            {/* CD Zone */}
            <rect x="15" y="244" width="470" height="124" rx="8" className="fill-emerald-50/10 dark:fill-emerald-950/5 stroke-emerald-200/40 dark:stroke-emerald-900/20 stroke-1 stroke-dashed" />
            <text x="25" y="254" className="text-[8px] font-bold fill-emerald-400 dark:fill-emerald-500 uppercase tracking-widest">CD: Continuous Deployment</text>

            {/* Pipeline Connection Lines */}
            {/* Developer to GitHub */}
            <line
              x1={250} y1={43}
              x2={250} y2={68}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 0 ? "stroke-blue-400 dark:stroke-blue-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* GitHub to CI Runner */}
            <line
              x1={250} y1={96}
              x2={250} y2={120}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 1 ? "stroke-blue-400 dark:stroke-blue-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* CI Runner Subline: Header to Build */}
            <line
              x1={250} y1={120}
              x2={250} y2={138}
              className={`stroke-[1.5px] transition-colors duration-300 ${
                activeStep >= 1 ? "stroke-blue-400 dark:stroke-blue-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* Build to Test */}
            <line
              x1={250} y1={162}
              x2={250} y2={168}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 2 ? "stroke-blue-400 dark:stroke-blue-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* Test to Lint/SAST */}
            <line
              x1={250} y1={192}
              x2={250} y2={198}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 3 ? "stroke-blue-400 dark:stroke-blue-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* Lint/SAST to CI Runner Exit */}
            <line
              x1={250} y1={222}
              x2={250} y2={230}
              className={`stroke-[1.5px] transition-colors duration-300 ${
                activeStep >= 4 ? "stroke-emerald-400 dark:stroke-emerald-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* CI Runner to Registry */}
            <line
              x1={250} y1={230}
              x2={250} y2={250}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 4 ? "stroke-emerald-400 dark:stroke-emerald-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* Registry to Staging */}
            <line
              x1={250} y1={278}
              x2={250} y2={295}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 5 ? "stroke-emerald-400 dark:stroke-emerald-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />
            {/* Staging to Production */}
            <line
              x1={250} y1={323}
              x2={250} y2={338}
              className={`stroke-2 transition-colors duration-300 ${
                activeStep >= 6 ? "stroke-emerald-400 dark:stroke-emerald-500" : "stroke-neutral-200 dark:stroke-neutral-800"
              }`}
            />

            {/* Workflow Nodes */}
            {/* Node 1: Developer */}
            <g filter="url(#shadow)">
              <rect
                x={170} y={15}
                width={160} height={28}
                rx={6}
                className={`stroke-[1.5px] transition-all duration-300 ${
                  activeStep === 0
                    ? "stroke-blue-400 dark:stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                    : activeStep > 0
                    ? "stroke-blue-200 dark:stroke-blue-800/60 fill-blue-50/10 dark:fill-blue-950/5"
                    : "stroke-neutral-200 dark:stroke-neutral-800 fill-neutral-50/50 dark:fill-neutral-900/10"
                }`}
              />
              <text x={250} y={29} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-semibold fill-foreground">
                💻 Developer
              </text>
            </g>

            {/* Node 2: GitHub Webhook */}
            <g filter="url(#shadow)">
              <rect
                x={160} y={68}
                width={180} height={28}
                rx={6}
                className={`stroke-[1.5px] transition-all duration-300 ${
                  activeStep === 0 || activeStep === 1
                    ? "stroke-blue-400 dark:stroke-blue-500 fill-blue-50/50 dark:fill-blue-950/20"
                    : activeStep > 1
                    ? "stroke-blue-200 dark:stroke-blue-800/60 fill-blue-50/10 dark:fill-blue-950/5"
                    : "stroke-neutral-200 dark:stroke-neutral-800 fill-neutral-50/50 dark:fill-neutral-900/10"
                }`}
              />
              <text x={250} y={82} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-semibold fill-foreground">
                🐙 GitHub Webhook
              </text>
            </g>

            {/* Node 3: CI Runner Container */}
            <g filter="url(#shadow)">
              <rect
                x={120} y={120}
                width={260} height={110}
                rx={8}
                className={`stroke-[1.5px] transition-all duration-300 ${
                  [1, 2, 3].includes(activeStep)
                    ? "stroke-blue-400 dark:stroke-blue-500 fill-blue-50/20 dark:fill-blue-950/10"
                    : activeStep > 3
                    ? "stroke-blue-200 dark:stroke-blue-800/60 fill-blue-50/5 dark:fill-blue-950/2"
                    : "stroke-neutral-200 dark:stroke-neutral-800 fill-neutral-50/50 dark:fill-neutral-900/10"
                }`}
              />
              <text x={250} y={131} textAnchor="middle" className="text-[9px] font-bold fill-muted-foreground uppercase tracking-wider">
                CI Runner
              </text>

              {/* Sub-node 3-1: Build & Compile */}
              <g>
                <rect
                  x={140} y={138}
                  width={220} height={24}
                  rx={4}
                  className={`stroke-[1.2px] transition-all duration-300 ${
                    activeStep === 1
                      ? "stroke-blue-400 dark:stroke-blue-500 fill-blue-50/60 dark:fill-blue-950/30"
                      : activeStep > 1
                      ? "stroke-emerald-400 dark:stroke-emerald-605 fill-emerald-50/20 dark:fill-emerald-950/10"
                      : "stroke-neutral-200 dark:stroke-neutral-850 fill-neutral-50/30 dark:fill-neutral-900/5"
                  }`}
                />
                <text x={250} y={150} textAnchor="middle" dominantBaseline="middle" className="text-[9.5px] font-semibold fill-foreground">
                  🛠️ Build & Compile
                </text>
              </g>

              {/* Sub-node 3-2: Test Run */}
              <g>
                <rect
                  x={140} y={168}
                  width={220} height={24}
                  rx={4}
                  className={`stroke-[1.2px] transition-all duration-300 ${
                    activeStep === 2
                      ? "stroke-blue-400 dark:stroke-blue-500 fill-blue-50/60 dark:fill-blue-950/30"
                      : activeStep > 2
                      ? "stroke-emerald-400 dark:stroke-emerald-605 fill-emerald-50/20 dark:fill-emerald-950/10"
                      : "stroke-neutral-200 dark:stroke-neutral-850 fill-neutral-50/30 dark:fill-neutral-900/5"
                  }`}
                />
                <text x={250} y={180} textAnchor="middle" dominantBaseline="middle" className="text-[9.5px] font-semibold fill-foreground">
                  🧪 Unit & Integration Test
                </text>
              </g>

              {/* Sub-node 3-3: Lint & SAST Analysis */}
              <g>
                <rect
                  x={140} y={198}
                  width={220} height={24}
                  rx={4}
                  className={`stroke-[1.2px] transition-all duration-300 ${
                    activeStep === 3
                      ? "stroke-blue-400 dark:stroke-blue-500 fill-blue-50/60 dark:fill-blue-950/30"
                      : activeStep > 3
                      ? "stroke-emerald-400 dark:stroke-emerald-605 fill-emerald-50/20 dark:fill-emerald-950/10"
                      : "stroke-neutral-200 dark:stroke-neutral-850 fill-neutral-50/30 dark:fill-neutral-900/5"
                  }`}
                />
                <text x={250} y={210} textAnchor="middle" dominantBaseline="middle" className="text-[9.5px] font-semibold fill-foreground">
                  🔍 Lint & SAST Analysis
                </text>
              </g>
            </g>

            {/* Node 4: Container Registry */}
            <g filter="url(#shadow)">
              <rect
                x={160} y={250}
                width={180} height={28}
                rx={6}
                className={`stroke-[1.5px] transition-all duration-300 ${
                  activeStep === 4
                    ? "stroke-emerald-400 dark:stroke-emerald-500 fill-emerald-50/50 dark:fill-emerald-950/20"
                    : activeStep > 4
                    ? "stroke-emerald-200 dark:stroke-emerald-800/60 fill-emerald-50/10 dark:fill-emerald-950/5"
                    : "stroke-neutral-200 dark:stroke-neutral-800 fill-neutral-50/50 dark:fill-neutral-900/10"
                }`}
              />
              <text x={250} y={264} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-semibold fill-foreground">
                📦 Registry Push
              </text>
            </g>

            {/* Node 5: Staging Deploy */}
            <g filter="url(#shadow)">
              <rect
                x={160} y={295}
                width={180} height={28}
                rx={6}
                className={`stroke-[1.5px] transition-all duration-300 ${
                  activeStep === 5
                    ? "stroke-emerald-400 dark:stroke-emerald-500 fill-emerald-50/50 dark:fill-emerald-950/20"
                    : activeStep > 5
                    ? "stroke-emerald-200 dark:stroke-emerald-800/60 fill-emerald-50/10 dark:fill-emerald-950/5"
                    : "stroke-neutral-200 dark:stroke-neutral-800 fill-neutral-50/50 dark:fill-neutral-900/10"
                }`}
              />
              <text x={250} y={309} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-semibold fill-foreground">
                🚀 Staging Deploy
              </text>
            </g>

            {/* Node 6: Production Release */}
            <g filter="url(#shadow)">
              <rect
                x={160} y={338}
                width={180} height={28}
                rx={6}
                className={`stroke-[1.5px] transition-all duration-300 ${
                  activeStep === 6
                    ? "stroke-emerald-400 dark:stroke-emerald-500 fill-emerald-50/50 dark:fill-emerald-950/20"
                    : isDone
                    ? "stroke-emerald-200 dark:stroke-emerald-800/60 fill-emerald-50/10 dark:fill-emerald-950/5"
                    : "stroke-neutral-200 dark:stroke-neutral-800 fill-neutral-50/50 dark:fill-neutral-900/10"
                }`}
              />
              <text x={250} y={352} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-semibold fill-foreground">
                ✅ Production Release
              </text>
            </g>

            {/* Dynamic Stage-by-Stage Animations (With key={activeStep} to prevent interpolation bug) */}

            {/* Step 0: Git Push Packet */}
            {activeStep === 0 && (
              <motion.circle
                key={`packet-${activeStep}`}
                cx={250}
                cy={43}
                r={5}
                className="fill-blue-400 dark:fill-blue-500"
                animate={{ cy: [43, 68] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
            )}

            {/* Step 1: Webhook to Runner & Build Progress */}
            {activeStep === 1 && (
              <>
                <motion.circle
                  key={`packet-${activeStep}`}
                  cx={250}
                  cy={96}
                  r={5}
                  className="fill-blue-400 dark:fill-blue-500"
                  animate={{ cy: [96, 138] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <motion.rect
                  key={`build-bar-${activeStep}`}
                  x={145}
                  y={161}
                  width={210}
                  height={1.5}
                  className="fill-blue-400 dark:fill-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: 210 }}
                  transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}

            {/* Step 2: Build to Test & Running Test Indicators */}
            {activeStep === 2 && (
              <>
                <motion.circle
                  key={`packet-${activeStep}`}
                  cx={250}
                  cy={162}
                  r={5}
                  className="fill-blue-400 dark:fill-blue-500"
                  animate={{ cy: [162, 168] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <g transform="translate(140, 168)">
                  <motion.text
                    x="110"
                    y="15"
                    textAnchor="middle"
                    className="text-[7.5px] fill-blue-500 font-mono font-bold"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    🧪 RUNNING TESTS...
                  </motion.text>
                </g>
              </>
            )}

            {/* Step 3: Test to Lint/SAST & Scan line animation */}
            {activeStep === 3 && (
              <>
                <motion.circle
                  key={`packet-${activeStep}`}
                  cx={250}
                  cy={192}
                  r={5}
                  className="fill-blue-400 dark:fill-blue-500"
                  animate={{ cy: [192, 198] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <motion.line
                  key={`scan-line-${activeStep}`}
                  x1={145}
                  y1={199.5}
                  x2={355}
                  y2={199.5}
                  className="stroke-blue-400 dark:stroke-blue-500"
                  strokeWidth={1.5}
                  animate={{ y: [199.5, 220.5, 199.5] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}

            {/* Step 4: SAST to Registry & Container Pack Moving */}
            {activeStep === 4 && (
              <>
                <motion.circle
                  key={`packet-${activeStep}`}
                  cx={250}
                  cy={222}
                  r={5}
                  className="fill-emerald-400 dark:fill-emerald-500"
                  animate={{ cy: [222, 250] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <g transform="translate(160, 250)">
                  <motion.text
                    x="90"
                    y="17"
                    textAnchor="middle"
                    className="text-[7px] fill-emerald-500 font-mono font-bold"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    📦 PUSHING IMAGE...
                  </motion.text>
                </g>
              </>
            )}

            {/* Step 5: Registry to Staging & Mock Playwright Browser Test */}
            {activeStep === 5 && (
              <>
                <motion.circle
                  key={`packet-${activeStep}`}
                  cx={250}
                  cy={278}
                  r={5}
                  className="fill-emerald-400 dark:fill-emerald-500"
                  animate={{ cy: [278, 295] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <g transform="translate(160, 295)">
                  <motion.text
                    x="90"
                    y="17"
                    textAnchor="middle"
                    className="text-[7px] fill-emerald-500 font-mono font-bold"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    🎭 PLAYWRIGHT E2E...
                  </motion.text>
                </g>
              </>
            )}

            {/* Step 6: Staging to Production & Traffic Swap */}
            {activeStep === 6 && (
              <>
                <motion.circle
                  key={`packet-${activeStep}`}
                  cx={250}
                  cy={323}
                  r={5}
                  className="fill-emerald-400 dark:fill-emerald-500"
                  animate={{ cy: [323, 338] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <g transform="translate(160, 338)">
                  <motion.text
                    x="90"
                    y="17"
                    textAnchor="middle"
                    className="text-[7px] fill-emerald-500 font-mono font-bold"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🔄 SWAPPING BLUE/GREEN...
                  </motion.text>
                </g>
              </>
            )}
          </svg>
        </div>

        {/* Right Column: Deployment Inspector & Variables */}
        <div className="border border-border/80 rounded-2xl bg-card p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              ⚙️ Deployment Inspector & Variables
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground">
                    <th className="pb-2 font-medium w-1/3">Variable Name</th>
                    <th className="pb-2 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {getMetadata(activeStep).map((meta, idx) => (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-muted-foreground font-semibold">{meta.key}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          meta.status === "active"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : meta.status === "success"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : meta.status === "pending"
                            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                            : "text-foreground"
                        }`}>
                          {meta.value}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Done State Toast */}
      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 dark:border-emerald-900/40 rounded-2xl text-center shadow-sm"
        >
          <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base">
            🎉 파이프라인 전체 과정 검증 성공! 변경 사항이 다운타임 없이 가동 환경에 안착했습니다.
          </p>
        </motion.div>
      )}
    </div>
  );
}

