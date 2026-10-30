import { Link } from "wouter";

export default function Privacy() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed text-sm sm:text-base">
      <h1 className="text-3xl font-bold">개인정보처리방침</h1>
      <p>PackeTracing에서 사용하는 브라우저 저장 기능과 외부 분석·광고 서비스에 관한 안내입니다.</p>
      <h2 className="text-xl font-semibold">사이트 이용 및 브라우저 저장</h2>
      <p>테마 설정은 브라우저의 localStorage에 theme 값으로 저장됩니다. 주제 검색과 필터는 브라우저 내에서 처리합니다. 학습 콘텐츠 이용을 위해 별도 회원가입이나 로그인 절차를 제공하지 않습니다.</p>
      <h2 className="text-xl font-semibold">외부 분석·광고 서비스</h2>
      <p>사이트에는 Google Analytics 4와 Google AdSense 스크립트가 포함되어 있습니다. Google을 포함한 외부 제공업체는 이 사이트 또는 다른 사이트에 대한 이전 방문 기록을 바탕으로 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. Google은 광고 쿠키를 이용해 방문 기록에 기반한 광고를 제공할 수 있습니다.</p>
      <p>데이터 처리 방식과 이용 가능한 선택권은 <a className="text-primary hover:underline" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a>, <a className="text-primary hover:underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google 광고 기술 안내</a>에서 확인할 수 있습니다.</p>
      <h2 className="text-xl font-semibold">이용자의 선택권</h2>
      <p>테마 설정은 브라우저의 사이트 데이터를 삭제하여 초기화할 수 있습니다. 맞춤형 광고 설정은 <a className="text-primary hover:underline" href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">Google 내 광고 센터</a>에서 관리할 수 있습니다. 브라우저 설정에서도 쿠키 저장을 제한할 수 있습니다.</p>
      <h2 className="text-xl font-semibold">문의 및 오류 제보</h2>
      <p>콘텐츠 또는 사이트 이용 관련 제안은 <Link href="/contact" className="text-primary hover:underline">GitHub Issues 안내</Link>를 이용해 주세요. GitHub Issues는 공개 게시판이므로 이름·이메일·계정 정보 등 개인정보를 게시하지 마세요.</p>
    </article>
  );
}
