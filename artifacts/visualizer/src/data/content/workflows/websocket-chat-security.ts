import type { ContentItem } from "../content-types";

export const websocketChatSecurityContent: ContentItem = {
  slug: "websocket-chat-security",
  category: "workflow",
  title: "WebSocket 실시간 채팅과 보안",
  subtitle:
    "연결과 방 입장부터 메시지 저장·수신·재접속까지 따라가며 서버의 검증 지점을 확인합니다",
  tags: ["WebSocket", "Realtime Chat", "Authorization", "CSWSH", "XSS"],
  description: `브라우저 두 대가 비공개 채팅방에서 텍스트 메시지를 주고받는 예제입니다. 웹 앱은 같은 사이트의 로그인 세션 쿠키를 사용하고, 서버는 기본 WebSocket 연결 위에서 JSON 이벤트를 주고받습니다. 방 입장, 저장 확인(ACK), 메시지 ID, 재접속 복구는 이 예제의 애플리케이션 규칙입니다.

### 1. 연결 수립과 교차 사이트 WebSocket 탈취

HTTP/1.1 예제에서 브라우저는 TLS 연결을 맺고 \`Upgrade: websocket\`을 요청합니다. 서버는 브라우저가 보낸 \`Origin\`과 세션을 확인한 후 \`101 Switching Protocols\`로 응답합니다. 연결이 열리면 같은 소켓에서 양방향으로 메시지를 주고받습니다.

악성 사이트가 피해자의 브라우저에서 WebSocket을 열고 브라우저가 쿠키를 함께 보내면, 서버가 출처를 확인하지 않을 경우 피해자 권한으로 연결될 수 있습니다(CSWSH). 브라우저 전용 엔드포인트는 HTTP API의 CORS 설정과 별도로 업그레이드 요청의 출처를 검사합니다. 정확한 출처 목록과 일치하지 않거나 출처가 없으면 연결 전에 거절합니다. \`Origin\`은 브라우저 출처를 검사하는 값입니다. 계정은 별도로 검증한 세션에서 결정합니다. \`wss://\`, \`Secure\`, \`HttpOnly\`, 서비스에 맞는 \`SameSite\`를 사용하고 세션 토큰은 URL에 넣지 않습니다.

~~~text
handleUpgrade(request):
    require exactAllowedOrigin(request.headers.origin)  # 실패 시 HTTP 403
    session = requireActiveSession(request.cookies)      # 없거나 만료 시 HTTP 401
    requireConnectionQuota(session.userId, request.clientIp)
    acceptWebSocket(principal = session.userId, sessionId = session.id)
~~~

### 2. 방 입장과 이벤트별 인가

\`join\`이 들어오면 서버의 현재 멤버십을 조회해 읽기 권한을 확인한 뒤 구독에 추가합니다. 방 ID를 알고 있거나 기존 소켓이 연결되어 있어도 쓰기 권한은 각 \`send\`에서, 기록 조회 권한은 각 \`resume\`에서 검사합니다. 보낸 사람 ID는 소켓에 연결한 세션에서 가져옵니다. \`senderId\` 등 스키마에 없는 필드는 거부합니다.

### 3. 메시지 크기와 요청 빈도 제한

라이브러리나 게이트웨이에서 조각을 합친 뒤의 메시지 크기와 압축 해제 후의 크기를 제한합니다. 계정별 이벤트 한도와 업그레이드 단계의 연결 한도를 함께 두고, 여러 서버가 처리한다면 카운터를 공유합니다. 크기·빈도 제한 뒤에 이벤트 종류와 JSON 스키마, 본문 길이를 검사합니다. 입력 검증을 통과한 값도 저장 시 바인드 파라미터로 전달합니다.

~~~text
onMessage(socket, raw):
    requireActiveSession(socket.sessionId)
    requireEventQuota(socket.userId)
    event = parseStrictJson(raw)  # 전송 계층에서 전체 메시지 크기를 먼저 제한

    if event.type == "join":
        requireRoomRead(socket.userId, event.roomId)
        subscribe(socket, event.roomId)

    if event.type == "send":
        message = saveAuthorizedMessage(socket.userId, event)
        replyAck(socket, event.clientMessageId, message.id)
~~~

### 4. 저장과 ACK, 중복 재시도

클라이언트는 메시지에 \`clientMessageId\`를 붙입니다. 서버는 쓰기 권한을 확인하고 DB 트랜잭션에서 메시지를 저장한 뒤 ACK를 반환합니다. ACK는 **서버 저장 완료** 를 뜻합니다. 상대방의 화면 표시나 읽음 여부는 별도 이벤트로 기록할 수 있습니다.

DB에 \`UNIQUE(room_id, sender_id, client_message_id)\` 제약을 둡니다. 동일 키와 동일 본문이 재전송되면 기존 ID를 반환하고, 같은 키에 다른 본문이면 충돌로 거절합니다. 쓰기 권한 검증과 저장 사이에 멤버십이 변경될 수 있다면 같은 트랜잭션에서 멤버십 행을 잠그고, 권한을 바꾸는 경로도 같은 잠금 규칙을 적용합니다.

~~~text
saveAuthorizedMessage(userId, event):
    transaction:
        lockMembershipAndRequireWrite(userId, event.roomId)
        result = insertOrFindExisting(event.roomId, userId,
                                      event.clientMessageId, event.text)
        requireSameBodyIfExisting(result, event.text)
        if result.isNew:
            saveOutboxEvent("message.created", result.message.id)
    return result.message
~~~

### 5. 브로드캐스트와 화면 표시

커밋된 새 메시지만 방의 활성 수신자에게 배포합니다. 위 예제는 메시지와 배포 이벤트를 같은 트랜잭션에 기록하는 아웃박스를 사용합니다. 저장 ACK와 배포는 커밋 이후 별도로 진행되므로 둘의 도착 순서는 달라질 수 있습니다. 워커가 이벤트를 다시 배포할 수 있으므로 수신자는 서버의 \`messageId\`로 중복 표시를 막습니다. 배포 시 수신자의 현재 세션과 방 읽기 권한을 적용합니다. 로그아웃하면 세션의 소켓을 닫고, 방에서 강퇴되면 해당 방의 구독을 해제합니다.

메시지 본문은 React의 일반 텍스트 표현식이나 DOM의 \`textContent\`로 표시합니다. HTML을 그대로 삽입하면 저장형 XSS가 될 수 있습니다. 리치 텍스트가 필요한 경우 허용 목록 기반 정제기를 사용하고 링크 URL 스킴도 제한합니다. 느린 수신자의 송신 대기열에는 상한을 두고, 한도를 넘기면 연결을 정리해 재접속 복구로 이어갑니다.

### 6. 재접속과 놓친 메시지 복구

서버는 WebSocket Ping/Pong과 응답 기한으로 끊어진 연결을 감지해 소켓과 구독을 정리합니다. 클라이언트는 재시도 간격을 늘리고 임의 지연을 섞어 한꺼번에 재접속하는 상황을 줄입니다. 재접속하면 세션과 방 권한을 다시 검사합니다.

수신자는 방별로 마지막으로 적용한 순서 커서를 보냅니다. 이 예제에서 서버가 부여하는 순번은 방 안에서 확정된 메시지 순서를 나타내며, 서버는 커서 이후의 메시지를 페이지 단위로 반환합니다. 라이브 수신과 기록 조회가 겹칠 수 있으므로, 예를 들어 라이브 이벤트를 잠시 버퍼링하면서 서버가 정한 기준 순번까지 기록을 조회하고 서버 메시지 ID로 병합합니다. 권한이 회수된 사용자의 재접속에는 이전 커서를 보내더라도 기록을 반환하지 않습니다.

운영 로그에는 출처 거절, 인증·인가 실패, 연결 수·한도 초과, 비정상 종료를 남깁니다. 세션 토큰과 메시지 원문은 기록 대상에서 제외합니다.`,
  steps: [
    "WSS 업그레이드 전에 Origin과 로그인 세션을 확인합니다.",
    "서버의 멤버십을 조회한 후 방 구독을 등록합니다.",
    "전송 계층의 크기 제한과 사용자별 요청 한도를 적용합니다.",
    "이벤트 스키마와 쓰기 권한을 확인하고 세션에서 발신자 ID를 가져옵니다.",
    "멱등 키로 메시지와 배포 이벤트를 저장하고 커밋 후 ACK를 보냅니다.",
    "현재 읽기 권한이 있는 활성 수신자에게 새 메시지를 배포합니다.",
    "수신 화면은 메시지 ID로 중복을 걸러내고 본문을 텍스트로 표시합니다.",
    "재접속하면 권한을 다시 검사한 뒤 마지막 순번 이후의 기록을 복구합니다.",
  ],
  examples: [
    "비공개 프로젝트 채팅에서 퇴장한 멤버의 기존 연결과 기록 접근 차단",
    "모바일 네트워크 전환으로 ACK가 사라졌을 때 같은 메시지의 중복 저장 방지",
    "고객 상담 채팅에서 사용자 입력이 상대 브라우저에서 HTML로 실행되지 않도록 처리",
  ],
  learningObjectives: [
    "업그레이드 시 인증과 채팅 이벤트마다 수행하는 인가를 구분할 수 있다.",
    "저장 ACK와 수신·읽음 상태를 구분하고 재시도 중복을 막는 키를 설계할 수 있다.",
    "교차 사이트 연결, 방 권한 우회, 메시지 폭주, 저장형 XSS를 각각 막는 지점을 찾을 수 있다.",
  ],
  commonMistakes: [
    "업그레이드에 성공해도 모든 방과 이벤트의 권한이 생기지는 않습니다.",
    "ACK를 받았다는 사실은 서버 저장을 확인한 것입니다. 상대방이 읽었다는 의미는 별도 상태로 관리합니다.",
    "전송 이벤트를 재시도할 때마다 새 clientMessageId를 만들면 기존 메시지와 중복인지 판단할 수 없습니다.",
  ],
  keyTakeaways: [
    "연결은 Origin과 세션으로, 방 입장·전송·수신·기록 조회는 현재 멤버십으로 제어합니다.",
    "메시지를 저장한 뒤 ACK를 보내고, 재전송은 DB 유일 제약으로 처리합니다.",
    "입력 크기와 속도, 송신 대기열을 제한하고 브라우저에서는 본문을 텍스트로 표시합니다.",
  ],
  exercises: [
    {
      question:
        "로그인 쿠키가 유효하지만 Origin이 허용 목록 밖이면 어떻게 해야 하나요?",
      options: [
        "HTTP 업그레이드 전에 연결을 거절한다.",
        "연결 후 첫 메시지까지 기다린다.",
        "쿠키가 있으므로 연결을 허용한다.",
      ],
      answerIndex: 0,
      explanation:
        "유효한 쿠키는 계정을 확인하는 데 사용합니다. 다른 사이트의 스크립트가 그 세션으로 연결하는 것은 별도로 차단해야 합니다.",
    },
    {
      question:
        "저장은 성공했지만 ACK가 유실돼 같은 clientMessageId와 본문을 다시 받았습니다. 어떻게 처리하나요?",
      options: [
        "기존 서버 메시지 ID를 ACK하고 새 배포 이벤트를 만들지 않는다.",
        "메시지를 새로 저장하고 전원에게 배포한다.",
        "새 메시지 ID를 만든 뒤 저장하지 않고 ACK한다.",
      ],
      answerIndex: 0,
      explanation:
        "같은 방과 보낸 사람의 동일 메시지라면 저장된 ID를 재사용할 수 있습니다.",
    },
  ],
  related: [
    {
      slug: "realtime-protocols",
      category: "workflow",
      relation: "WebSocket, SSE, Polling의 연결과 전송 방향 비교",
    },
    {
      slug: "jwt-vs-session",
      category: "workflow",
      relation: "로그인 세션과 연결 수립 시 사용자 식별",
    },
    {
      slug: "message-queue-event-driven",
      category: "workflow",
      relation: "아웃박스, 이벤트 재시도와 멱등 처리",
    },
  ],
};
