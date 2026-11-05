export default function Contact() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed">
      <h1 className="text-3xl font-bold">문의 및 오류 제보</h1>
      <h2 className="text-xl font-semibold">서비스 및 개인정보 관련 문의</h2>
      <p>비공개 문의, 개인정보 관련 요청 및 계정·광고·서비스 운영 문의는 <a href="mailto:help@4d4cat.com" className="text-primary underline underline-offset-2">help@4d4cat.com</a>으로 보내 주세요. 요청 처리에 필요한 내용만 작성하고 비밀번호나 불필요한 민감정보는 전송하지 마세요.</p>
      <h2 className="text-xl font-semibold">공개 오류 제보 및 콘텐츠 개선</h2>
      <p>시각화 단계가 잘못 표시되거나 기술 설명에 오류가 있는 경우, 아래 공개 저장소의 Issues에서 내용을 공유할 수 있습니다.</p>
      <p><a href="https://github.com/4catHub/PacketTracing/issues" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">PacketTracing GitHub Issues</a></p>
      <p>제보에는 콘텐츠 URL, 문제를 재현하는 단계, 기대한 결과와 실제 결과를 포함해 주세요. 공개 이슈에는 이름, 이메일, 계정 정보 등 개인정보를 게시하지 마세요. GitHub 계정이 필요할 수 있으며 이슈는 공개적으로 게시됩니다.</p>
    </article>
  );
}
