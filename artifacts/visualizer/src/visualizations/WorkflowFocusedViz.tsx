import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import {
  clampWorkflowSpan,
  resolveWorkflowMotionTone,
  type WorkflowAccent,
  type WorkflowActor,
  type WorkflowTransition,
  type WorkflowVisualizationSpec,
  type WorkflowWaterfallSpan,
} from "./workflow-visualization";

const accentStroke: Record<WorkflowAccent, string> = {
  blue: "#3b82f6", cyan: "#06b6d4", violet: "#8b5cf6",
  emerald: "#10b981", amber: "#f59e0b", rose: "#f43f5e",
};
const spanTone: Record<NonNullable<WorkflowWaterfallSpan["tone"]>, string> = {
  primary: "bg-blue-500 dark:bg-blue-400", secondary: "bg-violet-500 dark:bg-violet-400",
  success: "bg-emerald-500 dark:bg-emerald-400", warning: "bg-amber-500 dark:bg-amber-400",
  danger: "bg-rose-500 dark:bg-rose-400",
};
const transitionColor: Record<NonNullable<WorkflowTransition["kind"]>, string> = {
  request: "#3b82f6", response: "#10b981", event: "#8b5cf6", state: "#f59e0b",
};
const accentOf = (actor: WorkflowActor): WorkflowAccent => actor.accent ?? "blue";

function Controls({step,total,playing,onReset,onPrev,onToggle,onNext}:{step:number;total:number;playing:boolean;onReset:()=>void;onPrev:()=>void;onToggle:()=>void;onNext:()=>void}) {
  const progress=total<=1?100:(step/(total-1))*100;
  return <div className="flex h-11 items-center gap-3 rounded-xl border border-border bg-card px-3 shadow-sm">
    <div className="flex items-center gap-0.5">
      <button type="button" onClick={onReset} title="처음부터" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><RotateCcw size={15}/></button>
      <button type="button" onClick={onPrev} disabled={step===0} title="이전 단계" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"><SkipBack size={15}/></button>
      <button type="button" onClick={onToggle} title={playing?"일시정지":"재생"} className="rounded-md p-1.5 text-primary hover:bg-primary/10">{playing?<Pause size={17} fill="currentColor"/>:<Play size={17} fill="currentColor"/>}</button>
      <button type="button" onClick={onNext} disabled={step===total-1} title="다음 단계" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"><SkipForward size={15}/></button>
    </div>
    <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><motion.div className="absolute inset-y-0 left-0 rounded-full bg-primary" animate={{width:`${progress}%`}}/></div>
    <span className="min-w-[46px] text-right text-[11px] font-semibold text-muted-foreground">{step+1}/{total}</span>
  </div>;
}

function TopologyScene({spec,stepIndex}:{spec:WorkflowVisualizationSpec;stepIndex:number}) {
  const reduced=useReducedMotion()??false;
  const step=spec.steps[stepIndex];
  const active=new Set(step.activeActorIds);
  const map=useMemo(()=>Object.fromEntries(spec.actors.map(a=>[a.id,a])),[spec.actors]);
  const tone=resolveWorkflowMotionTone(spec);
  const [compact,setCompact]=useState(false);
  useEffect(()=>{
    const media=window.matchMedia("(max-width: 640px)");
    const sync=()=>setCompact(media.matches);
    sync();
    media.addEventListener("change",sync);
    return()=>media.removeEventListener("change",sync);
  },[]);
  const W=compact?460:1000,H=compact?500:430;
  const point=(a:WorkflowActor)=>compact
    ? {x:34+(a.x/100)*(W-68),y:24+(a.y/100)*(H-48)}
    : {x:a.x/100*W,y:a.y/100*H};

  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Focused interaction</div>
      <div className="mt-1 text-sm font-bold text-foreground">{step.title}</div>
      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.summary}</div>
    </div>
    <div className="relative bg-gradient-to-b from-muted/15 to-background">
      <svg viewBox={`0 0 ${W} ${H}`} className="block min-h-[330px] w-full" role="img" aria-label={step.title}>
        <defs>
          <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker>
        </defs>

        {/* Persistent structural context stays visible even when an edge is inactive. */}
        {(spec.topologyLinks??[]).map((link,i)=>{
          const from=map[link.from],to=map[link.to]; if(!from||!to) return null;
          const a=point(from),b=point(to);
          return <line key={`base-${i}-${link.from}-${link.to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-border" strokeWidth="2.5" strokeDasharray="5 7" opacity=".9"/>;
        })}

        {/* Stable system context: all actors stay in the same place across every beat. */}
        {spec.actors.map(actor=>{
          const p=point(actor); const isActive=active.has(actor.id);
          return <g key={actor.id} opacity={isActive?1:0.46}>
            <circle cx={p.x} cy={p.y} r={isActive?46:36} className="fill-card stroke-border" stroke={isActive?accentStroke[accentOf(actor)]:undefined} strokeWidth={isActive?4:2}/>
            {isActive && <motion.circle cx={p.x} cy={p.y} r={55} fill="none" stroke={accentStroke[accentOf(actor)]} strokeWidth="2" initial={false} animate={reduced?{}:{r:[52,59,52],opacity:[.25,.08,.25]}} transition={{duration:2,repeat:Infinity}}/>}
            <text x={p.x} y={p.y-3} textAnchor="middle" className="fill-foreground text-[16px] font-bold">{actor.label}</text>
            <text x={p.x} y={p.y+16} textAnchor="middle" className="fill-muted-foreground text-[11px]">{actor.detail??""}</text>
          </g>;
        })}

        {/* Only the active interaction lights up; topology itself never zooms or moves. */}
        {(step.transitions??[]).map((t,i,all)=>{
          const from=map[t.from],to=map[t.to]; if(!from||!to) return null;
          const a=point(from),b=point(to),color=transitionColor[t.kind??"request"];
          const dx=b.x-a.x,dy=b.y-a.y,len=Math.max(Math.hypot(dx,dy),1),ux=dx/len,uy=dy/len;
          const sx=a.x+ux*50,sy=a.y+uy*50,ex=b.x-ux*50,ey=b.y-uy*50;
          const samePair=all.filter(x=>(x.from===t.from&&x.to===t.to)||(x.from===t.to&&x.to===t.from));
          const pairIndex=samePair.indexOf(t);
          const lane=(pairIndex-(samePair.length-1)/2)*62;
          const nx=-uy,ny=ux;
          const cx=(sx+ex)/2+nx*lane,cy=(sy+ey)/2+ny*lane;
          const path=`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
          const labelX=.25*sx+.5*cx+.25*ex,labelY=.25*sy+.5*cy+.25*ey-14;
          return <g key={`${stepIndex}-${i}-${t.from}-${t.to}`}>
            <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" markerEnd="url(#wf-arrow)"/>
            <rect x={labelX-64} y={labelY-15} width="128" height="22" rx="7" className="fill-background stroke-border"/>
            <text x={labelX} y={labelY} textAnchor="middle" className="fill-foreground text-[10px] font-semibold">{i+1}. {t.label}</text>
            <motion.circle r="7" fill={color}>
              <animateMotion dur={reduced?"0s":"1.25s"} begin={reduced?"0s":`${i*.22}s`} repeatCount={reduced?"1":"indefinite"} path={path}/>
            </motion.circle>
          </g>;
        })}

        {tone==="playful" && step.playfulHint && <text x={W/2} y={H-18} textAnchor="middle" className="fill-muted-foreground text-[10px]">{step.playfulHint}</text>}
      </svg>
    </div>
  </section>;
}

function Waterfall({spec,stepIndex}:{spec:WorkflowVisualizationSpec;stepIndex:number}) {
  const reduced=useReducedMotion()??false; const step=spec.steps[stepIndex];
  return <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
      <div><div className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{spec.waterfallLabel??"Step detail · relative waterfall"}</div><div className="mt-1 text-sm font-bold text-foreground">{step.title}</div></div>
      <div className="text-[10px] text-muted-foreground">상대적 실행 순서 · 정밀 벤치마크 아님</div>
    </div>
    <div className="grid grid-cols-[minmax(92px,150px)_1fr] items-center gap-x-3 gap-y-2">
      <div/><div className="grid grid-cols-5 text-[9px] text-muted-foreground"><span>0</span><span>25</span><span>50</span><span>75</span><span className="text-right">100</span></div>
      {step.spans.map((span,i)=>{const start=clampWorkflowSpan(span.start),end=Math.max(start,clampWorkflowSpan(span.end)),width=Math.max((end-start)*100,2);
        return <div key={`${stepIndex}-${span.label}-${i}`} className="contents">
          <div className="truncate text-[11px] font-medium text-muted-foreground" title={span.label}>{span.label}</div>
          <div className="relative h-7 overflow-hidden rounded-md border border-border bg-muted/45"><motion.div className={`absolute inset-y-0 rounded-md ${spanTone[span.tone??"primary"]}`} style={{left:`${start*100}%`,width:`${width}%`,transformOrigin:"left center"}} initial={reduced?undefined:{scaleX:0,opacity:.55}} animate={{scaleX:1,opacity:1}} transition={{duration:reduced?0:.32,delay:i*.05}}/></div>
        </div>;
      })}
    </div>
  </section>;
}

export default function WorkflowFocusedViz({spec}:{spec:WorkflowVisualizationSpec}) {
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(true); const timer=useRef<ReturnType<typeof setInterval>|null>(null); const reduced=useReducedMotion()??false; const total=spec.steps.length;
  useEffect(()=>{if(timer.current)clearInterval(timer.current);if(!playing||reduced||total<=1)return;timer.current=setInterval(()=>setStep(v=>v>=total-1?0:v+1),spec.autoplayMs??3600);return()=>{if(timer.current)clearInterval(timer.current);};},[playing,reduced,spec.autoplayMs,total]);
  if(!total)return <div className="rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">표시할 워크플로우 단계가 없습니다.</div>;
  const safe=Math.min(step,total-1);
  return <div className="flex w-full flex-col gap-3">
    <Controls step={safe} total={total} playing={playing&&!reduced} onReset={()=>{setStep(0);setPlaying(false);}} onPrev={()=>{setStep(v=>Math.max(v-1,0));setPlaying(false);}} onToggle={()=>setPlaying(v=>!v)} onNext={()=>{setStep(v=>Math.min(v+1,total-1));setPlaying(false);}}/>
    <TopologyScene spec={spec} stepIndex={safe}/>
    <Waterfall spec={spec} stepIndex={safe}/>
  </div>;
}
