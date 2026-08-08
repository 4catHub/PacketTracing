import { ContentItem } from "../content-types";

export const messengerFileTransferContent: ContentItem = {
  slug: "messenger-file-transfer",
  category: "workflow",
  title: "OSI 7계층과 TCP/IP 4계층: 데이터 단위 캡슐화",
  subtitle: "osi-7-tcpip-4-layers.pdf가 이동하며 TCP/IP 4계층 안에서 OSI 7계층의 역할을 추적합니다.",
  tags: ["TCP/IP", "OSI 7 Layers", "TCP", "TLS", "Network"],
  description: `현대 네트워크는 보통 **TCP/IP 4계층 모델**로 구현하고 운영합니다. **OSI 7계층**은 이 동작을 더 세밀하게 설명하기 위한 참조 모델입니다. 이 페이지의 주인공은 osi-7-tcpip-4-layers.pdf를 사내 메신저로 전송하는 과정이며, 왼쪽은 발신·캡슐화, 오른쪽은 수신·역캡슐화를 나타냅니다.

## 전체 흐름

민지가 채팅창에 파일을 첨부하면 메신저가 파일 전송 요청을 만듭니다. 파일은 송신자 PC에서 사내 파일 서버로 업로드되고, 서버는 수신자에게 파일 도착 알림을 전달합니다. 준호의 메신저는 서버에서 파일을 다운로드한 뒤 파일 카드를 보여 주고, 준호가 카드를 누르면 운영체제의 파일 애플리케이션으로 파일을 엽니다.

시각화에서는 이 흐름을 두 개의 동일한 계층 모형으로 나누었습니다.

- 왼쪽 **발신 계층**: 파일 첨부 → Application → Transport → Internet → Network Access
- 오른쪽 **수신 계층**: Network Access → Internet → Transport → Application → 파일 열기

발신 데이터가 계층을 아래로 내려갈 때마다 바깥 데이터 단위가 추가됩니다. 수신 측에서는 같은 단위를 바깥쪽부터 제거하면서 원래 파일에 가까워집니다.

## TCP/IP 4계층과 OSI 7계층의 대응

### Application 계층 — OSI 5·6·7

TCP/IP의 Application 계층은 OSI의 Session(5), Presentation(6), Application(7)을 하나의 실용적인 계층으로 묶어 표현합니다.

- OSI 7: 메신저가 수신자, 파일명, 파일 크기, 메시지 내용을 전송 요청으로 구성합니다.
- OSI 6: 파일 데이터가 TLS로 암호화되고, 수신 측에서 복호화됩니다. 압축·인코딩과 같은 표현 변환도 이 영역의 개념으로 설명할 수 있습니다.
- OSI 5: 로그인된 메신저 연결과 파일 업로드·알림 세션을 유지합니다.

따라서 시각화의 Application 단계에서는 초록색 파일 조각 안쪽에 파란색 TLS Record가 추가됩니다. 다만 실제 제품에서는 TLS와 메신저 프로토콜 구현 위치가 달라질 수 있으므로, OSI 대응은 이해를 위한 개념적 매핑입니다.

### Transport 계층 — OSI 4

TCP는 Application에서 내려온 데이터를 전송 가능한 크기의 **TCP Segment**로 나눕니다. 각 세그먼트에는 출발지·목적지 포트와 순서 번호가 들어갑니다.

수신 측 TCP는 순서 번호를 기준으로 세그먼트를 다시 정렬하고, 확인 응답(ACK)을 보냅니다. 중간에 세그먼트가 사라지거나 손상되면 같은 순서의 데이터를 재전송해 애플리케이션이 온전한 스트림을 받도록 합니다.

### Internet 계층 — OSI 3

각 TCP Segment에는 IP 헤더가 추가되어 **IP Packet**이 됩니다. IP 헤더의 출발지·목적지 주소를 보고 라우터가 다음 홉을 선택합니다.

라우터는 파일 내용을 해석하지 않습니다. IP 목적지를 확인해 패킷을 다음 네트워크로 넘길 뿐이며, 일반적인 사내망에서는 IP 패킷 안의 TCP와 파일 데이터가 다음 홉까지 유지됩니다.

### Network Access 계층 — OSI 1·2

IP Packet은 현재 링크에서 전달될 수 있도록 Ethernet 또는 Wi‑Fi **Frame**으로 감싸집니다. 프레임에는 현재 링크의 MAC 주소와 오류 검출용 정보가 포함되고, 물리 계층에서는 이것이 전기·빛·무선 신호로 변환됩니다.

프레임은 링크 단위의 봉투이므로 라우터를 한 번 지날 때마다 다음 링크에 맞는 새 프레임으로 교체됩니다. 따라서 MAC 주소는 홉마다 달라질 수 있지만, IP 주소와 TCP 포트는 종단 간 통신의 주소로 남습니다.

## 파일 단위와 캡슐화

원본 파일 하나가 그대로 하나의 프레임이 되는 것은 아닙니다. 메신저는 큰 파일을 여러 **File Chunk** 또는 애플리케이션 데이터 조각으로 나누고, 각각을 전송합니다. 하나의 파일 조각은 개념적으로 다음처럼 포장됩니다.

**Wi‑Fi Frame → IP Packet → TCP Segment → TLS Record → File Chunk**

송신자는 바깥쪽 봉투를 차례로 추가하는 **캡슐화**를 수행합니다. 수신자는 Network Access에서 Frame을 제거하고, Internet에서 IP Packet을 제거하고, Transport에서 TCP Segment를 재조립한 뒤, Application에서 TLS를 처리해 File Chunk를 복원합니다. 이것이 **역캡슐화**입니다.

이 단위들은 항상 1:1로 대응하지 않습니다. 하나의 파일 조각이 여러 TCP 세그먼트로 나뉠 수 있고, 하나의 TCP 세그먼트가 여러 IP 패킷·링크 프레임으로 나뉘어 전송될 수도 있습니다. 시각화의 색상 껍질은 이 관계와 순서를 이해하기 위한 교육용 모델입니다.`,
  steps: [
    "파일 첨부: 민지가 채팅창에 osi-7-tcpip-4-layers.pdf를 첨부하고 전송을 누른다. 이 동작은 아직 TCP/IP 계층에 들어가기 전의 메신저 UI 단계다.",
    "Application: 메신저 요청·파일 메타데이터를 만들고 TLS로 보호한다. TCP/IP Application은 OSI 5·6·7 역할을 함께 포괄한다.",
    "Transport: TCP가 파일을 순서 번호가 있는 세그먼트로 나누고 포트·재전송·순서 보장을 담당한다.",
    "Internet: IP 헤더가 붙은 패킷이 출발지와 파일 서버의 IP 주소를 갖고 라우터가 선택할 경로를 제공한다.",
    "Network Access: IP 패킷 바깥에 Ethernet/Wi‑Fi 프레임이 붙어 로컬 링크로 전송된다. 라우터를 지날 때 이 프레임은 다음 링크용으로 교체된다.",
    "수신 Network Access와 Internet: 파일 서버 또는 수신자 측 링크에서 프레임을 벗기고 IP 목적지를 확인한다.",
    "수신 Transport와 Application: TCP가 세그먼트를 순서대로 재조립하고, TLS 보호가 처리된 뒤 메신저가 원본 파일을 수신한다.",
    "파일 열기: 준호가 메신저의 파일 카드를 눌러 osi-7-tcpip-4-layers.pdf를 연다.",
  ],
  examples: [
    "사내 메신저에서 PDF·이미지·압축 파일을 동료에게 공유",
    "TLS 기반 HTTPS 업로드와 다운로드",
    "TCP 순서 보장과 손실 세그먼트 재전송",
    "스위치·라우터를 지나는 프레임 전달",
  ],
  related: [
    { slug: "https-handshake", category: "workflow", relation: "파일 전송 전에 안전한 TLS 채널을 준비하는 과정" },
    { slug: "realtime-protocols", category: "workflow", relation: "수신자에게 새 파일 알림을 전달할 수 있는 실시간 연결 방식" },
    { slug: "google-dns", category: "workflow", relation: "사내 파일 서버의 이름을 IP 주소로 찾는 선행 과정" },
  ],
};
