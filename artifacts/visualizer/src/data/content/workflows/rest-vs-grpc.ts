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
    description: `마이크로서비스 간 통신 방식은 시스템 전체의 성능과 확장성에 직접적인 영향을 미칩니다. REST와 gRPC는 각각 다른 철학으로 설계된 두 가지 대표적인 API 아키텍처입니다.

## REST (Representational State Transfer)
HTTP/1.1 기반에 JSON 텍스트 포맷을 사용합니다. 사람이 읽기 쉽고, 브라우저에서 네이티브로 지원되며, curl 등으로 바로 테스트할 수 있는 범용성이 강점입니다. 다만 여러 데이터를 가져오려면 N+1 요청 문제가 발생하기 쉽고, JSON 파싱 오버헤드가 있습니다.

## REST의 순차적 N+1 조회 방식
관련 데이터를 수집하기 위해 먼저 메인 객체를 조회한 후, 해당 결과 수만큼 연관 테이블에 대해 루프를 돌며 개별 쿼리를 순차적으로 실행하여 왕복 지연이 발생합니다.

- User 정보 획득: GET /users/1 (SELECT * FROM users WHERE id=1)
- Posts 목록 획득: GET /posts?userId=1 (SELECT * FROM posts WHERE user_id=1)

## gRPC (Google Remote Procedure Call)
HTTP/2 기반에 Protocol Buffers(이진 직렬화)를 사용합니다. 동일한 데이터를 전송할 때 JSON 대비 최대 70% 작은 페이로드를 가지며, 단일 연결에서 양방향 스트리밍을 지원합니다. .proto 파일로 API 스키마를 강제하므로 타입 안정성이 높습니다. 단, 브라우저에서 직접 호출하려면 gRPC-Web 프록시가 필요합니다.

## gRPC의 단일 RPC 요청 방식
필요한 스펙을 프로토바이저 스키마에 하나의 서비스 메서드로 선언하고, 서버 내에서 한 번의 조인 쿼리로 조회하여 일괄 반환합니다.

- 단일 호출: GetUserWithPosts (SELECT * FROM users u LEFT JOIN posts p ON u.id=p.user_id WHERE u.id=1)

## 성능 및 효율성 비교 지표

- 페이로드 용량: JSON 포맷 대비 Protobuf 이진 포맷이 최대 70-80% 가량 크기 감소
- 파싱 오버헤드: 문자열 파싱 오버헤드가 존재하지 않고 바이트 단위로 즉시 역직렬화 수행
- 네트워크 다중화: 단일 TCP 커넥션 상에서 다중 스트림(Multiplexing)을 타므로 HOLB(Head-of-Line Blocking) 지연 방지

## 언제 무엇을 선택할까

- REST: Public API, 외부 연동, 단순 CRUD, 브라우저 직접 호출이 필요한 경우
- gRPC: 마이크로서비스 내부 통신, 고빈도 호출, 실시간 스트리밍, 다국어 클라이언트가 필요한 경우`,
  steps: [
    "[1단계: 직렬화 비교] REST는 무거운 JSON 텍스트 포맷을 파싱 및 직렬화하고, gRPC는 .proto 규격 기반의 콤팩트한 Protobuf 이진 바이너리로 고속 직렬화합니다.",
    "[2단계: 커넥션 비교] REST는 HTTP/1.1 단방향 연결에서 순차 전송하여 HOLB(Head-of-Line Blocking) 대기가 발생하며, gRPC는 HTTP/2 단일 커넥션 내 멀티플렉싱을 통해 병렬 스트림으로 동시 전송합니다.",
    "[3단계: DB 쿼리 비교] REST는 연관 데이터를 가져오기 위해 복수의 API를 순차 호출하는 N+1 쿼리 오버헤드가 자주 발생하지만, gRPC는 단일 RPC 서비스 호출로 서버에서 효율적인 단일 JOIN 조회를 처리합니다.",
    "[4단계: 응답 파싱 비교] REST는 수신한 JSON 문자열에 대한 클라이언트 측 파싱 연산 부담이 큰 반면, gRPC는 가벼운 바이너리 바이트 스트림 그대로 수신하여 즉시 메모리 객체로 초고속 역직렬화합니다."
],
    examples: [
    "마이크로서비스 간 내부 통신(Internal Communication)",
    "모바일 애플리케이션의 데이터 동기화",
    "실시간 양방향 데이터 스트리밍 서비스",
    "Public API 및 서드파티 연동 시스템 구축"
],
};
