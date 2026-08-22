import { ContentItem } from "../content-types";

export const scheduling: ContentItem = {
  slug: "scheduling",
  category: "algorithm",
  title: "스케줄링 알고리즘 (Scheduling)",
  subtitle: "CPU 자원을 최적으로 할당하기 위해 경쟁하는 5가지 핵심 프로세스 스케줄러 비교",
  tags: ["OS", "CPU", "Scheduling"],
  description: `운영체제(OS)의 CPU 스케줄러는 준비 큐(Ready Queue)에 대기 중인 프로세스들에게 한정된 CPU 연산 자원을 어떤 순서와 방식으로 배분할지 결정합니다.

### 1. FCFS (First-Come, First-Served, 선착순)
- **방식:** 준비 큐에 먼저 도착한 프로세스가 실행을 끝마칠 때까지 CPU를 독점적으로 사용합니다 (비선점, Non-preemptive).
- **한계:** 실행 시간이 긴 프로세스가 앞서 진입하면 뒤따르는 수많은 짧은 프로세스들이 장시간 정체되는 호송대 효과(Convoy Effect)가 발생합니다.

### 2. Round Robin (RR, 라운드 로빈)
- **방식:** 모든 프로세스가 정해진 고정 할당 시간(Time Quantum) 동안만 CPU를 사용하고, 작업이 끝나지 않으면 큐의 맨 뒤로 이동합니다 (선점, Preemptive).
- **특성:** 시분할(Time-sharing) 시스템의 기본 알고리즘으로 공정성이 높지만, 타임 퀀텀이 너무 작으면 잦은 문맥 교환(Context Switch) 오버헤드가 발생합니다.

### 3. SJF (Shortest Job First, 최단 작업 우선)
- **방식:** 대기 큐의 프로세스 중 총 예상 실행 시간이 가장 짧은 작업을 먼저 처리합니다 (비선점).
- **특성:** 수학적으로 평균 대기 시간(Average Waiting Time)을 최소화하지만, 긴 작업이 무한정 밀리는 기아 현상(Starvation)이 발생할 수 있습니다.

### 4. SRTF (Shortest Remaining Time First, 최단 잔여 시간 우선)
- **방식:** SJF의 선점형 버전으로, 실행 중인 프로세스의 남은 시간보다 더 짧은 예상 실행 시간을 가진 신규 프로세스가 유입되면 실행권을 즉시 강탈(Preempt)합니다.
- **특성:** 시스템 전체의 응답 속도가 매우 빠르지만 잔여 시간 추적 오버헤드가 동반됩니다.

### 5. Priority Scheduling (우선순위 스케줄링)
- **방식:** 프로세스마다 우선순위 등급(Priority Level)을 부여하고 등급이 가장 높은 작업에 CPU를 우선 배정합니다.
- **에이징(Aging) 해결책:** 낮은 우선순위 작업의 기아 현상을 방지하기 위해 큐에서 대기한 시간에 비례하여 우선순위를 점진 승격시키는 에이징 기법을 적용합니다.`,
  steps: [
    "Step 0: 초기 상태 - 대기열(Queue)에 실행 시간이 다른 태스크 블록들이 진입합니다. (VIP 태스크 포함)",
    "Step 1: 작업 시작 - FCFS는 첫 번째 태스크를 독점하며, Round Robin은 1단위를 실행하고 뒤로 넘길 준비를 합니다.",
    "Step 2: 선점 및 스케줄 변경 - RR은 이전 태스크를 맨 뒤로 튕겨내고 다음 태스크를 올립니다. SRTF는 새로 도착한 짧은 태스크를 보고 기존 작업을 선점(Preempt)합니다.",
    "Step 3: 우선순위 반영 - Priority는 대기 중인 일반 태스크를 제쳐두고 가장 늦게 온 VIP 태스크를 즉시 CPU에 올립니다."
  ],
  examples: [
    "웹 서버의 유입 커넥션 스케줄러",
    "운영체제(OS) CPU 커널 레벨 프로세스 스케줄러",
    "네트워크 패킷 전송 대역폭 분배용 라우터 큐잉"
  ],
  related: [
    { slug: "heap-sort", category: "algorithm", relation: "우선순위 스케줄링(Priority Scheduling)의 내부 자료구조인 우선순위 큐(Priority Queue)" },
    { slug: "cache-replacement", category: "algorithm", relation: "OS 차원의 가상 메모리 및 CPU 프로세스 자원 관리 메커니즘" }
  ]
};
