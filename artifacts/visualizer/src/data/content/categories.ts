import { Activity, Cpu, GitBranch, Layers3, ShieldAlert } from "lucide-react";
import type { Category } from "./content-types";

export const CONTENT_CATEGORIES = {
  workflow: {
    path: "workflows",
    label: "네트워크",
    color: "text-violet-700 dark:text-violet-400",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    icon: GitBranch,
    description: "복잡한 시스템의 동작 과정을 단계별로 시각화합니다. 네트워크, 프로토콜, 서버 동작 등 실제 시스템이 어떻게 작동하는지 인터랙티브하게 탐색하세요.",
  },
  attack: {
    path: "attacks",
    label: "공격기법",
    color: "text-rose-700 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    icon: ShieldAlert,
    description: "보안 취약점의 원인, 공격 흐름과 대응 절차를 단계별로 시각화합니다.",
  },
  failure: {
    path: "failures",
    label: "장애",
    englishLabel: "Failures",
    color: "text-amber-800 dark:text-amber-300",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Activity,
    description: "메모리와 동시성 등 소프트웨어 문제에서 정상 상태가 어디서 깨지는지 살펴보고, 증상과 진단·예방 방법을 연결합니다.",
  },
  algorithm: {
    path: "algorithms",
    label: "알고리즘",
    color: "text-emerald-700 dark:text-emerald-400",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: Cpu,
    description: "고전 알고리즘의 실행 과정을 눈으로 확인하세요. 정렬, 탐색, 수학적 알고리즘 등을 직접 조작하며 원리를 이해할 수 있습니다.",
  },
  architecture: {
    path: "architectures",
    label: "아키텍처",
    color: "text-sky-700 dark:text-sky-400",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    icon: Layers3,
    description: "이미 구현된 SaaS, 프레임워크와 플랫폼의 기능 구조 및 확장 인터페이스를 한 화면에서 탐색합니다. 상세 페이지에서는 구성요소와 국내·해외 활용 사례를 살펴볼 수 있습니다.",
  },
} as const satisfies Record<Category, {
  path: string;
  label: string;
  englishLabel?: string;
  color: string;
  badge: string;
  icon: typeof Activity;
  description: string;
}>;

export type CategoryPath = (typeof CONTENT_CATEGORIES)[Category]["path"];

export const CATEGORIES = Object.keys(CONTENT_CATEGORIES) as Category[];

export function categoryForPath(path: string): Category | undefined {
  return CATEGORIES.find((category) => CONTENT_CATEGORIES[category].path === path);
}

export function contentPath(category: Category, slug: string): string {
  return `/${CONTENT_CATEGORIES[category].path}/${slug}`;
}
