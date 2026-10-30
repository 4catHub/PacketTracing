import type { ReactNode } from "react";
import type { RedisCaseId } from "./RedisSecurity2026Scene";

export type RedisPanelStage = "client" | "access" | "core" | "memory" | "result";
type Mode = "vulnerable" | "patched";
type Box = { x: number; y: number; w: number; h: number };
type Props = {
  box: Box; selected: RedisCaseId; stage: RedisPanelStage;
  phase: number | null; mode: Mode; active: boolean; compact: boolean;
};

type CaseData = {
  input: string; permission: string; engine: string; issue: string;
  outcome: string; remedy: string; code: string;
  pipeline: [string, string, string];
};

const cases: Record<RedisCaseId, CaseData> = {
  "23479": {
    input: "차단 명령", permission: "차단 명령 실행 권한",
    engine: "차단 클라이언트 재실행", issue: "해제된 클라이언트 참조",
    outcome: "UAF · 조건부 RCE", remedy: "재실행 오류 처리 수정",
    code: "BLOCK / RETRY", pipeline: ["BLOCK", "RESUME", "EVICT"],
  },
  "25243": {
    input: "직렬화 데이터", permission: "RESTORE 명령 권한",
    engine: "기본 RESTORE 복원", issue: "잘못된 메모리 접근",
    outcome: "메모리 오류 · 조건부 RCE", remedy: "Redis 본체 보안 업데이트",
    code: "RESTORE / RDB", pipeline: ["SERIAL", "DECODE", "OBJECT"],
  },
  "25588": {
    input: "시계열 직렬화 데이터", permission: "RESTORE + TimeSeries",
    engine: "RedisTimeSeries 모듈", issue: "시계열 데이터 복원 오류",
    outcome: "모듈 메모리 오류 · RCE 가능", remedy: "TimeSeries 모듈 수정",
    code: "RESTORE / TS", pipeline: ["RESTORE", "TS MODULE", "SERIES"],
  },
  "25589": {
    input: "Bloom 직렬화 데이터", permission: "RESTORE + RedisBloom",
    engine: "RedisBloom 모듈", issue: "경계 밖 메모리 접근",
    outcome: "모듈 메모리 오류 · RCE 가능", remedy: "RedisBloom 모듈 수정",
    code: "RESTORE / BF", pipeline: ["RESTORE", "BF MODULE", "BITSET"],
  },
  "23631": {
    input: "복제·Lua 상태", permission: "쓰기 허용 레플리카",
    engine: "마스터/레플리카 동기화", issue: "해제된 Lua 상태 참조",
    outcome: "Lua UAF · 조건부 RCE", remedy: "복제·Lua 및 설정 점검",
    code: "SYNC / LUA", pipeline: ["MASTER", "SYNC", "LUA"],
  },
};

const colors = {
  base: "#64748b", blue: "#2563eb", violet: "#7c3aed",
  warning: "#d97706", danger: "#e11d48", safe: "#059669",
};

function Txt({ x, y, children, tint, size = 11, strong = false, anchor = "start" }: {
  x: number; y: number; children: ReactNode; tint?: string;
  size?: number; strong?: boolean; anchor?: "start" | "middle" | "end";
}) {
  return <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={strong ? 750 : 500}
    className={tint ? undefined : "fill-foreground"} fill={tint}>{children}</text>;
}

function Shell({ box, active, color, heading, eyebrow, children }: {
  box: Box; active: boolean; color: string; heading: string;
  eyebrow: string; children: ReactNode;
}) {
  return <g>
    {active && <rect x={box.x - 4} y={box.y - 4} width={box.w + 8} height={box.h + 8}
      fill="none" stroke={color} strokeWidth={1.8} strokeDasharray="5 4" rx={15} />}
    <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={12}
      stroke={active ? color : "#94a3b8"} strokeWidth={active ? 2.3 : 1.1}
      strokeOpacity={active ? 1 : .6} className="fill-card" />
    <rect x={box.x} y={box.y + 12} width={5} height={box.h - 24} rx={3}
      fill={active ? color : "#94a3b8"} />
    <Txt x={box.x + 17} y={box.y + 23} size={10} tint={colors.base} strong>{eyebrow}</Txt>
    <Txt x={box.x + 17} y={box.y + 46} size={15} strong>{heading}</Txt>
    <path d={"M " + (box.x + 12) + " " + (box.y + 57) + " H " + (box.x + box.w - 12)}
      className="stroke-border" strokeWidth={1} />
    {children}
  </g>;
}

function MiniGlyph({ selected, x, y, width, height, tint, emphasis }: {
  selected: RedisCaseId; x: number; y: number; width: number; height: number;
  tint: string; emphasis: boolean;
}) {
  // Each CVE deliberately has a different pictogram, not a generic server square.
  const cy = y + height / 2;
  if (selected === "23479") {
    const gap = 7, unit = (width - 2 * gap) / 3;
    return <g>
      {["WAIT", "RETRY", "EVICT"].map((name, i) =>
        <g key={name}>
          <rect x={x + i * (unit + gap)} y={cy - 19} width={unit} height={38} rx={5}
            fill={i === 2 && emphasis ? colors.danger : tint} fillOpacity={.13}
            stroke={i === 2 && emphasis ? colors.danger : tint}
            strokeWidth={i === 2 && emphasis ? 2.2 : 1.25}
            strokeDasharray={i === 2 && emphasis ? "4 3" : undefined} />
          <Txt x={x + i * (unit + gap) + unit / 2} y={cy + 4} anchor="middle"
            tint={i === 2 && emphasis ? colors.danger : tint} strong size={10}>{name}</Txt>
        </g>)}
    </g>;
  }
  if (selected === "25243") {
    const dw = Math.min(57, width * .31);
    return <g>
      <path d={"M " + x + " " + (cy - 26) + " H " + (x + dw - 13) +
        " L " + (x + dw) + " " + (cy - 13) + " V " + (cy + 26) +
        " H " + x + " Z"} fill={tint} fillOpacity={.1} stroke={tint} strokeWidth={1.5} />
      <path d={"M " + (x + dw - 13) + " " + (cy - 26) + " V " + (cy - 13) +
        " H " + (x + dw)} fill="none" stroke={tint} strokeWidth={1.3} />
      <Txt x={x + dw / 2} y={cy + 8} anchor="middle" tint={tint} size={11} strong>RDB</Txt>
      <path d={"M " + (x + dw + 6) + " " + cy + " H " + (x + dw + 21) +
        " l -5 -5 m 5 5 l -5 5"} stroke={tint} fill="none" strokeWidth={1.8} />
      {["00", "01", "10"].map((v, i) => {
        const segment = Math.max(12, (width - dw - 30) / 3);
        const bx = x + dw + 26 + i * segment;
        return <g key={i}>
          <rect x={bx} y={cy - 15} width={segment - 4} height={30} rx={3}
            stroke={emphasis && i === 2 ? colors.danger : tint} fill={tint} fillOpacity={.08}
            strokeDasharray={emphasis && i === 2 ? "4 2" : undefined} />
          <Txt x={bx + (segment - 4) / 2} y={cy + 4} anchor="middle" tint={tint} size={10}>{v}</Txt>
        </g>;
      })}
    </g>;
  }
  if (selected === "25588") {
    return <g>
      <path d={"M " + (x + 4) + " " + (cy - 27) + " V " + (cy + 25) +
        " H " + (x + width - 4)} stroke={tint} strokeOpacity={.65} fill="none" strokeWidth={1.5} />
      <path d={"M " + (x + 10) + " " + (cy + 12) +
        " l " + (width * .2) + " -19 l " + (width * .18) + " 7 l " +
        (width * .21) + " -24 l " + (width * .17) + " 16 l " + (width * .15) + " -6"}
        fill="none" stroke={tint} strokeWidth={2.6} strokeLinejoin="round" />
      {[.2, .38, .59, .76].map((p, i) =>
        <circle key={i} cx={x + 10 + width * p}
          cy={cy + [ -7, 0, -24, -8 ][i]} r={3.5} fill={tint} />)}
      {emphasis && <circle cx={x + width * .59 + 10} cy={cy - 24} r={9}
        fill="none" stroke={colors.danger} strokeDasharray="3 3" strokeWidth={2} />}
    </g>;
  }
  if (selected === "25589") {
    const cols = 10, cells = 20, s = Math.min(15, (width - 30) / cols);
    return <g>
      {Array.from({length:cells}, (_, i) => {
        const isSet = [1, 3, 4, 8, 11, 14, 17].includes(i);
        return <rect key={i} x={x + 3 + (i % cols) * (s + 3)}
          y={cy - 19 + Math.floor(i / cols) * (s + 5)} width={s} height={s} rx={2}
          fill={isSet ? tint : colors.base} fillOpacity={isSet ? .33 : .07}
          stroke={emphasis && i === 19 ? colors.danger : tint} strokeWidth={emphasis && i === 19 ? 2 : 1} />;
      })}
      {emphasis && <path d={"M " + (x + 10 * (s + 3)) + " " + (cy - 24) +
        " V " + (cy + 27)} stroke={colors.danger} strokeWidth={2} strokeDasharray="3 3" />}
    </g>;
  }
  return <g>
    {["MASTER", "REPLICA"].map((label, i) => {
      const xx = x + i * (width * .54);
      return <g key={label}>
        <rect x={xx} y={cy - 24} width={width * .43} height={48} rx={6}
          fill={tint} fillOpacity={.12}
          stroke={i === 1 && emphasis ? colors.danger : tint} strokeWidth={1.8}
          strokeDasharray={i === 1 && emphasis ? "4 3" : undefined}/>
        <Txt x={xx + width * .215} y={cy - 4} tint={tint} strong size={10}
          anchor="middle">{label}</Txt>
        <Txt x={xx + width * .215} y={cy + 12} tint={tint} size={10}
          anchor="middle">{i === 0 ? "SYNC" : "LUA"}</Txt>
      </g>;
    })}
    <path d={"M " + (x + width * .44 + 2) + " " + cy + " H " + (x + width * .52 - 2) +
      " l -5 -5 m 5 5 l -5 5"} stroke={tint} fill="none" strokeWidth={2} />
  </g>;
}

function TopPanel({ box, selected, stage, phase, mode, active, compact }: Props) {
  const item = cases[selected];
  const patched = mode === "patched" && phase !== null && phase >= 1;
  const dangerStep = mode === "vulnerable" && phase !== null && phase >= 2;
  const tint = patched ? colors.safe : stage === "client" ? colors.blue :
    stage === "access" ? colors.blue : colors.violet;
  const heading = stage === "client" ? item.input :
    stage === "access" ? item.permission : item.engine;
  const idx = stage === "client" ? 1 : stage === "access" ? 2 : 3;
  const code = stage === "client" ? item.code : stage === "access" ?
    (selected === "23631" ? "replica-read-only=no" :
      selected === "23479" ? "BLOCKING CMD" :
        selected === "25243" ? "ACL: RESTORE" :
          selected === "25588" ? "MODULE: TIMESERIES" : "MODULE: BLOOM") :
    item.pipeline.join("  >  ");
  const y = box.y + 75, x = box.x + 17, w = box.w - 34;
  const drawingHeight = compact ? 73 : 112;
  const motifY = y + 8;
  const shapeWidth = Math.min(compact ? 206 : 174, w - 24);
  return <Shell box={box} active={active} color={tint}
    eyebrow={"0" + idx + (stage === "client" ? " / ENTRY" :
      stage === "access" ? " / PERMISSION" : " / DISPATCH")}
    heading={heading}>
    <rect x={x} y={y} width={w} height={drawingHeight} rx={9}
      className="fill-background stroke-border" strokeWidth={1.2} />
    {stage === "access" &&
      <g>
        <path d={"M " + (x + 15) + " " + (motifY + 13) + " l 17 -6 l 17 6 v 22 q -17 18 -34 0 z"}
          fill={colors.blue} fillOpacity={.1} stroke={colors.blue} strokeWidth={1.6} />
        <path d={"M " + (x + 25) + " " + (motifY + 25) + " l 5 5 l 11 -13"}
          fill="none" stroke={colors.blue} strokeWidth={2} />
      </g>}
    {stage === "access"
      ? <g transform={"translate(" + (x + 68) + " " + (motifY + 2) + ") scale(0.58)"}>
          <MiniGlyph selected={selected} x={0} y={0} width={165} height={56}
            tint={tint} emphasis={dangerStep && active} />
        </g>
      : <MiniGlyph selected={selected} x={x + 13} y={motifY}
          width={shapeWidth} height={56} tint={tint} emphasis={dangerStep && active} />}
    <Txt x={x + 10} y={box.y + (compact ? 177 : 220)}
      tint={patched ? colors.safe : dangerStep && active ? colors.danger : colors.base}
      size={compact ? 11 : 10} strong>
      {stage === "core" && dangerStep && active ? "위험 경로: " + item.pipeline[2] :
        patched && stage === "core" ? "수정된 내부 처리 적용" : code}
    </Txt>
    {!compact && <Txt x={x + 3} y={box.y + box.h - 17} size={10} tint={colors.base}>
      {stage === "client" ? "인증된 사용자의 제어 입력" :
        stage === "access" ? "사용자·모듈·레플리카 조건 확인" : "Redis / 모듈 경계에서 실행"}
    </Txt>}
  </Shell>;
}

function MemoryPanel({ box, selected, phase, mode, active, compact }: Props) {
  const item = cases[selected];
  const bad = mode === "vulnerable" && phase !== null && phase >= 3;
  const patched = mode === "patched" && phase !== null && phase >= 1;
  const tint = patched ? colors.safe : bad ? colors.danger : colors.warning;
  const x = box.x + 18, y = box.y + 83, w = box.w - 36;
  const unit = compact ? 29 : 35;
  const markY = y + 67;
  return <Shell box={box} active={active} color={tint}
    eyebrow="05 / MEMORY FAILURE" heading={item.issue}>
    <rect x={x} y={y} width={w} height={compact ? 91 : 102} rx={8}
      className="fill-background stroke-border" />
    {(selected === "23479" || selected === "23631") ? <g>
      <rect x={x + 12} y={y + 12} width={w * .27} height={58} rx={5}
        stroke={colors.violet} strokeWidth={1.5} fill={colors.violet} fillOpacity={.1} />
      <Txt x={x + 12 + w * .135} y={y + 36} tint={colors.violet} anchor="middle" strong size={11}>
        {selected === "23479" ? "CLIENT REF" : "LUA REF"}
      </Txt>
      <Txt x={x + 12 + w * .135} y={y + 53} tint={colors.violet} anchor="middle" size={10}>pointer</Txt>
      <path d={"M " + (x + 21 + w * .27) + " " + (y + 42) +
        " H " + (x + w * .67 - 6) + " l -7 -6 m 7 6 l -7 6"}
        fill="none" stroke={tint} strokeWidth={2.2} strokeDasharray={bad ? "5 3" : undefined} />
      <rect x={x + w * .68} y={y + 12} width={w * .27} height={58} rx={5}
        stroke={tint} strokeWidth={2} strokeDasharray={bad ? "5 3" : undefined}
        fill={tint} fillOpacity={.12}/>
      <Txt x={x + w * .815} y={y + 38} tint={tint} anchor="middle" strong size={13}>
        {patched ? "VALID" : bad ? "FREED" : "HEAP"}
      </Txt>
      <Txt x={x + w * .815} y={y + 54} tint={tint} anchor="middle" size={10}>
        {patched ? "no stale ref" : bad ? "dangling" : "allocated"}
      </Txt>
    </g> : selected === "25243" ? <g>
      {[0, 1, 2].map((i) => {
        const xx = x + 14 + i * (w * .32);
        return <g key={i}>
          <rect x={xx} y={y + 13} width={w * .26} height={56} rx={6}
            stroke={bad && i === 1 ? colors.danger : tint}
            strokeWidth={bad && i === 1 ? 2.3 : 1.2}
            fill={tint} fillOpacity={.09}
            strokeDasharray={bad && i === 1 ? "5 3" : undefined} />
          <Txt x={xx + w * .13} y={y + 37} tint={tint} strong size={11} anchor="middle">
            {i === 0 ? "ALLOC" : i === 1 ? (bad ? "FREE ×2" : "FREE") : "CHECK"}
          </Txt>
          <Txt x={xx + w * .13} y={y + 53} tint={colors.base} size={10} anchor="middle">
            {i === 0 ? "memory" : i === 1 ? (bad ? "reported" : "lifetime") : "boundary"}
          </Txt>
        </g>;
      })}
      <path d={"M " + (x + 22 + w * .26) + " " + markY +
        " H " + (x + w * .64)} stroke={tint} strokeWidth={1.8} fill="none" />
    </g> : <g>
      {Array.from({length:16}, (_, i) => {
        const u = Math.min(unit, (w - 40) / 10), gap = 4;
        const bx = x + 12 + (i % 8) * (u + gap);
        const by = y + 16 + Math.floor(i / 8) * (u + 4);
        const overflow = bad && (i === 7 || i === 15);
        return <rect key={i} x={bx} y={by} width={u} height={u} rx={3}
          fill={overflow ? colors.danger : tint}
          fillOpacity={overflow ? .26 : i % 3 === 0 ? .18 : .07}
          stroke={overflow ? colors.danger : tint}
          strokeWidth={overflow ? 2.4 : 1}
          strokeDasharray={overflow ? "4 3" : undefined}/>;
      })}
      {selected === "25588" ?
        <path d={"M " + (x + 24) + " " + (y + 47) +
          " l 25 -20 l 24 9 l 25 -14 l 24 8 l 21 -18"}
          stroke={tint} strokeWidth={2} fill="none" /> :
        <g>
          <path d={"M " + (x + 12) + " " + (y + 80) +
            " H " + (x + w - 15)} stroke={tint} strokeWidth={2}
            strokeDasharray={bad ? "4 3" : undefined} fill="none" />
          <Txt x={x + w - 15} y={y + 68} tint={tint} size={10} anchor="end" strong>
            {bad ? "OOB BOUNDARY" : "BIT ARRAY"}
          </Txt>
        </g>}
    </g>}
    <Txt x={x + 4} y={box.y + box.h - 40} tint={tint} strong size={compact ? 11 : 12}>
      {patched ? "✓ 해당 취약 메모리 경로 보안 수정" :
        bad ? selected === "23479" || selected === "23631" ? "✕ 해제된 참조를 다시 사용 (UAF)" :
          selected === "25243" ? "✕ double-free 등 메모리 안전성 위반" :
            selected === "25588" ? "✕ 시계열 복원 중 잘못된 메모리 접근" :
              "✕ Bloom 메모리 경계 밖 접근" :
          "메모리 수명·경계 상태를 도형으로 추적"}
    </Txt>
    <Txt x={x + 4} y={box.y + box.h - 18} size={10} tint={colors.base}>
      주소·실측 스택·악용 입력이 아닌 원리 개념도
    </Txt>
  </Shell>;
}

function ResultPanel({ box, selected, phase, mode, active, compact }: Props) {
  const item = cases[selected];
  const patched = mode === "patched" && phase !== null && phase >= 1;
  const risk = mode === "vulnerable" && phase === 4;
  const tint = patched ? colors.safe : risk ? colors.danger : colors.warning;
  const x = box.x + 21, y = box.y + 82, w = box.w - 42;
  const h = compact ? 63 : 72;
  return <Shell box={box} active={active} color={tint}
    eyebrow="06 / CONDITIONAL OUTCOME" heading={patched ? "수정 적용 · 잔여 위험 검증" : "결과 · 조건부 영향"}>
    <rect x={x} y={y} width={w} height={h} rx={8} className="fill-background stroke-border"/>
    <rect x={x + 10} y={y + 12} width={Math.min(89, w * .25)} height={h - 23}
      rx={6} stroke={tint} strokeWidth={1.7} fill={tint} fillOpacity={.12} />
    <Txt x={x + 10 + Math.min(89, w * .25) / 2} y={y + (compact ? 39 : 43)}
      tint={tint} strong anchor="middle" size={12}>
      {patched ? "PATCH" : risk ? "FAULT" : "CHECK"}
    </Txt>
    <path d={"M " + (x + Math.min(89, w * .25) + 19) + " " + (y + h / 2) +
      " H " + (x + Math.min(89, w * .25) + 44) + " l -6 -6 m 6 6 l -6 6"}
      stroke={tint} strokeWidth={2} fill="none" />
    <Txt x={x + Math.min(89, w * .25) + 54} y={y + (compact ? 26 : 30)}
      tint={tint} strong size={compact ? 11 : 13}>
      {patched ? item.remedy : risk ? "RCE는 조건부" : "실제 실행은 별도 검증"}
    </Txt>
    <Txt x={x + Math.min(89, w * .25) + 54} y={y + (compact ? 44 : 53)}
      tint={colors.base} size={11}>
      {patched ? "버전·설정·로그 확인" :
        selected === "23631" ? "레플리카·Lua 조건" :
          selected === "23479" ? "UAF · 프로세스 권한" :
            selected === "25243" ? "복원 메모리 손상" :
              selected === "25588" ? "TimeSeries 모듈" : "Bloom 모듈"}
    </Txt>
    <rect x={x} y={y + (compact ? 75 : 89)} width={w} height={compact ? 27 : 35} rx={5}
      fill={tint} fillOpacity={.08} stroke={tint} strokeOpacity={.5} />
    <Txt x={x + 13} y={y + (compact ? 93 : 111)} tint={tint}
      strong size={compact ? 11 : 12}>
      {patched ? "패치 확인 ≠ 과거 침해 없음" :
        selected === "23631" ? "복제 설정 · 지원 버전 확인" :
          selected === "25588" ? "Redis + TimeSeries 수정" :
            selected === "25589" ? "Redis + RedisBloom 수정" :
              "Redis 본체 수정 릴리스 적용"}
    </Txt>
    {!compact && <Txt x={x + 3} y={box.y + box.h - 18} tint={colors.base} size={10}>
      데이터 유출·프로세스 장애·RCE는 환경 및 악용 성공 여부에 따라 달라짐
    </Txt>}
  </Shell>;
}

export default function RedisCasePanel(props: Props) {
  return props.stage === "memory" ? <MemoryPanel {...props}/> :
    props.stage === "result" ? <ResultPanel {...props}/> :
      <TopPanel {...props}/>;
}
