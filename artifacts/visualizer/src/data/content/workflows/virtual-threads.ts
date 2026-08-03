import { ContentItem } from "../content-types";

export const virtualThreadsContent: ContentItem = {
  slug: "virtual-threads",
  category: "workflow",
  title: "Java Virtual Threads",
  subtitle: "OS 스레드 매핑의 한계를 뛰어넘는 Java 21 경량 가상 스레드 원리 & 장단점",
  tags: [
    "Java",
    "VirtualThreads",
    "Concurrency",
    "JVM"
  ],
  description: `Java 21 LTS에서 공식 도입된 가상 스레드(Virtual Threads)는 백엔드 서버의 성능과 처리량을 대폭 높여주는 경량 스레드 기술입니다. 기존 동기 방식의 읽기 쉽고 직관적인 코드를 그대로 유지하면서도, 수십만 개의 요청을 막힘없이 비동기 수준으로 빠르게 처리할 수 있습니다.

### 가상 스레드 이전의 처리 방식 (플랫폼 스레드)
Java 21 이전에는 하나의 요청을 처리하기 위해 OS(운영체제)의 진짜 스레드인 플랫폼 스레드를 1개씩 1:1로 할당했습니다.

- 메모리 낭비: 스레드 1개를 만들 때마다 약 1MB의 메모리를 사용하므로, 스레드를 수천 개 이상 만들면 메모리가 부족해 서버가 다운됩니다.
- 스레드 멈춤(Blocking) 현상: 데이터베이스(DB)를 조회하거나 외부 API를 호출할 때, 응답이 올 때까지 expensive한 OS 스레드가 아무 일도 하지 않고 멍하니 대기(WAITING)하여 CPU 자원이 심각하게 낭비됩니다.

### Java 21 가상 스레드의 해결 방법
가상 스레드는 실제 OS 스레드(캐리어 스레드) 위에서 수십만 개의 가상 스레드가 필요할 때마다 탔다 내렸다(Mount & Unmount)를 반복하는 구조입니다.

- 쉬어가는 지점 저장(Unmount): 가상 스레드가 DB 조회나 파일 읽기 등 대기 시간(I/O)을 만나면, 진행 중이던 상태를 메모리(Continuation Heap)에 살짝 저장해두고 스레드에서 내립니다.
- 스레드 재사용: 내린 자리에 대기 중이던 다른 가상 스레드가 즉시 탑승하여 연산을 이어가므로 CPU가 쉬지 않고 일합니다.
- 다시 돌아와 재개(Remount): DB 응답이 도착하면 킵해두었던 작업 내용(Continuation)을 가지고 놀고 있는 OS 스레드에 다시 탑승하여 중단된 위치부터 작업을 마무리합니다.

### 가상 스레드를 사용할 때의 핵심 장점
- 압도적인 처리량(Throughput) 향상: OS 스레드 개수 한계에 얽매이지 않고 서버 1대당 수십만 개의 동시 요청을 안정적으로 처리할 수 있습니다.
- 직관적인 코드 가독성: Mono/Flux 같은 반응형 스트림이나 복잡한 콜백 연산자를 배우지 않고, 기존의 직관적인 try-catch 및 순차 실행(동기식) 코드를 100% 그대로 작성합니다.
- 기존 생태계 완벽 호환: Spring MVC, JPA, JDBC 등 기존 동기 라이브러리 및 백엔드 기술 프레임워크를 수정 없이 그대로 사용할 수 있습니다.
- 손쉬운 디버깅: 에러 발생 시 기존 Thread Callstack(스택트레이스)이 그대로 유지되어 디버깅과 모니터링이 매우 용이합니다.

### 가상 스레드의 단점 및 주의사항
- 스레드 핀닝(Pinning) 현상: synchronized 블록이나 Native 메서드 내부에서 블로킹 I/O가 발생하면 가상 스레드가 OS 스레드에서 내리지 못하고 고정(Pinning)되는 현상이 생깁니다. (ReentrantLock으로 교체 권장)
- CPU-bound 작업에서의 이점 없음: 가상 스레드는 I/O 대기 시간을 효율화하는 기술이므로, 복잡한 암호화, 동영상 인코딩, 대용량 계산 등 CPU 연산이 주를 이루는 작업에서는 아무런 성능 향상이 없으며 오히려 오버헤드가 생깁니다.
- 스레드 풀링 금지: 가상 스레드는 필요할 때 생성하고 버리는 일회성 경량 객체이므로 Executors.newFixedThreadPool()처럼 풀에 넣어서 재사용(Pooling)하면 안 됩니다.
- ThreadLocal 메모리 낭비: 수십만 개의 가상 스레드 각각에 무거운 ThreadLocal 변수를 생성하면 메모리 소모가 급증할 수 있습니다. (Scoped Values 활용 권장)

### 어떤 상황에 가상 스레드를 사용해야 하는가?
- 사용해야 하는 최적의 상황:
  - 데이터베이스 조회, 외부 REST API 호출, 네트워크 Socket 통신 등 Blocking I/O 비중이 높은 대규모 웹 서버 서비스.
  - 기존 Spring MVC + JPA 기반 백엔드 코드를 복잡한 WebFlux(반응형)로 대대적 리팩토링하기에는 공수가 너무 크고 위험할 때 minimal한 수정으로 동시성을 극대화하고 싶을 때.
  - 수만 명의 대량 동시 접속자(C1000K) 요청을 라우팅해야 하는 API Gateway 및 웹 프록시 서버.
- 사용을 피해야 하는 상황:
  - 이미지/동영상 변환, AI 추론 연산, 파일 압축 등 CPU 연산 중심(CPU-bound) 작업이 대부분인 시스템.
  - synchronized 구문이 깊게 얽혀 있는 구버전 레거시 라이브러리를 대량으로 사용하는 환경.`,
  steps: [
    "[1단계: 요청 도착 및 스레드 할당] 웹 서버로 사용자 요청이 들어오면 작업을 처리할 스레드가 1개씩 할당됩니다.",
    "[2단계: DB 및 외부 API 작업 호출] 데이터베이스 조회나 외부 네트워크 요청 등 시간이 걸리는 일(I/O 작업)을 시작합니다.",
    "[3단계: 스레드 대기 상태 차이] 기존 스레드는 응답이 올 때까지 멍하니 대기하지만, 가상 스레드는 작업을 힙 메모리에 킵해두고 다른 일을 하러 떠납니다.",
    "[4단계: 응답 완료 및 작업 재개] DB 응답이 돌아오면 가상 스레드가 다시 돌아와 멈췄던 지점부터 깔끔하게 마무리지어 응답을 돌려줍니다."
  ],
  examples: [
    "대규모 동시 요청(C1000K)을 처리하는 고성능 REST API 서버",
    "외부 서드파티 HTTP API 및 DB Blocking I/O를 대량 호출하는 마이크로서비스",
    "기존 Blocking Spring MVC 코드를 코드 수정 최소화로 리팩토링하는 백엔드 시스템"
  ],
  related: [
    { slug: "rest-vs-grpc", category: "workflow", relation: "API 호출 시 가상 스레드 기반 동시성 적용" },
    { slug: "realtime-protocols", category: "workflow", relation: "웹소켓/SSE 연결 관리에 가상 스레드 활용" },
    { slug: "api-gateway", category: "workflow", relation: "API Gateway의 라우팅 처리 동시성 모델 비교" }
  ]
};
