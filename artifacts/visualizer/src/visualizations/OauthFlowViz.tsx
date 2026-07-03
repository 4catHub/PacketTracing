import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";
import { gsap } from "gsap";
import { contentData } from "@/data/content";

// content.ts 내 'oauth-flow' 데이터 동기화
const oauthFlowData = contentData.find((d) => d.slug === "oauth-flow");
const STEPS_DESC = oauthFlowData?.steps ?? [];
const total = STEPS_DESC.length;

// 단계별 요약 타이틀 정의
const STEP_TITLES = [
  "소셜 로그인 시도 (Browser ➔ Auth Server)",
  "인증 및 권한 동의 (Browser ➔ Auth Server)",
  "인증 코드 반환 (Auth Server ➔ Browser ➔ Client)",
  "토큰 요청 (Client ➔ Auth Server)",
  "Access Token 발급 (Auth Server ➔ Client)",
  "사용자 데이터 요청 (Client ➔ Resource Server)",
  "리소스 반환 및 로그인 성공 (Resource Server ➔ Client ➔ Browser)"
];

// 세로 직렬화 노드 좌표 (Browser ➔ Client App ➔ Auth/Resource Server)
const NODES = {
  browser: { x: 300, y: 70, label: "Browser (User)", icon: "👤" },
  client: { x: 300, y: 230, label: "Client App", icon: "💻" },
  auth: { x: 180, y: 390, label: "Auth Server", icon: "🔑" },
  resource: { x: 420, y: 390, label: "Resource Server", icon: "🖥️" },
};

const STEP_ACTIVE_NODES: Record<number, string[]> = {
  0: ["browser", "auth"],
  1: ["browser", "auth"],
  2: ["auth", "browser", "client"],
  3: ["client", "auth"],
  4: ["auth", "client"],
  5: ["client", "resource"],
  6: ["resource", "client", "browser"],
};

// 노드 좌표에 기초한 정밀 엣지 좌표 설정
const EDGES = [
  { id: "browser-auth", x1: 270, y1: 98, x2: 180, y2: 362, type: "front" },
  { id: "browser-client", x1: 300, y1: 98, x2: 300, y2: 202, type: "front" },
  { id: "client-auth", x1: 270, y1: 258, x2: 180, y2: 362, type: "back" },
  { id: "client-resource", x1: 330, y1: 258, x2: 420, y2: 362, type: "back" },
];

const ACTIVE_EDGES_MAP: Record<number, string[]> = {
  0: ["browser-auth"],
  1: ["browser-auth"],
  2: ["browser-auth", "browser-client"],
  3: ["client-auth"],
  4: ["client-auth"],
  5: ["client-resource"],
  6: ["client-resource", "browser-client"],
};

const getMarkerProps = (edgeId: string, step: number) => {
  if (step < 0) return {};
  if (edgeId === "browser-auth") {
    if (step === 0 || step === 1) return { markerEnd: "url(#arrow-cyan)" };
    if (step === 2) return { markerStart: "url(#arrow-cyan)" };
  }
  if (edgeId === "browser-client") {
    if (step === 2) return { markerEnd: "url(#arrow-cyan)" };
    if (step === 6) return { markerStart: "url(#arrow-cyan)" };
  }
  if (edgeId === "client-auth") {
    if (step === 3) return { markerEnd: "url(#arrow-emerald)" };
    if (step === 4) return { markerStart: "url(#arrow-emerald)" };
  }
  if (edgeId === "client-resource") {
    if (step === 5) return { markerEnd: "url(#arrow-emerald)" };
    if (step === 6) return { markerStart: "url(#arrow-emerald)" };
  }
  return {};
};

export default function OauthFlowViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const isComplete = activeStep >= total - 1;

  const svgRef = useRef<SVGSVGElement>(null);
  const packetGroupRef = useRef<SVGGElement>(null);
  const tooltipTextRef = useRef<SVGTextElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const timerRef = useRef<number | null>(null);

  const getStepDuration = (step: number) => {
    if (step === 6) return 5000; // 마지막 7단계는 Dwell 시간을 고려해 5초 동안 보여줌
    return 4000; // 일반 단계는 4초
  };

  // Auto-cycling Loop: 마지막 단계 틱(Dwell) 지연 후 자동 순환되는 구조 유지
  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = getStepDuration(activeStep);
    timerRef.current = window.setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // 마지막 단계 완료 후 0단계로 자동 순환
        setActiveStep(0);
      }
    }, stepDuration);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, activeStep, total]);

  // GSAP: Packet and Tooltip Flow Animation
  useEffect(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    const packetGroup = packetGroupRef.current;
    if (!packetGroup) return;

    if (activeStep < 0 || activeStep >= total) {
      gsap.set(packetGroup, { opacity: 0 });
      return;
    }

    const tl = gsap.timeline({ repeat: -1 });
    timelineRef.current = tl;

    if (activeStep === 0) {
      tl.set(packetGroup, { x: 270, y: 98, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "GET /authorize"; })
        .to(packetGroup, { x: 180, y: 362, duration: 2.0, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    } else if (activeStep === 1) {
      tl.set(packetGroup, { x: 270, y: 98, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "POST /consent"; })
        .to(packetGroup, { x: 180, y: 362, duration: 2.0, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    } else if (activeStep === 2) {
      // 2구간 연쇄: Auth Server (180, 362) ➔ Browser (270, 98) | Browser (300, 98) ➔ Client App (300, 202)
      tl.set(packetGroup, { x: 180, y: 362, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "302 Redirect (Code)"; })
        .to(packetGroup, { x: 270, y: 98, duration: 1.5, ease: "power1.inOut" })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "Auth Code"; })
        .set(packetGroup, { x: 300, y: 98 })
        .to(packetGroup, { x: 300, y: 202, duration: 1.5, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    } else if (activeStep === 3) {
      tl.set(packetGroup, { x: 270, y: 258, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "POST /token"; })
        .to(packetGroup, { x: 180, y: 362, duration: 2.0, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    } else if (activeStep === 4) {
      tl.set(packetGroup, { x: 180, y: 362, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "Access Token"; })
        .to(packetGroup, { x: 270, y: 258, duration: 2.0, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    } else if (activeStep === 5) {
      tl.set(packetGroup, { x: 330, y: 258, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "GET /userinfo"; })
        .to(packetGroup, { x: 420, y: 362, duration: 2.0, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    } else if (activeStep === 6) {
      // 2구간 연쇄: Resource Server (420, 362) ➔ Client App (330, 258) | Client App (300, 202) ➔ Browser (300, 98)
      tl.set(packetGroup, { x: 420, y: 362, opacity: 1 })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "User Profile JSON"; })
        .to(packetGroup, { x: 330, y: 258, duration: 1.5, ease: "power1.inOut" })
        .call(() => { if (tooltipTextRef.current) tooltipTextRef.current.textContent = "Login Success"; })
        .set(packetGroup, { x: 300, y: 202 })
        .to(packetGroup, { x: 300, y: 98, duration: 1.5, ease: "power1.inOut" })
        .to(packetGroup, { opacity: 0, duration: 0.3 })
        .delay(0.5);
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [activeStep]);

  const handlePlay = useCallback(() => {
    setIsPlaying((p) => {
      const nextPlaying = !p;
      if (nextPlaying && activeStep === -1) {
        setActiveStep(0);
      }
      return nextPlaying;
    });
  }, [activeStep]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) setActiveStep((p) => p + 1);
  }, [activeStep]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const progress = ((activeStep + 1) / total) * 100;

  // 설명 내 ** 제거 필터링을 적용한 텍스트
  const stepDesc = activeStep >= 0 ? (STEPS_DESC[activeStep] ?? "").replace(/\*\*/g, "") : "";

  // API Payload Inspector Renderer (미니멀 라이트/다크 대응)
  const renderPayloadInspector = () => {
    if (activeStep < 0) {
      return (
        <div className="flex flex-col justify-center items-center py-8 text-slate-400 dark:text-slate-500 italic text-xs sm:text-sm text-center px-4 space-y-2 select-none">
          <span>🔍 API Payload Inspector</span>
          <span>인증 단계를 진행하면 주고받는 실제 HTTP 통신 헤더와 페이로드 정보가 여기에 실시간으로 표시됩니다.</span>
        </div>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-sky-600 dark:text-sky-400 font-bold">GET /oauth/authorize HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Host: auth.identity-provider.com</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Accept: text/html</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Query Parameters:</div>
            <div className="pl-2 space-y-1 font-mono text-[10.5px] sm:text-[11.5px]">
              <div><span className="text-violet-600 dark:text-violet-400">response_type</span> = <span className="text-emerald-600 dark:text-emerald-400">"code"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">client_id</span> = <span className="text-emerald-600 dark:text-emerald-400">"client_123abc"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">redirect_uri</span> = <span className="text-emerald-600 dark:text-emerald-400">"https://client.com/callback"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">scope</span> = <span className="text-emerald-600 dark:text-emerald-400">"profile email"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">state</span> = <span className="text-emerald-600 dark:text-emerald-400">"secure_state_987"</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 브라우저를 OAuth 로그인 폼 주소로 Redirection 시키는 요청입니다.</div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-sky-600 dark:text-sky-400 font-bold">POST /oauth/consent HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Content-Type: application/json</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Payload Data (OAuth 동의):</div>
            <pre className="text-emerald-600 dark:text-emerald-400 font-mono text-[10.5px] sm:text-[11.5px] pl-1 overflow-x-auto">
{`{
  "grant_consent": true,
  "user_email": "user@gmail.com",
  "approved_scopes": [
    "profile",
    "email"
  ]
}`}
            </pre>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 사용자가 인증 기관의 화면에서 승인 단추를 눌렀을 때의 전송 데이터 예시입니다.</div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-sky-600 dark:text-sky-400 font-bold">HTTP/1.1 302 Found</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Location: https://client.com/callback...</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Redirect URL Parameters:</div>
            <div className="pl-2 space-y-1 font-mono text-[10.5px] sm:text-[11.5px]">
              <div><span className="text-violet-600 dark:text-violet-400">code</span> = <span className="text-emerald-600 dark:text-emerald-400">"auth_code_xyz789"</span> <span className="text-[9px] text-amber-500 font-bold">(1회성 코드)</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">state</span> = <span className="text-emerald-600 dark:text-emerald-400">"secure_state_987"</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 브라우저의 Query String에 코드를 실어 Client 백엔드로 302 리다이렉트 처리합니다.</div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-pink-600 dark:text-pink-400 font-bold">POST /oauth/token HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Host: auth.identity-provider.com</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Content-Type: application/x-www-form-urlencoded</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Form Data (Server-to-Server):</div>
            <div className="pl-2 space-y-1 font-mono text-[10.5px] sm:text-[11.5px]">
              <div><span className="text-violet-600 dark:text-violet-400">grant_type</span> = <span className="text-emerald-600 dark:text-emerald-400">"authorization_code"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">code</span> = <span className="text-emerald-600 dark:text-emerald-400">"auth_code_xyz789"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">client_id</span> = <span className="text-emerald-600 dark:text-emerald-400">"client_123abc"</span></div>
              <div><span className="text-violet-600 dark:text-violet-400">client_secret</span> = <span className="text-red-500 dark:text-red-400">"client_sec_secure_99"</span> <span className="text-[9px] text-slate-400 dark:text-slate-500">(비공개)</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 브라우저가 개입할 수 없는 백채널을 사용하므로 탈취 위험이 극히 낮습니다.</div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-sky-600 dark:text-sky-400 font-bold">HTTP/1.1 200 OK</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Content-Type: application/json</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Response Body (Token):</div>
            <pre className="text-emerald-600 dark:text-emerald-400 font-mono text-[10.5px] sm:text-[11.5px] pl-1 overflow-x-auto">
{`{
  "access_token": "at_bearer_ey98123...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_987654...",
  "scope": "profile email"
}`}
            </pre>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 검증이 완료되어 클라이언트는 향후 API 요청에 사용할 Access Token을 획득했습니다.</div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-pink-600 dark:text-pink-400 font-bold">GET /v1/userinfo HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Host: api.identity-provider.com</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Request Header:</div>
            <div className="pl-2 font-mono text-[10.5px] sm:text-[11.5px] space-y-0.5">
              <div><span className="text-violet-600 dark:text-violet-400">Authorization:</span> <span className="text-sky-600 dark:text-sky-400 font-bold">Bearer at_bearer_ey98123...</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 획득한 Access Token을 Authorization Header에 Bearer 타입으로 실어 요청합니다.</div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30">
            <div className="text-[12px] sm:text-xs text-sky-600 dark:text-sky-400 font-bold">HTTP/1.1 200 OK</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 font-mono">Content-Type: application/json</div>
            <div className="border-t border-slate-100 dark:border-slate-800 my-1.5"></div>
            <div className="text-amber-600 dark:text-amber-500 font-bold text-[11.5px] sm:text-xs">Resource Data (Profile JSON):</div>
            <pre className="text-emerald-600 dark:text-emerald-400 font-mono text-[10.5px] sm:text-[11.5px] pl-1 overflow-x-auto">
{`{
  "sub": "user_998822",
  "name": "Jane Doe",
  "email": "user@gmail.com",
  "picture": "https://api.com/pic/jd.png"
}`}
            </pre>
            <div className="text-[10px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 italic mt-2">* 토큰 검증 성공 후 자원 서버가 사용자의 프로필 데이터를 넘겨주며 인증 프로세스가 종료됩니다.</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 제어 HUD */}
      <div className="flex items-center gap-2 flex-wrap bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-border/60 text-xs">
        <button
          onClick={handleReset}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          data-testid="button-reset"
          aria-label="초기화"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={handlePrev}
          disabled={activeStep < 0}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors"
          data-testid="button-prev"
          aria-label="이전 단계"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          onClick={handlePlay}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-xs font-semibold transition-colors"
          data-testid="button-play-pause"
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          <span>{isPlaying ? "일시정지" : "재생"}</span>
        </button>
        <button
          onClick={handleNext}
          disabled={isComplete}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors"
          data-testid="button-next"
          aria-label="다음 단계"
        >
          <ChevronRight size={13} />
        </button>
        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">
            {activeStep >= 0 ? `${activeStep + 1} / ${total}` : "대기"}
          </div>
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-sky-500 rounded-full"
              animate={{ width: `${Math.max(0, progress)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* 2. 시각화 영역 & API Inspector Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: SVG Diagram */}
        <div className="lg:col-span-2 relative border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-955/20 overflow-hidden flex justify-center py-4">
          <svg
            ref={svgRef}
            viewBox="0 0 600 500"
            className="w-full h-auto aspect-[600/500] block select-none rounded-xl overflow-hidden"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* 표준 feDropShadow 사용 */}
              <filter id="subtle-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.08" />
              </filter>
              
              {/* 화살표 마커 헤드 */}
              <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" className="fill-sky-500" />
              </marker>
              <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 2 L 8 5 L 0 8 z" className="fill-emerald-500" />
              </marker>
            </defs>

            {/* 은회색 격자 무늬 배경 (rx/ry 추가) */}
            <rect width="100%" height="100%" fill="none" rx="12" ry="12" />
            <g className="stroke-slate-200/50 dark:stroke-slate-800/30" strokeWidth="0.5">
              {Array.from({ length: 26 }).map((_, i) => (
                <line key={`grid-h-${i}`} x1="0" y1={i * 20} x2="600" y2={i * 20} />
              ))}
              {Array.from({ length: 31 }).map((_, i) => (
                <line key={`grid-v-${i}`} x1={i * 20} y1="0" x2={i * 20} y2="500" />
              ))}
            </g>

            {/* 연결 엣지 드로잉 레이어 */}
            {EDGES.map((edge) => {
              const isActive = activeStep >= 0 && ACTIVE_EDGES_MAP[activeStep]?.includes(edge.id);
              const strokeClass = isActive
                ? edge.type === "front"
                  ? "stroke-sky-500 stroke-[2px]"
                  : "stroke-emerald-500 stroke-[2px]"
                : "stroke-slate-200 dark:stroke-slate-800 stroke-[1px]";
              const isDash = edge.type === "front";
              const markerProps = getMarkerProps(edge.id, activeStep);

              return (
                <line
                  key={`edge-${edge.id}-${activeStep}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  className={`transition-all duration-300 ${strokeClass}`}
                  strokeDasharray={isDash ? "4 4" : undefined}
                  {...markerProps}
                />
              );
            })}

            {/* 4대 핵심 노드 그룹 드로잉 */}
            {Object.entries(NODES).map(([key, node]) => {
              const isHighlighted = activeStep >= 0 && STEP_ACTIVE_NODES[activeStep]?.includes(key);
              const isFrontChannel = key === "browser" || (key === "auth" && activeStep < 3) || (activeStep === 2 && key === "client");
              const activeColorClass = isFrontChannel ? "stroke-sky-500" : "stroke-emerald-500";
              const strokeClass = isHighlighted 
                ? `${activeColorClass} stroke-[2px]` 
                : "stroke-slate-200 dark:stroke-slate-800 stroke-[1px]";

              return (
                <g key={key} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    x="-60"
                    y="-28"
                    width="120"
                    height="56"
                    rx="12"
                    className={`fill-white dark:fill-slate-900 transition-colors duration-300 ${strokeClass}`}
                    filter="url(#subtle-shadow)"
                  />
                  <text
                    x="0"
                    y="-4"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="18"
                    className="select-none"
                  >
                    {node.icon}
                  </text>
                  <text
                    x="0"
                    y="16"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-[11px] font-sans select-none transition-colors duration-300 ${
                      isHighlighted 
                        ? "fill-slate-900 dark:fill-white font-semibold" 
                        : "fill-slate-500 dark:fill-slate-400"
                    }`}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* 실시간 패킷 및 데이터 툴팁 모션 */}
            <g ref={packetGroupRef} key={activeStep} opacity="0">
              <circle
                cx="0"
                cy="0"
                r="6"
                className={activeStep >= 3 && activeStep <= 5 ? "fill-emerald-500" : "fill-sky-500"}
              />
              <g transform="translate(0, -22)">
                <rect
                  x="-55"
                  y="-10"
                  width="110"
                  height="20"
                  rx="6"
                  className={`fill-white dark:fill-slate-900 stroke-[1.5px] transition-colors duration-300 ${
                    activeStep >= 3 && activeStep <= 5 ? "stroke-emerald-500" : "stroke-sky-500"
                  }`}
                />
                <text
                  ref={tooltipTextRef}
                  x="0"
                  y="1"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-800 dark:fill-slate-200 font-mono text-[9px] font-bold select-none"
                >
                  -
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Right 1 Column: API Payload Inspector */}
        <div className="lg:col-span-1 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40 p-4 font-mono text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 shadow-sm h-full min-h-[420px] flex flex-col">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-3 select-none shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
              💻 API Payload Inspector
            </span>
            {activeStep >= 0 && (
              <span className="px-2 py-0.5 rounded bg-sky-55/30 text-sky-600 dark:text-sky-400 font-bold font-sans text-[10px]">
                Active
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderPayloadInspector()}
          </div>
        </div>
      </div>

      {/* 4. 하단 단계 설명 Callout 박스 */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 rounded-2xl border border-sky-100 dark:border-sky-950/50 bg-sky-50/30 dark:bg-sky-950/10 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-sky-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-sm select-none">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-200">
                  {STEP_TITLES[activeStep]}
                </h4>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {stepDesc}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. 완료 상태 배너 */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/50 rounded-2xl flex items-center gap-3.5"
        >
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
          <div className="text-sm sm:text-base font-semibold text-emerald-800 dark:text-emerald-400 leading-relaxed">
            <strong>OAuth 2.0 Authorization Code 인증 완료!</strong>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-normal">
              시퀀스 흐름이 완벽히 검증되었습니다. 사용자의 브라우저를 통한 Redirect와 백채널(Server-to-Server) 요청이 명확히 격리되어 Access Token을 완전 무결하게 확보했습니다.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
