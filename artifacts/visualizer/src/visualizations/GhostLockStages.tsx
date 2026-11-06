import {
  CircleSlash,
  Cpu,
  GitPullRequestArrow,
  Hourglass,
  ListOrdered,
  LockKeyhole,
  Search,
  ShieldCheck,
  Unlink,
  UserRound,
} from "lucide-react";
import {
  stageIconClass as icon,
  type StageIllustration,
} from "./AttackStageIllustration";

function StackSlots({ state }: { state: "live" | "expired" | "empty" }) {
  return (
    <svg
      viewBox="0 0 96 68"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <g className="text-muted-foreground">
        <path d="M 18 13 H 78 M 18 55 H 78" />
        <rect x="24" y="17" width="48" height="8" rx="2" />
        <rect x="24" y="43" width="48" height="8" rx="2" />
      </g>
      <rect
        x="24"
        y="27"
        width="48"
        height="14"
        rx="2"
        fill={state === "live" ? "currentColor" : "none"}
        fillOpacity=".15"
        strokeDasharray={state === "live" ? undefined : "4 3"}
      />
      {state === "live" ? (
        <circle cx="48" cy="34" r="3.5" fill="currentColor" />
      ) : state === "expired" ? (
        <path d="m 44 30 8 8 m 0 -8 -8 8" />
      ) : (
        <path d="M 44 34 H 52" />
      )}
    </svg>
  );
}

function WaitCycle() {
  return (
    <svg
      viewBox="0 0 96 68"
      className="size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M 31 25 Q 48 7 65 25 m -9 -2 9 2 -1 -9 M 65 43 Q 48 61 31 43 m 9 2 -9 -2 1 9" />
      <circle cx="19" cy="34" r="11" />
      <circle cx="77" cy="34" r="11" />
      <g
        fill="currentColor"
        stroke="none"
        textAnchor="middle"
        fontWeight="800"
        fontSize="14"
      >
        <text x="19" y="39">
          A
        </text>
        <text x="77" y="39">
          C
        </text>
      </g>
    </svg>
  );
}

export const ghostLockStages = {
  overview: {
    objects: [
      {
        mark: <ListOrdered className={icon} />,
        label: "futex 대기열",
        detail: "실제 대기자 A",
        tone: "blue",
      },
      {
        mark: <StackSlots state="live" />,
        label: "A의 커널 스택",
        detail: "대기 객체를 저장",
        tone: "blue",
      },
      {
        mark: <LockKeyhole className={icon} />,
        label: "대상 PI 잠금",
        detail: "스레드 C가 소유",
        tone: "neutral",
      },
    ],
  },
  enqueue: {
    objects: [
      {
        mark: <Hourglass className={icon} />,
        label: "스레드 A",
        detail: "원본 futex에서 대기",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <ListOrdered className={icon} />,
        label: "원본 대기열",
        detail: "커널이 A를 등록",
        tone: "neutral",
        next: "arrow",
      },
      {
        mark: <StackSlots state="live" />,
        label: "A의 스택",
        detail: "대기 객체 생성",
        tone: "blue",
      },
    ],
  },
  dependency: {
    objects: [
      {
        mark: <LockKeyhole className={icon} />,
        label: "스레드 C",
        detail: "대상 PI 잠금 보유",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <Hourglass className={icon} />,
        label: "체인 잠금 대기",
        detail: "A가 가진 잠금 요청",
        tone: "warning",
        next: "arrow",
      },
      {
        mark: <UserRound className={icon} />,
        label: "스레드 A",
        detail: "체인 잠금 소유자",
        tone: "blue",
      },
    ],
  },
  deadlock: {
    objects: [
      {
        mark: <GitPullRequestArrow className={icon} />,
        label: "스레드 B",
        detail: "A 대신 재큐잉",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <WaitCycle />,
        label: "A ↔ C 순환",
        detail: "서로 상대의 잠금 대기",
        tone: "warning",
        next: "arrow",
      },
      {
        mark: <Cpu className={icon} />,
        label: "커널의 교착 감지",
        detail: "−EDEADLK 반환",
        tone: "danger",
      },
    ],
  },
  wrongRollback: {
    objects: [
      {
        mark: <Cpu className={icon} />,
        label: "롤백 실행",
        detail: "대기 객체를 트리에서 제거",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <Unlink className={icon} />,
        label: "B의 대기 상태 초기화",
        detail: "현재 실행 스레드를 정리",
        tone: "danger",
      },
      {
        mark: <StackSlots state="live" />,
        label: "A의 참조는 유지",
        detail: "실제 대기자의 상태가 남음",
        tone: "warning",
      },
    ],
  },
  dangling: {
    objects: [
      {
        mark: <UserRound className={icon} />,
        label: "A의 참조가 남음",
        detail: "이전 스택 주소를 가리킴",
        tone: "danger",
        next: "arrow",
      },
      {
        mark: <StackSlots state="expired" />,
        label: "대기 객체 수명 종료",
        detail: "사용자 공간으로 복귀",
        tone: "danger",
      },
    ],
  },
  useAfterFree: {
    objects: [
      {
        mark: <Search className={icon} />,
        label: "후속 PI 탐색",
        detail: "커널이 A의 참조를 읽음",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <StackSlots state="expired" />,
        label: "수명 끝난 스택 접근",
        detail: "스택 Use-After-Free",
        tone: "danger",
      },
    ],
  },
  correctRollback: {
    objects: [
      {
        mark: <Cpu className={icon} />,
        label: "실제 대기자 확인",
        detail: "객체에 연결된 A 선택",
        tone: "blue",
        next: "arrow",
      },
      {
        mark: <LockKeyhole className={icon} />,
        label: "A의 잠금 아래 정리",
        detail: "대기 객체를 트리에서 제거",
        tone: "safe",
        next: "arrow",
      },
      {
        mark: <Unlink className={icon} />,
        label: "A의 참조 해제",
        detail: "NULL로 초기화",
        tone: "safe",
      },
    ],
  },
  cleared: {
    objects: [
      {
        mark: <Unlink className={icon} />,
        label: "A의 참조는 NULL",
        detail: "복귀 전에 초기화",
        tone: "safe",
        next: "blocked",
      },
      {
        mark: <StackSlots state="expired" />,
        label: "수명 끝난 스택",
        detail: "후속 탐색에서 접근 차단",
        tone: "neutral",
      },
    ],
  },
  guard: {
    objects: [
      {
        mark: <StackSlots state="empty" />,
        label: "큐 등록 전 오류",
        detail: "대기자 정보가 미설정",
        tone: "warning",
        next: "arrow",
      },
      {
        mark: <CircleSlash className={icon} />,
        label: "제거 함수 생략",
        detail: "미등록 상태 확인",
        tone: "safe",
        next: "arrow",
      },
      {
        mark: <ShieldCheck className={icon} />,
        label: "오류 분기 종료",
        detail: "NULL 역참조 차단",
        tone: "safe",
      },
    ],
  },
} satisfies Record<string, StageIllustration>;

export type GhostLockStageId = keyof typeof ghostLockStages;
