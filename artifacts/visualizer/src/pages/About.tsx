import { Link } from "wouter";

export default function About() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed">
      <h1 className="text-3xl font-bold">PackeTracing 소개</h1>
      <p>PackeTracing은 네트워크, 분산 시스템, 데이터베이스 및 알고리즘의 동작 원리를 단계별 시각화와 기술 설명으로 학습할 수 있도록 만든 웹사이트입니다.</p>
      <h2 className="text-xl font-semibold">학습 방식</h2>
      <p>각 콘텐츠는 시각화, 개요, 핵심 단계 및 활용 사례를 함께 제공합니다. 사용자는 애니메이션의 상태 변화를 살펴보고, 텍스트 설명을 통해 배경 개념과 처리 과정의 의미를 확인할 수 있습니다.</p>
      <h2 className="text-xl font-semibold">운영 및 수정 정책</h2>
      <p>콘텐츠는 주제별 기술 설명과 인터랙티브 시각화를 함께 제공합니다. 수정이 필요한 경우 공개된 이슈를 통해 문제의 위치, 재현 단계, 기대 동작을 전달할 수 있으며, 수정 사항은 저장소 변경 이력으로 확인할 수 있습니다.</p>
      <h2 className="text-xl font-semibold">콘텐츠 관리 원칙</h2>
      <p>설명은 해당 주제의 실제 기술 개념을 기준으로 작성하며, 시각화는 학습을 위한 단순화된 모델입니다. 실제 시스템의 구현·성능·동시성 조건은 기술과 환경에 따라 다를 수 있습니다. 오류나 부정확한 부분이 있다면 수정 요청을 받을 수 있도록 공개 제보 경로를 제공합니다.</p>
      <p><Link href="/contact" className="text-primary hover:underline">오류 제보 및 개선 제안</Link></p>
    </article>
  );
}
