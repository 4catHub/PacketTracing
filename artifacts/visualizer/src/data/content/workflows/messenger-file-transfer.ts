import { ContentItem } from "../content-types";

export const messengerFileTransferContent: ContentItem = {
  slug: "messenger-file-transfer",
  category: "workflow",
  title: "OSI 7계층과 TCP/IP 4계층: 데이터 단위 캡슐화",
  subtitle: "osi-7-tcpip-4-layers.pdf가 이동하며 TCP/IP 4계층 안에서 OSI 7계층의 역할을 추적합니다.",
  tags: ["TCP/IP", "OSI 7 Layers", "TCP", "TLS", "Network"],
  description: `현대 네트워크는 일반적으로 TCP/IP 4계층 모델로 구현 및 운영되며, OSI 7계층은 이를 더 정밀하게 설명하기 위한 개념적 참조 모델입니다. 사내 메신저를 통해 파일을 전송하는 과정에서 발생하는 계층별 캡슐화(Encapsulation)와 역캡슐화(Decapsulation) 흐름을 추적합니다.

### 1. 발신 캡슐화와 수신 역캡슐화 파이프라인
- **발신 측 캡슐화 (Downstream):** 상위 계층에서 하위 계층으로 내려갈 때마다 각 프로토콜 헤더가 외부 봉투처럼 차례로 감싸집니다 (\`File Chunk\` ➔ \`TLS Record\` ➔ \`TCP Segment\` ➔ \`IP Packet\` ➔ \`Ethernet/Wi-Fi Frame\`).
- **수신 측 역캡슐화 (Upstream):** 수신 호스트는 하위 계층부터 차례로 헤더를 검증 및 제거하여 최상위 원본 파일 데이터를 복원합니다.

### 2. TCP/IP 4계층과 OSI 7계층의 매핑 분석
- Application 계층 (OSI 5·6·7): 메신저 애플리케이션(L7)의 파일 전송 요청을 구성하고, TLS 암호화(L6)를 적용하며, 세션(L5)을 유지 관리합니다.
- **Transport 계층 (OSI 4):** TCP 프로토콜이 파일을 분할하여 \`TCP Segment\`를 생성하고, 포트 번호, 순서 번호(Sequence Number), 재전송 및 신뢰성 있는 흐름 제어를 담당합니다.
- **Internet 계층 (OSI 3):** IP 헤더를 추가하여 \`IP Packet\`을 생성하며, 라우터가 출발지/목적지 IP 주소를 참조하여 최적의 패킷 전달 경로(라우팅)를 결정합니다.
- Network Access 계층 (OSI 1·2): 물리 링크 전송을 위해 MAC 주소가 포함된 \`Frame\`으로 감싸고, 물리 계층에서 전기·빛·무선 전파 신호로 변환하여 전송합니다.`,
  steps: [
    "파일 첨부: 민지가 채팅창에 osi-7-tcpip-4-layers.pdf를 첨부하고 전송을 누른다. 이 동작은 아직 TCP/IP 계층에 들어가기 전의 메신저 UI 단계다.",
    "Application: 메신저 요청·파일 메타데이터를 만들고 TLS로 보호한다. TCP/IP Application은 OSI 5·6·7 역할을 함께 포괄한다.",
    "Transport: TCP가 파일을 순서 번호가 있는 세그먼트로 나누고 포트·재전송·순서 보장을 담당한다.",
    "Internet: IP 헤더가 붙은 패킷이 출발지와 파일 서버의 IP 주소를 갖고 라우터가 선택할 경로를 제공한다.",
    "Network Access: IP 패킷 바깥에 Ethernet/Wi‑Fi 프레임이 붙어 로컬 링크로 전송된다. 라우터를 지날 때 이 프레임은 다음 링크용으로 교체된다.",
    "수신 Network Access와 Internet: 파일 서버 또는 수신자 측 링크에서 프레임을 벗기고 IP 목적지를 확인한다.",
    "수신 Transport와 Application: TCP가 세그먼트를 순서대로 재조립하고, TLS 보호가 처리된 뒤 메신저가 원본 파일을 수신한다.",
    "파일 열기: 준호가 메신저의 파일 카드를 눌러 osi-7-tcpip-4-layers.pdf를 연다."
  ],
  examples: [
    "사내 메신저에서 PDF·이미지·압축 파일을 동료에게 공유",
    "TLS 기반 HTTPS 업로드와 다운로드",
    "TCP 순서 보장과 손실 세그먼트 재전송",
    "스위치·라우터를 지나는 프레임 전달"
  ],
  related: [
    { slug: "https-handshake", category: "workflow", relation: "파일 전송 전에 안전한 TLS 채널을 준비하는 과정" },
    { slug: "realtime-protocols", category: "workflow", relation: "수신자에게 새 파일 알림을 전달할 수 있는 실시간 연결 방식" },
    { slug: "google-dns", category: "workflow", relation: "사내 파일 서버의 이름을 IP 주소로 찾는 선행 과정" }
  ]
};
