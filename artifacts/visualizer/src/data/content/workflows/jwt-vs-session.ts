import { ContentItem } from "../content-types";

export const jwtVsSessionContent: ContentItem = {
  slug: "jwt-vs-session",
  category: "workflow",
  title: "로그인 및 로그아웃 (Session vs JWT)",
  subtitle: "콘서트 입장권 비유로 이해하는 상태유지(Stateful) vs 무상태(Stateless) 인증 아키텍처",
  tags: [
    "Security",
    "Authentication",
    "JWT",
    "Session"
  ],
  description: `웹 애플리케이션의 인증과 인가 처리 방식은 서버 아키텍처와 확장성에 결정적인 영향을 미칩니다. 콘서트 입장 비유를 통해 서버에 상태를 저장하는 Stateful 세션 방식과 클라이언트 토큰에 상태를 담는 Stateless JWT 방식의 동작 메커니즘을 대조합니다.

### 1. 세션 기반 인증 (매표소 장부와 단순 팔찌)
서버가 로그인 성공 시 세션 저장소(DB/Redis)에 사용자 세션을 기록하고, 클라이언트에게는 무작위 난수 식별자인 \`Session ID\` 쿠키를 발급합니다.
- **로그인 처리:** 서버의 중앙 집중형 세션 저장소에 로그인 상태를 직접 생성하므로, 세션 탈취 방어를 위한 \`HttpOnly\` 및 \`SameSite\` 쿠키 설정이 필수적입니다.
- **API 요청 검증:** 클라이언트가 매 요청마다 \`Session ID\`를 쿠키로 전달하면, 게이트가 서버 세션 DB를 매번 룩업(Lookup)하여 세션 유효성을 교차 검증합니다.
- **로그아웃 처리:** 서버의 세션 장부에서 해당 ID 레코드를 즉시 삭제하여, 탈취된 쿠키라도 즉각적이고 완벽하게 접근을 차단합니다.

### 2. JWT 토큰 인증 (서명 검증이 가능한 스마트 티켓)
서버가 로그인 성공 시 사용자의 신원 정보와 만료일을 담아 디지털 서명한 토큰 객체(\`Header.Payload.Signature\`)를 발행하여 클라이언트에 넘겨줍니다. 서버 메모리에는 상태를 저장하지 않습니다.
- **무상태성 (Stateless):** 서버가 세션 저장소를 조회하지 않고 오직 토큰의 서명 무결성만을 수학적으로 자체 검증하므로, 대규모 트래픽에서 뛰어난 수평 확장성(Scale-out)을 발휘합니다.
- **토큰 저장소 및 보안:** XSS 공격을 방지하기 위해 자바스크립트로 접근할 수 없는 \`HttpOnly\` 보안 쿠키 저장이 권장되며, CSRF 방어를 위해 \`SameSite=Strict\`를 병행합니다.
- **무효화의 한계:** 이미 발행된 토큰은 별도 서버 상태가 없다면 발급 후 만료 시까지 유효할 수 있습니다. 다만 거부 목록, 토큰 버전, 키 교체 등의 방법으로 조기 무효화를 구현할 수 있습니다.

### 3. 이중 토큰 전략 (Access & Refresh Token)
JWT의 무상태성을 유지하면서 분실/탈취 위험을 최소화하기 위해 두 종류의 토큰을 혼용합니다.
- **Access Token:** 실제 API 인가에 쓰이며, 탈취 사고를 대비하여 수명을 극도로 짧게(예: 15분~1시간) 설정합니다.
- **Refresh Token:** Access Token 만료 시 재발급 용도로 쓰이며, 유효 기간을 길게(예: 2주) 설정하고 Redis에 저장하여 필요 시 서버에서 발급 이력을 즉시 강제 무효화할 수 있도록 제어권을 확보합니다.

### 4. 로그아웃 시 인증 무효화 비교
- **Stateful 무효화:** 세션 방식은 서버 저장소의 레코드만 삭제하면 즉각 세션이 파기되어 통제가 매우 간단합니다.
- **하이브리드 블랙리스트 극복:** JWT 환경에서는 로그아웃 시 토큰의 Signature 값을 추출하여 잔여 수명 동안 Redis 블랙리스트에 등록하고, 인가 인터셉터에서 블랙리스트를 우선 조회하여 조기 차단합니다.

### 참고 자료
- [JSON Web Token 표준 RFC 7519](https://www.rfc-editor.org/info/rfc7519)`,
  learningObjectives: ["세션 ID 검증과 서명된 JWT의 검증·무효화 과정을 비교할 수 있다."],
  commonMistakes: ["JWT가 항상 암호화되는 것은 아니며 일반적인 서명형 JWT의 payload는 쉽게 디코딩할 수 있습니다. 무효화는 거부 목록이나 토큰 버전 관리로 구현할 수 있습니다."],
  keyTakeaways: ["JWT를 HttpOnly 쿠키로 전달한다면 CSRF 방어도 별도로 고려해야 합니다."],
  exercises: [{"question":"서명만 된 JWT의 payload에 비밀번호를 그대로 넣으면 안 되는 이유는?","options":["암호화되어 있지 않아 내용을 읽을 수 있어서","압축되기 때문에","항상 서버 저장소에 기록되기 때문에"],"answerIndex":0,"explanation":"JWS 형태의 JWT는 서명으로 무결성을 검증하지만 payload를 비밀로 유지하지는 않습니다."}],
  steps: [
    "대기 상태: 관람객(클라이언트)이 로그인을 위해 콘서트장 매표소에 접근합니다.",
    "로그인 요청: 매표소에 신분증(ID/PW)을 제출하여 신원 확인을 요청합니다.",
    "인증 완료 및 발급: 세션 방식은 장부에 등록 후 '단순 팔찌'를 발급하며, JWT 방식은 서명된 '스마트 티켓'을 발급합니다.",
    "인가된 API 요청: 세션 게이트는 매번 서버 장부를 룩업해야 통과되고, JWT 게이트는 스마트 티켓을 자체 검증하여 딜레이 없이 통과시킵니다.",
    "로그아웃 및 무효화: 세션은 서버 장부의 기록을 지워 즉시 출입을 막습니다. JWT는 클라이언트가 티켓을 폐기하고, 서버는 위험 토큰을 블랙리스트 전광판에 등록하여 방어합니다."
  ],
  examples: [
    "단일 모놀리식 서버 기반 서비스 (세션 인증에 적합)",
    "대규모 다중 서버 및 MSA(마이크로서비스) 아키텍처 (JWT 인증에 적합)",
    "외부 API 및 서드파티 제휴 서비스 연동 (JWT/OAuth2에 적합)",
    "실시간 금융 거래 등 즉각적인 강제 로그아웃이 필수적인 서비스 (세션 인증 권장)"
  ],
  related: [
    { slug: "oauth-flow", category: "workflow", relation: "OAuth 2.0 인증 절차 완료 후 토큰 기반 인가 방식" },
    { slug: "api-gateway", category: "workflow", relation: "Gateway 진입점에서 JWT 토큰을 자체 파싱하여 인가 처리" },
    { slug: "monolith-vs-msa", category: "workflow", relation: "Monolith(세션 선호) vs MSA(Stateless JWT 선호) 아키텍처 선택" }
  ]
};
