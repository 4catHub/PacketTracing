import { ContentItem } from "../content-types";

export const oauthFlowContent: ContentItem = {
  slug: "oauth-flow",
  category: "workflow",
  title: "OAuth 2.0 권한 위임 흐름",
  subtitle: "Authorization Code Grant Flow (인증 코드 승인 방식)",
  tags: [
    "Security",
    "OAuth2",
    "Authentication",
    "Web"
  ],
  description: `OAuth 2.0은 사용자의 비밀번호를 서드파티 애플리케이션에 직접 노출하지 않고도, 신뢰할 수 있는 인증 서버를 통해 안전하게 권한을 위임(Authorization Delegation)받을 수 있도록 설계된 업계 표준 프로토콜입니다.

### 1. OAuth 2.0 핵심 4대 구성원 (Roles)
- **Resource Owner (사용자):** 자신의 프로필이나 데이터에 대한 접근 권한을 소유하고 승인하는 주체입니다.
- **Client (서비스 애플리케이션):** 사용자의 리소스에 접근하고자 하는 웹/앱 서비스입니다.
- **Authorization Server (인증 서버):** 사용자의 신원을 인증(ID/PW, 2FA)하고 접근 토큰(Access Token)을 발급하는 서버(예: Google, Kakao 인증 서버)입니다.
- **Resource Server (API 서버):** 사용자의 보호된 자원(사진, 연락처, 프로필)을 보관하고 있으며, 유효한 Access Token 검증 시 데이터를 제공합니다.

### 2. Authorization Code 승인 5단계 프로세스
Access Token을 브라우저에 직접 노출하지 않고 백엔드 간 보안 채널로 교환하여 토큰 탈취를 방어합니다.
- **로그인 요청 및 리다이렉트:** 사용자가 '구글로 로그인' 클릭 시, \`client_id\`, \`redirect_uri\`, \`scope\`, \`state\` 파라미터와 함께 인증 서버 로그인 페이지로 리다이렉트됩니다.
- **사용자 인증 및 권한 동의:** 사용자가 인증 서버에서 로그인하고 요청된 리소스 접근 권한을 승인합니다.
- **일회성 Authorization Code 발급:** 인증 서버가 브라우저를 \`redirect_uri\`로 돌려보내며 URL 쿼리 스트링으로 수명이 매우 짧은 일회용 \`code\`를 전달합니다.
- **백엔드 토큰 교환:** Client 백엔드 서버가 인증 서버의 Token 엔드포인트로 \`code\`와 함께 외부에 노출되지 않는 비밀키 \`client_secret\`을 안전하게 POST 전송하여 \`Access Token\`을 획득합니다.
- **보호된 리소스 접근:** Client가 발급받은 Access Token을 \`Authorization: Bearer <token>\` 헤더에 담아 Resource Server의 API를 호출하고 사용자 데이터를 반환받습니다.

### 3. 보안 핵심: 왜 Authorization Code가 필수적인가?
- **브라우저 노출 방지:** 프론트엔드 URL 해시나 로컬 스토리지에 토큰을 직접 넘기면 브라우저 히스토리나 XSS 공격에 토큰이 탈취당하기 쉽습니다.
- **Client Secret 검증:** 일회용 Code는 기밀 클라이언트는 비밀키를 보호해야 하며, 공개 클라이언트를 포함한 현대 OAuth 흐름에서는 PKCE로 코드 교환을 원래 요청에 바인딩합니다. 코드 탈취 위험을 줄이려면 HTTPS 및 redirect_uri 검증도 필요합니다.
- **CSRF 방어:** 요청 시 임의의 난수인 \`state\` 값을 포함하여 인증 완료 후 회신된 값과 대조함으로써 인증 요청과 응답을 연결하여 CSRF 위험을 줄입니다.

### 참고 자료
- [OAuth 2.0 Security Best Current Practice, RFC 9700](https://www.rfc-editor.org/info/rfc9700)`,
  learningObjectives: ["Authorization Code와 state, PKCE가 서로 어떤 공격을 줄이는지 구분할 수 있다."],
  commonMistakes: ["OAuth 2.0 자체는 인가(권한 위임) 프로토콜이며 로그인 신원 정보 표준은 OpenID Connect입니다. 공개 클라이언트에는 client_secret을 안전하게 보관할 수 없으므로 PKCE가 중요합니다."],
  keyTakeaways: ["코드 교환 시 redirect_uri 검증, state 검증, PKCE code_verifier 확인을 함께 고려해야 합니다."],
  exercises: [{"question":"모바일 앱처럼 client_secret을 안전하게 보관할 수 없는 OAuth 클라이언트가 코드 탈취 위험을 낮추는 대표 방법은?","options":["PKCE","쿠키 크기 증가","HTTP 전송"],"answerIndex":0,"explanation":"PKCE는 authorization code를 획득한 공격자가 원래 요청의 code_verifier 없이 토큰으로 교환하기 어렵게 합니다."}],
  steps: [
    "사용자가 서비스(Client)의 \"로그인\" 버튼 클릭 → Authorization Server로 리다이렉트",
    "사용자가 로그인 및 권한 부여 동의",
    "인증 서버가 사용자를 Client의 Redirect URI로 돌려보내며 Authorization Code(인증 코드) 전달",
    "Client 백엔드가 Authorization Server에 Authorization Code + Client Secret을 전송하며 Access Token 요청",
    "인증 서버가 클라이언트 정보 검증 후 Access Token 및 Refresh Token 발급",
    "Client가 발급받은 Access Token을 HTTP Authorization 헤더에 담아 Resource Server로 자원 요청",
    "Resource Server가 토큰 유효성 검증 후 보호된 사용자 리소스 반환"
  ],
  examples: [
    "구글, 카카오, 네이버 소셜 로그인 연동",
    "서드파티 플러그인에 내 서비스 API 권한 부여",
    "싱글 사인온(SSO) 아키텍처 구축",
    "백엔드 채널 기반의 안전한 API 연동 방식"
  ],
  related: [
    { slug: "jwt-vs-session", category: "workflow", relation: "OAuth 발급 토큰의 구조 및 세션 관리 비교" },
    { slug: "https-handshake", category: "workflow", relation: "리다이렉트 및 토큰 발급 시 암호화 통신을 보장하는 TLS 기반" }
  ]
};
