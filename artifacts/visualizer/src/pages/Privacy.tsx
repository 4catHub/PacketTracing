export default function Privacy() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed text-sm sm:text-base">
      <h1 className="text-3xl font-bold">개인정보처리방침</h1>
      <p>이 안내는 공개된 PacketTracing 웹사이트 소스에 있는 브라우저 저장 및 외부 서비스 스크립트를 기준으로 작성되었습니다. 실제 운영 환경의 수집 정보 및 법적 필수 고지 항목은 운영자가 확인해야 합니다.</p>
      <h2 className="text-xl font-semibold">사이트에서 사용하는 정보</h2>
      <p>화면의 밝기 설정을 유지하기 위해 브라우저 localStorage의 theme 값을 사용합니다. 주제 검색·필터는 브라우저의 화면 상태에서 처리하며, 현재 소스의 시각화 콘텐츠 조회에는 별도 로그인이나 서버 측 계정 등록 절차가 없습니다.</p>
      <h2 className="text-xl font-semibold">외부 분석·광고 서비스</h2>
      <p>현재 웹페이지의 HTML에는 Google Analytics 4 측정 스크립트(G-8W1EQPM4XY)와 Google AdSense 스크립트(ca-pub-7964524110042064)가 설정되어 있습니다. 페이지를 열면 Google 서비스에 네트워크 요청이 전달될 수 있으며, Google은 설정 및 지역별 동의 상태에 따라 쿠키·기기 정보·방문 정보를 처리할 수 있습니다.</p>
      <p>자세한 내용은 <a className="text-primary hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a> 및 <a className="text-primary hover:underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">광고 기술 안내</a>를 참고하세요.</p>
      <h2 className="text-xl font-semibold">선택권과 보관</h2>
      <p>테마 설정은 브라우저의 사이트 데이터를 지워 초기화할 수 있습니다. Google의 광고 개인화 설정은 Google 계정의 광고 설정에서 변경할 수 있으며, 브라우저 쿠키 설정을 통해 저장을 제한할 수도 있습니다. 브라우저 설정에 따라 일부 기능이 제한될 수 있습니다.</p>
      <h2 className="text-xl font-semibold">운영자 추가 확인이 필요한 항목</h2>
      <p>실제 데이터 보유 기간, 호스팅 로그, 처리위탁·제3자 제공 범위, 동의 관리 도구의 적용 지역, 개인정보 보호 책임자 및 비공개 문의 채널은 공개 소스만으로 확정할 수 없습니다. 운영자는 이를 확인하여 본 방침을 보완하고 적용일을 공지해야 합니다.</p>
    </article>
  );
}
