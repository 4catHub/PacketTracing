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
    description: `HTTPS는 HTTP 프로토콜의 보안 취약성을 극복하기 위해 TLS(Transport Layer Security) 암호화 계층을 얹은 프로토콜입니다. TLS 1.3은 단 1-RTT(1 Round Trip Time)만에 대칭 키를 교환하고 보안 세션을 맺는 극적인 성능 향상을 이루어냈습니다.

## 왜 대칭키와 비대칭키를 섞어 쓰는가?
비대칭키(공개키/개인키) 암호화는 안전하지만 연산 비용이 매우 큽니다. 반면 대칭키 암호화는 빠르지만 키를 안전하게 공유하기 어렵습니다. 따라서 TLS는 비대칭키(디피-헬만 키 합의 및 디지털 서명)를 사용하여 데이터를 암호화할 '대칭 키(세션 키)'를 안전하게 교환하고, 이후 실제 통신은 그 대칭 키로 빠르게 암호화합니다.

## TLS 1.3의 핵심 개선 (1-RTT)
이전 TLS 1.2는 2-RTT가 필요했으나, TLS 1.3은 Client Hello 단계에서 암호화 제안과 함께 디피-헬만(Diffie-Hellman) 키 교환을 위한 공유값 파라미터를 미리 전송(Key Share)하여 첫 번째 왕복 만에 세션 키를 생성해 냅니다.`,
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
};
