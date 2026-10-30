import type { ContentItem } from "../content-types";

export const mcpToolCallContent: ContentItem = {
  slug: "mcp-tool-call",
  category: "workflow",
  title: "MCP 연결과 도구 호출",
  subtitle: "서버 연결·도구 탐색부터 LLM의 선택, 실행, 결과 기반 답변까지",
  tags: ["MCP", "AI", "Tool Calling", "JSON-RPC"],
  description: `MCP(Model Context Protocol)는 AI 앱과 외부 도구·데이터 제공자 사이의 공통 통신 규약입니다. 시각화는 서울 날씨를 묻는 하나의 성공 경로를 따라갑니다. 날씨 값은 학습용 고정 데이터이며, 연결 준비 6단계와 요청 처리 9단계를 구분합니다.

### 구성 요소와 책임
| 구성 요소 | 역할 |
| --- | --- |
| Host | 사용자 대화, 모델 연동, 실행 정책과 Client 수명 관리 |
| Client | Host 내부에서 서버별 연결과 MCP 메시지 송수신 담당 |
| Server | 도구 정의 노출, 인자 검증, 도구 실행과 결과 반환 |
| LLM | 질문에 맞는 도구·인자 선택, 실행 결과를 바탕으로 답변 생성 |
| 외부 API | 이 예시에서 Server가 실제 날씨를 얻는 데이터 제공자 |

그림의 Host와 Client는 책임을 나눠 표시한 것으로, Client는 Host 내부 모듈입니다. 여러 서버를 연결하면 Host가 서버별 Client를 관리합니다. 이 페이지는 하나의 연결에 집중합니다.

### 연결 준비: 버전 합의와 도구 탐색
Host가 서버 설정을 읽은 뒤 Client가 \`initialize\`를 보내고, Server가 버전과 \`capabilities\`를 응답합니다. Client가 수용 가능한 버전인지 확인한 다음 \`notifications/initialized\`를 보냅니다. 이 알림은 요청 id와 JSON-RPC 응답이 없습니다.

Server의 \`tools\` 지원을 확인하면 \`tools/list\`로 도구의 이름·설명·\`inputSchema\`를 얻습니다. 도구 목록이 여러 페이지면 \`nextCursor\`를 따라 추가 조회합니다. 예시는 도구 하나가 한 페이지에 들어갑니다. 초기화와 목록 탐색은 질문마다 반복하는 단계가 아닙니다.

### 요청 처리: 모델의 선택과 실제 실행
Host가 질문과 도구 정의를 LLM에 전달하면 모델이 \`get_weather\`와 \`city=서울\`을 선택합니다. Host는 인자와 정책을 확인하고, 허용된 호출을 Client에 전달합니다. 사용자 확인 여부와 UI는 앱 정책에 따라 정합니다.

Client가 \`tools/call\`에 \`name\`과 \`arguments\`를 담아 보내면 Server가 입력과 권한을 검증하고 도구를 실행합니다. 여기서는 외부 날씨 API를 호출하지만, 파일 읽기나 DB 조회처럼 다른 작업도 가능합니다. Server는 같은 요청 id로 결과를 반환합니다. Host가 결과를 모델의 대화 맥락에 반영하면 LLM이 최종 답변을 만듭니다.

### 어떤 구간이 MCP인가?
| 구간 | 통신 |
| --- | --- |
| Host ↔ Client | 앱 내부 호출 |
| Client ↔ Server | MCP JSON-RPC 메시지 |
| Host ↔ LLM | 모델 API, MCP 규격 밖의 동작 |
| Server ↔ 날씨 API | 도구 구현이 사용하는 외부 API |

LLM의 도구 호출 제안과 실제 \`tools/call\` 메시지는 구분해야 합니다. 모델 API의 도구 호출 형식은 제공자별로 다르며, MCP가 그 형식을 통일하는 것은 아닙니다. 도구 결과 역시 최종 답변과 별개입니다.

### 전송 방식과 연결 재사용
이 시각화는 원격 \`Streamable HTTP\`를 예로 들며 MCP 메시지는 HTTP POST로 보냅니다. JSON 응답 또는 SSE 스트림을 사용할 수 있습니다. HTTP에서는 초기화로 합의한 버전을 이후 요청의 \`MCP-Protocol-Version\` 헤더에 넣고, 서버가 세션 id를 발급했다면 \`MCP-Session-Id\`도 전달합니다. 메시지 창에는 JSON-RPC 본문을 표시합니다.

로컬 \`stdio\`는 Client가 서버 프로세스를 실행하고 표준 입출력으로 통신합니다. 전송 방식이 달라도 초기화·탐색·호출이라는 핵심 흐름은 같습니다. 재생의 반복은 학습 편의를 위한 것이며, 실제 앱은 연결과 도구 목록을 재사용할 수 있습니다.

### 실패하면 어디서 멈출까?
- 버전 불일치: Client가 응답 버전을 지원하지 않으면 연결을 중단합니다.
- 실행 거절: Host 정책이 허용하지 않으면 도구 요청을 보내지 않습니다.
- 프로토콜 오류: 알 수 없는 도구 등은 JSON-RPC \`error\` 응답이 될 수 있습니다.
- 도구 실행 실패: API 오류 같은 실행 실패는 도구 결과의 \`isError: true\`로 전달할 수 있습니다.
- 타임아웃: 무한 대기를 피하고 취소·오류 처리를 합니다. 재시도는 작업의 중복 실행 가능성을 고려해 결정합니다.

### 공식 참고 자료
이 페이지의 메시지 예시는 MCP 2025-11-25 명세를 기준으로 작성했습니다.
- [구성 요소와 책임](https://modelcontextprotocol.io/specification/2025-11-25/architecture)
- [연결 수명주기와 초기화](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle)
- [도구 탐색·호출·오류](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [stdio와 Streamable HTTP](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports)`,
  learningObjectives: ["도구 호출의 요청·승인·응답 단계를 구분할 수 있다."],
  commonMistakes: ["MCP는 도구 응답을 그대로 사실로 보증하지 않습니다. 외부 데이터의 신뢰성과 권한 범위를 별도로 검증해야 합니다."],
  keyTakeaways: ["도구 호출 전 권한 확인, 입력 검증, 반환 데이터의 처리 경계를 확인합니다."],
  exercises: [{"question":"외부 도구가 전달한 내용을 시스템 명령과 동일하게 취급해도 될까요?","options":["아니요, 외부 입력으로 취급해야 합니다.","예, MCP 표준을 사용하면 안전합니다.","응답이 JSON이면 가능합니다."],"answerIndex":0,"explanation":"MCP를 통해 전달된 외부 콘텐츠는 신뢰할 수 없는 데이터일 수 있습니다."}],
  steps: [
    "서버 설정 — Host가 서버 주소·전송 방식·필요한 인증을 준비하고 Client를 구성합니다.",
    "초기화 — initialize 요청과 응답으로 버전·기능을 합의한 뒤 notifications/initialized를 보냅니다.",
    "도구 탐색 — tools/list로 이름·설명·입력 스키마를 받아 모델에 제공할 도구를 준비합니다.",
    "도구 선택 — Host가 질문과 도구 정의를 모델에 전달하고 LLM이 도구명과 인자를 제안합니다.",
    "실행 결정 — Host가 인자와 정책을 확인하고 허용된 호출을 Client에 넘깁니다.",
    "실제 호출 — Client가 tools/call을 보내고 Server가 도구를 실행해 외부 데이터를 가져옵니다.",
    "결과 반환 — Server가 같은 요청 id로 도구 결과를 반환하고 Client가 Host에 전달합니다.",
    "답변 생성 — Host가 도구 결과를 LLM에 반영하고 최종 답변을 사용자에게 표시합니다.",
  ],
  examples: [
    "날씨 조회 — get_weather(city=서울)로 최신 데이터를 얻어 질문에 답변",
    "개발 도구 연동 — 저장소 검색 도구로 관련 코드를 찾고 결과를 설명",
    "사내 데이터 조회 — 권한이 허용하는 DB 도구로 주문 상태를 조회",
    "문서 검색 — 검색 서버가 반환한 문서 내용을 근거로 답변 작성",
  ],
  related: [
    { slug: "rest-vs-grpc", category: "workflow", relation: "호출 규약과 전송 계층의 역할 비교" },
    { slug: "oauth-flow", category: "workflow", relation: "인증이 필요한 원격 서버의 접근 권한 이해" },
    { slug: "realtime-protocols", category: "workflow", relation: "Streamable HTTP가 활용할 수 있는 SSE 이해" },
  ],
};
