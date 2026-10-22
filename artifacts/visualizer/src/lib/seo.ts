import { contentData } from "@/data/content";

export const SITE_ORIGIN = "https://4d4cat.com";
export const SITE_NAME = "PackeTracing";

export type SeoInfo = {
  title: string;
  description: string;
  robots: string;
  canonical?: string;
  ogType: "website" | "article";
};

const homeDescription = "네트워크·분산 시스템·데이터베이스의 처리 흐름과 알고리즘의 실행 단계를 시각화 및 기술 해설로 학습합니다.";

export function contentPath(category: "workflow" | "attack" | "algorithm", slug: string): string {
  return `/${category === "workflow" ? "workflows" : category === "attack" ? "attacks" : "algorithms"}/${slug}`;
}

export function allPublicPaths(): string[] {
  return [
    "/", "/category/workflows", "/category/attacks", "/category/algorithms",
    ...contentData.map((item) => contentPath(item.category, item.slug)),
    "/about", "/contact", "/privacy",
  ];
}

function descriptionFor(item: (typeof contentData)[number]): string {
  // First prose block provides a topic-specific, readable search snippet.
  const intro = item.description.split(/\n\s*#{2,3}\s/)[0]
    .replace(/[*`#\[\]]/g, "").replace(/\s+/g, " ").trim();
  return (intro || item.subtitle).slice(0, 170);
}

export function getSeo(pathname: string): SeoInfo {
  const path = pathname.replace(/\/+$/, "") || "/";
  const base = { robots: "index, follow" };
  if (path === "/") return {
    ...base, title: `${SITE_NAME} - 인터랙티브 시스템 및 알고리즘 시각화`,
    description: homeDescription, canonical: `${SITE_ORIGIN}/`, ogType: "website",
  };
  if (path === "/category/workflows" || path === "/category/attacks" || path === "/category/algorithms") {
    const isWorkflow = path.endsWith("workflows");
    const isAttack = path.endsWith("attacks");
    return { ...base,
      title: `${isWorkflow ? "네트워크" : isAttack ? "공격기법" : "알고리즘"} 학습 | ${SITE_NAME}`,
      description: isAttack ? "PHP 등 보안 취약점의 원인, 공격 과정과 조치 방법을 단계별로 학습합니다." : isWorkflow
        ? "네트워크, API, 데이터베이스, 분산 시스템의 실제 처리 흐름과 단계별 기술 설명을 살펴봅니다."
        : "정렬, 탐색, 자료구조, 그래프 알고리즘의 실행 순서, 복잡도와 적용 사례를 시각화로 학습합니다.",
      canonical: `${SITE_ORIGIN}${path}`, ogType: "website",
    };
  }
  const detailMatch = path.match(/^\/(workflows|attacks|algorithms)\/([a-z0-9-]+)$/);
  if (detailMatch) {
    const category = detailMatch[1] === "workflows" ? "workflow" : detailMatch[1] === "attacks" ? "attack" : "algorithm";
    const item = contentData.find((x) => x.category === category && x.slug === detailMatch[2]);
    if (item) return {
      ...base, title: `${item.title} 동작 원리 | ${SITE_NAME}`,
      description: descriptionFor(item), canonical: `${SITE_ORIGIN}${path}`, ogType: "article",
    };
  }
  const staticPages: Record<string, { title: string; description: string }> = {
    "/about": { title: `서비스 소개 | ${SITE_NAME}`, description: "PackeTracing의 제작 목적, 시각화 학습 방식과 콘텐츠 관리 원칙을 안내합니다." },
    "/contact": { title: `문의 및 오류 제보 | ${SITE_NAME}`, description: "PackeTracing 사용 중 발견한 오류와 기술 설명의 개선 의견을 전달하는 방법을 안내합니다." },
    "/privacy": { title: `개인정보처리방침 | ${SITE_NAME}`, description: "PackeTracing의 브라우저 저장, Google Analytics 및 광고 관련 개인정보 처리 안내입니다." },
  };
  if (staticPages[path]) return { ...base, ...staticPages[path], canonical: `${SITE_ORIGIN}${path}`, ogType: "website" };
  return { title: `페이지를 찾을 수 없습니다 | ${SITE_NAME}`, description: "요청한 학습 콘텐츠를 찾을 수 없습니다.", robots: "noindex, follow", ogType: "website" };
}

export function getStructuredData(pathname: string): unknown[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  const seo = getSeo(path);
  if (!seo.canonical) return [];
  if (path === "/") return [{
    "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME,
    url: `${SITE_ORIGIN}/`, description: seo.description, inLanguage: "ko",
  }];
  const detailMatch = path.match(/^\/(workflows|algorithms)\/([a-z0-9-]+)$/);
  const categoryPath = detailMatch ? `/category/${detailMatch[1]}` : null;
  const crumbs = [{ "@type": "ListItem", position: 1, name: "홈", item: `${SITE_ORIGIN}/` }];
  if (categoryPath) crumbs.push({ "@type": "ListItem", position: 2,
    name: detailMatch![1] === "workflows" ? "네트워크" : detailMatch![1] === "attacks" ? "공격기법" : "알고리즘",
    item: `${SITE_ORIGIN}${categoryPath}` });
  crumbs.push({ "@type": "ListItem", position: crumbs.length + 1,
    name: seo.title.split(" | ")[0], item: seo.canonical });
  return [{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs }];
}

function setMeta(key: "name" | "property", tagName: string, content?: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${tagName}"]`);
  if (!content) { element?.remove(); return; }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(key, tagName);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function applySeoToDocument(path: string): void {
  const seo = getSeo(path);
  document.title = seo.title;
  document.documentElement.lang = "ko";
  setMeta("name", "description", seo.description);
  setMeta("name", "robots", seo.robots);
  setMeta("property", "og:title", seo.title);
  setMeta("property", "og:description", seo.description);
  setMeta("property", "og:type", seo.ogType);
  setMeta("property", "og:url", seo.canonical);
  setMeta("name", "twitter:card", "summary");
  setMeta("name", "twitter:title", seo.title);
  setMeta("name", "twitter:description", seo.description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!seo.canonical) canonical?.remove();
  else {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = seo.canonical;
  }
  document.head.querySelectorAll('script[data-packetracing-jsonld]').forEach((element) => element.remove());
  const data = getStructuredData(path);
  if (data.length) {
    const element = document.createElement("script");
    element.type = "application/ld+json";
    element.dataset.packetracingJsonld = "true";
    element.textContent = JSON.stringify(data).replace(/</g, "\\u003c");
    document.head.appendChild(element);
  }
}
