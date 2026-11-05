import { Link } from "wouter";

const PRIVACY_EMAIL = "help@4d4cat.com";

export default function Privacy() {
  return (
    <article className="max-w-3xl mx-auto space-y-6 leading-relaxed text-sm sm:text-base">
      <h1 className="text-3xl font-bold">개인정보처리방침</h1>
      <p>PackeTracing(https://4d4cat.com)의 서비스 이용 과정에서 사용하는 브라우저 저장 기능, 방문 분석 및 광고 서비스와 관련된 개인정보 처리 내용을 안내합니다.</p>
      <p className="text-muted-foreground">시행일: 2026년 11월 5일</p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">1. 처리 목적과 항목</h2>
        <p>사이트는 학습 콘텐츠를 회원가입이나 로그인 없이 제공합니다. 사이트 자체의 주제 검색·필터는 브라우저에서 처리하며, 검색어를 별도 계정 정보와 연결하는 기능은 제공하지 않습니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>화면 설정:</strong> 선택한 테마를 브라우저 localStorage의 <code>theme</code> 항목에 저장합니다.</li>
          <li><strong>방문 통계:</strong> Google Analytics 4를 통해 페이지 이용 현황 등을 분석할 수 있습니다. Google 서비스는 쿠키, 온라인 식별자, 기기·브라우저 정보, 방문 및 상호작용 정보 등을 처리할 수 있습니다.</li>
          <li><strong>광고:</strong> Google AdSense와 광고 기술 제공업체가 광고 게재·측정·부정 사용 방지 등을 위해 쿠키 또는 유사 기술과 방문 정보를 사용할 수 있습니다.</li>
          <li><strong>개인정보 문의:</strong> 이용자가 이메일로 문의하면 회신과 요청 처리를 위해 이메일 주소 및 문의 내용을 처리합니다.</li>
        </ul>
        <p>웹 호스팅·네트워크 제공업체가 서비스 제공과 보안을 위해 접속 기록을 처리할 수도 있습니다. 이에 대한 구체적인 저장 항목과 보유 기간은 실제 호스팅 환경의 설정과 제공업체 정책에 따릅니다.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">2. 처리 및 보유 기간</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>테마 설정:</strong> 이용자의 브라우저에 유지되며, 테마 변경 또는 사이트 저장 데이터 삭제로 변경·제거할 수 있습니다.</li>
          <li><strong>Google Analytics 4:</strong> 사용자·이벤트 수준 데이터의 보유 기간은 운영 중인 Google Analytics 속성의 데이터 보관 설정 및 Google 정책에 따릅니다. 데이터 유형별 보유 기준은 다를 수 있으며, 집계 보고서에는 동일한 보유 설정이 적용되지 않을 수 있습니다.</li>
          <li><strong>Google 광고 관련 데이터:</strong> 쿠키 및 식별자 등의 보유·삭제 기준은 해당 제공업체의 정책과 이용자의 브라우저·광고 설정에 따릅니다.</li>
          <li><strong>이메일 문의:</strong> 문의 응대와 후속 확인에 필요한 기간 동안 보관하고, 처리 목적이 달성되어 더 이상 필요하지 않으면 삭제합니다. 법령상 보존 의무가 있는 경우 해당 의무에 따릅니다.</li>
        </ul>
        <p><a className="text-primary underline underline-offset-2" href="https://support.google.com/analytics/answer/7667196?hl=ko" target="_blank" rel="noopener noreferrer">Google Analytics 데이터 보관 안내</a>에서 유형별 보유 기준을 확인할 수 있습니다.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">3. 외부 분석 및 광고 서비스</h2>
        <p><strong>Google Analytics 4</strong>는 방문·이용 통계 분석에, <strong>Google AdSense</strong>는 광고 제공 및 측정에 사용합니다. Google을 포함한 제3자 광고 제공업체는 이 사이트 또는 다른 사이트에 대한 이전 방문 기록을 바탕으로 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. Google 광고 쿠키를 통해 Google과 그 파트너가 방문 정보에 기반한 광고를 제공할 수 있습니다.</p>
        <p>외부 제공업체의 데이터 처리, 국외 처리 또는 전달 여부, 보유 기간과 선택권은 적용 서비스·설정·방문 지역에 따라 달라집니다. 자세한 내용은 <a className="text-primary underline underline-offset-2" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google 개인정보처리방침</a>과 <a className="text-primary underline underline-offset-2" href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google 광고 기술 안내</a>를 참고할 수 있습니다.</p>
        <p>맞춤형 광고는 <a className="text-primary underline underline-offset-2" href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">Google 내 광고 센터</a>에서 관리할 수 있으며, 일부 제3자 광고업체의 선택권은 <a className="text-primary underline underline-offset-2" href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">AboutAds</a>에서 확인할 수 있습니다.</p>
        <p>유럽경제지역(EEA)·영국·스위스 이용자에게 광고를 제공하는 경우 지역별 동의 요건이 적용될 수 있으며, 개인정보처리방침의 고지만으로 필요한 동의 절차가 대체되지는 않습니다.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">4. 개인정보의 파기 및 이용자 선택권</h2>
        <p>사이트가 직접 보관하는 문의 정보는 처리 목적이 달성되어 더 이상 필요하지 않을 때 삭제합니다. 전자 기록은 복구하기 어려운 방식으로 삭제하는 것을 원칙으로 하며, 다른 법령에 따라 보존할 필요가 있다면 해당 기준을 따릅니다. 외부 서비스에서 처리하는 데이터의 삭제는 해당 제공업체의 정책과 절차에 따릅니다.</p>
        <p>브라우저의 쿠키와 사이트 데이터를 삭제하거나 차단할 수 있습니다. 다만 일부 기능이나 광고 표시 방식에 영향을 줄 수 있습니다. 개인정보 열람·정정·삭제·처리정지 등 권리 행사 또는 관련 문의는 아래 이메일로 요청할 수 있으며, 적용 법령과 실제 처리 범위에 따라 안내합니다.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">5. 운영 및 개인정보 문의</h2>
        <p>사이트명: PackeTracing · 운영 도메인: <a className="text-primary underline underline-offset-2" href="https://4d4cat.com/">4d4cat.com</a></p>
        <p>운영·개인정보 보호 관련 문의: <a className="text-primary underline underline-offset-2" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a></p>
        <p>문의 이메일에는 요청 처리에 꼭 필요한 정보만 포함해 주세요. 민감한 정보, 비밀번호 또는 불필요한 신분증 사본은 보내지 마세요. 기술 설명 오류·개선 제안은 <Link href="/contact" className="text-primary underline underline-offset-2">문의 및 오류 제보 안내</Link>를 참고해 주세요. 공개 GitHub Issues에는 개인정보를 게시하지 마세요.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">6. 방침 변경</h2>
        <p>서비스 운영이나 개인정보 처리 방식이 변경되면 이 페이지의 내용과 시행일을 갱신하여 안내합니다.</p>
      </section>
    </article>
  );
}
