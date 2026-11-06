import type {
  WorkflowActor,
  WorkflowSpanStatus,
  WorkflowTransitionKind,
  WorkflowVisualizationSpec,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

export type ChatMode = "normal" | "defense";
type ActorId = "sender" | "server" | "receiver" | "db" | "foreign";

type Action =
  | { from: ActorId; to: ActorId; label: string; kind: WorkflowTransitionKind }
  | { owner: ActorId; label: string; status?: WorkflowSpanStatus };

type Scenario = {
  title: string;
  summary: string;
  actions: Action[];
  example: string;
};

const request = (from: ActorId, to: ActorId, label: string): Action => ({
  from,
  to,
  label,
  kind: "request",
});
const response = (from: ActorId, to: ActorId, label: string): Action => ({
  from,
  to,
  label,
  kind: "response",
});
const event = (from: ActorId, to: ActorId, label: string): Action => ({
  from,
  to,
  label,
  kind: "event",
});
const work = (
  owner: ActorId,
  label: string,
  status?: WorkflowSpanStatus,
): Action => ({ owner, label, status });

export const chatPhases: {
  label: string;
  normal: Scenario;
  defense: Scenario;
}[] = [
  {
    label: "연결",
    normal: {
      title: "WSS 연결 열기",
      summary:
        "송신자 브라우저의 HTTP/1.1 업그레이드 요청을 받습니다. 서버는 Origin과 로그인 세션을 확인한 뒤 연결을 엽니다.",
      actions: [
        request("sender", "server", "GET /ws · Upgrade"),
        work("server", "Origin·세션 검사", "success"),
        response("server", "sender", "HTTP 101"),
      ],
      example:
        "Origin: https://chat.example\nUpgrade: websocket\nCookie: session=<redacted>\n\nHTTP/1.1 101 Switching Protocols",
    },
    defense: {
      title: "외부 사이트에서 연 소켓 거절",
      summary:
        "피해자 브라우저가 쿠키를 함께 보내더라도, 공격 페이지의 Origin은 허용 목록에 없습니다. 서버가 업그레이드 전에 403을 반환합니다.",
      actions: [
        request("foreign", "server", "외부 Origin으로 Upgrade"),
        work("server", "허용 목록 불일치", "warning"),
        response("server", "foreign", "HTTP 403"),
      ],
      example:
        'if (origin !== "https://chat.example")\n    return httpForbidden();\n\n// Origin을 통과한 요청도 세션을 따로 검증합니다.',
    },
  },
  {
    label: "방 입장",
    normal: {
      title: "방 멤버십 확인과 구독",
      summary:
        "송신자가 방 입장을 요청합니다. 서버는 로그인 계정으로 현재 읽기 권한을 확인하고 소켓을 구독에 등록합니다.",
      actions: [
        request("sender", "server", "join · room-42"),
        request("server", "db", "읽기 권한 조회"),
        work("server", "소켓 구독 등록", "success"),
        response("server", "sender", "joined"),
      ],
      example: '{ "type": "join", "roomId": "room-42" }',
    },
    defense: {
      title: "다른 비공개 방의 구독 차단",
      summary:
        "로그인한 사용자가 다른 방 ID를 보냅니다. 서버는 읽기 권한이 없는 계정의 구독을 등록하지 않습니다.",
      actions: [
        request("sender", "server", "join · 비공개 방"),
        request("server", "db", "읽기 권한 조회"),
        work("server", "구독 등록 생략", "warning"),
        response("server", "sender", "room_forbidden"),
      ],
      example:
        "requireRoomRead(socket.userId, event.roomId);\nsubscribe(socket, event.roomId);",
    },
  },
  {
    label: "입력 제한",
    normal: {
      title: "메시지 크기와 빈도 검사",
      summary:
        "소켓으로 들어온 완성된 메시지의 크기와 사용자별 요청 한도를 확인합니다. 검사를 통과한 메시지를 JSON으로 해석합니다.",
      actions: [
        event("sender", "server", "send 메시지"),
        work("server", "크기·빈도 제한 통과", "success"),
        work("server", "JSON 스키마 검사"),
      ],
      example:
        "transport.maxDecodedMessageBytes = appLimit;\nrequireEventQuota(socket.userId);\nevent = parseStrictJson(raw);",
    },
    defense: {
      title: "메시지 폭주를 저장 전에 차단",
      summary:
        "정상 로그인 소켓도 send를 반복할 수 있습니다. 서버는 계정별 한도를 넘긴 요청을 처리하지 않습니다. 크기가 과도한 메시지는 전송 계층에서 먼저 제한합니다.",
      actions: [
        event("sender", "server", "send 반복"),
        work("server", "계정별 빈도 한도 초과", "warning"),
        response("server", "sender", "rate_limited"),
      ],
      example:
        "if (!quota.tryConsume(socket.userId))\n    return rejectEvent('rate_limited');\n\n// 메시지 크기 제한은 조각 합산과 압축 해제 이후까지 적용합니다.",
    },
  },
  {
    label: "전송 인가",
    normal: {
      title: "현재 쓰기 권한과 발신자 확인",
      summary:
        "서버는 세션에 연결된 사용자 ID로 방 쓰기 권한을 확인합니다. 저장에는 같은 사용자 ID를 사용합니다.",
      actions: [
        event("sender", "server", "검증된 send"),
        request("server", "db", "쓰기 권한 확인"),
        work("server", "세션의 발신자 ID 사용", "success"),
      ],
      example:
        '{ "type": "send", "roomId": "room-42",\n  "clientMessageId": "c-7", "text": "안녕하세요" }',
    },
    defense: {
      title: "클라이언트가 붙인 발신자 ID 거절",
      summary:
        "사용자가 다른 사람의 senderId를 전송하더라도 이벤트 스키마가 해당 필드를 허용하지 않습니다. 발신자는 서버가 검증한 세션에서만 가져옵니다.",
      actions: [
        event("sender", "server", "senderId가 붙은 send"),
        work("server", "허용되지 않은 필드", "warning"),
        response("server", "sender", "invalid_event"),
      ],
      example:
        "event = parseStrictSend(raw); // 알 수 없는 필드는 오류\nsenderId = socket.principal.userId;",
    },
  },
  {
    label: "저장·ACK",
    normal: {
      title: "DB 커밋 후 저장 ACK 반환",
      summary:
        "서버가 새 메시지와 배포 이벤트를 같은 트랜잭션에 기록합니다. 커밋이 끝난 뒤 송신자에게 서버 메시지 ID를 보냅니다.",
      actions: [
        request("server", "db", "메시지 + 아웃박스 저장"),
        work("db", "트랜잭션 커밋", "success"),
        response("server", "sender", "ack · m-104"),
      ],
      example:
        '{ "type": "ack", "clientMessageId": "c-7", "messageId": "m-104" }',
    },
    defense: {
      title: "같은 메시지 재전송에서 중복 저장 방지",
      summary:
        "저장은 끝났지만 ACK를 잃은 송신자가 같은 키와 본문을 보냅니다. DB 유일 제약으로 기존 메시지 ID를 찾아 ACK만 다시 보냅니다.",
      actions: [
        event("sender", "server", "send 재시도 · c-7"),
        request("server", "db", "기존 메시지 ID 조회"),
        work("db", "유일 제약 · 새 행 없음", "success"),
        response("server", "sender", "기존 ack · m-104"),
      ],
      example:
        "UNIQUE (room_id, sender_id, client_message_id)\n\n// 같은 키·같은 본문 → 기존 ID\n// 같은 키·다른 본문 → 충돌",
    },
  },
  {
    label: "배포",
    normal: {
      title: "읽기 권한이 있는 상대에게 배포",
      summary:
        "아웃박스에 기록된 새 메시지를 가져와 현재 읽기 권한이 있는 방 구독자에게 열린 소켓으로 전송합니다.",
      actions: [
        event("db", "server", "커밋된 배포 이벤트"),
        work("server", "현재 읽기 권한 확인", "success"),
        event("server", "receiver", "message.created · m-104"),
      ],
      example:
        '{ "type": "message.created", "messageId": "m-104",\n  "roomId": "room-42", "seq": 104, "text": "안녕하세요" }',
    },
    defense: {
      title: "강퇴된 구독자에게 배포 중단",
      summary:
        "이전 구독 정보가 남아 있어도 현재 방 읽기 권한이 없으면 수신 대상에서 제외합니다. 강퇴 시 기존 방 구독도 해제합니다.",
      actions: [
        event("db", "server", "커밋된 배포 이벤트"),
        work("server", "읽기 권한 회수 확인", "warning"),
        work("server", "구독 해제 · 전송 생략"),
      ],
      example:
        "if (!canReadNow(receiver.userId, message.roomId)) {\n    unsubscribe(receiver, message.roomId);\n    return;\n}",
    },
  },
  {
    label: "화면 표시",
    normal: {
      title: "상대 브라우저에서 메시지 표시",
      summary:
        "수신자는 서버 메시지 ID로 중복 여부를 확인합니다. 새 메시지 본문을 텍스트로 표시하고 적용한 순번을 기록합니다.",
      actions: [
        event("server", "receiver", "message.created"),
        work("receiver", "messageId 중복 제거"),
        work("receiver", "본문을 텍스트로 표시", "success"),
      ],
      example:
        "if (!seen.has(message.messageId)) {\n    bubble.textContent = message.text;\n    seen.add(message.messageId);\n}",
    },
    defense: {
      title: "저장된 HTML이 실행되지 않게 표시",
      summary:
        "본문에 HTML처럼 보이는 문자열이 있어도 수신 화면은 일반 텍스트로 표시합니다. 브라우저는 본문을 HTML 요소나 이벤트 핸들러로 해석하지 않습니다.",
      actions: [
        event("server", "receiver", "HTML 형태의 본문"),
        work("receiver", "textContent로 출력", "success"),
        work("receiver", "태그·이벤트 실행 없음"),
      ],
      example:
        "bubble.textContent = message.text;\n// React에서는 <p>{message.text}</p>처럼 일반 텍스트로 렌더링합니다.",
    },
  },
  {
    label: "재접속",
    normal: {
      title: "재접속 후 놓친 기록 복구",
      summary:
        "수신자가 다시 연결해 마지막 순번을 보냅니다. 서버는 권한을 다시 확인하고 이후 기록을 페이지로 반환합니다.",
      actions: [
        request("receiver", "server", "resume · afterSeq 103"),
        work("server", "세션·방 읽기 권한 확인"),
        request("server", "db", "104번 이후 페이지 조회"),
        response("server", "receiver", "기록 페이지"),
      ],
      example: '{ "type": "resume", "roomId": "room-42", "afterSeq": 103 }',
    },
    defense: {
      title: "권한을 잃은 계정의 기록 복구 차단",
      summary:
        "이미 입장했던 계정이 예전 순번을 보내도 현재 방 읽기 권한이 필요합니다. 인가에 실패하면 메시지 기록을 조회하지 않습니다.",
      actions: [
        request("receiver", "server", "resume · 과거 순번"),
        work("server", "현재 읽기 권한 없음", "warning"),
        response("server", "receiver", "room_forbidden"),
      ],
      example:
        "requireActiveSession(socket.sessionId);\nrequireRoomRead(socket.userId, roomId);\nreturn readAfter(roomId, afterSeq, pageLimit);",
    },
  },
];

const actors: (WorkflowActor & { id: ActorId })[] = [
  {
    id: "foreign",
    label: "외부 페이지",
    detail: "피해자 브라우저",
    x: 50,
    y: 16,
    accent: "rose",
  },
  {
    id: "sender",
    label: "송신자",
    detail: "브라우저",
    x: 16,
    y: 49,
    accent: "blue",
  },
  {
    id: "server",
    label: "채팅 서버",
    detail: "세션 · 권한",
    x: 50,
    y: 49,
    accent: "violet",
  },
  {
    id: "receiver",
    label: "수신자",
    detail: "브라우저",
    x: 84,
    y: 49,
    accent: "emerald",
  },
  {
    id: "db",
    label: "DB",
    detail: "방 · 메시지",
    x: 50,
    y: 82,
    accent: "amber",
  },
];

export function chatWorkflow(mode: ChatMode): WorkflowVisualizationSpec {
  return {
    title: "실시간 채팅 메시지의 이동 경로",
    subjectRisk: "sensitive",
    overviewMs: 3300,
    autoplayMs: 6200,
    overviewSummary:
      mode === "normal"
        ? "송신자와 수신자는 각자의 연결을 채팅 서버에 유지합니다. 서버는 방 권한과 저장 상태를 확인하고 필요한 메시지만 전달합니다."
        : "각 단계는 독립된 방어 예제입니다. 어느 참여자가 요청을 거절하거나, 기존 결과를 반환하거나, 본문을 텍스트로 처리하는지 확인합니다.",
    waterfallLabel: "단계별 처리 순서",
    actors,
    topologyLinks: actors
      .filter((actor) => actor.id !== "server")
      .map((actor) => ({ from: actor.id, to: "server" })),
    steps: chatPhases.map(({ [mode]: scenario }) => {
      const active = new Set<ActorId>();
      const transitions: NonNullable<
        WorkflowVisualizationSpec["steps"][number]["transitions"]
      > = [];
      const spans: WorkflowWaterfallSpan[] = scenario.actions.map(
        (action, i, actions) => {
          const time = {
            start: i / actions.length,
            end: (i + 0.85) / actions.length,
          };
          if ("owner" in action) {
            active.add(action.owner);
            const tone =
              action.status === "warning"
                ? "warning"
                : action.status === "success"
                  ? "success"
                  : "primary";
            return {
              ...time,
              actorId: action.owner,
              label: action.label,
              kind: "work",
              status: action.status,
              tone,
            };
          }
          active.add(action.from);
          active.add(action.to);
          transitions.push(action);
          return {
            ...time,
            actorId: action.from,
            label: action.label,
            kind: "network",
            tone: "secondary",
          };
        },
      );

      return {
        title: scenario.title,
        summary: scenario.summary,
        activeActorIds: [...active],
        transitions,
        spans,
      };
    }),
  };
}
