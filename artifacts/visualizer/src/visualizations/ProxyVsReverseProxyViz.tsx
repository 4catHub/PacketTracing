import { motion } from "framer-motion";
import { Server, Network, ArrowDown, Shield, Globe, Lock } from "lucide-react";

// Nginx Combined Config Snippets
const FORWARD_PROXY_NGINX_CODE = `server {
    listen 8888;
    resolver 8.8.8.8; # External DNS

    location / {
        # Forward client request to target URL
        proxy_pass http://$http_host$request_uri;
        proxy_set_header Host $http_host;
    }
}`;

const REVERSE_PROXY_NGINX_CODE = `server {
    listen 80;
    server_name api.example.com;

    location /api/v1/ {
        # Route external requests to internal backend
        proxy_pass http://127.0.0.1:8080/;

        # Preserve original client IP & headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`;

// Extended Comparison Table Data
const COMPARISON_DATA = [
  {
    feature: "주요 대리 대상 (Agent For)",
    proxy: "클라이언트 (Client Side)",
    reverseProxy: "백엔드 서버 (Server Side)",
    loadBalancer: "서버 클러스터 (Multiple Servers)",
    apiGateway: "마이크로서비스 (MSA Gateway)",
    caching: "자원 응답 (Static/API Response)"
  },
  {
    feature: "핵심 목적 (Core Goal)",
    proxy: "IP 은닉, 사내망 보안, 웹 접근 제어",
    reverseProxy: "서버 IP 은닉, SSL 종단, 라우팅",
    loadBalancer: "트래픽 균등 분산, 고가용성(HA)",
    apiGateway: "인증/인가, Rate Limit, API 변환",
    caching: "빠른 응답 재사용, DB 부하 감소"
  },
  {
    feature: "주요 활용 위치 (Position)",
    proxy: "사내망 출력 게이트웨이",
    reverseProxy: "VPC / DMZ 백엔드 전방 최전선",
    loadBalancer: "L4/L7 네트워크 스위치 / Nginx",
    apiGateway: "MSA 최전방 진입점",
    caching: "프록시 레이어 / CDN 분산망"
  },
  {
    feature: "보안 기능 (Security Role)",
    proxy: "클라이언트 신원 보호 & 웹 필터링",
    reverseProxy: "백엔드 실 IP 은닉 & SSL Termination",
    loadBalancer: "장애 서버 자동 감지(Healthcheck)",
    apiGateway: "API Key / JWT 인증 & 디도스 차단",
    caching: "원본 서버 인프라 보호"
  }
];

function UnifiedVerticalSvg() {
  return (
    <svg
      viewBox="0 0 600 520"
      className="w-full max-w-[600px] h-auto select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* SECTION 1: FORWARD PROXY (TOP) */}
      <g>
        {/* Section Container Box */}
        <rect
          x="15"
          y="15"
          width="570"
          height="230"
          rx="12"
          className="fill-blue-500/5 stroke-blue-500/20"
          strokeWidth="1.5"
        />
        <text
          x="30"
          y="40"
          className="text-[11px] font-extrabold fill-blue-600 dark:fill-blue-400 uppercase tracking-wider font-sans flex items-center"
        >
          1. FORWARD PROXY (포워드 프록시: 클라이언트 대리 및 IP 은닉)
        </text>

        {/* Connecting Lines */}
        <line
          x1="110"
          y1="135"
          x2="260"
          y2="135"
          className="stroke-blue-400 dark:stroke-blue-500/60"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <line
          x1="340"
          y1="135"
          x2="480"
          y2="135"
          className="stroke-emerald-400 dark:stroke-emerald-500/60"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Client Node */}
        <g>
          <rect
            x="45"
            y="95"
            width="90"
            height="80"
            rx="8"
            className="fill-white dark:fill-slate-900 stroke-blue-300 dark:stroke-blue-800"
            strokeWidth="2"
          />
          <text x="90" y="125" textAnchor="middle" className="text-[22px]">💻</text>
          <text x="90" y="146" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-100 font-sans">
            Client
          </text>
          <text x="90" y="161" textAnchor="middle" className="text-[8px] fill-blue-600 dark:fill-blue-400 font-mono font-bold">
            192.168.1.10
          </text>
        </g>

        {/* Forward Proxy Node */}
        <g>
          <rect
            x="240"
            y="85"
            width="120"
            height="100"
            rx="10"
            className="fill-white dark:fill-slate-900 stroke-blue-500 dark:stroke-blue-400 shadow-sm"
            strokeWidth="2.5"
          />
          <text x="300" y="117" textAnchor="middle" className="text-[24px]">🛡️</text>
          <text x="300" y="139" textAnchor="middle" className="text-[10.5px] font-extrabold fill-slate-800 dark:fill-slate-100 font-sans">
            Forward Proxy
          </text>
          <text x="300" y="153" textAnchor="middle" className="text-[8px] fill-amber-600 dark:fill-amber-400 font-sans font-semibold">
            사내망 보안 & IP 변환
          </text>
          <rect x="257" y="160" width="86" height="15" rx="3" className="fill-blue-100 dark:fill-blue-950 stroke-blue-300 dark:stroke-blue-800" strokeWidth="1" />
          <text x="300" y="171" textAnchor="middle" className="text-[7.5px] font-mono fill-blue-700 dark:fill-blue-300 font-bold">
            203.0.113.5
          </text>
        </g>

        {/* External Target Web Server */}
        <g>
          <rect
            x="465"
            y="95"
            width="90"
            height="80"
            rx="8"
            className="fill-white dark:fill-slate-900 stroke-emerald-400 dark:stroke-emerald-800"
            strokeWidth="2"
          />
          <text x="510" y="125" textAnchor="middle" className="text-[22px]">🌐</text>
          <text x="510" y="146" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-100 font-sans">
            Target Web
          </text>
          <text x="510" y="161" textAnchor="middle" className="text-[8px] fill-emerald-600 dark:fill-emerald-400 font-mono font-bold">
            1.1.1.1:80
          </text>
        </g>

        {/* Looping Packet Animation: Client -> Forward Proxy -> Target */}
        <motion.g
          key="fp-pkt-loop"
          initial={{ x: 90, y: 135, opacity: 0 }}
          animate={{
            x: [90, 300, 300, 510, 510, 300, 300, 90],
            y: [135, 135, 135, 135, 135, 135, 135, 135],
            opacity: [0, 1, 1, 1, 1, 1, 1, 0]
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.4, 0.6, 0.7, 0.85, 0.9, 1]
          }}
        >
          <circle cx="0" cy="0" r="7" className="fill-blue-500 dark:fill-blue-400" />
          <text x="0" y="2.5" textAnchor="middle" className="text-[7.5px] fill-white font-extrabold font-mono">
            REQ
          </text>
        </motion.g>

        {/* Footnote Badge */}
        <rect x="140" y="200" width="320" height="24" rx="5" className="fill-slate-900/90 dark:fill-slate-800/90" />
        <text x="300" y="216" textAnchor="middle" className="text-[9.5px] fill-slate-100 font-medium font-sans">
          외부 웹 서버는 출발지 IP를 프록시 주소인 <tspan className="fill-amber-300 font-mono font-bold">203.0.113.5</tspan>로 인지함
        </text>
      </g>

      {/* SECTION DIVIDER ARROW */}
      <g>
        <line x1="300" y1="248" x2="300" y2="265" className="stroke-slate-300 dark:stroke-slate-700" strokeWidth="1.5" strokeDasharray="3 3" />
        <polygon points="296,265 304,265 300,271" className="fill-slate-400 dark:fill-slate-600" />
      </g>

      {/* SECTION 2: REVERSE PROXY (BOTTOM) */}
      <g>
        {/* Section Container Box */}
        <rect
          x="15"
          y="275"
          width="570"
          height="230"
          rx="12"
          className="fill-emerald-500/5 stroke-emerald-500/20"
          strokeWidth="1.5"
        />
        <text
          x="30"
          y="300"
          className="text-[11px] font-extrabold fill-emerald-600 dark:fill-emerald-400 uppercase tracking-wider font-sans"
        >
          2. REVERSE PROXY (리버스 프록시: 백엔드 서버 대리 및 라우팅)
        </text>

        {/* Connecting Lines */}
        <line
          x1="110"
          y1="395"
          x2="250"
          y2="395"
          className="stroke-purple-400 dark:stroke-purple-500/60"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M 350 395 C 400 395, 415 345, 465 345"
          className="stroke-emerald-400 dark:stroke-emerald-500/60"
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
        />
        <path
          d="M 350 395 C 400 395, 415 445, 465 445"
          className="stroke-emerald-400 dark:stroke-emerald-500/60"
          strokeWidth="2"
          strokeDasharray="4 4"
          fill="none"
        />

        {/* Public Client Node */}
        <g>
          <rect
            x="45"
            y="355"
            width="90"
            height="80"
            rx="8"
            className="fill-white dark:fill-slate-900 stroke-purple-300 dark:stroke-purple-800"
            strokeWidth="2"
          />
          <text x="90" y="385" textAnchor="middle" className="text-[22px]">📱</text>
          <text x="90" y="406" textAnchor="middle" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-100 font-sans">
            Public Client
          </text>
          <text x="90" y="421" textAnchor="middle" className="text-[8px] fill-purple-600 dark:fill-purple-400 font-mono font-bold">
            203.0.113.88
          </text>
        </g>

        {/* Nginx Reverse Proxy Node */}
        <g>
          <rect
            x="235"
            y="345"
            width="130"
            height="100"
            rx="10"
            className="fill-white dark:fill-slate-900 stroke-emerald-500 dark:stroke-emerald-400 shadow-sm"
            strokeWidth="2.5"
          />
          <text x="300" y="375" textAnchor="middle" className="text-[24px]">🟢</text>
          <text x="300" y="396" textAnchor="middle" className="text-[11px] font-extrabold fill-slate-900 dark:fill-slate-100 font-sans">
            Nginx Proxy
          </text>
          <text x="300" y="410" textAnchor="middle" className="text-[8.5px] fill-emerald-600 dark:fill-emerald-400 font-mono font-bold">
            api.example.com
          </text>
          <rect x="250" y="418" width="100" height="16" rx="3" className="fill-emerald-100 dark:fill-emerald-950 stroke-emerald-300 dark:stroke-emerald-800" strokeWidth="1" />
          <text x="300" y="429" textAnchor="middle" className="text-[7.5px] font-mono fill-emerald-700 dark:fill-emerald-300 font-bold">
            SSL & proxy_pass
          </text>
        </g>

        {/* Internal Backend App Server 1 */}
        <g>
          <rect
            x="455"
            y="315"
            width="100"
            height="60"
            rx="7"
            className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />
          <text x="505" y="338" textAnchor="middle" className="text-[18px]">🖥️</text>
          <text x="505" y="354" textAnchor="middle" className="text-[9px] font-bold fill-slate-800 dark:fill-slate-100 font-sans">
            Backend App A
          </text>
          <text x="505" y="366" textAnchor="middle" className="text-[7.5px] fill-slate-500 font-mono">
            127.0.0.1:8080
          </text>
        </g>

        {/* Internal Backend App Server 2 */}
        <g>
          <rect
            x="455"
            y="415"
            width="100"
            height="60"
            rx="7"
            className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-700"
            strokeWidth="1.5"
          />
          <text x="505" y="438" textAnchor="middle" className="text-[18px]">⚙️</text>
          <text x="505" y="454" textAnchor="middle" className="text-[9px] font-bold fill-slate-800 dark:fill-slate-100 font-sans">
            Backend App B
          </text>
          <text x="505" y="466" textAnchor="middle" className="text-[7.5px] fill-slate-500 font-mono">
            127.0.0.1:8081
          </text>
        </g>

        {/* Looping Packet Animation: Public Client -> Nginx -> Backend 1 */}
        <motion.g
          key="rp-pkt-loop"
          initial={{ x: 90, y: 395, opacity: 0 }}
          animate={{
            x: [90, 300, 300, 505, 505, 300, 300, 90],
            y: [395, 395, 395, 345, 345, 395, 395, 395],
            opacity: [0, 1, 1, 1, 1, 1, 1, 0]
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.3, 0.4, 0.6, 0.7, 0.85, 0.9, 1]
          }}
        >
          <circle cx="0" cy="0" r="7.5" className="fill-purple-500 dark:fill-purple-400" />
          <text x="0" y="2.5" textAnchor="middle" className="text-[7.5px] fill-white font-extrabold font-mono">
            GET
          </text>
        </motion.g>

        {/* Footnote Badge */}
        <rect x="130" y="460" width="340" height="24" rx="5" className="fill-slate-900/90 dark:fill-slate-800/90" />
        <text x="300" y="476" textAnchor="middle" className="text-[9.5px] fill-slate-100 font-medium font-sans">
          클라이언트는 백엔드 실 주소를 모르며 <tspan className="fill-emerald-300 font-mono font-bold">api.example.com</tspan>만 인지함
        </text>
      </g>
    </svg>
  );
}

export default function ProxyVsReverseProxyViz() {
  return (
    <div className="flex flex-col gap-6 py-2 font-sans">
      {/* 1. Unified Vertical Visual Canvas Box */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col p-5 sm:p-6 gap-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Forward Proxy vs Reverse Proxy 구조 직렬 비교
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Realtime Looping Stream
          </span>
        </div>

        {/* 100% SVG Vertical Diagram Viewport */}
        <div className="flex justify-center items-center w-full bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2 sm:p-4">
          <UnifiedVerticalSvg />
        </div>
      </div>

      {/* 2. Unified Nginx Configuration Examples Box (Forward + Reverse side-by-side) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Server className="text-emerald-500" size={18} />
            Nginx 설정 예시 비교 (Forward Proxy vs Reverse Proxy)
          </h4>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold">
            nginx.conf
          </span>
        </div>

        {/* Side-by-Side Code Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Forward Proxy Code */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <Shield size={14} />
              Forward Proxy 설정 예시 (Port 8888)
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-950 text-slate-100 p-3.5 rounded-xl border border-slate-800 leading-relaxed h-full">
              {FORWARD_PROXY_NGINX_CODE}
            </pre>
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
              💡 내부 클라이언트가 Nginx를 프록시 서버로 사용해 외부 <code>$http_host</code>로 우회 접근합니다.
            </p>
          </div>

          {/* Reverse Proxy Code */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Globe size={14} />
              Reverse Proxy 설정 예시 (Port 80)
            </div>
            <pre className="whitespace-pre-wrap font-mono text-xs bg-slate-950 text-slate-100 p-3.5 rounded-xl border border-slate-800 leading-relaxed h-full">
              {REVERSE_PROXY_NGINX_CODE}
            </pre>
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60">
              💡 외부 80포트 요청을 받아 내부 <code>127.0.0.1:8080</code> 백엔드 서비스로 전달하고 헤더를 유지합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Extended Comparison Table (Bottom) */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Network className="text-blue-500" size={18} />
          관련 네트워크 기술 비교표 (Proxy vs LB vs API Gateway vs Caching)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-semibold">구분 (Feature)</th>
                <th className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400">Forward Proxy</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">Reverse Proxy</th>
                <th className="py-2.5 px-3 font-semibold text-indigo-600 dark:text-indigo-400">Load Balancer</th>
                <th className="py-2.5 px-3 font-semibold text-rose-600 dark:text-rose-400">API Gateway</th>
                <th className="py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400">Caching</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {COMPARISON_DATA.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">{row.feature}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{row.proxy}</td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">{row.reverseProxy}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{row.loadBalancer}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{row.apiGateway}</td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{row.caching}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
