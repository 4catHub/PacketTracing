import { Link } from "wouter";

export default function About() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed">
      <h1 className="text-3xl font-bold">PackeTracing 소개</h1>
      <p>PackeTracing은 네트워크·분산 시스템·알고리즘의 실행 흐름과 SaaS·프레임워크·플랫폼의 아키텍처를 시각화 및 기술 설명으로 학습할 수 있도록 만든 웹사이트입니다.</p>
      <h2 className="text-xl font-semibold">학습 방식</h2>
      <p>워크플로우와 알고리즘 콘텐츠는 실행 흐름을 단계별로 보여주고, 아키텍처 콘텐츠는 전체 구성요소를 한 장면에서 탐색할 수 있게 합니다. 각 페이지는 개요, 기술 설명 및 활용 사례를 제공하며, 아키텍처는 학습 문제 대신 국내·해외 도입 사례를 출처와 함께 제공합니다.</p>
      <h2 className="text-xl font-semibold">수정 및 제보 방식</h2>
      <p>콘텐츠 오류 및 개선 제안은 공개 GitHub Issues에서 접수합니다. 수정 이력은 GitHub 저장소의 커밋 및 Pull Request 기록으로 확인할 수 있습니다.</p>
      <h2 className="text-xl font-semibold">콘텐츠 관리 원칙</h2>
      <p>설명은 해당 주제의 실제 기술 개념을 기준으로 작성하며, 시각화는 학습을 위한 단순화된 모델입니다. 실제 시스템의 구현·성능·동시성 조건은 기술과 환경에 따라 다를 수 있습니다. 오류나 부정확한 부분이 있다면 수정 요청을 받을 수 있도록 공개 제보 경로를 제공합니다.</p>
      <p>서비스·개인정보 관련 비공개 문의는 <a href="mailto:help@4d4cat.com" className="text-primary underline underline-offset-2">help@4d4cat.com</a>으로, 콘텐츠 오류 제보는 <Link href="/contact" className="text-primary underline underline-offset-2">문의 안내</Link>의 공개 GitHub Issues로 접수할 수 있습니다.</p>
    </article>
  );
}
