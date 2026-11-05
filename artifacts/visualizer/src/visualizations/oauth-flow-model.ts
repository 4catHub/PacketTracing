import { oauthLoginPhases } from "@/data/content/workflows/oauth-flow";
import type { WorkflowVisualizationSpec, WorkflowWaterfallSpan } from "./workflow-visualization";

export type OauthActorId = "browser" | "app" | "provider" | "profile";

type Exchange = {
  kind: "request" | "response";
  from: OauthActorId;
  to: OauthActorId;
  label: string;
  payload: string;
};

type Work = {
  kind: "work" | "wait";
  owner: OauthActorId;
  label: string;
  detail: string;
  failure?: string;
};

export type OauthOperation = Exchange | Work;

type OauthStage = {
  operations: OauthOperation[];
  example: string;
};

export const oauthStages: OauthStage[] = [
  {
    operations: [
      { kind: "request", from: "browser", to: "app", label: "GET /login/oidc", payload: "소셜 로그인 선택" },
      { kind: "work", owner: "app", label: "로그인 시도 저장", detail: "state · nonce · verifier 생성" },
    ],
    example: "GET /login/oidc\n\n# 앱 서버의 임시 기록 (브라우저의 로그인 시도와 연결)\nstate = <state>\nnonce = <nonce>\ncode_verifier = <random verifier>",
  },
  {
    operations: [
      { kind: "response", from: "app", to: "browser", label: "302 Found", payload: "Location: 제공자의 /authorize" },
      { kind: "request", from: "browser", to: "provider", label: "GET /authorize", payload: "openid · state · nonce · challenge" },
      { kind: "work", owner: "provider", label: "인가 요청 확인", detail: "등록된 redirect_uri와 요청 확인" },
    ],
    example: "302 Found\nLocation: https://idp.example/authorize?response_type=code\n  &client_id=web-app&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback\n  &scope=openid%20profile&state=<state>&nonce=<nonce>\n  &code_challenge=<S256 challenge>&code_challenge_method=S256",
  },
  {
    operations: [
      { kind: "response", from: "provider", to: "browser", label: "제공자 화면", payload: "필요 시 로그인·권한 동의 표시" },
      { kind: "wait", owner: "browser", label: "사용자 입력 대기", detail: "제공자 화면에서 인증하고 권한 선택" },
      { kind: "work", owner: "provider", label: "인증·권한 승인 확인", detail: "승인 시 일회용 code를 요청에 연결", failure: "동의 거부 → access_denied 콜백" },
    ],
    example: "# 동의를 거부했을 때의 콜백 예시\n302 Found\nLocation: https://app.example/callback?error=access_denied&state=<state>",
  },
  {
    operations: [
      { kind: "response", from: "provider", to: "browser", label: "302 Found", payload: "Location: /callback?code=…&state=…" },
      { kind: "request", from: "browser", to: "app", label: "GET /callback", payload: "일회용 code + state" },
      { kind: "work", owner: "app", label: "저장한 state와 비교", detail: "원래 로그인 시도와 연결 확인", failure: "state 불일치·만료 → 교환 중단" },
    ],
    example: "302 Found\nLocation: https://app.example/callback?code=<one-time code>&state=<state>\n\n# 브라우저가 Location 주소로 이동\nGET /callback?code=<one-time code>&state=<state>",
  },
  {
    operations: [
      { kind: "request", from: "app", to: "provider", label: "POST /token", payload: "code + verifier + 클라이언트 인증" },
      { kind: "work", owner: "provider", label: "PKCE와 코드 검증", detail: "verifier로 계산한 challenge가 저장값과 일치", failure: "코드 만료·재사용 또는 PKCE 불일치 → invalid_grant" },
      { kind: "response", from: "provider", to: "app", label: "200 OK", payload: "ID Token + Access Token" },
    ],
    example: "POST /token\nAuthorization: Basic <encoded client credentials>\nContent-Type: application/x-www-form-urlencoded\n\ngrant_type=authorization_code&code=<one-time code>\n&redirect_uri=https%3A%2F%2Fapp.example%2Fcallback\n&code_verifier=<random verifier>\n\n200 OK\n{ \"id_token\": \"<signed JWT>\", \"access_token\": \"<access token>\", \"token_type\": \"Bearer\" }",
  },
  {
    operations: [
      { kind: "work", owner: "app", label: "ID Token 서명과 클레임 확인", detail: "제공자 공개키 · iss · aud · exp · nonce", failure: "서명·클레임 검증 실패 → 로그인 중단" },
      { kind: "work", owner: "app", label: "서비스 계정 확인", detail: "검증된 (iss, sub)로 계정 식별" },
    ],
    example: "# ID Token의 디코딩된 페이로드 예시. 검증에는 원본 JWT 사용.\n{\n  \"iss\": \"https://idp.example\", \"aud\": \"web-app\",\n  \"sub\": \"user-42\", \"exp\": <expiry>, \"iat\": <issued at>,\n  \"nonce\": \"<nonce>\"\n}",
  },
  {
    operations: [
      { kind: "request", from: "app", to: "profile", label: "GET /userinfo", payload: "Bearer Access Token" },
      { kind: "response", from: "profile", to: "app", label: "200 OK", payload: "토큰 확인 후 sub + 프로필" },
      { kind: "work", owner: "app", label: "ID Token의 sub와 비교", detail: "일치하면 프로필 정보 사용", failure: "sub 불일치 → 프로필 응답 폐기" },
    ],
    example: "GET /userinfo\nAuthorization: Bearer <access token>\n\n200 OK\n{ \"sub\": \"user-42\", \"name\": \"Example User\" }",
  },
  {
    operations: [
      { kind: "work", owner: "app", label: "서비스 세션 생성", detail: "검증된 계정과 새 세션 ID 연결" },
      { kind: "response", from: "app", to: "browser", label: "303 See Other", payload: "Set-Cookie + Location: /account" },
      { kind: "request", from: "browser", to: "app", label: "GET /account", payload: "서비스 세션 쿠키로 로그인 유지" },
    ],
    example: "303 See Other\nLocation: /account\nSet-Cookie: session=<new session ID>; Path=/; Secure; HttpOnly; SameSite=Lax\n\nGET /account\nCookie: session=<new session ID>",
  },
];

export const oauthWorkflow: WorkflowVisualizationSpec = {
  title: "OAuth 2.0 + OIDC 로그인 워크플로우",
  subjectRisk: "sensitive",
  overviewMs: 3600,
  autoplayMs: 5600,
  overviewSummary: "사용자 브라우저는 인가 화면과 서비스 사이를 이동하고, 앱 서버는 제공자와 직접 코드를 교환합니다. 흐름에서 세션 쿠키가 만들어지는 시점을 따라가 보세요.",
  waterfallLabel: "현재 단계의 실행 순서",
  actors: [
    { id: "browser", label: "브라우저", detail: "사용자 화면", x: 20, y: 20, accent: "blue" },
    { id: "provider", label: "인가 서버", detail: "OIDC 제공자", x: 80, y: 20, accent: "violet" },
    { id: "app", label: "앱 서버", detail: "서비스 백엔드", x: 20, y: 80, accent: "emerald" },
    { id: "profile", label: "UserInfo API", detail: "보호 리소스", x: 80, y: 80, accent: "amber" },
  ],
  topologyLinks: [
    { from: "browser", to: "app" },
    { from: "browser", to: "provider" },
    { from: "app", to: "provider" },
    { from: "app", to: "profile" },
  ],
  steps: oauthStages.map(({ operations }, index) => {
    const activeActorIds = new Set<OauthActorId>();
    const transitions: NonNullable<WorkflowVisualizationSpec["steps"][number]["transitions"]> = [];
    const spans: WorkflowWaterfallSpan[] = operations.map((operation, order) => {
      const time = { start: order / operations.length, end: (order + 0.9) / operations.length };
      if ("owner" in operation) {
        activeActorIds.add(operation.owner);
        return { ...time, actorId: operation.owner, kind: operation.kind, label: operation.label, detail: operation.detail };
      }
      activeActorIds.add(operation.from);
      activeActorIds.add(operation.to);
      transitions.push(operation);
      return { ...time, actorId: operation.from, kind: "network", label: operation.label, detail: operation.payload };
    });

    const { title, summary } = oauthLoginPhases[index];
    return { title, summary, activeActorIds: [...activeActorIds], transitions, spans };
  }),
};
