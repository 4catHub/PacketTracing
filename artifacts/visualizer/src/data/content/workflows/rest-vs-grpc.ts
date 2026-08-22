import { ContentItem } from "../content-types";

export const restVsGrpcContent: ContentItem = {
  slug: "rest-vs-grpc",
  category: "workflow",
  title: "REST vs gRPC",
  subtitle: "HTTP/1.1 + JSON vs HTTP/2 + Protobuf 통신 방식 비교",
  tags: [
    "API",
    "Architecture",
    "Microservices",
    "Protocols"
  ],
  description: `마이크로서비스 간 통신 방식은 시스템 전체의 성능, 지연 시간(Latency), 그리고 확장성에 결정적인 영향을 미칩니다. REST와 gRPC는 각각 다른 철학과 네트워크 프로토콜을 기반으로 설계된 대표적인 API 아키텍처입니다.

### 1. REST (HTTP/1.1 + JSON 텍스트 통신)
HTTP/1.1 기반에 사람이 읽기 쉬운 JSON 텍스트 포맷을 사용합니다. 브라우저에서 네이티브로 지원되며 범용성이 뛰어나지만, 직렬화/파싱 오버헤드와 네트워크 다중화 한계가 존재합니다.
- **데이터 포맷:** 사람이 직관적으로 읽을 수 있는 텍스트 기반 JSON을 사용하여 디버깅이 간편합니다.
- 순차적 N+1 조회 한계: 연관 데이터를 획득하기 위해 먼저 메인 리소스(\`GET /users/1\`)를 조회한 뒤, 하위 목록(\`GET /posts?userId=1\`)을 순차 호출하므로 네트워크 RTT 왕복 지연이 누적됩니다.
- **Head-of-Line Blocking (HOLB):** HTTP/1.1 단일 연결에서는 앞선 요청의 응답이 지연되면 뒤따르는 요청들이 모두 블로킹됩니다.

### 2. gRPC (HTTP/2 + Protocol Buffers 이진 통신)
구글이 개발한 HTTP/2 기반의 고성능 RPC(Remote Procedure Call) 프레임워크로, 컴팩트한 이진 직렬화 포맷인 Protocol Buffers(\`.proto\`)를 사용합니다.
- **고압축 바이너리 직렬화:** JSON 대비 최대 70~80% 작은 페이로드 크기를 가지며, 문자열 파싱 없이 바이트 단위로 즉각 역직렬화합니다.
- **단일 커넥션 멀티플렉싱:** HTTP/2의 단일 TCP 연결 내에서 수많은 병렬 스트림(Streams)을 동시에 전송하여 HOLB 문제를 원천 방지합니다.
- **단일 RPC 일괄 쿼리:** 서비스 스펙(\`GetUserWithPosts\`)에 단일 호출을 정의하고 백엔드 DB에서 한 번의 JOIN 조회로 일괄 반환합니다.
- **엄격한 타입 안정성:** \`.proto\` 인터페이스 정의 언어(IDL)를 기반으로 클라이언트와 서버 스텁(Stub) 코드가 자동 생성되어 런타임 타입 오류를 방지합니다.

### 3. 핵심 성능 및 기술 지표 대조
두 통신 패러다임의 주요 아키텍처 차이점입니다.
- **전송 페이로드:** REST(무거운 텍스트 JSON) vs gRPC(초경량 바이너리 바이트 스트림)
- **커넥션 모델:** REST(단방향 요청/응답, 잦은 TCP 핸드셰이크) vs gRPC(양방향 스트리밍, 영구 멀티플렉싱 커넥션)
- **스키마 계약:** REST(선택적 OpenAPI/Swagger 문서화) vs gRPC(필수적인 .proto 컴파일 타임 인터페이스 강제)
- **브라우저 지원:** REST(모든 브라우저 네이티브 지원) vs gRPC(브라우저 직접 호출 시 gRPC-Web 프록시 계층 필요)

### 4. 아키텍처 선택 가이드라인
- **REST 선택 권장:** Public API, 외부 서드파티 제휴 연동, 단순 CRUD 관리자 웹, 브라우저 직접 통신이 중심인 서비스
- **gRPC 선택 권장:** 백엔드 마이크로서비스 간(East-West) 내부 고속 통신, 고빈도 대용량 트래픽, 실시간 양방향 스트리밍, 다국어 폴리글랏(Polyglot) 서버 환경`,
  steps: [
    "[1단계: 직렬화 비교] REST는 무거운 JSON 텍스트 포맷을 파싱 및 직렬화하고, gRPC는 .proto 규격 기반의 콤팩트한 Protobuf 이진 바이너리로 고속 직렬화합니다.",
    "[2단계: 커넥션 비교] REST는 HTTP/1.1 단방향 연결에서 순차 전송하여 HOLB(Head-of-Line Blocking) 대기가 발생하며, gRPC는 HTTP/2 단일 커넥션 내 멀티플렉싱을 통해 병렬 스트림으로 동시 전송합니다.",
    "[3단계: DB 쿼리 비교] REST는 연관 데이터를 가져오기 위해 복수의 API를 순차 호출하는 N+1 쿼리 오버헤드가 자주 발생하지만, gRPC는 단일 RPC 서비스 호출로 서버에서 효율적인 단일 JOIN 조회를 처리합니다.",
    "[4단계: 응답 파싱 비교] REST는 수신한 JSON 문자열에 대한 클라이언트 측 파싱 연산 부담이 큰 반면, gRPC는 가벼운 바이너리 바이트 스트림 그대로 수신하여 즉시 메모리 객체로 초고속 역직렬화합니다."
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
