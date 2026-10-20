import WorkflowFocusedViz from "./WorkflowFocusedViz";
import McpTopologyScene from "./McpTopologyScene";
import type { WorkflowVisualizationSpec, WorkflowWaterfallSpan } from "./workflow-visualization";

const message = (label: string, payload: unknown) => ({
  label,
  code: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2),
});

const span = (
  actorId: string,
  label: string,
  start: number,
  end: number,
  kind: WorkflowWaterfallSpan["kind"] = "work",
): WorkflowWaterfallSpan => ({ actorId, label, start, end, kind });

const tool = {
  name: "get_weather",
  description: "도시의 현재 날씨를 조회합니다.",
  inputSchema: {
    type: "object",
    properties: { city: { type: "string" } },
    required: ["city"],
    additionalProperties: false,
  },
};

export const mcpToolCallSpec: WorkflowVisualizationSpec = {
  title: "MCP 연결에서 도구 호출까지",
  motionTone: "friendly",
  autoplayMs: 4400,
  overviewMs: 3000,
  overviewSummary: "서울 날씨를 묻는 예시입니다. Client는 Host 내부 모듈이며, MCP 메시지는 Client ↔ Server 사이를 오갑니다. LLM과 날씨 API 호출은 별도 경로입니다.",
  waterfallLabel: "현재 단계의 실행 순서 · 예시 비중",
  actors: [
    { id: "user", label: "사용자", detail: "질문 · 답변", accent: "blue", x: 12, y: 50, compactX: 20, compactY: 12 },
    { id: "host", label: "Host", detail: "AI 앱 · 실행 정책", accent: "violet", x: 35, y: 50, compactX: 20, compactY: 46 },
    { id: "model", label: "LLM", detail: "선택 · 답변 생성", accent: "violet", x: 35, y: 16, compactX: 20, compactY: 84 },
    { id: "client", label: "Client", detail: "Host 내부 · MCP", accent: "cyan", x: 60, y: 50, compactX: 80, compactY: 12 },
    { id: "server", label: "Server", detail: "MCP 도구 제공", accent: "emerald", x: 85, y: 50, compactX: 80, compactY: 46 },
    { id: "api", label: "날씨 API", detail: "외부 데이터", accent: "amber", x: 85, y: 85, compactX: 80, compactY: 84 },
  ],
  topologyLinks: [
    { from: "user", to: "host" },
    { from: "host", to: "model" },
    { from: "host", to: "client" },
    { from: "client", to: "server" },
    { from: "server", to: "api" },
  ],
  steps: [
    {
      title: "연결 준비 ① · Host가 Client를 구성",
      summary: "Host에 서버 주소와 전송 방식을 등록합니다. 이 예시는 원격 Streamable HTTP 연결이며, 인증이 필요한 서버는 해당 인증도 준비합니다.",
      activeActorIds: ["host", "client"],
      transitions: [{ from: "host", to: "client", label: "서버 연결 설정", kind: "state" }],
      spans: [span("host", "서버 설정 읽기", 0, 0.3), span("client", "전송 계층 준비", 0.3, 1)],
      message: message("Host 내부 설정 예시 · MCP 메시지 아님", {
        server: "weather",
        transport: "Streamable HTTP",
        url: "https://weather.example.com/mcp",
      }),
    },
    {
      title: "연결 준비 ② · initialize 요청",
      summary: "Client가 지원하는 프로토콜 버전과 기능을 알립니다. 아직 도구를 호출하지 않습니다.",
      activeActorIds: ["client", "server"],
      transitions: [{ from: "client", to: "server", label: "initialize", kind: "request", payload: "#1" }],
      spans: [span("client", "초기화 요청 전송", 0, 0.35, "network"), span("server", "호환 버전 확인", 0.35, 1)],
      message: message("Client → Server · JSON-RPC 요청 #1", {
        jsonrpc: "2.0", id: 1, method: "initialize",
        params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "LearningHost", version: "1.0.0" } },
      }),
    },
    {
      title: "연결 준비 ③ · 버전과 capabilities 합의",
      summary: "Server가 응답 #1로 버전과 tools 지원을 알립니다. Client는 응답 버전을 지원하는지 확인하고, 지원하지 않으면 연결을 중단합니다.",
      activeActorIds: ["server", "client"],
      transitions: [{ from: "server", to: "client", label: "버전 · tools 지원", kind: "response", payload: "#1" }],
      spans: [span("server", "서버 기능 응답", 0, 0.45, "network"), span("client", "버전 수용 · 기능 저장", 0.45, 1)],
      message: message("Server → Client · JSON-RPC 응답 #1", {
        jsonrpc: "2.0", id: 1,
        result: { protocolVersion: "2025-11-25", capabilities: { tools: {} }, serverInfo: { name: "WeatherServer", version: "1.0.0" } },
      }),
    },
    {
      title: "연결 준비 ④ · 초기화 완료 알림",
      summary: "Client가 notifications/initialized를 보내 정상 작업을 시작할 준비가 되었음을 알립니다. 알림에는 id가 없고 JSON-RPC 응답도 없습니다.",
      activeActorIds: ["client", "server"],
      transitions: [{ from: "client", to: "server", label: "초기화 완료 알림", kind: "event", payload: "N" }],
      spans: [span("client", "완료 알림 전송", 0, 0.4, "network"), span("server", "작업 단계 진입", 0.4, 1)],
      message: message("Client → Server · 알림, id 없음", { jsonrpc: "2.0", method: "notifications/initialized" }),
    },
    {
      title: "연결 준비 ⑤ · tools/list로 도구 탐색",
      summary: "tools 지원을 확인한 Client가 도구 목록을 요청합니다. 도구 탐색은 실행과 별개이며, 연결을 유지하면 매 질문마다 초기화할 필요가 없습니다.",
      activeActorIds: ["client", "server"],
      transitions: [{ from: "client", to: "server", label: "tools/list", kind: "request", payload: "#2" }],
      spans: [span("client", "도구 목록 요청", 0, 0.35, "network"), span("server", "노출할 도구 조회", 0.35, 1)],
      message: message("Client → Server · JSON-RPC 요청 #2", { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
    },
    {
      title: "연결 준비 ⑥ · 이름·설명·입력 스키마 확보",
      summary: "Server가 get_weather의 정의를 반환합니다. Host는 Client를 통해 받은 도구 정의를 모델이 사용할 수 있는 형식으로 준비합니다.",
      activeActorIds: ["server", "client"],
      transitions: [{ from: "server", to: "client", label: "도구 정의 반환", kind: "response", payload: "#2" }],
      spans: [span("server", "이름 · 설명 · 스키마", 0, 0.4, "network"), span("client", "Host에 도구 목록 제공", 0.4, 1)],
      message: message("Server → Client · JSON-RPC 응답 #2", { jsonrpc: "2.0", id: 2, result: { tools: [tool] } }),
    },
    {
      title: "요청 처리 ① · 질문과 도구 정의를 모델에 전달",
      summary: "사용자가 서울 날씨를 묻습니다. Host가 질문과 도구 정의를 LLM에 전달하며, 이 모델 API 호출은 MCP 규격 밖의 동작입니다.",
      activeActorIds: ["user", "host", "model"],
      transitions: [
        { from: "user", to: "host", label: "서울 날씨 알려줘", kind: "request" },
        { from: "host", to: "model", label: "질문 + 도구 정의", kind: "request", labelOffsetY: 0 },
      ],
      spans: [span("user", "질문 입력", 0, 0.15), span("host", "모델 요청 구성", 0.15, 0.4), span("model", "필요한 도구 판단", 0.4, 1)],
      message: message("Host → LLM · 모델 요청의 개념 예시, MCP 메시지 아님", {
        question: "서울 날씨 알려줘",
        availableTools: ["get_weather(city: string)"],
      }),
    },
    {
      title: "요청 처리 ② · LLM이 도구와 인자를 선택",
      summary: "LLM이 get_weather와 city=서울을 제안합니다. 이 시점에는 날씨를 조회하지 않았으며, 실제 실행은 Host와 Client가 이어서 담당합니다.",
      activeActorIds: ["model", "host"],
      transitions: [{ from: "model", to: "host", label: "도구 호출 제안", kind: "response", labelOffsetY: 0 }],
      spans: [span("model", "도구명 · 인자 생성", 0, 0.7), span("host", "호출 제안 수신", 0.7, 1)],
      message: message("LLM → Host · 모델 응답의 개념 예시, MCP 메시지 아님", { tool: "get_weather", arguments: { city: "서울" } }),
    },
    {
      title: "요청 처리 ③ · Host가 실행 허용 여부 판단",
      summary: "Host가 도구명·인자·실행 정책을 확인합니다. 이 예시는 읽기 도구 실행을 허용한 경로이며, 앱 정책에 따라 사용자 확인을 받을 수도 있습니다.",
      activeActorIds: ["host", "client"],
      transitions: [{ from: "host", to: "client", label: "허용된 호출 전달", kind: "state" }],
      spans: [span("host", "인자 · 실행 정책 확인", 0, 0.65), span("client", "MCP 요청 구성", 0.65, 1)],
      message: message("Host 내부 결정 예시 · 거절되면 tools/call을 보내지 않음", {
        tool: "get_weather", arguments: { city: "서울" }, decision: "allow",
      }),
    },
    {
      title: "요청 처리 ④ · Client가 tools/call 전송",
      summary: "Client가 도구명과 arguments를 JSON-RPC 요청 #3으로 보냅니다. Server는 입력과 접근 권한을 검증한 뒤 해당 도구로 라우팅합니다.",
      activeActorIds: ["client", "server"],
      transitions: [{ from: "client", to: "server", label: "tools/call", kind: "request", payload: "#3" }],
      spans: [span("client", "요청 #3 전송", 0, 0.35, "network"), span("server", "검증 · 도구 라우팅", 0.35, 1)],
      message: message("Client → Server · JSON-RPC 요청 #3", {
        jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_weather", arguments: { city: "서울" } },
      }),
    },
    {
      title: "요청 처리 ⑤ · Server가 외부 API 호출",
      summary: "get_weather 구현이 날씨 API를 호출합니다. MCP Server 뒤의 실제 작업이며, 외부 API의 요청 형식과 인증은 MCP와 별도로 정해집니다.",
      activeActorIds: ["server", "api"],
      transitions: [{ from: "server", to: "api", label: "날씨 조회 · HTTP", kind: "request", labelOffsetY: 0 }],
      spans: [span("server", "날씨 API 요청", 0, 0.25, "network"), span("api", "현재 날씨 조회", 0.25, 1)],
      message: message("Server → 날씨 API · 외부 HTTP 요청 예시, MCP 메시지 아님", "GET /current?city=Seoul\nHost: weather-api.example.com\n\n도구 구현이 외부 API를 호출합니다."),
    },
    {
      title: "요청 처리 ⑥ · 외부 데이터 수신",
      summary: "날씨 API가 예시 데이터인 18°C·맑음을 반환합니다. Server는 이를 MCP 도구 결과로 변환하며, Client는 요청 #3의 결과를 기다리고 있습니다.",
      activeActorIds: ["api", "server"],
      transitions: [{ from: "api", to: "server", label: "18°C · 맑음", kind: "response", labelOffsetY: 0 }],
      spans: [span("api", "날씨 데이터 반환", 0, 0.35, "network"), span("server", "도구 결과 구성", 0.35, 0.9), span("client", "요청 #3 결과 대기", 0, 1, "wait")],
      message: message("날씨 API → Server · 학습용 고정 데이터, 실시간 조회 아님", { city: "서울", temperature: 18, conditions: "맑음" }),
    },
    {
      title: "요청 처리 ⑦ · MCP 도구 결과 반환",
      summary: "Server가 동일한 id=3으로 content를 반환합니다. isError=false는 도구 실행 성공을 뜻하며, 아직 사용자에게 보여줄 최종 답변은 아닙니다.",
      activeActorIds: ["server", "client"],
      transitions: [{ from: "server", to: "client", label: "도구 결과 · #3", kind: "response", payload: "#3" }],
      spans: [span("server", "content 반환", 0, 0.5, "network"), span("client", "id=3 요청과 연결", 0.5, 1)],
      message: message("Server → Client · JSON-RPC 응답 #3", {
        jsonrpc: "2.0", id: 3, result: { content: [{ type: "text", text: "서울: 18°C, 맑음" }], isError: false },
      }),
    },
    {
      title: "요청 처리 ⑧ · Host가 결과를 모델에 반영",
      summary: "Client가 Host에 결과를 넘기고, Host가 도구 결과를 대화 맥락에 추가해 LLM을 다시 호출합니다. 모델에 전달하는 형식은 앱과 모델 API에 따라 다릅니다.",
      activeActorIds: ["client", "host", "model"],
      transitions: [
        { from: "client", to: "host", label: "도구 결과 전달", kind: "response" },
        { from: "host", to: "model", label: "도구 결과 + 맥락", kind: "request", labelOffsetY: 0 },
      ],
      spans: [span("client", "결과 전달", 0, 0.2), span("host", "대화 맥락에 추가", 0.2, 0.45), span("model", "결과 기반 답변 생성", 0.45, 1)],
      message: message("Host → LLM · 모델 요청의 개념 예시, MCP 메시지 아님", { tool: "get_weather", toolResult: "서울: 18°C, 맑음", instruction: "도구 결과를 바탕으로 질문에 답하세요." }),
    },
    {
      title: "요청 처리 ⑨ · 사용자에게 답변",
      summary: "LLM이 결과를 설명하고 Host가 사용자에게 표시합니다. 연결을 유지하면 다음 질문은 도구 선택부터 이어갈 수 있습니다. 학습용 재생은 잠시 후 전체 흐름을 반복합니다.",
      activeActorIds: ["model", "host", "user"],
      transitions: [
        { from: "model", to: "host", label: "답변 생성 완료", kind: "response", labelOffsetY: 0 },
        { from: "host", to: "user", label: "최종 답변 표시", kind: "response" },
      ],
      spans: [span("model", "최종 답변 반환", 0, 0.55), span("host", "응답 표시", 0.55, 1)],
      message: message("Host → 사용자 · 학습용 예시 답변", "현재 서울은 18°C이며 맑습니다.\n\n연결 준비와 도구 탐색은 완료된 상태로 유지할 수 있습니다."),
    },
  ],
};

export default function McpToolCallViz() {
  return <WorkflowFocusedViz spec={mcpToolCallSpec} TopologyCanvas={McpTopologyScene} />;
}
