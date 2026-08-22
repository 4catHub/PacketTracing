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
  description: `Java 21 LTS(Project Loom)에서 공식 도입된 가상 스레드(Virtual Threads)는 백엔드 서버의 처리량(Throughput)을 획기적으로 끌어올리는 경량 사용자 모드 스레드 기술입니다.

### 1. 플랫폼 스레드의 한계 (Thread-per-Request의 병목)
Java 21 이전에는 하나의 요청을 처리하기 위해 운영체제(OS)의 커널 스레드를 1:1로 매핑하여 사용했습니다.
- **메모리 오버헤드:** 스레드 1개당 약 1MB의 호출 스택(Stack) 메모리가 소비되어 수천 개 이상의 스레드 생성 시 OOM(Out of Memory)이 발생합니다.
- **블로킹 I/O 대기 낭비:** DB 쿼리나 외부 REST API 호출 시 응답이 도착할 때까지 OS 스레드가 유휴 상태(WAITING)로 CPU 코어를 낭비합니다.

### 2. 가상 스레드의 핵심 동작 메커니즘 (Mount & Unmount)
적은 수의 OS 캐리어 스레드(Carrier Thread) 위에서 수십만 개의 가상 스레드가 비동기 이벤트 루프처럼 전환됩니다.
- **대기 시 언마운트 (Unmount):** 가상 스레드가 I/O 블로킹을 만나면 실행 상태를 힙 메모리(\`Continuation\`)에 저장하고 캐리어 스레드에서 즉시 내립니다.
- **캐리어 스레드 재사용:** 비워진 OS 스레드에 대기 중이던 다른 가상 스레드가 즉시 마운트되어 CPU가 유휴 시간 없이 100% 연산에 집중합니다.
- **작업 재개 (Remount):** I/O 작업이 완료되면 이벤트 알림을 받아 킵해두었던 Continuation을 가지고 가용한 캐리어 스레드에 다시 탑승하여 중단 지점부터 실행을 이어갑니다.

### 3. 가상 스레드 도입 시 주의사항 및 안티패턴
- **스레드 핀닝 (Thread Pinning):** \`synchronized\` 블록 내부에서 블로킹 I/O가 발생하면 가상 스레드가 언마운트되지 못하고 OS 스레드를 붙잡는 현상이 발생합니다 (\`ReentrantLock\`으로 대체 필요).
- **CPU-Bound 작업 비적합:** 비디오 인코딩, 대규모 연산 등 CPU 사용률이 100%인 작업에는 이점이 없으며 컨텍스트 스위칭 오버헤드만 증가합니다.
- **스레드 풀링 금지:** 가상 스레드는 비용이 거의 들지 않는 일회성 객체이므로 풀링(\`ThreadPool\`)하지 말고 요청마다 새로 생성(\`Executors.newVirtualThreadPerTaskExecutor()\`)해야 합니다.`,
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
