import React from "react";
import ReactMarkdown from "react-markdown";
import { ContentItem } from "@/data/content/content-types";

interface Section {
  title?: string;
  level?: number;
  content: string;
}

function parseMarkdownSections(markdown: string): Section[] {
  const lines = markdown.trim().split("\n");
  const sections: Section[] = [];
  let currentTitle: string | undefined = undefined;
  let currentLevel: number | undefined = undefined;
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headerMatch) {
      if (currentLines.length > 0 || currentTitle !== undefined) {
        sections.push({
          title: currentTitle,
          level: currentLevel,
          content: currentLines.join("\n").trim(),
        });
        currentLines = [];
      }
      currentLevel = headerMatch[1].length;
      currentTitle = headerMatch[2].trim();
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0 || currentTitle !== undefined) {
    sections.push({
      title: currentTitle,
      level: currentLevel,
      content: currentLines.join("\n").trim(),
    });
  }

  return sections;
}

// 텍스트/노드에서 '키워드: 설명' 패턴을 찾아 키워드 볼드 처리
function formatColonNodes(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") {
    let cleanText = children.replace(/^[-•*—\s]+/, "");
    cleanText = cleanText.replace(/^(\d{1,2}\.\s*)/, "");

    const colonIndex = cleanText.indexOf(":");
    if (colonIndex > 0 && colonIndex < 60 && !cleanText.startsWith("http")) {
      const key = cleanText.slice(0, colonIndex).trim();
      const rest = cleanText.slice(colonIndex + 1);
      return (
        <>
          <strong className="text-foreground font-semibold">{key}:</strong>
          {rest}
        </>
      );
    }
    return cleanText;
  }

  if (Array.isArray(children)) {
    // 첫 번째 원소가 string이고 콜론을 포함하는 경우
    if (typeof children[0] === "string") {
      let cleanFirst = children[0].replace(/^[-•*—\s]+/, "");
      cleanFirst = cleanFirst.replace(/^(\d{1,2}\.\s*)/, "");

      const colonIndex = cleanFirst.indexOf(":");
      if (colonIndex > 0 && colonIndex < 60 && !cleanFirst.startsWith("http")) {
        const key = cleanFirst.slice(0, colonIndex).trim();
        const rest = cleanFirst.slice(colonIndex + 1);
        return [
          <strong key="colon-key" className="text-foreground font-semibold">
            {key}:
          </strong>,
          rest,
          ...children.slice(1),
        ];
      }
      return [cleanFirst, ...children.slice(1)];
    }
  }

  return children;
}

const markdownComponents = {
  h1: ({ children }: any) => (
    <h3 className="text-base sm:text-lg font-bold text-foreground mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h2: ({ children }: any) => (
    <h4 className="text-sm sm:text-base font-bold text-foreground mt-3 mb-1.5 first:mt-0">
      {children}
    </h4>
  ),
  h3: ({ children }: any) => (
    <h5 className="text-xs sm:text-sm font-semibold text-foreground mt-2 mb-1 first:mt-0">
      {children}
    </h5>
  ),
  p: ({ children }: any) => {
    const formatted = formatColonNodes(children);
    return (
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed my-2 first:mt-0 last:mb-0">
        {formatted}
      </p>
    );
  },
  ul: ({ children }: any) => (
    <ul className="space-y-2 my-2.5 pl-0.5">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="space-y-2 my-2.5 pl-0.5 list-decimal list-inside text-xs sm:text-sm text-muted-foreground leading-relaxed">
      {children}
    </ol>
  ),
  li: ({ children }: any) => {
    const formatted = formatColonNodes(children);
    return (
      <li className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/70 shrink-0 mt-2" />
        <div className="flex-1">{formatted}</div>
      </li>
    );
  },
  strong: ({ children }: any) => (
    <strong className="font-semibold text-foreground">
      {children}
    </strong>
  ),
  code: ({ children }: any) => (
    <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground border border-border/50">
      {children}
    </code>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="p-3.5 rounded-xl bg-muted/30 border-l-4 border-primary text-xs sm:text-sm text-muted-foreground my-2.5 space-y-1">
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 rounded-xl border border-border/60">
      <table className="w-full text-left text-xs sm:text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border/60">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-border/40 font-mono text-muted-foreground">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-muted/20 transition-colors">{children}</tr>
  ),
  th: ({ children }: any) => <th className="p-2.5 px-3 font-semibold">{children}</th>,
  td: ({ children }: any) => <td className="p-2.5 px-3">{children}</td>,
};

interface UniversalOverviewProps {
  item: ContentItem;
}

export function UniversalOverview({ item }: UniversalOverviewProps) {
  const sections = parseMarkdownSections(item.description);

  return (
    <div className="space-y-4 text-foreground" data-testid="universal-overview">
      {sections.map((sec, idx) => {
        // 서두 인트로 카드 (제목이 없는 첫 번째 문단)
        if (!sec.title) {
          if (!sec.content) return null;
          return (
            <div
              key={`intro-${idx}`}
              className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-muted text-foreground text-xs font-semibold">
                  {item.category === "workflow" ? "Workflow Overview" : "Algorithm Overview"}
                </span>
              </div>
              <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
                {sec.content}
              </p>
            </div>
          );
        }

        // 번호 매김 또는 단계가 포함된 제목인지 확인 (예: "1. ", "## 1. ", "[1단계]")
        const stepMatch = sec.title.match(/^(\d+)[\.\s]+(.+)$/);
        const stageMatch = sec.title.match(/^\[(\d+)단계[:\s]+(.+)\]$/);
        const stepNum = stepMatch ? stepMatch[1] : stageMatch ? stageMatch[1] : null;
        const pureTitle = stepMatch ? stepMatch[2] : stageMatch ? stageMatch[2] : sec.title;

        return (
          <section key={`sec-${idx}`} className="space-y-2">
            <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3.5">
              {/* 카드 헤더 */}
              <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                {stepNum ? (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {stepNum.padStart(2, "0")}
                  </span>
                ) : (
                  <div className="w-1 h-4 rounded-full bg-primary" />
                )}
                <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                  {pureTitle}
                </h3>
              </div>

              {/* 카드 본문 (마크다운 파싱 렌더링) */}
              <div className="space-y-2">
                <ReactMarkdown components={markdownComponents}>
                  {sec.content}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
