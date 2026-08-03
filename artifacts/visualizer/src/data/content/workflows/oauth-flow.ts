import { ContentItem } from "../content-types";

export const oauthFlowContent: ContentItem = {
    slug: "oauth-flow",
    category: "workflow",
    title: "OAuth 2.0 인증 흐름",
    subtitle: "Authorization Code Grant Flow (인증 코드 승인 방식)",
    tags: [
    "Security",
    "OAuth2",
    "Authentication",
    "Web"
],
    description: `OAuth 2.0은 서드파티 애플리케이션이 사용자를 대신하여 서비스의 자원에 안전하게 접근할 수 있도록 권한을 위임하는 표준 프로토콜입니다. 그 중 가장 널리 쓰이는 인증 코드 승인 방식(Authorization Code Grant)은 높은 수준의 보안을 보장합니다.

## 주요 구성원 (Roles)
- Resource Owner (사용자): 로그인 및 리소스 접근 권한을 부여하는 주체입니다.
- Client (서드파티 서비스): 사용자를 대신해 Resource Server에 접근하려는 웹/앱 서비스입니다.
- Authorization Server (인증 서버): 사용자를 인증하고 Access Token을 발급하는 서버입니다.
- Resource Server (API 서버): 사용자의 개인 데이터를 소유하고 있으며 보호되는 자원을 제공합니다.

## 왜 Authorization Code가 필요한가
Access Token을 브라우저에 직접 노출하지 않고 백엔드(Client Server) 간 보안 채널을 통해 전달하기 위함입니다. 프론트엔드가 탈취되더라도 Authorization Code만으로는 Access Token을 받아갈 수 없으므로(클라이언트 시크릿 검증 필요), 높은 수준의 보안을 유지할 수 있습니다.`,
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

