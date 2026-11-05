import type { ContentItem } from "../content-types";

export const oauthLoginPhases = [
  { label: "로그인", title: "로그인 요청과 임시 상태 생성", summary: "브라우저에서 소셜 로그인을 선택하면 앱 서버가 이 시도에만 쓸 state, nonce, PKCE verifier를 생성해 브라우저의 로그인 시도와 연결합니다." },
  { label: "리다이렉트", title: "제공자의 인가 화면으로 이동", summary: "앱 서버가 302 응답을 보내면 브라우저가 제공자의 /authorize에 접속합니다. scope에 openid를 포함하고, PKCE verifier에서 계산한 S256 challenge를 전달합니다." },
  { label: "인증·동의", title: "제공자에서 사용자 인증과 권한 확인", summary: "제공자가 사용자를 인증하고 필요할 때 동의를 받습니다. 이미 로그인했거나 기존 동의가 있으면 화면이 생략될 수 있습니다." },
  { label: "콜백 확인", title: "인가 코드 반환과 state 확인", summary: "제공자가 브라우저를 등록된 콜백으로 돌려보냅니다. 앱 서버는 받은 state를 원래 로그인 시도와 대조한 뒤 코드 교환으로 넘어갑니다." },
  { label: "토큰 교환", title: "서버 간 코드 교환과 PKCE 검증", summary: "앱 서버가 코드와 verifier를 토큰 엔드포인트에 보냅니다. 제공자가 코드, 클라이언트 인증, redirect URI와 PKCE를 확인해 ID Token과 Access Token을 발급합니다." },
  { label: "신원 확인", title: "ID Token 검증과 서비스 계정 식별", summary: "앱 서버가 ID Token 서명, iss, aud, exp와 nonce를 확인합니다. 검증한 iss와 sub를 조합해 제공자의 사용자와 서비스 계정을 연결합니다." },
  { label: "프로필", title: "UserInfo 조회와 사용자 일치 확인", summary: "추가 프로필이 필요하면 앱 서버가 Access Token으로 UserInfo를 조회하고, 응답의 sub가 ID Token과 같은지 확인합니다. 이 단계는 선택입니다." },
  { label: "세션 발급", title: "서비스 세션 생성과 쿠키 발급", summary: "앱 서버가 검증된 계정의 서비스 세션을 새로 만들고 브라우저에 세션 쿠키를 설정합니다. 이후 브라우저는 서비스 요청에 이 쿠키를 보냅니다." },
] as const;

export const oauthFlowContent: ContentItem = {
  slug: "oauth-flow",
  category: "workflow",
  title: "OAuth 2.0과 OIDC 소셜 로그인",
  subtitle: "Authorization Code + PKCE · 브라우저 리다이렉트부터 서비스 세션까지",
  tags: ["Security", "OAuth2", "OIDC", "PKCE"],
  description: `소셜 로그인 버튼을 누르면 브라우저가 외부 제공자의 로그인 화면으로 이동했다가 서비스로 돌아옵니다. 이 예시는 **웹 브라우저와 백엔드가 있는 서비스** 가 OAuth 2.0 Authorization Code + PKCE와 OpenID Connect(OIDC)를 사용해 서비스 세션을 만드는 흐름입니다.

### 1. 참여자와 통신 경로
- **사용자와 브라우저** 는 서비스에서 로그인을 시작하고, 제공자 화면에서 인증과 동의를 진행합니다. 브라우저는 인가 코드가 포함된 콜백을 전달합니다.
- **앱 서버** 는 OAuth 클라이언트이자 OIDC의 Relying Party입니다. 로그인 시도 상태를 보관하고 토큰을 교환·검증한 후 서비스 세션을 생성합니다.
- **인가 서버** 는 OIDC 제공자입니다. 등록된 redirect URI를 확인하고 사용자 인증, 권한 동의, 인가 코드와 토큰 발급을 처리합니다.
- **UserInfo API** 는 Access Token을 받아 프로필을 제공하는 보호 리소스입니다. 예시에서 인가 서버와 역할을 분리해 표시하며, 실제 제공자는 같은 도메인에서 운영할 수도 있습니다.

### 2. 코드·토큰·쿠키는 어디에 쓰이나
- **Authorization Code** 는 수명이 짧은 일회용 교환권입니다. 브라우저를 거쳐 앱 서버에 도착합니다.
- **ID Token** 은 제공자가 누구를 인증했는지 앱 서버에 전달하는 JWT입니다. 신뢰하는 제공자의 키로 서명을 검증하고 발급자, 대상, 만료와 이 시도에서 보낸 nonce를 확인합니다.
- **Access Token** 은 UserInfo처럼 보호된 API를 호출할 때 사용하는 권한 증표입니다. OAuth 2.0은 이런 접근 권한 위임을 정의하고, OIDC는 그 위에 신원 확인을 추가합니다.
- **Refresh Token** 은 제공자 정책과 요청 범위에 따라 발급될 수 있으며, Access Token을 갱신하는 데 사용합니다.
- **서비스 세션 쿠키** 는 앱 서버가 발급합니다. 이 구조에서는 제공자 토큰을 앱 서버에서 처리하고 브라우저에는 서비스의 세션 ID를 전달합니다.

### 3. 무엇을 어디에서 검증하나
- **state · 앱 서버 콜백** 은 응답을 브라우저의 로그인 시도와 연결해 로그인 CSRF를 방어합니다. 누락, 불일치 또는 만료면 코드 교환을 중단합니다. 확인한 로그인 시도는 한 번만 소비합니다.
- **PKCE · 인가 서버의 토큰 교환** 은 최초 요청의 challenge와 교환 시 전달한 verifier를 연결합니다. 인가 서버는 \`BASE64URL(SHA256(verifier))\`를 저장된 challenge와 비교합니다. 이 예시의 기밀 웹 클라이언트는 PKCE와 별도로 제공자가 등록한 방식으로 클라이언트 인증도 합니다.
- **nonce · 앱 서버의 ID Token 검증** 은 발급된 ID Token을 원래 로그인 시도에 연결해 재사용을 방어합니다. 제공자의 키와 \`iss\`, \`aud\`, \`exp\`도 확인합니다.
- **sub · 계정 매핑과 UserInfo** 는 제공자 안에서 사용자를 식별합니다. 계정 연결 키는 \`(iss, sub)\`로 잡고, UserInfo를 조회했다면 ID Token과 \`sub\`가 일치할 때만 프로필을 사용합니다.

### 4. 실패가 발생하는 지점
동의를 거부하면 등록된 콜백에 \`error=access_denied\`가 올 수 있습니다. 제공자가 만료·재사용 코드나 불일치한 verifier를 받으면 토큰 교환을 거부합니다. ID Token 검증에 실패하면 앱 서버가 세션 발급을 중단합니다. 성공 시에는 새 세션 ID를 발급하고 HTTPS에서 \`HttpOnly\`와 \`Secure\`가 설정된 쿠키로 전달합니다. 시각화는 사이트 간 최상위 GET 콜백을 쓰는 예시로 \`SameSite=Lax\`를 사용합니다.`,
  learningObjectives: [
    "브라우저 리다이렉트와 백엔드 토큰 교환을 구분할 수 있다.",
    "state, PKCE, nonce를 어느 참여자가 언제 확인하는지 설명할 수 있다.",
    "ID Token, Access Token, 서비스 세션 쿠키의 사용처를 구분할 수 있다.",
  ],
  commonMistakes: [
    "Access Token만 보고 서비스 사용자의 신원을 확정하는 경우. OIDC 클라이언트는 검증된 ID Token의 발급자와 사용자 식별자로 계정을 연결합니다.",
    "PKCE를 클라이언트 인증으로 사용하는 경우. PKCE는 코드를 원래 인가 요청에 연결하고, 기밀 클라이언트는 등록된 방식으로 별도 인증합니다.",
  ],
  keyTakeaways: [
    "브라우저는 인가 코드와 서비스 세션 쿠키를 전달하고, 이 웹 백엔드는 제공자 토큰을 서버에서 처리합니다.",
    "앱 서버는 콜백에서 state를, ID Token에서 nonce를 확인합니다. 인가 서버는 코드 교환 중 PKCE verifier를 확인합니다.",
  ],
  exercises: [
    {
      question: "콜백의 state가 저장된 로그인 시도와 다르면 앱 서버는 어떻게 처리해야 할까요?",
      options: ["토큰 교환 전에 로그인 시도를 중단한다.", "인가 코드만 있으면 교환한다.", "새 state를 만들어 같은 코드를 교환한다."],
      answerIndex: 0,
      explanation: "콜백을 시작했던 브라우저의 로그인 시도와 연결할 수 있어야 코드 교환을 진행합니다.",
    },
    {
      question: "앱 서버가 UserInfo를 호출할 때 Authorization 헤더에 넣는 값은 무엇인가요?",
      options: ["Access Token", "ID Token", "서비스 세션 쿠키"],
      answerIndex: 0,
      explanation: "Access Token은 보호 리소스에 접근할 권한을 나타냅니다. ID Token은 신원 확인에, 서비스 쿠키는 서비스 세션 유지에 사용합니다.",
    },
  ],
  steps: oauthLoginPhases.map(({ title, summary }) => `${title} — ${summary}`),
  examples: [
    "OIDC를 제공하는 계정으로 서버 기반 웹 서비스에 소셜 로그인",
    "검증한 외부 계정을 서비스 회원 정보에 연결하고 자체 세션 생성",
    "로그인 후 권한 범위에 따라 이름과 사진 같은 추가 프로필 조회",
  ],
  related: [
    { slug: "jwt-vs-session", category: "workflow", relation: "제공자 ID Token과 앱의 세션 상태 구분" },
    { slug: "https-handshake", category: "workflow", relation: "리다이렉트와 백엔드 토큰 교환을 보호하는 TLS" },
  ],
};
