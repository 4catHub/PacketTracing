import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronLeft, ChevronRight, RotateCcw, ShieldCheck } from "lucide-react";

// OAuth 2.0 Sequence Diagram Steps
const STEPS = [
  {
    title: "1. 소셜 로그인 시도 (Browser ➔ Auth Server)",
    y: 105,
    x1: 75, // Browser
    x2: 375, // Auth Server
    desc: "사용자가 Client 서비스의 '소셜 로그인' 버튼을 누르면, 서비스는 사용자의 브라우저를 Authorization Server의 로그인 화면으로 리다이렉트 시킵니다.",
  },
  {
    title: "2. 인증 및 권한 동의 (Browser ➔ Auth Server)",
    y: 145,
    x1: 75, // Browser
    x2: 375, // Auth Server
    desc: "사용자가 Authorization Server에 로그인하고, 서비스(Client)가 요청한 프로필 등의 권한 부여 동의 버튼을 클릭합니다.",
  },
  {
    title: "3. 인증 코드 반환 (Auth Server ➔ Browser ➔ Client)",
    y: 185,
    x1: 375, // Auth Server
    x2: 225, // Client App (via Browser 302 Redirect)
    desc: "동의가 완료되면 인증 서버는 브라우저를 거쳐 일회용 인증 코드(Authorization Code)를 Client의 Redirect URI로 전달합니다.",
  },
  {
    title: "4. 토큰 요청 (Client ➔ Auth Server)",
    y: 225,
    x1: 225, // Client App (Server-to-Server backchannel)
    x2: 375, // Auth Server
    desc: "Client 백엔드 서버는 브라우저로부터 받은 인증 코드와 자신의 고유 비밀 키(Client Secret)를 모아 Auth Server에 직접 Access Token을 요청합니다.",
  },
  {
    title: "5. Access Token 발급 (Auth Server ➔ Client)",
    y: 265,
    x1: 375, // Auth Server
    x2: 225, // Client App
    desc: "Auth Server는 코드와 Secret을 검증한 후, 외부 노출 없이 안전한 백채널을 통해 Client 백엔드로 Access Token을 직접 발급합니다.",
  },
  {
    title: "6. 사용자 데이터 요청 (Client ➔ Resource Server)",
    y: 305,
    x1: 225, // Client App
    x2: 525, // Resource Server
    desc: "토큰을 얻은 Client 백엔드는 사용자의 프로필 데이터를 가져오기 위해 HTTP 헤더에 Access Token을 실어 Resource Server에 자원을 요청합니다.",
  },
  {
    title: "7. 리소스 반환 및 로그인 성공 (Resource Server ➔ Client ➔ Browser)",
    y: 345,
    x1: 525, // Resource Server
    x2: 75, // Browser (Final UI response)
    desc: "Resource Server는 토큰 검증 후 유저 데이터를 반환하고, Client는 사용자의 로그인을 완료하여 최종 로그인 성공 화면을 브라우저에 표시합니다.",
  },
];

const LIFELINES = [
  { id: 0, label: "Browser (User)", x: 75, icon: "👤" },
  { id: 1, label: "Client App", x: 225, icon: "💻" },
  { id: 2, label: "Auth Server", x: 375, icon: "🔑" },
  { id: 3, label: "Resource Server", x: 525, icon: "🖥️" },
];

const STEP_NODES = [
  { from: 0, to: 2, via: null }, // Step 1
  { from: 0, to: 2, via: null }, // Step 2
  { from: 2, to: 1, via: 0 },    // Step 3 (via Browser)
  { from: 1, to: 2, via: null }, // Step 4
  { from: 2, to: 1, via: null }, // Step 5
  { from: 1, to: 3, via: null }, // Step 6
  { from: 3, to: 0, via: 1 },    // Step 7 (via Client)
];

export default function OauthFlowViz() {
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const total = STEPS.length;
  const isComplete = activeStep >= total - 1;

  // Auto play logic
  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 4500; // API Payload를 충분히 볼 수 있도록 지연시간 증가
    const t = setTimeout(() => {
      if (activeStep < total - 1) {
        setActiveStep((p) => p + 1);
      } else {
        // 마지막 7단계 완료 후 재생 중지 (지연 보장)
        setIsPlaying(false);
      }
    }, stepDuration);

    return () => clearTimeout(t);
  }, [isPlaying, activeStep, total]);

  const handlePlay = useCallback(() => {
    if (isComplete) {
      setActiveStep(-1);
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying((p) => !p);
    }
  }, [isComplete]);

  const handleNext = useCallback(() => {
    setIsPlaying(false);
    if (activeStep < total - 1) setActiveStep((p) => p + 1);
  }, [activeStep, total]);

  const handlePrev = useCallback(() => {
    setIsPlaying(false);
    if (activeStep >= 0) setActiveStep((p) => p - 1);
  }, [activeStep]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setActiveStep(-1);
  }, []);

  const progress = ((activeStep + 1) / total) * 100;
  const stepData = activeStep >= 0 ? STEPS[activeStep] : null;

  // API Payload Inspector 텍스트 및 UI 렌더러 (글자 크기를 11.5px / xs / sm 으로 확대)
  const renderPayloadInspector = () => {
    if (activeStep < 0) {
      return (
        <div className="flex flex-col justify-center items-center h-full text-slate-500 italic text-xs sm:text-sm text-center px-4 space-y-2 select-none">
          <span>🔍 API Payload Inspector</span>
          <span>인증 단계를 진행하면 주고받는 실제 HTTP 통신 헤더와 페이로드 정보가 여기에 실시간으로 표시됩니다.</span>
        </div>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-sky-400 font-bold">GET /oauth/authorize HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Host: auth.identity-provider.com</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Accept: text/html</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Query Parameters:</div>
            <div className="pl-2 space-y-1 font-mono text-[10.5px] sm:text-[11.5px]">
              <div><span className="text-purple-400">response_type</span> = <span className="text-emerald-400">"code"</span></div>
              <div><span className="text-purple-400">client_id</span> = <span className="text-emerald-400">"client_123abc"</span></div>
              <div><span className="text-purple-400">redirect_uri</span> = <span className="text-emerald-400">"https://client.com/callback"</span></div>
              <div><span className="text-purple-400">scope</span> = <span className="text-emerald-400">"profile email"</span></div>
              <div><span className="text-purple-400">state</span> = <span className="text-emerald-400">"secure_state_987"</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 브라우저를 OAuth 로그인 폼 주소로 Redirection 시키는 요청입니다.</div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-sky-400 font-bold">POST /oauth/consent HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Content-Type: application/json</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Payload Data (OAuth 동의):</div>
            <pre className="text-emerald-400 font-mono text-[10.5px] sm:text-[11.5px] pl-1 overflow-x-auto">
{`{
  "grant_consent": true,
  "user_email": "user@gmail.com",
  "approved_scopes": [
    "profile",
    "email"
  ]
}`}
            </pre>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 사용자가 인증 기관의 화면에서 승인 단추를 눌렀을 때의 전송 데이터 예시입니다.</div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-sky-400 font-bold">HTTP/1.1 302 Found</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Location: https://client.com/callback...</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Redirect URL Parameters:</div>
            <div className="pl-2 space-y-1 font-mono text-[10.5px] sm:text-[11.5px]">
              <div><span className="text-purple-400">code</span> = <span className="text-emerald-400">"auth_code_xyz789"</span> <span className="text-[9px] text-amber-500 font-bold">(1회성 코드)</span></div>
              <div><span className="text-purple-400">state</span> = <span className="text-emerald-400">"secure_state_987"</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 브라우저의 Query String에 코드를 실어 Client 백엔드로 302 리다이렉트 처리합니다.</div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-pink-400 font-bold">POST /oauth/token HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Host: auth.identity-provider.com</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Content-Type: application/x-www-form-urlencoded</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Form Data (Server-to-Server):</div>
            <div className="pl-2 space-y-1 font-mono text-[10.5px] sm:text-[11.5px]">
              <div><span className="text-purple-400">grant_type</span> = <span className="text-emerald-400">"authorization_code"</span></div>
              <div><span className="text-purple-400">code</span> = <span className="text-emerald-400">"auth_code_xyz789"</span></div>
              <div><span className="text-purple-400">client_id</span> = <span className="text-emerald-400">"client_123abc"</span></div>
              <div><span className="text-purple-400">client_secret</span> = <span className="text-red-400">"client_sec_secure_99"</span> <span className="text-[9px] text-slate-500">(비공개)</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 브라우저가 개입할 수 없는 백채널을 사용하므로 탈취 위험이 극히 낮습니다.</div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-sky-400 font-bold">HTTP/1.1 200 OK</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Content-Type: application/json</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Response Body (Token):</div>
            <pre className="text-emerald-400 font-mono text-[10.5px] sm:text-[11.5px] pl-1 overflow-x-auto">
{`{
  "access_token": "at_bearer_ey98123...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "rt_987654...",
  "scope": "profile email"
}`}
            </pre>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 검증이 완료되어 클라이언트는 향후 API 요청에 사용할 Access Token을 획득했습니다.</div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-pink-400 font-bold">GET /v1/userinfo HTTP/1.1</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Host: api.identity-provider.com</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Request Header:</div>
            <div className="pl-2 font-mono text-[10.5px] sm:text-[11.5px] space-y-0.5">
              <div><span className="text-purple-400">Authorization:</span> <span className="text-sky-400 font-bold">Bearer at_bearer_ey98123...</span></div>
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 획득한 Access Token을 Authorization Header에 Bearer 타입으로 실어 요청합니다.</div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-2.5 select-text selection:bg-blue-500/30 selection:text-white">
            <div className="text-[12px] sm:text-xs text-sky-400 font-bold">HTTP/1.1 200 OK</div>
            <div className="text-[11px] sm:text-[11.5px] text-slate-400 font-mono">Content-Type: application/json</div>
            <div className="border-t border-slate-800 my-1"></div>
            <div className="text-yellow-400 font-bold text-[11.5px] sm:text-xs">Resource Data (Profile JSON):</div>
            <pre className="text-emerald-400 font-mono text-[10.5px] sm:text-[11.5px] pl-1 overflow-x-auto">
{`{
  "sub": "user_998822",
  "name": "Jane Doe",
  "email": "user@gmail.com",
  "picture": "https://api.com/pic/jd.png"
}`}
            </pre>
            <div className="text-[10px] sm:text-[10.5px] text-slate-500 italic mt-2">* 토큰 검증 성공 후 자원 서버가 사용자의 프로필 데이터를 넘겨주며 인증 프로세스가 종료됩니다.</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleReset}
          className="p-2.5 rounded-lg border border-card-border bg-card hover:bg-muted text-muted-foreground transition-colors"
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
          {isComplete ? "다시 보기" : isPlaying ? "일시정지" : activeStep < 0 ? "인증 시작" : "계속"}
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
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground font-semibold">
            <span>단계 {Math.max(0, activeStep + 1)} / {total}</span>
            {activeStep >= 0 && (
              <span className="flex items-center gap-1 font-bold text-primary">
                Sequence Flow
              </span>
            )}
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

      {/* Visual Workspace grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sequence Diagram SVG (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative border border-border/60 rounded-xl bg-card overflow-hidden">
            <svg className="w-full h-auto aspect-[600/400] block" viewBox="0 0 600 400">
              <defs>
                <linearGradient id="seqLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <filter id="glow" x="-15%" y="-15%" width="130%" height="130%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.6" />
                </filter>
                <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1" />
                </filter>
              </defs>

              <rect x="0" y="0" width="600" height="400" fill="none" />

              {/* Lifelines */}
              {LIFELINES.map((line) => {
                const isFrom = activeStep >= 0 && STEP_NODES[activeStep]?.from === line.id;
                const isTo = activeStep >= 0 && STEP_NODES[activeStep]?.to === line.id;
                const isVia = activeStep >= 0 && STEP_NODES[activeStep]?.via === line.id;
                const isHighlighted = isFrom || isTo || isVia;

                return (
                  <g key={line.id}>
                    {/* Vertical line */}
                    <line
                      x1={line.x}
                      y1={75}
                      x2={line.x}
                      y2={370}
                      stroke={isHighlighted ? "#3b82f6" : "#cbd5e1"}
                      strokeWidth={isHighlighted ? 2 : 1.5}
                      strokeDasharray="4 4"
                      className="dark:stroke-slate-700 transition-colors duration-300"
                    />
                    
                    {/* Header Node Box */}
                    <motion.g
                      animate={isHighlighted ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                      transition={{ repeat: isHighlighted ? Infinity : 0, duration: 1.8 }}
                    >
                      <rect
                        x={line.x - 48}
                        y={18}
                        width="96"
                        height="40"
                        rx="10"
                        fill="var(--card, #ffffff)"
                        stroke={isHighlighted ? "#3b82f6" : "#cbd5e1"}
                        strokeWidth={isHighlighted ? 2 : 1.5}
                        className="fill-card dark:fill-slate-900 dark:stroke-slate-700"
                        filter={isHighlighted ? "url(#glow)" : "url(#shadow)"}
                      />
                      <text x={line.x} y={34} textAnchor="middle" className="text-base select-none">
                        {line.icon}
                      </text>
                      <text x={line.x} y={50} textAnchor="middle" className="text-[10.5px] font-extrabold fill-foreground select-none">
                        {line.label}
                      </text>
                    </motion.g>
                  </g>
                );
              })}

              {/* Historical Step Lines */}
              {STEPS.map((step, idx) => {
                if (idx >= activeStep) return null;
                return (
                  <g key={`past-line-${idx}`}>
                    <line
                      x1={step.x1}
                      y1={step.y}
                      x2={step.x2}
                      y2={step.y}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      opacity="0.35"
                    />
                    <circle cx={step.x2} cy={step.y} r="3" fill="#10b981" opacity="0.45" />
                    <text
                      x={(step.x1 + step.x2) / 2}
                      y={step.y - 5}
                      textAnchor="middle"
                      className="text-[10px] fill-emerald-600 dark:fill-emerald-400 font-extrabold font-mono select-none"
                      opacity="0.5"
                    >
                      Step {idx + 1}
                    </text>
                  </g>
                );
              })}

              {/* Active Step Animation Line and Packet */}
              {stepData && (
                <g key={`active-group-${activeStep}`}>
                  {/* Dynamic Message Arrow Line */}
                  <motion.line
                    key={`line-${activeStep}`}
                    x1={stepData.x1}
                    y1={stepData.y}
                    x2={stepData.x2}
                    y2={stepData.y}
                    stroke="url(#seqLineGrad)"
                    strokeWidth="3.5"
                    filter="url(#glow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />

                  {/* Arrow Head */}
                  <polygon
                    points={
                      stepData.x1 < stepData.x2
                        ? `${stepData.x2 - 10},${stepData.y - 4.5} ${stepData.x2},${stepData.y} ${stepData.x2 - 10},${stepData.y + 4.5}`
                        : `${stepData.x2 + 10},${stepData.y - 4.5} ${stepData.x2},${stepData.y} ${stepData.x2 + 10},${stepData.y + 4.5}`
                    }
                    fill="#10b981"
                    filter="url(#glow)"
                  />

                  {/* Animated Data Packet circle */}
                  <motion.circle
                    key={`packet-${activeStep}`}
                    r="6.5"
                    fill="#3b82f6"
                    filter="url(#glow)"
                    initial={{ cx: stepData.x1 }}
                    animate={{ cx: stepData.x2 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                    cy={stepData.y}
                  />

                  {/* Badge Label indicating active step */}
                  <rect
                    x={((stepData.x1 + stepData.x2) / 2) - 22}
                    y={stepData.y - 17}
                    width="44"
                    height="13"
                    rx="3.5"
                    fill="#3b82f6"
                  />
                  <text
                    x={(stepData.x1 + stepData.x2) / 2}
                    y={stepData.y - 7}
                    textAnchor="middle"
                    className="text-[9px] font-bold font-mono fill-white select-none"
                  >
                    Step {activeStep + 1}
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Right Column: API Payload Inspector */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="flex-1 border border-border rounded-xl bg-slate-950 dark:bg-slate-900/50 p-4 font-mono text-[11px] sm:text-xs text-slate-300 overflow-y-auto min-h-[280px] lg:min-h-0 lg:max-h-[400px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2 select-none">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">💻 API Payload Inspector</span>
              {activeStep >= 0 && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/25 text-blue-400 font-bold font-sans text-[8px] animate-pulse">
                  Connected
                </span>
              )}
            </div>
            {renderPayloadInspector()}
          </div>
        </div>

      </div>

      {/* Step Callout */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && activeStep < total && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 shadow select-none">
                {activeStep + 1}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <h4 className="font-bold text-base sm:text-lg text-foreground">
                  {STEPS[activeStep].title}
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {STEPS[activeStep].desc}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Banner */}
      {isComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3.5"
        >
          <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
          <div className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed">
            <strong>OAuth 2.0 Authorization Code 인증 완료!</strong>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              시퀀스 흐름이 완벽히 검증되었습니다. 사용자의 브라우저를 통한 Redirect와 백채널(Server-to-Server) 요청이 명확히 격리되어 Access Token을 완전 무결하게 확보했습니다.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
