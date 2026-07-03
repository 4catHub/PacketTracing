import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ShieldCheck, Server, Laptop, Award, Key, ArrowRightLeft, Info } from "lucide-react";

type Phase = "client-hello" | "server-hello" | "key-exchange" | "secure-channel";

export default function HttpsHandshakeViz() {
  const [phase, setPhase] = useState<Phase>("client-hello");

  // GSAP 타임라인 제어용 ref
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // SVG 엘리먼트 Refs
  const clientHelloGroupRef = useRef<SVGGElement>(null);
  const serverHelloGroupRef = useRef<SVGGElement>(null);
  const certGroupRef = useRef<SVGGElement>(null);
  
  const caVerifyLineRef = useRef<SVGLineElement>(null);
  const caClientLineRef = useRef<SVGLineElement>(null);
  
  const clientPulseRef = useRef<SVGCircleElement>(null);
  const serverPulseRef = useRef<SVGCircleElement>(null);
  
  const clientKeyRef = useRef<SVGGElement>(null);
  const serverKeyRef = useRef<SVGGElement>(null);
  
  const tunnelRef = useRef<SVGLineElement>(null);
  const secureShieldRef = useRef<SVGRectElement>(null);
  const secureTextRef = useRef<SVGTextElement>(null);

  // 양방향 데이터 패킷 Refs
  const dp1Ref = useRef<SVGCircleElement>(null);
  const dp2Ref = useRef<SVGCircleElement>(null);

  useEffect(() => {
    // GSAP 타임라인 인스턴스 생성 및 연속 반복 루프 구성
    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 2.0,
      onRepeat: () => {
        setPhase("client-hello");
      }
    });
    timelineRef.current = tl;

    // --- 0. 초기 상태 설정 (Set Initials) ---
    gsap.set(clientHelloGroupRef.current, { x: 0, opacity: 0 });
    gsap.set(serverHelloGroupRef.current, { x: 0, opacity: 0 });
    gsap.set(certGroupRef.current, { x: 0, opacity: 0, scale: 0.9, transformOrigin: "50% 50%" });
    gsap.set([caVerifyLineRef.current, caClientLineRef.current], { opacity: 0, strokeDasharray: "6, 6", strokeDashoffset: 0 });
    gsap.set([clientPulseRef.current, serverPulseRef.current], { scale: 0, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set([clientKeyRef.current, serverKeyRef.current], { opacity: 0, y: -10 });
    gsap.set(tunnelRef.current, { opacity: 0, strokeWidth: 10 });
    gsap.set([secureShieldRef.current, secureTextRef.current], { opacity: 0 });
    gsap.set([dp1Ref.current, dp2Ref.current], { opacity: 0, cx: 120 });

    // --- 1. Client Hello 단계 (0.0s ~ 3.0s) ---
    tl.addLabel("client-hello");
    tl.to(clientHelloGroupRef.current, { opacity: 1, duration: 0.3 });
    // Client(120, 220)에서 Server(480, 220)으로 패킷 및 라벨 이동
    tl.to(clientHelloGroupRef.current, { x: 360, duration: 2.2, ease: "power1.inOut" });
    tl.to(clientHelloGroupRef.current, { opacity: 0, duration: 0.3, ease: "power1.in" }, "-=0.3");

    // --- 2. Server Hello & Certificate 단계 (3.0s ~ 7.2s) ---
    tl.addLabel("server-hello");
    tl.call(() => setPhase("server-hello"));
    
    // Server(480, 220)에서 Client(120, 220)으로 날아갈 준비
    tl.set(serverHelloGroupRef.current, { x: 0 }); // relative 초기화
    tl.set(certGroupRef.current, { x: 0 });
    
    tl.to([serverHelloGroupRef.current, certGroupRef.current], { opacity: 1, duration: 0.3 });
    
    // 서버 응답 패킷 및 인증서 날아감 (동시에 이동)
    tl.to(serverHelloGroupRef.current, { x: -360, duration: 2.2, ease: "power1.inOut" });
    tl.to(certGroupRef.current, { 
      x: -360, 
      y: 0,
      duration: 2.2, 
      ease: "power1.inOut" 
    }, "<");

    // 중간 지점에 다다랐을 때(x 이동거리 약 -180, 즉 x좌표 300 부근) CA 신뢰성 검증 빔 작동
    tl.to(caVerifyLineRef.current, { opacity: 1, duration: 0.2 }, "-=1.5");
    tl.to(caVerifyLineRef.current, { strokeDashoffset: -30, duration: 0.8, ease: "none" }, "<");
    tl.to(caVerifyLineRef.current, { opacity: 0, duration: 0.2 }, "-=0.7");
    
    tl.to(caClientLineRef.current, { opacity: 1, duration: 0.2 }, "-=1.0");
    tl.to(caClientLineRef.current, { strokeDashoffset: -30, duration: 0.8, ease: "none" }, "<");
    tl.to(caClientLineRef.current, { opacity: 0, duration: 0.2 }, "-=0.4");

    tl.to([serverHelloGroupRef.current, certGroupRef.current], { opacity: 0, duration: 0.3, ease: "power1.in" }, "-=0.3");

    // --- 3. Key Derivation 단계 (7.2s ~ 10.0s) ---
    tl.addLabel("key-exchange");
    tl.call(() => setPhase("key-exchange"));

    // 클라이언트 & 서버 연산 펄스 연출
    tl.to([clientPulseRef.current, serverPulseRef.current], {
      scale: 1.8,
      opacity: 0.8,
      duration: 0.1
    });
    tl.to([clientPulseRef.current, serverPulseRef.current], {
      scale: 3.0,
      opacity: 0,
      duration: 0.8,
      ease: "power1.out"
    });
    
    // 2차 펄스 추가
    tl.set([clientPulseRef.current, serverPulseRef.current], { scale: 0, opacity: 0 });
    tl.to([clientPulseRef.current, serverPulseRef.current], {
      scale: 1.8,
      opacity: 0.8,
      duration: 0.1
    }, "+=0.1");
    tl.to([clientPulseRef.current, serverPulseRef.current], {
      scale: 3.0,
      opacity: 0,
      duration: 0.8,
      ease: "power1.out"
    });

    // 대칭키 유도 완료 배지 등장 (노드 하단 아래로 쏙 등장)
    tl.to([clientKeyRef.current, serverKeyRef.current], {
      opacity: 1,
      y: 28,
      duration: 0.6,
      ease: "back.out(1.7)"
    }, "-=0.5");

    // --- 4. Finished & Secure Channel 단계 (10.0s ~ 15.5s) ---
    tl.addLabel("secure-channel");
    tl.call(() => setPhase("secure-channel"));

    // 보안 에메랄드 녹색 터널 및 쉴드 활성화
    tl.to(tunnelRef.current, { opacity: 1, duration: 0.6 });
    tl.to([secureShieldRef.current, secureTextRef.current], { opacity: 1, duration: 0.6 }, "<");

    // 양방향 암호화 데이터 송수신 반복 연출
    // 데이터 패킷 1 (Client -> Server)
    tl.set(dp1Ref.current, { cx: 120, opacity: 1 });
    tl.to(dp1Ref.current, { cx: 480, duration: 0.8, ease: "none" });
    tl.to(dp1Ref.current, { opacity: 0, duration: 0.1 });
    
    // 데이터 패킷 2 (Server -> Client)
    tl.set(dp2Ref.current, { cx: 480, opacity: 1 });
    tl.to(dp2Ref.current, { cx: 120, duration: 0.8, ease: "none" });
    tl.to(dp2Ref.current, { opacity: 0, duration: 0.1 });

    // 왕복 데이터 패킷 한 번 더 반복
    tl.set(dp1Ref.current, { cx: 120, opacity: 1 });
    tl.to(dp1Ref.current, { cx: 480, duration: 0.8, ease: "none" });
    tl.to(dp1Ref.current, { opacity: 0, duration: 0.1 });
    
    tl.set(dp2Ref.current, { cx: 480, opacity: 1 });
    tl.to(dp2Ref.current, { cx: 120, duration: 0.8, ease: "none" });
    tl.to(dp2Ref.current, { opacity: 0, duration: 0.1 });

    // --- 5. 대기 후 리셋 (15.5s ~ 17.5s) ---
    tl.to({}, { duration: 1.5 }); // 데이터 전송 후 터널 유지 상태 대기
    
    // 모든 보안 상태 원복 페이드아웃
    tl.to([tunnelRef.current, secureShieldRef.current, secureTextRef.current, clientKeyRef.current, serverKeyRef.current], {
      opacity: 0,
      duration: 0.6
    });

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* 라이트 모드 전용 단계 네비게이션 배너 */}
      <div className="bg-white border border-slate-200 shadow-sm p-4 rounded-2xl max-w-[640px] mx-auto space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            HTTPS Handshake Status
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className={`p-2.5 rounded-lg transition-all duration-300 ${phase === "client-hello" ? "bg-blue-50 text-blue-700 font-bold border border-blue-200" : "text-slate-400 font-medium"}`}>
            1. Client Hello
          </div>
          <div className={`p-2.5 rounded-lg transition-all duration-300 ${phase === "server-hello" ? "bg-emerald-50 text-emerald-700 font-bold border border-emerald-200" : "text-slate-400 font-medium"}`}>
            2. Server Hello
          </div>
          <div className={`p-2.5 rounded-lg transition-all duration-300 ${phase === "key-exchange" ? "bg-amber-50 text-amber-700 font-bold border border-amber-200" : "text-slate-400 font-medium"}`}>
            3. Key Derive
          </div>
          <div className={`p-2.5 rounded-lg transition-all duration-300 ${phase === "secure-channel" ? "bg-purple-50 text-purple-700 font-bold border border-purple-200" : "text-slate-400 font-medium"}`}>
            4. Secured
          </div>
        </div>
      </div>

      {/* SVG 다이어그램 패널 */}
      <div className="relative w-full max-w-[640px] mx-auto border border-slate-200 rounded-2xl bg-slate-50/50 shadow-inner overflow-hidden">
        <svg viewBox="0 0 600 380" className="w-full h-auto block select-none bg-white">
          <defs>
            {/* SVG 그림자 필터 (표준 feDropShadow 명세 준수) */}
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000000" floodOpacity="0.06" />
            </filter>
            <filter id="packet-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3b82f6" floodOpacity="0.2" />
            </filter>
            
            {/* 보안 터널 그라데이션 */}
            <linearGradient id="secureTunnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* CA-Client, Server-CA 점선 연결선 (인증서 검증용) */}
          <line
            ref={caVerifyLineRef}
            x1="480"
            y1="220"
            x2="300"
            y2="80"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            ref={caClientLineRef}
            x1="300"
            y1="80"
            x2="120"
            y2="220"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* 기본 네트워크 물리선 (회색 점선) */}
          <line
            x1="120"
            y1="220"
            x2="480"
            y2="220"
            stroke="#e2e8f0"
            strokeWidth="4"
            strokeDasharray="6 6"
          />

          {/* HTTPS 보안 터널 (GSAP로 크기/불투명도 조절) */}
          <line
            ref={tunnelRef}
            x1="120"
            y1="220"
            x2="480"
            y2="220"
            stroke="url(#secureTunnelGrad)"
            strokeLinecap="round"
          />

          {/* 보안 터널 활성화 쉴드 테두리 */}
          <rect
            ref={secureShieldRef}
            x="12"
            y="12"
            width="576"
            height="356"
            rx="16"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="6 6"
          />
          <text
            ref={secureTextRef}
            x="30"
            y="38"
            fill="#10b981"
            fontSize="13"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            🛡️ HTTPS 보안 암호 채널 활성화됨 (TLS 1.3)
          </text>

          {/* --- 데이터 흐름 패킷들 (보안 채널 활성화 시 왕복) --- */}
          <circle ref={dp1Ref} r="9" fill="#10b981" cy="220" />
          <circle ref={dp2Ref} r="9" fill="#3b82f6" cy="220" />

          {/* --- 1. Client Hello 패킷 그룹 --- */}
          <g ref={clientHelloGroupRef}>
            <circle cx="120" cy="220" r="10" fill="#3b82f6" filter="url(#packet-shadow)" />
            <g transform="translate(120, 172)">
              <rect x="-70" y="-15" width="140" height="30" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fill="#1e40af" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                Client Hello (g^x)
              </text>
            </g>
          </g>

          {/* --- 2. Server Hello 패킷 그룹 (패킷 라인 아래쪽 배치로 겹침 방지) --- */}
          <g ref={serverHelloGroupRef}>
            <circle cx="480" cy="220" r="10" fill="#10b981" filter="url(#packet-shadow)" />
            <g transform="translate(480, 272)">
              <rect x="-70" y="-15" width="140" height="30" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
              <text x="0" y="4" textAnchor="middle" fill="#065f46" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                Server Hello (g^y)
              </text>
            </g>
          </g>

          {/* --- 2-2. 인증서 전송 카드 그룹 (패킷 라인 위쪽 배치로 겹침 방지) --- */}
          <g ref={certGroupRef}>
            <g transform="translate(480, 168)">
              <rect x="-70" y="-15" width="140" height="30" rx="6" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" filter="url(#node-shadow)" />
              <text x="0" y="4" textAnchor="middle" fill="#d97706" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                📄 CA SSL 인증서
              </text>
            </g>
          </g>

          {/* --- 3. 클라이언트 & 서버 연산 펄스 서클 --- */}
          <circle ref={clientPulseRef} cx="120" cy="220" r="30" fill="none" stroke="#3b82f6" strokeWidth="3" />
          <circle ref={serverPulseRef} cx="480" cy="220" r="30" fill="none" stroke="#10b981" strokeWidth="3" />

          {/* --- 주체 노드 1: Client Browser --- */}
          <g transform="translate(120, 220)" filter="url(#node-shadow)">
            <rect x="-55" y="-40" width="110" height="80" rx="14" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
            <text x="0" y="-8" textAnchor="middle" fontSize="24">💻</text>
            <text x="0" y="20" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
              Client Browser
            </text>
            
            {/* 대칭키 합의 완료 배지 (Key Derivation 단계에서 등장 - 크기 증대) */}
            <g ref={clientKeyRef}>
              <rect x="-50" y="20" width="100" height="22" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
              <text x="0" y="34" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                🔑 세션 키 완성
              </text>
            </g>
          </g>

          {/* --- 주체 노드 2: Web Server --- */}
          <g transform="translate(480, 220)" filter="url(#node-shadow)">
            <rect x="-55" y="-40" width="110" height="80" rx="14" fill="#ffffff" stroke="#10b981" strokeWidth="2.5" />
            <text x="0" y="-8" textAnchor="middle" fontSize="24">🖥️</text>
            <text x="0" y="20" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
              Web Server
            </text>

            {/* 대칭키 합의 완료 배지 (Key Derivation 단계에서 등장 - 크기 증대) */}
            <g ref={serverKeyRef}>
              <rect x="-50" y="20" width="100" height="22" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
              <text x="0" y="34" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                🔑 세션 키 완성
              </text>
            </g>
          </g>

          {/* --- 주체 노드 3: CA (Certificate Authority) --- */}
          <g transform="translate(300, 80)" filter="url(#node-shadow)">
            <rect x="-55" y="-35" width="110" height="70" rx="14" fill="#ffffff" stroke="#f59e0b" strokeWidth="2.5" />
            <text x="0" y="-6" textAnchor="middle" fontSize="22">🏢</text>
            <text x="0" y="18" textAnchor="middle" fill="#1e293b" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
              CA (인증 기관)
            </text>
          </g>

          {/* --- 고정 역할 텍스트 가이드 (폰트 크기 대폭 증대 및 레이아웃 유지) --- */}
          {/* Client 역할 */}
          <g transform="translate(120, 315)">
            <text x="0" y="0" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • 암호 알고리즘 제안
            </text>
            <text x="0" y="15" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • SSL 인증서 검증
            </text>
            <text x="0" y="30" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • 대칭 세션키 유도
            </text>
          </g>

          {/* Server 역할 */}
          <g transform="translate(480, 315)">
            <text x="0" y="0" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • 암호 방식 최종 선택
            </text>
            <text x="0" y="15" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • CA 서명 인증서 제공
            </text>
            <text x="0" y="30" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • 대칭 세션키 유도
            </text>
          </g>

          {/* CA 역할 */}
          <g transform="translate(300, 165)">
            <text x="0" y="0" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • 서버 신원 검증 및 서명 발급
            </text>
            <text x="0" y="15" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="semibold" fontFamily="sans-serif">
              • 디지털 신뢰 체인 형성
            </text>
          </g>
        </svg>
      </div>

      {/* 하단 정보성 가이드 보드 */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-[640px] mx-auto space-y-4">
        <h4 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Info size={18} className="text-blue-500" />
          연속 동작 연출 시나리오 설명
        </h4>
        <ul className="space-y-2.5 text-sm sm:text-base text-slate-600 list-disc list-inside leading-relaxed">
          <li>
            <strong className="text-slate-800">1. Client Hello:</strong> 브라우저가 지원 암호 리스트와 자신의 키 교환 파라미터(<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs sm:text-sm">g^x</code>)를 서버에 전송합니다.
          </li>
          <li>
            <strong className="text-slate-800">2. Server Hello & Cert:</strong> 서버가 암호를 정하고 자신의 파라미터(<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs sm:text-sm">g^y</code>) 및 인증서를 제공하며, 브라우저는 상위 CA 기관을 통해 신뢰성을 검증합니다.
          </li>
          <li>
            <strong className="text-slate-800">3. Key Derive:</strong> 두 주체가 파라미터를 교환하여 각자 동일한 <strong className="text-slate-800">대칭 세션키</strong>(<code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs sm:text-sm">g^xy</code>)를 독립적으로 유도해 냅니다.
          </li>
          <li>
            <strong className="text-slate-800">4. Secured Channel:</strong> 인증이 완료되어 녹색 보안 채널이 활성화되며, 이후의 실시간 웹 데이터는 모두 합의된 세션키로 암호화되어 안전하게 양방향 전송됩니다.
          </li>
        </ul>
      </div>
    </div>
  );
}
