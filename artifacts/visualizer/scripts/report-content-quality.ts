import fs from "node:fs";
import path from "node:path";
import { contentData } from "../src/data/content";

// Heuristic triage only: do not equate text length with originality or accuracy.
const rows = contentData.map((item) => {
  const issues: string[] = [];
  const description = item.description.trim();
  const sections = (description.match(/^#{2,3} /gm) ?? []).length;
  if (description.length < 800) issues.push("설명 분량 검토");
  if (sections < 2) issues.push("단계별 설명 구조 검토");
  if (!item.steps?.length) issues.push("핵심 단계 연결 검토");
  if (!item.related?.length) issues.push("관련 학습 경로 검토");
  if (!item.learningObjectives?.length) issues.push("학습 목표 검토");
  if (!item.exercises?.length) issues.push("학습 확인 문제 검토");
  return { item, issues, sections, chars: description.length };
}).sort((a, b) => b.issues.length - a.issues.length || a.chars - b.chars);
const lines = [
  "# 콘텐츠 품질 점검 보고서",
  "",
  "> 자동 생성된 검토 대기열입니다. 기술적 정확성, 독창성, 시각화 일치 여부는 사람이 직접 검토해야 합니다.",
  "",
  `- 총 콘텐츠: ${rows.length}개`,
  `- 자동 점검 항목이 있는 콘텐츠: ${rows.filter((row) => row.issues.length > 0).length}개`,
  "",
  "| 콘텐츠 | 카테고리 | 글자 수 | 소제목 수 | 검토 항목 |",
  "| --- | --- | ---: | ---: | --- |",
  ...rows.map(({ item, chars, sections, issues }) => `| ${item.title.replace(/\|/g, "/")} (${item.slug}) | ${item.category} | ${chars} | ${sections} | ${issues.join(", ") || "자동 점검 통과"} |`),
  "",
  "## 수동 검토 체크리스트",
  "",
  "- 설명이 실제 시각화 단계 및 상태 변화와 일치하는가?",
  "- 단순 정의 외에 입력·출력·실패·예외 사례가 구체적인가?",
  "- 기술적 전제, 환경별 차이, 단순화의 한계를 명시했는가?",
  "- 학습자가 결과를 스스로 검증할 수 있는가?",
  "- 원문과 유사한 설명을 반복하지 않고 주제별 고유한 관찰을 제공하는가?",
  "",
];
const target = process.argv[2];
const output = lines.join("\n");
if (target) {
  fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  fs.writeFileSync(target, output, "utf8");
  console.log(`[Content quality] ${rows.length} items → ${target}`);
} else console.log(output);
