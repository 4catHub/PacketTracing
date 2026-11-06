import {
  AppWindow,
  Braces,
  FileCheck2,
  FileCode2,
  FileSearch,
  Globe2,
  KeyRound,
  Package,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Terminal,
  UserRound,
} from "lucide-react";
import {
  StageFileStack,
  stageIconClass as icon,
  type StageIllustration,
} from "./AttackStageIllustration";

function CacheNodes() {
  return (
    <svg
      viewBox="0 0 96 68"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M 48 25 V 35 M 19 47 V 35 H 77 V 47 M 48 35 V 47" />
      <rect x="31" y="9" width="34" height="16" rx="4" />
      <path d="M 37 17 H 42 M 47 17 H 59" />
      {[19, 48, 77].map((x) => (
        <g key={x} transform={`translate(${x} 54)`}>
          <circle r="8" className="fill-card" />
          <path d="m -3 0 2 2 4 -4" />
        </g>
      ))}
    </svg>
  );
}

export const nikkeAttackStages = {
  overview: {
    objects: [
      {
        mark: <StageFileStack count={4} />,
        label: "공식 CDN",
        detail: "런처 스크립트 배포",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <AppWindow className={icon} />,
        label: "PC 런처",
        detail: "내장 브라우저 · JS 브리지",
        tone: "blue",
      },
      {
        mark: <Globe2 className={icon} />,
        label: "외부 서버",
        detail: "외부 로더 · 번들",
        tone: "neutral",
      },
    ],
  },
  responseOverview: {
    objects: [
      {
        mark: <FileCheck2 className={icon} />,
        label: "정상 배포 복구",
        detail: "운영사가 파일 교체",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <CacheNodes />,
        label: "공식 CDN",
        detail: "엣지 캐시 갱신",
        tone: "safe",
      },
      {
        mark: <ShieldCheck className={icon} />,
        label: "사용자 PC",
        detail: "별도로 검사·제거",
        tone: "safe",
      },
    ],
  },
  domain: {
    objects: [
      {
        mark: <Globe2 className={icon} />,
        label: "외부 도메인",
        detail: "일부 게임 서비스가 사용",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <KeyRound className={icon} />,
        label: "제3자 통제",
        detail: "도메인 제어권 이전",
        tone: "danger",
      },
    ],
  },
  tamper: {
    objects: [
      {
        mark: <StageFileStack count={4} crossed />,
        label: "공식 CDN의 JS 4개",
        detail: "변조된 파일",
        tone: "danger",
        next: "arrow",
      },
      {
        mark: <Braces className={icon} />,
        label: "외부 로더 코드",
        detail: "스크립트 안에 추가",
        tone: "warning",
      },
    ],
  },
  load: {
    objects: [
      {
        mark: <FileCode2 className={icon} />,
        label: "변조 스크립트",
        detail: "공식 CDN 응답",
        tone: "danger",
        next: "arrow",
      },
      {
        mark: <AppWindow className={icon} />,
        label: "런처 내장 브라우저",
        detail: "스크립트 로드·실행",
        tone: "blue",
      },
    ],
  },
  download: {
    objects: [
      {
        mark: <Braces className={icon} />,
        label: "JS 브리지",
        detail: "외부 다운로드 요청",
        tone: "warning",
        next: "arrow",
      },
      {
        mark: <Globe2 className={icon} />,
        label: "외부 서버",
        detail: "조건에 따라 응답",
        tone: "danger",
        next: "arrow",
      },
      {
        mark: <Package className={icon} />,
        label: "K2F 번들",
        detail: "런처 쪽으로 내려옴",
        tone: "danger",
      },
    ],
  },
  execute: {
    objects: [
      {
        mark: <Package className={icon} />,
        label: "내려받은 번들",
        detail: "K2F Lua 에이전트 포함",
        tone: "danger",
        next: "arrow",
      },
      {
        mark: <Terminal className={icon} />,
        label: "로컬에서 실행",
        detail: "사용자 계정 권한",
        tone: "danger",
      },
    ],
  },
  replace: {
    objects: [
      {
        mark: <StageFileStack count={3} crossed />,
        label: "변조본 3개",
        detail: "CDN에서 교체할 파일",
        tone: "danger",
        next: "arrow",
      },
      {
        mark: <StageFileStack count={3} />,
        label: "정상본 3개",
        detail: "운영사가 교체",
        tone: "safe",
      },
    ],
  },
  cache: {
    objects: [
      {
        mark: <RefreshCw className={icon} />,
        label: "나머지 파일 1개",
        detail: "캐시 갱신 요청",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <CacheNodes />,
        label: "CDN 엣지",
        detail: "정상본 순차 반영",
        tone: "safe",
        next: "arrow",
      },
      {
        mark: <FileCheck2 className={icon} />,
        label: "정상 스크립트",
        detail: "런처에 제공",
        tone: "safe",
      },
    ],
  },
  scan: {
    objects: [
      {
        mark: <ScanLine className={icon} />,
        label: "사용자 PC 검사",
        detail: "기존 파일 점검",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <FileSearch className={icon} />,
        label: "악성 파일 탐지",
        detail: "제거 여부 확인",
        tone: "warning",
        next: "arrow",
      },
      {
        mark: <ShieldCheck className={icon} />,
        label: "동의 후 제거",
        detail: "탐지된 경우 실행",
        tone: "safe",
      },
    ],
  },
  credentials: {
    objects: [
      {
        mark: <UserRound className={icon} />,
        label: "계정 확인",
        detail: "점검을 마친 기기 사용",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <KeyRound className={icon} />,
        label: "기존 자격증명 폐기",
        detail: "비밀번호 변경 · 키 재발급",
        tone: "safe",
      },
    ],
  },
} satisfies Record<string, StageIllustration>;

export type NikkeStageId = keyof typeof nikkeAttackStages;
