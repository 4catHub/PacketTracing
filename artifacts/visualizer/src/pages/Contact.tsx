export default function Contact() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed">
      <h1 className="text-3xl font-bold">문의 및 오류 제보</h1>
      <p>시각화 단계가 잘못 표시되거나 기술 설명에 오류가 있는 경우, 아래 공개 저장소의 Issues에서 내용을 공유할 수 있습니다.</p>
      <p><a href="https://github.com/4catHub/PacketTracing/issues" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PacketTracing GitHub Issues</a></p>
      <p>제보에는 콘텐츠 URL, 문제를 재현하는 단계, 기대한 결과와 실제 결과를 포함해 주세요. 공개 이슈에는 이름, 이메일, 계정 정보 등 개인 정보를 게시하지 마세요.</p>
      <p>오류 제보와 콘텐츠 개선 제안은 위 GitHub Issues에서 접수합니다. GitHub 계정이 필요할 수 있으며, 이슈는 공개적으로 게시됩니다.</p>
    </article>
  );
}
