import { ContentItem } from "../content-types";

export const restVsGrpcContent: ContentItem = {
  slug: "rest-vs-grpc",
  category: "workflow",
  title: "REST vs gRPC",
  subtitle: "자원 중심 HTTP API와 HTTP/2·Protobuf 기반 RPC 통신 비교",
  tags: [
    "API",
    "Architecture",
    "Microservices",
    "Protocols"
  ],
  description: `마이크로서비스 간 통신 방식은 시스템 전체의 성능, 지연 시간(Latency), 그리고 확장성에 결정적인 영향을 미칩니다. REST와 gRPC는 각각 다른 철학과 네트워크 프로토콜을 기반으로 설계된 대표적인 API 아키텍처입니다.

### 1. REST (HTTP 기반 자원 중심 API)
REST API는 HTTP/1.1뿐 아니라 HTTP/2·HTTP/3도 사용할 수 있으며 표현 형식은 JSON 외에도 다양합니다. 브라우저 호환성이 높고 도구 생태계가 넓습니다. 성능은 데이터 표현, HTTP 버전, 캐시 및 API 설계에 따라 달라집니다.
- **데이터 포맷:** JSON을 흔히 사용하지만 표현 형식은 다양하며, JSON의 사람이 읽기 쉬운 특성은 디버깅에 유리합니다.
- **API 조합:** 별도 리소스를 순차 조회하는 API 설계에서는 추가 왕복이 발생하지만, 이는 REST 자체가 강제하는 성질이 아닙니다.
- **Head-of-Line Blocking (HOLB):** HTTP/1.1 단일 연결에서는 앞선 요청의 응답이 지연되면 뒤따르는 요청들이 모두 블로킹됩니다.

### 2. gRPC (HTTP/2 + Protocol Buffers 이진 통신)
구글이 개발한 HTTP/2 기반의 고성능 RPC(Remote Procedure Call) 프레임워크로, 컴팩트한 이진 직렬화 포맷인 Protocol Buffers(\`.proto\`)를 사용합니다.
- **고압축 바이너리 직렬화:** 일반적으로 구조화된 이진 직렬화로 메시지 크기와 파싱 비용을 줄일 수 있지만, 실제 차이는 데이터 구조와 측정 환경에 따라 달라집니다.
- **단일 커넥션 멀티플렉싱:** HTTP/2의 단일 TCP 연결 내에서 수많은 병렬 스트림(Streams)을 동시에 전송하여 HTTP/1.1 수준의 응답 순서 제약을 완화하지만 TCP 수준의 패킷 손실에 따른 지연은 남을 수 있습니다.
- **단일 RPC 일괄 요청:** 서비스 스펙(\`GetUserWithPosts\`)에 여러 데이터를 묶는 단일 RPC를 정의할 수 있습니다. 다만 실제 DB 쿼리 횟수는 서버 구현에 따라 달라집니다.
- **엄격한 타입 안정성:** \`.proto\` 인터페이스 정의 언어(IDL)를 기반으로 클라이언트와 서버 스텁(Stub) 코드가 자동 생성되어 스키마 불일치 위험을 낮출 수 있지만 모든 런타임 오류를 방지하지는 못합니다.

### 3. 핵심 성능 및 기술 지표 대조
두 통신 패러다임의 주요 아키텍처 차이점입니다.
- **전송 페이로드:** REST API는 JSON 등 표현을 선택할 수 있고, gRPC는 일반적으로 Protobuf 등 이진 직렬화를 사용합니다.
- **커넥션 모델:** REST는 HTTP 버전에 따른 연결 재사용·다중화를 활용할 수 있고, gRPC는 HTTP/2 스트림과 양방향 스트리밍을 지원합니다.
- **스키마 계약:** REST(선택적 OpenAPI/Swagger 문서화) vs gRPC(필수적인 .proto 컴파일 타임 인터페이스 강제)
- **브라우저 지원:** REST(모든 브라우저 네이티브 지원) vs gRPC(브라우저 직접 호출 시 gRPC-Web 프록시 계층 필요)

### 4. 아키텍처 선택 가이드라인
- **REST 선택 권장:** Public API, 외부 서드파티 제휴 연동, 단순 CRUD 관리자 웹, 브라우저 직접 통신이 중심인 서비스
- **gRPC 선택 권장:** 백엔드 마이크로서비스 간(East-West) 내부 고속 통신, 고빈도 대용량 트래픽, 실시간 양방향 스트리밍, 다국어 폴리글랏(Polyglot) 서버 환경

### 참고 자료
- [gRPC 공식 소개](https://grpc.io/docs/what-is-grpc/introduction/)`,
  learningObjectives: ["REST의 표현 형식과 HTTP 버전, gRPC의 RPC 방식이 서로 다른 비교 축임을 구분할 수 있다."],
  commonMistakes: ["REST는 HTTP/1.1이나 JSON만을 뜻하지 않습니다. HTTP/2 또는 HTTP/3에서도 REST API를 제공할 수 있습니다."],
  keyTakeaways: ["페이로드 크기와 속도는 스키마·메시지 크기·압축·네트워크 환경에 따라 달라져 고정 배율로 단정할 수 없습니다."],
  exercises: [{"question":"REST API와 gRPC를 비교할 때 타당한 설명은?","options":["REST도 HTTP/2를 사용할 수 있다","REST는 반드시 XML만 사용한다","gRPC는 항상 DB를 한 번만 읽는다"],"answerIndex":0,"explanation":"REST는 자원 중심 API 설계 스타일이며 특정 HTTP 버전이나 데이터 표현을 강제하지 않습니다."}],
  steps: [
    "표현 방식 비교 — REST API는 JSON 등 다양한 콘텐츠 유형을 사용할 수 있고, gRPC는 일반적으로 Protobuf 스키마로 직렬화합니다.",
    "전송 계층 비교 — REST도 HTTP/2 다중화를 사용할 수 있으며, gRPC는 HTTP/2 스트림 기반 RPC를 지원합니다.",
    "API 설계 비교 — 필요한 데이터를 하나의 API/RPC로 묶을지 여러 호출로 나눌지는 프로토콜 자체보다 인터페이스 설계가 결정합니다.",
    "성능 비교 — 동일한 조건에서 페이로드 크기, 직렬화 비용, 네트워크 지연, 브라우저 호환성을 측정한 뒤 선택합니다."
  ],
  examples: [
    "마이크로서비스 간 내부 통신(Internal Communication)",
    "모바일 애플리케이션의 고속 데이터 동기화",
    "실시간 양방향 데이터 스트리밍 서비스",
    "Public API 및 서드파티 연동 시스템 구축"
  ],
  related: [
    { slug: "monolith-vs-msa", category: "workflow", relation: "MSA 내부 서비스 간 gRPC 고속 통신 활용" },
    { slug: "realtime-protocols", category: "workflow", relation: "HTTP/2 스트리밍 및 WebSocket 실시간 통신" },
    { slug: "api-gateway", category: "workflow", relation: "외부 REST 요청을 내부 gRPC로 변환/조율하는 API Gateway" }
  ]
};
