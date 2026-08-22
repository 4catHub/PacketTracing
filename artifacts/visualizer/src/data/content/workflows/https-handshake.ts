import { ContentItem } from "../content-types";

export const httpsHandshakeContent: ContentItem = {
  slug: "https-handshake",
  category: "workflow",
  title: "HTTPS (SSL/TLS 1.3) Handshake",
  subtitle: "공개키 암호화와 디피-헬만 알고리즘을 통한 보안 세션 키 합의 과정",
  tags: [
    "Security",
    "HTTPS",
    "TLS1.3",
    "Cryptography"
  ],
  description: `HTTPS는 평문 전송인 HTTP의 도청 및 변조 취약성을 극복하기 위해 TLS(Transport Layer Security) 암호화 계층을 얹은 프로토콜입니다. TLS 1.3은 단 1-RTT(1 Round Trip Time)만에 대칭 세션키를 교환하고 암호화 터널을 확립합니다.

### 1. 하이브리드 암호화 아키텍처 (대칭키 + 비대칭키)
보안성과 연산 성능의 균형을 위해 두 가지 암호화 방식을 지능적으로 결합하여 운영합니다.
- 비대칭키 (디지털 서명 & 키 교환): 공개키/개인키 쌍을 이용하여 서버 신원을 검증하고 대칭키를 안전하게 합의합니다. 연산 비용이 크기 때문에 초기 핸드셰이크 단계에서만 사용됩니다.
- **대칭키 (고속 세션 암호화):** 생성된 대칭 세션키(Session Key)를 통해 실제 애플리케이션 데이터를 초고속(AES-GCM, ChaCha20-Poly1305)으로 암호화하여 통신합니다.

### 2. TLS 1.3 핸드셰이크 4단계 흐름
TLS 1.3은 이전 세대(TLS 1.2의 2-RTT) 대비 레이턴시를 절반으로 단축시켰습니다.
- **Client Hello (1-RTT 시작):** 클라이언트가 지원하는 암호화 제품군(Cipher Suites) 리스트와 디피-헬만(Diffie-Hellman) 공개 파라미터(Key Share)를 서버에 선제적으로 전송합니다.
- Server Hello & CA 인증서: 서버가 최적의 암호화 방식을 선택하고 자신의 Key Share 값 및 공인 CA(인증기관)의 디지털 서명이 포함된 인증서를 클라이언트에 회신합니다.
- CA 서명 검증 & 대칭 세션키 도출: 클라이언트는 브라우저에 내장된 루트 CA 공개키로 서버 인증서를 검증한 후, 디피-헬만 수학 연산에 양측 Key Share를 대입하여 양단에서 동일한 대칭 세션키를 독자 도출합니다.
- Encrypted Finished & 암호화 터널 확립: 세션키로 암호화된 완료 메시지(Finished)를 상호 교환하고, 도청이 불가능한 보안 녹색 터널을 통해 본 데이터를 송수신합니다.

### 3. 주요 보안 메커니즘
- **CA 인증서 신뢰 체인 (Chain of Trust):** 서버 인증서 ➔ 중간 CA ➔ 루트 CA로 이어지는 디지털 서명 검증으로 중간자 공격(MITM)을 원천 차단합니다.
- 순방향 비밀성 (PFS, Perfect Forward Secrecy): 임시 디피-헬만(ECDHE) 키를 사용하여, 향후 서버 개인키가 유출되더라도 과거의 통신 기록을 복호화할 수 없도록 보장합니다.`,
  steps: [
    "Client Hello: 클라이언트가 브라우저 지원 암호 제품군(Cipher Suites) 리스트와 디피-헬만 키 교환을 위한 Key Share 값을 인증 서버에 전송",
    "Server Hello: 서버가 사용할 암호 방식을 선택하고 자신의 Key Share 값, CA 디지털 서명이 포함된 인증서를 함께 클라이언트에 반환",
    "키 생성 및 검증: 클라이언트는 CA 공개키로 서버 인증서를 검증하고, 양측의 Key Share 값을 디피-헬만 수식에 대입하여 동일한 \"세션 대칭키\"를 독자적으로 유도 완료",
    "Handshake 완료 & 암호화 통신 시작: 이제 암호화된 채널을 통해 서로의 검증 완료 메시지(Finished)를 전송하고 본 데이터 전송을 시작"
  ],
  examples: [
    "웹 브라우저의 주소창 자물쇠 아이콘 활성화",
    "신용카드 결제 및 로그인 정보 전송 보호",
    "공인인증서 및 루트 CA(인증기관) 신뢰 체인 검증",
    "중간자 공격(MITM) 방지 및 도청 차단"
  ],
  related: [
    { slug: "google-dns", category: "workflow", relation: "DNS 주소 조회 완료 후 수행되는 HTTPS 세션 연결" },
    { slug: "proxy-vs-reverse-proxy", category: "workflow", relation: "Reverse Proxy 단에서 수행하는 TLS Termination 헤더 암호화 해제" },
    { slug: "oauth-flow", category: "workflow", relation: "OAuth 2.0 리다이렉트 토큰 전달 시의 보안 암호화 기반" }
  ]
};
