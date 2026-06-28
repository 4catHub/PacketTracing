import { motion } from "framer-motion";

interface App {
  name: string;
  runtime: string;
  lib: string;
  color: string;
  textColor: string;
}

const APPS: App[] = [
  { name: "App A", runtime: "Python 2.7", lib: "Django 1.x", color: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700", textColor: "text-blue-700 dark:text-blue-300" },
  { name: "App B", runtime: "Python 3.11", lib: "FastAPI", color: "bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700", textColor: "text-violet-700 dark:text-violet-300" },
  { name: "App C", runtime: "Node 18", lib: "Express", color: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700", textColor: "text-emerald-700 dark:text-emerald-300" },
  { name: "App D", runtime: "Node 14", lib: "Koa (레거시)", color: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700", textColor: "text-amber-700 dark:text-amber-300" },
];

export default function DockerViz() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Before */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
              ❌ Docker 적용 전
            </span>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-red-300 dark:border-red-700 p-4 space-y-3 bg-red-50/30 dark:bg-red-900/10 h-full">
            <div className="flex items-center gap-2">
              <span className="text-base">🖥️</span>
              <span className="text-sm font-bold text-foreground">단일 서버 — 공유 런타임</span>
            </div>

            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-100/60 dark:bg-red-900/30 p-3 text-center">
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">공유 런타임 / OS 패키지</span>
              <div className="flex justify-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-800/60 rounded text-red-700 dark:text-red-300">Python 2.7 ⚡</span>
                <span className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-800/60 rounded text-red-700 dark:text-red-300">Python 3.11 ⚡</span>
                <span className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-800/60 rounded text-red-700 dark:text-red-300">Node 18 ⚡</span>
                <span className="text-xs px-2 py-0.5 bg-red-200 dark:bg-red-800/60 rounded text-red-700 dark:text-red-300">Node 14 ⚡</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg border border-red-300 dark:border-red-700">
              <span className="text-sm">⚠️</span>
              <span className="text-xs text-red-700 dark:text-red-400 font-medium">
                Python 버전 충돌: 동시에 기본 python으로 설정 불가
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {APPS.map((app) => (
                <div key={app.name} className={`rounded-xl border p-2.5 space-y-0.5 ${app.color}`}>
                  <div className={`text-sm font-bold ${app.textColor}`}>{app.name}</div>
                  <div className="text-xs text-muted-foreground">{app.runtime}</div>
                  <div className="text-xs text-muted-foreground">{app.lib}</div>
                  {(app.runtime === "Python 2.7" || app.runtime === "Python 3.11") && (
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">⚡ 버전 충돌</div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-start gap-1.5"><span>•</span><span>App A 업그레이드 시 App B가 깨질 수 있음</span></div>
              <div className="flex items-start gap-1.5"><span>•</span><span>새 서버마다 수동 패키지 설치 반복</span></div>
              <div className="flex items-start gap-1.5"><span>•</span><span>"내 컴퓨터에서는 됐는데요" 빈번 발생</span></div>
            </div>
          </div>
        </motion.div>

        {/* After */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              ✅ Docker 적용 후
            </span>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 p-4 space-y-3 bg-emerald-50/30 dark:bg-emerald-900/10 h-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🖥️</span>
                <span className="text-sm font-bold text-foreground">동일 서버 — 컨테이너 격리</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">격리됨 ✓</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {APPS.map((app) => (
                <div key={app.name} className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-1">
                  <div className="rounded-lg p-2.5 space-y-1 bg-slate-100/60 dark:bg-slate-800/40">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🐳</span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Container</span>
                    </div>
                    <div className={`rounded-lg border p-1.5 space-y-0.5 ${app.color}`}>
                      <div className={`text-sm font-bold ${app.textColor}`}>{app.name}</div>
                      <div className="text-xs text-muted-foreground">{app.runtime}</div>
                      <div className="text-xs text-muted-foreground">{app.lib}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ 독립 실행</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-center">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">🐳 Docker Engine (Host OS 공유, 프로세스 격리)</span>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span>각 컨테이너가 독립된 런타임 — 버전 충돌 없음</span></div>
              <div className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span>Dockerfile 한 파일로 어디서나 동일한 환경 재현</span></div>
              <div className="flex items-start gap-1.5"><span className="text-emerald-500">✓</span><span>docker run 한 줄로 신규 서버 즉시 배포</span></div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
