export type Category = 'workflow' | 'algorithm';

export interface ComplexityInfo {
  best: string;
  avg: string;
  worst: string;
  space: string;
  stable?: boolean;
}

export interface ContentItem {
  slug: string;
  category: Category;
  title: string;
  subtitle: string;
  tags: string[];
  description: string;
  steps?: string[];
  examples: string[];
  complexity?: ComplexityInfo;
}

export const contentData: ContentItem[] = [
  // ── 워크플로우 ────────────────────────────────────────────────
  {
    slug: "framework-rendering",
    category: "workflow",
    title: "프론트엔드 프레임워크 렌더링",
    subtitle: "Vanilla JS vs React vs Vue vs Svelte 렌더링 파이프라인 비교",
    tags: ["Frontend", "Rendering", "React", "Vue", "Svelte", "DOM"],
    description: `웹 애플리케이션의 상태 변화를 화면에 반영하는 방식은 성능과 유지보수성에 결정적인 영향을 미칩니다. 브라우저 본연의 동작부터 현대 컴파일러 기법까지 각 프레임워크의 핵심 렌더링 파이프라인과 그 차이점을 상세히 비교합니다.

## Vanilla JS
- 핵심 동작: 프레임워크나 가상 DOM 없이 브라우저 본래의 DOM API를 직접 조작하는 가장 가볍고 직관적인 방식입니다.
- 주요 차이: 상태 업데이트 시 개발자가 직접 엘리먼트를 쿼리하고 변경해야 하므로 대규모 앱에서 오류 발생 확률이 높고, 불필요한 레이아웃 연산(Reflow)이 반복될 수 있습니다.

## React
- 핵심 동작: 상태가 변경되면 새로운 가상 DOM 트리를 메모리 상에 구축하고, 이를 이전 트리와 비교(Diffing)하여 달라진 부분만 실제 DOM에 일괄 반영(Commit)합니다.
- 주요 차이: 런타임에 비교 엔진(Fiber Reconciler)이 구동되어 번들 용량 및 가상 DOM 메모리 사용량은 늘어나지만, 일괄 배치 업데이트를 통해 개발 효율과 UI 안정성을 높입니다.

## Vue
- 핵심 동작: ES6 Proxy를 기반으로 데이터의 읽기/쓰기를 가로채며, 컴포넌트 렌더링 단계에서 해당 데이터에 대한 종속성(Dependency)을 지능적으로 자동 수집합니다.
- 주요 차이: 데이터가 변했을 때 전체 트리를 돌지 않고, 해당 변화에 영향받는 컴포넌트 단위로 가상 DOM 패치(Patch)를 수행하기 때문에 React보다 런타임 업데이트 범위가 더욱 국소적입니다.

## Svelte
- 핵심 동작: 런타임 가상 DOM을 완전히 배제하고, 빌드 타임에 컴포넌트 구조를 AST로 정적 분석하여 상태 변경 시 실제 DOM의 특정 노드를 갱신하는 타겟팅 JS 코드로 사전 컴파일합니다.
- 주요 차이: 가상 DOM 생성 및 비교 연산의 런타임 비용이 전혀 없으며, 코드 실행 시 메모리에 연결된 노드가 직접(Direct) 갱신되므로 런타임 오버헤드가 극도로 적습니다.`,
    steps: [
      "1단계: 브라우저 공통 로드 — HTML, CSS, JS 다운로드 및 브라우저 파싱 시작",
      "2단계: Vanilla DOM 빌드 — 브라우저가 DOM 및 CSSOM 트리 생성 후 Render Tree 결합",
      "3단계: Vanilla 레이아웃 & 페인트 — 화면 배치를 계산(Layout)하고 픽셀로 드로잉(Paint)",
      "4단계: React 렌더링 루프 — 상태 변경 시 JSX가 가상 DOM으로 변환되어 Fiber Reconciler에서 Diffing 수행",
      "5단계: React DOM 커밋 — 계산된 차이점을 실제 DOM에 일괄 반영하여 Paint 유발",
      "6단계: Vue 반응형 추적 — Proxy가 데이터 접근을 가로채 렌더링 종속성을 추적 및 수집",
      "7단계: Vue 가상 DOM 패치 — 상태 변경 시 종속된 컴포넌트의 가상 DOM만 생성 후 Patch로 반영",
      "8단계: Svelte 컴파일 분석 — 빌드 타임에 상태 변경과 DOM 업데이트 코드를 매핑하여 컴파일",
      "9단계: Svelte 직접 DOM 갱신 — 가상 DOM 없이 런타임 상태 변화 시 해당 DOM 노드를 직접 변경",
    ],
    examples: [
      "각 프레임워크의 동작 원리에 따른 렌더링 성능 최적화",
      "Virtual DOM의 유무에 따른 브라우저 자원 및 메모리 사용량 차이 비교",
      "컴파일 타임 프레임워크(Svelte)와 런타임 프레임워크(React, Vue)의 특징 이해",
    ],
  },
  {
    slug: 'google-dns',
    category: 'workflow',
    title: '주소 입력부터 페이지 렌더링까지의 전체 흐름',
    subtitle: 'Browser → DNS → TCP → HTTP → Render',
    tags: ['Networking', 'DNS', 'HTTP', 'Browser'],
    description: `URL을 입력하고 엔터를 누르는 순간부터 화면에 페이지가 그려질 때까지, 수백 밀리초 안에 12단계 이상의 정교한 협력이 일어납니다.

## DNS 조회 단계
브라우저는 먼저 자신의 캐시를 확인하고, 없으면 OS 캐시와 /etc/hosts 파일을 조회합니다. 로컬 캐시가 모두 없을 경우 ISP의 재귀 DNS Resolver가 Root Nameserver → TLD Nameserver → Authoritative Nameserver 순으로 질의하며 최종 IP 주소를 찾아냅니다. 이 과정에서 각 단계는 TTL 기간 동안 결과를 캐시하여 다음 요청을 빠르게 처리합니다.

## TCP & TLS 연결 단계
IP를 얻은 브라우저는 서버와 TCP 3-way Handshake(SYN → SYN-ACK → ACK)를 수행해 신뢰성 있는 연결을 맺습니다. HTTPS 사이트라면 그 위에 TLS 1.3 협상이 추가됩니다. TLS 1.3은 1-RTT 만에 완료되어 이전 버전보다 빠릅니다.

## HTTP 요청 & 렌더링 단계
연결이 완료되면 브라우저는 HTTP/2 GET 요청을 보냅니다. 서버(Google의 GWS)는 HTML, CSS, JS 파일을 응답하고, 브라우저는 이를 파싱해 DOM → CSSOM → Render Tree → Layout → Paint 순서로 화면을 그립니다.`,
    steps: [
      'Browser DNS 캐시 확인 — 이전 방문 기록이 있으면 즉시 IP 반환 (< 1ms)',
      'OS 캐시 & /etc/hosts 파일 확인 — 시스템 수준 DNS 캐시 조회 (~1ms)',
      '재귀 DNS Resolver 질의 — ISP 또는 8.8.8.8 같은 공개 DNS에 위임 (~10–20ms)',
      'Root Nameserver 질의 — .com TLD NS 주소를 반환 (~20–40ms)',
      'TLD Nameserver 질의 — google.com의 Authoritative NS 주소를 반환 (~30–50ms)',
      'Authoritative Nameserver 질의 — 최종 IP 주소(예: 142.250.196.36)와 TTL 반환 (~40–60ms)',
      'TCP 3-way Handshake — SYN → SYN-ACK → ACK, 신뢰성 있는 채널 수립 (1 RTT)',
      'TLS 1.3 Handshake — 암호화 세션 협상 (1 RTT)',
      'HTTP/2 GET 요청 전송 — 헤더, 쿠키 포함 (~1–5ms)',
      '서버 응답 수신 — HTML + 리소스 참조 포함 (~20–100ms)',
      'HTML 파싱 & 페이지 렌더링 — DOM → CSSOM → Render Tree → Layout → Paint (~50–500ms)',
    ],
    examples: [
      '웹 사이트 접속 및 페이지 렌더링 과정 이해',
      '네트워크 지연 시간(Latency) 최적화 포인트 파악',
      '프론트엔드 성능 최적화(Critical Rendering Path)의 기초',
      '웹 애플리케이션 보안(TLS/SSL) 계층 이해',
    ],
  },
  {
    slug: 'rest-vs-grpc',
    category: 'workflow',
    title: 'REST vs gRPC',
    subtitle: 'HTTP/1.1 + JSON vs HTTP/2 + Protobuf 통신 방식 비교',
    tags: ['API', 'Architecture', 'Microservices', 'Protocols'],
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
      '[1단계: 직렬화 비교] REST는 무거운 JSON 텍스트 포맷을 파싱 및 직렬화하고, gRPC는 .proto 규격 기반의 콤팩트한 Protobuf 이진 바이너리로 고속 직렬화합니다.',
      '[2단계: 커넥션 비교] REST는 HTTP/1.1 단방향 연결에서 순차 전송하여 HOLB(Head-of-Line Blocking) 대기가 발생하며, gRPC는 HTTP/2 단일 커넥션 내 멀티플렉싱을 통해 병렬 스트림으로 동시 전송합니다.',
      '[3단계: DB 쿼리 비교] REST는 연관 데이터를 가져오기 위해 복수의 API를 순차 호출하는 N+1 쿼리 오버헤드가 자주 발생하지만, gRPC는 단일 RPC 서비스 호출로 서버에서 효율적인 단일 JOIN 조회를 처리합니다.',
      '[4단계: 응답 파싱 비교] REST는 수신한 JSON 문자열에 대한 클라이언트 측 파싱 연산 부담이 큰 반면, gRPC는 가벼운 바이너리 바이트 스트림 그대로 수신하여 즉시 메모리 객체로 초고속 역직렬화합니다.',
    ],
    examples: [
      '마이크로서비스 간 내부 통신(Internal Communication)',
      '모바일 애플리케이션의 데이터 동기화',
      '실시간 양방향 데이터 스트리밍 서비스',
      'Public API 및 서드파티 연동 시스템 구축',
    ],
  },
  {
    slug: 'cicd',
    category: 'workflow',
    title: 'CI/CD 파이프라인',
    subtitle: 'Code Push → Build → Test → Deploy 자동화 흐름',
    tags: ['DevOps', 'CI/CD', 'Automation', 'Pipeline'],
    description: `CI/CD(Continuous Integration / Continuous Delivery)는 코드 변경을 자동으로 빌드·검증·배포하는 파이프라인입니다. 사람이 수동으로 처리하던 반복 작업을 제거하고, 버그를 조기에 발견하며, 배포 주기를 단축합니다.

## CI (Continuous Integration)
개발자가 코드를 Push하는 순간 자동으로 빌드와 테스트가 실행됩니다. 팀원 모두의 코드가 메인 브랜치에 지속적으로 통합되어 "통합 지옥(Integration Hell)"을 방지합니다.

- 코드 Push → 트리거 발생
- 의존성 설치 & 빌드
- 단위 테스트(Unit Test) & 통합 테스트(Integration Test)
- 정적 분석(Lint) & 보안 취약점 스캔(SAST)
- 테스트 커버리지 리포트

## CD (Continuous Delivery / Deployment)
CI가 통과되면 자동으로 배포 가능한 아티팩트(Docker 이미지 등)를 만들어 스테이징 환경에 배포하고, 추가 검증 후 프로덕션까지 자동 배포합니다.

- Docker 이미지 빌드 & 레지스트리 Push
- 스테이징 환경 배포 & E2E 테스트
- 승인 게이트(필요 시 수동 승인)
- 프로덕션 배포 (Blue-Green 또는 Canary 방식)
- 배포 완료 알림 & 모니터링`,
    steps: [
      '개발자가 코드를 Push → GitHub Actions / GitLab CI / Jenkins 트리거 발생',
      '의존성 설치, 소스 컴파일, 빌드 아티팩트 생성',
      '단위 테스트 & 통합 테스트 실행 — 실패 시 파이프라인 중단 및 알림',
      'Lint, 정적 분석, 보안 취약점 스캔(SAST/DAST)',
      'Docker 이미지 빌드 → 컨테이너 레지스트리(ECR, GCR 등) Push',
      '스테이징 환경 배포 → E2E 테스트 & 스모크 테스트',
      '프로덕션 배포 (Blue-Green Deployment 또는 Canary Release)',
    ],
    examples: [
      'GitHub Actions로 PR 마다 자동 테스트 실행',
      'Kubernetes 클러스터에 Zero-downtime 배포',
      '보안 취약점이 있는 코드가 프로덕션에 도달하기 전 차단',
      '배포 주기를 월 1회에서 하루 수십 회로 단축',
    ],
  },
  {
    slug: 'docker-before-after',
    category: 'workflow',
    title: 'Docker 적용 전/후 차이',
    subtitle: '배포 방식 및 유지보수(로그, 헬스체크, 볼륨) 차이 비교',
    tags: ['Docker', 'Container', 'DevOps', 'Isolation', 'Maintenance'],
    description: `Docker는 애플리케이션의 실행 환경 전체를 컨테이너로 격리하여 배포 및 유지보수의 편의성을 극대화합니다.

## 배포 과정의 혁신
전통적인 방식에서는 서버마다 필요한 OS 패키지와 라이브러리 버전을 직접 수동 설치하므로 환경 불일치와 버전 충돌 위험이 높습니다. 반면 Docker 환경은 개발 PC에서 작성한 Dockerfile을 기반으로 완성된 이미지를 빌드한 후, 운영 서버에서 단 한 줄의 명령어로 그대로 실행하므로 개발 환경과 프로덕션 환경의 완벽한 일치가 보장됩니다.

## 유지보수 단계의 이점

- 로그 분석: 각 앱마다 파일 위치가 달라 뒤지기 번거롭던 문제를 stdout/stderr 표준 출력으로 통일하여 docker logs 명령어 한 줄로 조회할 수 있습니다.    
- 헬스체크: 포트나 프로세스를 직접 감시하는 크론 스크립트 대신, Dockerfile에 HEALTHCHECK 선언을 해두면 데몬이 상태를 실시간 확인하고 비정상 컨테이너를 복구할 수 있습니다.    
- 볼륨 관리: 호스트 OS의 경로에 앱 데이터가 어지럽게 섞이는 전통 방식과 달리, 컨테이너 라이프사이클과 독립된 전용 Docker 볼륨을 구성하여 안전하게 보존하고 마운트할 수 있습니다.`,
    steps: [
      '전통적 배포 vs Docker 배포: 수동 의존성 컴파일과 서버 환경 차이 발생 vs 완성된 Docker 이미지 배포 및 즉각 실행',
      '로그 분석: 파일 서버 경로를 직접 탐색하는 파편화된 로그 vs docker logs 및 표준 출력(stdout/stderr) 단일화',
      '헬스체크: 프로세스 모니터링 데몬 수동 설치 vs Dockerfile 내 HEALTHCHECK 정의를 통한 컨테이너 상태 자동 감시',
      '볼륨 관리: 호스트 OS 파일시스템에 생성된 데이터 산재 vs 독립적으로 분리 마운트되어 관리 및 백업이 용이한 Docker 볼륨',
    ],
    examples: [
      '개발/스테이징/프로덕션 환경 일치 보장',
      '마이크로서비스별 독립적인 런타임 버전 관리',
      'docker logs를 활용한 중앙 집중형 로그 파이프라인 연동',
      'HEALTHCHECK 선언을 통한 컨테이너 자가 치유(Self-Healing) 환경 구성',
      'docker volume을 이용한 DB 데이터 백업 및 마이그레이션 격리',
    ],
  },
  {
    slug: 'k8s-before-after',
    category: 'workflow',
    title: 'Kubernetes 적용 전/후 차이',
    subtitle: '단일 서버 장애 vs 자동 복구·스케일링 클러스터 비교',
    tags: ['Kubernetes', 'k8s', 'DevOps', 'Orchestration'],
    description: `Kubernetes(k8s)는 컨테이너화된 애플리케이션의 배포·스케일링·자가복구를 자동화하는 오케스트레이션 플랫폼입니다. 단순히 Docker를 여러 서버에서 돌리는 것을 넘어, 시스템 전체를 선언적으로 관리합니다.

## Kubernetes 적용 전
단일 서버 또는 수동 관리 환경에서의 한계입니다.

- 서버 한 대가 다운되면 서비스 전체 중단 (SPOF, Single Point of Failure)
- 트래픽 급증 시 수동으로 서버를 추가하고 설정해야 하는 지연 발생
- 컨테이너가 충돌해도 자동으로 재시작되지 않아 수동 개입 필요
- 배포 시 서비스를 내리고 올리는 과정에서 다운타임 발생
- 여러 서버의 상태를 사람이 직접 모니터링해야 하는 운영 부담

## Kubernetes 적용 후
클러스터가 원하는 상태(Desired State)를 자동으로 유지합니다.

- Pod(컨테이너 그룹)가 어느 노드에서 죽어도 즉시 다른 노드에 재스케줄링
- CPU/메모리 사용률에 따라 HPA(Horizontal Pod Autoscaler)가 파드 수 자동 조절
- Rolling Update로 무중단 배포 (Canary, Blue-Green 전략 지원)
- Service 오브젝트가 로드 밸런싱을 자동 처리 — 새 파드가 뜨면 즉시 트래픽 추가
- YAML 선언 파일 하나로 전체 클러스터 상태를 코드로 관리 (GitOps)`,
    steps: [
      '(Before) 단일 서버 장애 → 서비스 전체 다운, 수동 복구까지 수분~수시간',
      '(Before) 트래픽 급증 → 수동 스케일 아웃, 느린 대응',
      'k8s Deployment 작성: 원하는 Pod 수(replicas)와 컨테이너 이미지 선언',
      '(After) Pod 장애 감지 → kubelet이 자동으로 새 Pod 재스케줄링 (수초 내)',
      '(After) HPA: CPU 70% 초과 시 Pod 자동 추가, 부하 감소 시 자동 축소',
      '(After) Rolling Update: 구 버전 Pod를 하나씩 교체 → 무중단 배포 보장',
    ],
    examples: [
      '프로덕션 파드 장애 시 수초 내 자동 복구',
      '이커머스 블랙프라이데이: 트래픽 급증 시 파드 자동 스케일 아웃',
      'Blue-Green 배포로 새 버전 즉시 롤백 가능한 무중단 릴리즈',
      'GitOps: Git에 YAML 푸시 → ArgoCD가 클러스터에 자동 적용',
    ],
  },
  {
    slug: 'oauth-flow',
    category: 'workflow',
    title: 'OAuth 2.0 인증 흐름',
    subtitle: 'Authorization Code Grant Flow (인증 코드 승인 방식)',
    tags: ['Security', 'OAuth2', 'Authentication', 'Web'],
    description: `OAuth 2.0은 서드파티 애플리케이션이 사용자를 대신하여 서비스의 자원에 안전하게 접근할 수 있도록 권한을 위임하는 표준 프로토콜입니다. 그 중 가장 널리 쓰이는 인증 코드 승인 방식(Authorization Code Grant)은 높은 수준의 보안을 보장합니다.

## 주요 구성원 (Roles)
- Resource Owner (사용자): 로그인 및 리소스 접근 권한을 부여하는 주체입니다.
- Client (서드파티 서비스): 사용자를 대신해 Resource Server에 접근하려는 웹/앱 서비스입니다.
- Authorization Server (인증 서버): 사용자를 인증하고 Access Token을 발급하는 서버입니다.
- Resource Server (API 서버): 사용자의 개인 데이터를 소유하고 있으며 보호되는 자원을 제공합니다.

## 왜 Authorization Code가 필요한가
Access Token을 브라우저에 직접 노출하지 않고 백엔드(Client Server) 간 보안 채널을 통해 전달하기 위함입니다. 프론트엔드가 탈취되더라도 Authorization Code만으로는 Access Token을 받아갈 수 없으므로(클라이언트 시크릿 검증 필요), 높은 수준의 보안을 유지할 수 있습니다.`,
    steps: [
      '사용자가 서비스(Client)의 "로그인" 버튼 클릭 → Authorization Server로 리다이렉트',
      '사용자가 로그인 및 권한 부여 동의',
      '인증 서버가 사용자를 Client의 Redirect URI로 돌려보내며 Authorization Code(인증 코드) 전달',
      'Client 백엔드가 Authorization Server에 Authorization Code + Client Secret을 전송하며 Access Token 요청',
      '인증 서버가 클라이언트 정보 검증 후 Access Token 및 Refresh Token 발급',
      'Client가 발급받은 Access Token을 HTTP Authorization 헤더에 담아 Resource Server로 자원 요청',
      'Resource Server가 토큰 유효성 검증 후 보호된 사용자 리소스 반환',
    ],
    examples: [
      '구글, 카카오, 네이버 소셜 로그인 연동',
      '서드파티 플러그인에 내 서비스 API 권한 부여',
      '싱글 사인온(SSO) 아키텍처 구축',
      '백엔드 채널 기반의 안전한 API 연동 방식',
    ],
  },
  {
    slug: 'jwt-vs-session',
    category: 'workflow',
    title: 'JWT vs 세션 인증 비교',
    subtitle: 'Stateless 토큰 검증 vs Stateful 세션 저장소 통신 방식 비교',
    tags: ['Security', 'Authentication', 'JWT', 'Session'],
    description: `웹 애플리케이션의 인증 처리 방식은 서버의 아키텍처와 확장성에 직접적인 영향을 미칩니다. 세션 기반 인증과 JWT 기반 토큰 인증은 사용자 로그인 상태를 유지하고 검증하는 방식에서 근본적인 철학적 차이를 보입니다.

## 세션 기반 인증 (Stateful)
서버가 사용자의 로그인 상태(세션)를 메모리나 데이터베이스(Redis 등)에 저장하고 이를 추적합니다. 클라이언트는 쿠키를 통해 '세션 ID'만 전송하며, 실제 사용자 데이터는 안전하게 서버 측에 보관됩니다. 세션 만료나 강제 로그아웃 처리가 용이하지만, 다중 서버 환경에서 세션 동기화 오버헤드가 발생하며 서버의 메모리 부담이 늘어납니다.

## JWT 토큰 인증 (Stateless)
서버에 상태를 저장하지 않고, 필요한 모든 정보를 토큰(Payload) 자체에 담아 클라이언트에 전달합니다. 서버는 토큰의 서명(Signature)만 비밀 키로 검증하므로 분산 아키텍처(MSA) 및 다중 서버 환경에서 확장성이 뛰어납니다. 다만 발급된 토큰을 서버 측에서 강제로 무효화하기 어렵고, 토큰 크기가 커 네트워크 대역폭을 추가로 소모할 수 있습니다.`,
    steps: [
      '로그인 요청: 클라이언트가 세션 카운터 또는 JWT 매표소에 로그인 정보를 들고 인증을 요청합니다.',
      '세션 생성 및 토큰 발급: 세션은 사물함 장부(DB)에 기록 후 아무 정보가 없는 열쇠(Session ID)를 발급하고, JWT는 사용자 정보가 기록된 네온 빛 자유이용권 팔찌를 발급합니다.',
      '서비스 요청 및 검증: 세션은 요청 시마다 열쇠를 보내 서버가 장부를 매번 찾아보아야 하며, JWT는 게이트에서 팔찌의 서명(위조 여부)만 레이저 스캔하여 즉시 통과시킵니다.',
      '만료 및 로그아웃 상황: 세션은 서버가 장부에서 칸을 지우면 즉시 만료되며, JWT는 만료 시각이 되는 순간 팔찌의 불빛이 꺼지며 게이트에서 차단(401)됩니다.',
    ],
    examples: [
      '단일 모놀리식 서버 기반 서비스 (세션 인증에 적합)',
      '대규모 다중 서버 및 MSA(마이크로서비스) 아키텍처 (JWT 인증에 적합)',
      '외부 API 및 서드파티 제휴 서비스 연동 (JWT/OAuth2에 적합)',
      '실시간 금융 거래 등 실시간 세션 만료 및 제어가 필수적인 서비스 (세션 인증 권장)',
    ],
  },
  {
    slug: 'realtime-protocols',
    category: 'workflow',
    title: '실시간 통신 프로토콜 비교',
    subtitle: 'WebSocket vs SSE (Server-Sent Events) vs Polling',
    tags: ['Networking', 'Real-time', 'WebSocket', 'SSE', 'HTTP'],
    description: `웹에서 실시간으로 데이터를 주고받기 위해서는 일반적인 단방향 HTTP 요청-응답 모델을 극복해야 합니다. 대표적인 실시간 통신 기법인 Polling, SSE, WebSocket은 네트워크 효율성과 실시간성 측면에서 뚜렷한 차이를 보입니다.

## Polling (폴링)
클라이언트가 주기적으로(예: 3초마다) 서버에 새 HTTP 요청을 보내 새 데이터가 있는지 확인합니다. 구현이 매우 단순하지만, 데이터 변화가 없더라도 불필요한 요청/응답 패킷이 계속 오가므로 서버 리소스 낭비가 매우 큽니다.

## SSE (Server-Sent Events)
클라이언트가 한 번 연결을 요청하면(EventSource), 서버는 연결을 유지한 채 서버 측에서 클라이언트로 실시간 데이터를 푸시(Push)하는 단방향 스트리밍 방식입니다. HTTP 표준 프로토콜을 그대로 사용하며 재연결 처리가 내장되어 있어 가볍지만, 클라이언트가 서버로 데이터를 보낼 때는 별도의 HTTP 요청을 쏘아야 합니다.

## WebSocket (웹소켓)
최초에 HTTP 연결(Switching Protocols)을 거친 뒤, TCP 양방향 소켓 채널을 수립하여 헤더 오버헤드가 거의 없는 순수 프레임 형태로 실시간 양방향 데이터를 전송하는 방식입니다. 실시간 게임, 채팅 등 실시간성이 극도로 요구되는 서비스에 필수적이지만, 연결 관리 비용이 가장 큽니다.`,
    steps: [
      '연결 수립: Polling은 매번 단발성 HTTP 연결, SSE는 단방향 스트림 연결 유지, WebSocket은 HTTP에서 소켓 프로토콜로 업그레이드',
      '클라이언트 데이터 송신: Polling과 SSE는 일반 HTTP 요청 사용, WebSocket은 이미 열린 소켓을 통해 가벼운 프레임으로 직접 즉시 송신',
      '서버 데이터 푸시: Polling은 다음 요청 주기까지 대기 후 응답, SSE와 WebSocket은 이벤트 발생 즉시 서버가 클라이언트로 데이터를 즉시 푸시',
      '연결 오버헤드: Polling은 매번 헤더 전송 및 핸드셰이크 발생, SSE/WebSocket은 한 번 맺은 영구 연결을 사용하여 전송 오버헤드가 거의 없음',
    ],
    examples: [
      '실시간 주식 차트, 주가 실시간 갱신 (SSE가 매우 효율적)',
      '실시간 멀티플레이어 웹 게임, 실시간 협업 에디터 (WebSocket 필수)',
      '실시간 알림 피드, SNS 새 피드 알림 (SSE 또는 폴링)',
      '주기적인 센서 데이터 모니터링 (폴링 또는 SSE)',
    ],
  },
  {
    slug: 'https-handshake',
    category: 'workflow',
    title: 'HTTPS (SSL/TLS 1.3) Handshake',
    subtitle: '공개키 암호화와 디피-헬만 알고리즘을 통한 보안 세션 키 합의 과정',
    tags: ['Security', 'HTTPS', 'TLS1.3', 'Cryptography'],
    description: `HTTPS는 HTTP 프로토콜의 보안 취약성을 극복하기 위해 TLS(Transport Layer Security) 암호화 계층을 얹은 프로토콜입니다. TLS 1.3은 단 1-RTT(1 Round Trip Time)만에 대칭 키를 교환하고 보안 세션을 맺는 극적인 성능 향상을 이루어냈습니다.

## 왜 대칭키와 비대칭키를 섞어 쓰는가?
비대칭키(공개키/개인키) 암호화는 안전하지만 연산 비용이 매우 큽니다. 반면 대칭키 암호화는 빠르지만 키를 안전하게 공유하기 어렵습니다. 따라서 TLS는 비대칭키(디피-헬만 키 합의 및 디지털 서명)를 사용하여 데이터를 암호화할 '대칭 키(세션 키)'를 안전하게 교환하고, 이후 실제 통신은 그 대칭 키로 빠르게 암호화합니다.

## TLS 1.3의 핵심 개선 (1-RTT)
이전 TLS 1.2는 2-RTT가 필요했으나, TLS 1.3은 Client Hello 단계에서 암호화 제안과 함께 디피-헬만(Diffie-Hellman) 키 교환을 위한 공유값 파라미터를 미리 전송(Key Share)하여 첫 번째 왕복 만에 세션 키를 생성해 냅니다.`,
    steps: [
      'Client Hello: 클라이언트가 브라우저 지원 암호 제품군(Cipher Suites) 리스트와 디피-헬만 키 교환을 위한 Key Share 값을 인증 서버에 전송',
      'Server Hello: 서버가 사용할 암호 방식을 선택하고 자신의 Key Share 값, CA 디지털 서명이 포함된 인증서를 함께 클라이언트에 반환',
      '키 생성 및 검증: 클라이언트는 CA 공개키로 서버 인증서를 검증하고, 양측의 Key Share 값을 디피-헬만 수식에 대입하여 동일한 "세션 대칭키"를 독자적으로 유도 완료',
      'Handshake 완료 & 암호화 통신 시작: 이제 암호화된 채널을 통해 서로의 검증 완료 메시지(Finished)를 전송하고 본 데이터 전송을 시작',
    ],
    examples: [
      '웹 브라우저의 주소창 자물쇠 아이콘 활성화',
      '신용카드 결제 및 로그인 정보 전송 보호',
      '공인인증서 및 루트 CA(인증기관) 신뢰 체인 검증',
      '중간자 공격(MITM) 방지 및 도청 차단',
    ],
  },
  {
    slug: 'api-gateway',
    category: 'workflow',
    title: 'API Gateway Rate Limiting',
    subtitle: '클라이언트 요청 제어 및 Rate Limiting 과부하 흐름 시각화',
    tags: ['Gateway', 'Rate Limiting', 'Networking', 'Security'],
    description: `API Gateway는 모든 클라이언트 요청의 최전방 진입점(Front Door) 역할을 하며, 시스템 보호를 위한 Rate Limiting을 수행합니다. 클럽의 입구와 경비원에 비유하여 작동 원리를 쉽게 이해할 수 있습니다.

## 1. 정상 라우팅 상태 (클럽 입장)
클라이언트 요청들(안경 쓴 개발자, 선글라스 VIP, 지친 직장인 등)이 춤추는 모습으로 변해 신나게 입구로 향합니다. 경비원이 가용 토큰(입장 팔찌)을 하나씩 채워주면, 사람들이 리듬을 타며 클럽 내부(마이크로서비스)로 입장합니다. 사용한 토큰은 토큰 충전기에서 지정된 속도로 천천히 재생성됩니다. (HTTP 헤더: X-RateLimit-Remaining 감소 및 리필)

## 2. 트래픽 폭주 상태 (입구 혼잡)
갑자기 감당하기 힘들 정도로 수많은 사람들이 입구로 밀려듭니다. 경비원이 분주하게 팔찌를 채워주지만, 유입 속도가 재생성 속도보다 훨씬 빨라 가용 팔찌가 순식간에 고갈되어 1개 이하로 떨어집니다.

## 3. 요청 차단 상태 (입장 제한)
팔찌가 완전히 소진(0개)되면 경비원이 차단막을 내리고 팔찌가 없는 사람들을 단호하게 돌려보냅니다. 돌려보내진 사람들은 눈물 아이콘과 함께 뒤로 사라집니다. 이때 차단된 요청에 대해서는 HTTP 429 Too Many Requests 상태 코드와 함께 안내 JSON 메시지가 반환되며, BLOCKED 카운터가 급증합니다.`,
    steps: [
      '정상 라우팅 (Normal Gateway Routing) — 춤추는 클라이언트들이 입구로 향하고, 경비원이 입장 팔찌(토큰)를 채워 마이크로서비스로 정상 안내합니다. 토큰은 충전기에서 서서히 충전됩니다.',
      '트래픽 폭주 (Traffic Spike) — 수많은 클라이언트 캐릭터들이 몰려들며 대기 줄이 길어지고, 가용 토큰(팔찌)이 빠르게 소모되어 바닥을 보이기 시작합니다.',
      '게이트 과부하 & 요청 차단 (Access Blocked) — 토큰이 완전히 소진되어 경비원이 차단막을 내리고, 팔찌가 없는 요청들을 HTTP 429 에러 코드와 함께 눈물을 흘리며 돌려보냅니다.',
    ],
    examples: [
      '디도스(DDoS) 공격 방어 및 시스템 안정성 확보',
      'API 사용량 제한 및 과금 정책(SaaS API Key) 적용',
      '백엔드 마이크로서비스의 리소스 고갈 방지',
      '토큰 버킷(Token Bucket) 및 리키 버킷(Leaky Bucket) 알고리즘 이해',
    ],
  },
  {
    slug: 'monolith-vs-msa',
    category: 'workflow',
    title: '모놀리식 vs 마이크로서비스 아키텍처(MSA)',
    subtitle: '단일 서버 내부 호출 vs 분산 서비스 간 네트워크 통신 흐름 비교',
    tags: ['Architecture', 'System Design', 'Microservices', 'Monolith'],
    description: `시스템 설계의 핵심 패러다임인 모놀리식(Monolithic) 아키텍처와 마이크로서비스 아키텍처(MSA)는 요청을 처리하는 흐름과 서비스 간 통신 방식에서 근본적인 차이가 있습니다.

## 모놀리식 아키텍처
모든 비즈니스 로직(인증, 주문, 재고, 결제, 알림 등)이 하나의 애플리케이션 프로세스 안에서 실행됩니다. 모듈 간 통신은 메모리 내 함수 호출(In-Memory Call)로 이루어지므로 네트워크 지연이 전혀 없고 트랜잭션 관리가 매우 단순합니다. 단일 데이터베이스를 공유하여 완벽한 데이터 일관성을 유지할 수 있지만, 하나의 모듈에 장애가 발생하면 전체 시스템이 다운되고 스케일 아웃이 비효율적이라는 단점이 있습니다.

## 마이크로서비스 아키텍처 (MSA)
비즈니스 경계(Bounded Context)에 따라 서비스가 독립적인 프로세스로 쪼개져 실행됩니다. 각 서비스는 자신만의 데이터베이스를 소유(Database-per-Service)하며, 서비스 간 통신은 HTTP, gRPC 또는 메시지 큐를 통한 네트워크 통신으로 진행됩니다. 특정 서비스의 장애가 다른 서비스로 전파되지 않도록 격리(Fault Isolation)할 수 있고 서비스별 개별 스케일 아웃이 가능하지만, 여러 네트워크 호출로 인한 지연 시간(Latency) 누적과 분산 트랜잭션 관리의 높은 복잡성을 해결해야 합니다.`,
    steps: [
      '클라이언트 요청 유입 — 사용자의 주문 요청이 유입됩니다. 모놀리스는 로드밸런서를 통해 단일 서버로, MSA는 API 게이트웨이로 도달합니다.',
      '인증 및 인가 처리 — 모놀리스는 프로세스 내부 메모리 호출로 세션/토큰을 즉시 확인합니다. MSA는 인증 서비스(Auth Service)로 네트워크 통신을 거쳐 검증합니다.',
      '비즈니스 로직 수행 및 주문 생성 — 모놀리스는 내부의 주문 모듈을 호출합니다. MSA는 게이트웨이를 거쳐 주문 서비스(Order Service)로 요청이 전달됩니다.',
      '재고 확인 및 차감 — 주문 처리를 위해 재고 상태를 확인합니다. 모놀리스는 내부 메모리 호출로 재고를 조회하지만, MSA는 주문 서비스에서 재고 서비스(Inventory Service)로 네트워크 호출을 보냅니다.',
      '결제 요청 및 트랜잭션 — 결제를 수행합니다. 모놀리스는 단일 데이터베이스 내에서 하나의 로컬 트랜잭션(ACID)으로 안전하게 처리합니다. MSA는 결제 서비스(Payment Service)로 네트워크 호출을 수행하고 분산 데이터베이스에 각각 기록하므로 분산 트랜잭션 처리가 수반됩니다.',
      '알림 발송 및 최종 응답 — 고객에게 알림을 보냅니다. 모놀리스는 동기 혹은 내부 스레드로 알림 모듈을 호출한 후 응답합니다. MSA는 메시지 브로커를 통해 알림 서비스(Notification Service)에 비동기 이벤트를 발행하고, 주문 서비스는 클라이언트에게 즉시 최종 응답을 반환합니다.',
    ],
    examples: [
      '단일 웹 서비스에서 트래픽 증가에 따른 스케일 아웃 방식 비교',
      '특정 서비스(예: 결제 서비스) 장애 발생 시 시스템 전체에 미치는 영향 분석',
      '서비스 간 지연 시간(Latency) 축적 및 네트워크 병목 파악',
      '공유 데이터베이스 트랜잭션과 서비스별 데이터베이스의 정합성 유지 방식 비교',
    ],
  },

  // ── 알고리즘 ────────────────────────────────────────────────
  {
    slug: 'sieve-of-eratosthenes',
    category: 'algorithm',
    title: '에라토스테네스의 체',
    subtitle: '범위 내 모든 소수를 O(N log log N)에 찾는 고대 알고리즘',
    tags: ['Math', 'Primes', 'Optimization'],
    complexity: {
      best: 'O(N log log N)',
      avg: 'O(N log log N)',
      worst: 'O(N log log N)',
      space: 'O(N)',
    },
    description: `에라토스테네스의 체는 고대 그리스 수학자 에라토스테네스가 고안한 소수 탐색 알고리즘으로, 특정 범위 N까지의 모든 소수를 찾는 가장 효율적인 방법 중 하나입니다. 시간 복잡도 O(N log log N), 공간 복잡도 O(N)입니다.

## 동작 원리
2부터 시작하여 해당 수가 합성수로 표시되지 않았다면 소수로 확정하고, 그 배수들을 모두 합성수로 표시합니다. √N까지만 반복하면 N 이하의 모든 소수를 찾을 수 있습니다.

- 2는 소수 → 4, 6, 8, ... 을 합성수로 표시
- 3은 소수 → 6, 9, 12, ... 을 합성수로 표시
- 4는 이미 합성수 → 건너뜀
- 5는 소수 → 10, 15, 20, ... 을 합성수로 표시
- √N 이후 남은 미표시 수는 모두 소수

## 왜 효율적인가
각 합성수는 단 한 번만 표시됩니다. 소수 p에 대해 p² 미만의 배수는 이미 더 작은 소수에 의해 표시되어 있으므로, p²부터 시작해 배수를 지워 나갑니다. 이 덕분에 일반적인 소수 판별(O(N√N))보다 훨씬 빠릅니다.`,
    steps: [
      '2부터 N까지 배열 초기화 (모두 "소수 후보")',
      'p = 2: 소수 확정 → p²(=4)부터 p 간격으로 합성수 표시',
      'p = 3: 소수 확정 → 9, 12, 15... 합성수 표시',
      'p = 4: 이미 합성수 → 건너뜀',
      '√N 이하 모든 p 처리 완료 → 남은 미표시 수 전부 소수 확정',
    ],
    examples: [
      '암호학(RSA)의 기초가 되는 큰 소수 탐색',
      '코딩 테스트 소수 판별 최적화',
      '정수론 연구 및 수학적 패턴 분석',
      '해시 테이블의 버킷 크기 결정 (소수 사용)',
    ],
  },
  {
    slug: 'bubble-sort',
    category: 'algorithm',
    title: '버블 정렬',
    subtitle: '인접한 두 원소를 반복 비교·교환하는 기초 정렬',
    tags: ['Sort', 'O(n²)', 'Comparison'],
    complexity: {
      best: 'O(n)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: true,
    },
    description: `버블 정렬은 인접한 두 원소를 비교하여 순서가 잘못된 경우 교환하는 과정을 반복합니다. 각 패스마다 가장 큰 원소가 끝으로 "버블링"되어 올라갑니다.

## 복잡도
- 시간 복잡도: 최선 O(n) | 평균·최악 O(n²)
- 공간 복잡도: O(1) (제자리 정렬)
- 안정(Stable) 정렬: 동일한 값의 원소 순서 유지

## 특징과 한계
구현이 매우 단순하지만 n이 커질수록 성능이 급격히 저하됩니다. 이미 정렬된 배열에 대해 조기 종료(Early Termination) 최적화를 적용하면 O(n)이 됩니다. 교육용·소규모 데이터 외에는 실무에서 거의 사용되지 않습니다.`,
    steps: [
      '0번째 원소부터 (n-1)번째 원소까지 인접 비교',
      'arr[i] > arr[i+1]이면 두 원소 교환 (swap)',
      '한 패스 완료 후 배열 끝에 최대값 고정',
      '다음 패스는 마지막 고정 원소를 제외하고 반복',
      '교환이 한 번도 없으면 이미 정렬됨 → 조기 종료',
    ],
    examples: [
      '알고리즘 교육 및 정렬 개념 입문',
      '소규모 데이터 또는 거의 정렬된 데이터',
    ],
  },
  {
    slug: 'selection-sort',
    category: 'algorithm',
    title: '선택 정렬',
    subtitle: '매 패스마다 최솟값을 찾아 앞으로 가져오는 정렬',
    tags: ['Sort', 'O(n²)', 'Comparison'],
    complexity: {
      best: 'O(n²)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: false,
    },
    description: `선택 정렬은 정렬되지 않은 부분에서 최솟값을 찾아 맨 앞 원소와 교환하는 과정을 반복합니다. 각 패스마다 정렬된 부분이 하나씩 늘어납니다.

## 복잡도
- 시간 복잡도: 최선·평균·최악 모두 O(n²)
- 공간 복잡도: O(1) (제자리 정렬)
- 불안정(Unstable) 정렬: 동일한 값의 원소 순서가 바뀔 수 있음

## 특징
버블 정렬에 비해 교환 횟수가 적습니다(패스당 최대 1번). 데이터 이동 비용이 매우 클 때 상대적으로 유리할 수 있지만, 비교 횟수는 여전히 O(n²)이라 실무에서는 잘 사용되지 않습니다.`,
    steps: [
      '미정렬 영역(0~n-1)에서 최솟값의 인덱스를 찾음',
      '최솟값을 미정렬 영역의 첫 번째 원소와 교환',
      '정렬 경계를 오른쪽으로 한 칸 이동',
      'n-1회 반복 후 완전 정렬 완료',
    ],
    examples: [
      '교환 비용이 큰 환경(예: 플래시 메모리 쓰기 최소화)',
      '알고리즘 비교 학습 (버블 정렬과 비교)',
    ],
  },
  {
    slug: 'insertion-sort',
    category: 'algorithm',
    title: '삽입 정렬',
    subtitle: '카드 패 정리하듯 원소를 적절한 위치에 삽입하는 정렬',
    tags: ['Sort', 'O(n²)', 'Adaptive'],
    complexity: {
      best: 'O(n)',
      avg: 'O(n²)',
      worst: 'O(n²)',
      space: 'O(1)',
      stable: true,
    },
    description: `삽입 정렬은 정렬되지 않은 원소를 하나씩 꺼내어 이미 정렬된 부분의 올바른 위치에 삽입합니다. 카드 게임에서 손패를 정리하는 방식과 동일합니다.

## 복잡도
- 시간 복잡도: 최선 O(n) | 평균·최악 O(n²)
- 공간 복잡도: O(1) (제자리 정렬)
- 안정(Stable) 정렬: 동일한 값의 원소 순서 유지

## 특징 및 장점
거의 정렬된 배열에서 O(n)에 가까운 성능을 보이는 적응형(Adaptive) 알고리즘입니다. 소규모 데이터(n < 30)에서는 퀵 정렬보다 빠른 경우가 있어, 많은 라이브러리의 하이브리드 정렬(예: Python Timsort)에서 소규모 구간에 삽입 정렬을 사용합니다.`,
    steps: [
      '인덱스 1부터 시작, 현재 원소(key)를 임시 저장',
      '정렬된 부분(왼쪽)에서 key보다 큰 원소들을 오른쪽으로 한 칸씩 이동',
      '빈 자리에 key 삽입',
      '인덱스를 1씩 증가하며 배열 끝까지 반복',
    ],
    examples: [
      '거의 정렬된 데이터의 실시간 정렬',
      'Python Timsort, Java Arrays.sort() 소규모 구간 서브루틴',
      '온라인 정렬 (데이터가 하나씩 도착할 때)',
    ],
  },
  {
    slug: 'merge-sort',
    category: 'algorithm',
    title: '병합 정렬',
    subtitle: '분할 정복으로 O(n log n)을 보장하는 안정 정렬',
    tags: ['Sort', 'O(n log n)', 'Divide & Conquer'],
    complexity: {
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(n)',
      stable: true,
    },
    description: `병합 정렬은 배열을 절반으로 재귀적으로 분할하고, 분할된 두 배열을 정렬된 상태로 병합하는 분할 정복(Divide & Conquer) 알고리즘입니다.

## 복잡도
- 시간 복잡도: 최선·평균·최악 모두 O(n log n)
- 공간 복잡도: O(n) (추가 배열 필요)
- 안정(Stable) 정렬: 동일한 값의 원소 순서 유지

## 특징
어떤 입력에도 O(n log n)을 보장하는 신뢰성이 가장 큰 장점입니다. 추가 메모리(O(n))가 필요하지만, 링크드 리스트 정렬에서는 O(1) 공간으로 구현 가능합니다. Java의 Arrays.sort(Object[])와 Python의 Timsort 기반이 병합 정렬에서 출발했습니다.

## 병합 단계
두 정렬된 배열을 합칠 때, 각 배열의 맨 앞 원소를 비교하여 더 작은 것을 결과 배열에 넣는 과정을 반복합니다. 이 병합 연산의 시간 복잡도는 O(n)이며, log n번의 분할 레벨을 거치므로 전체 O(n log n)이 됩니다.`,
    steps: [
      '배열을 절반으로 분할 (재귀적으로 길이 1이 될 때까지)',
      '길이 1인 배열은 이미 정렬된 상태',
      '두 정렬된 배열을 병합: 각 배열 맨 앞 원소를 비교하며 작은 것을 결과에 추가',
      '한쪽 배열이 소진되면 나머지 배열을 결과에 이어 붙임',
      '재귀 호출이 반환될수록 점점 큰 단위가 정렬 완료',
    ],
    examples: [
      'Java Arrays.sort(Object[]) 내부 구현',
      '외부 정렬(External Sort): 디스크의 대용량 파일 정렬',
      '링크드 리스트 정렬 (추가 메모리 없이 O(n log n))',
      '안정 정렬이 필요한 다중 키 정렬',
    ],
  },
  {
    slug: 'quick-sort',
    category: 'algorithm',
    title: '퀵 정렬',
    subtitle: '피벗을 기준으로 분할하는 평균 O(n log n) 정렬',
    tags: ['Sort', 'O(n log n)', 'Divide & Conquer'],
    complexity: {
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n²)',
      space: 'O(log n)',
      stable: false,
    },
    description: `퀵 정렬은 피벗(Pivot) 원소를 기준으로 배열을 두 부분으로 분할하고 재귀적으로 정렬합니다. 실제 데이터에서 평균적으로 가장 빠른 비교 기반 정렬 알고리즘으로, 대부분의 언어 표준 라이브러리 정렬에 기반이 됩니다.

## 복잡도
- 시간 복잡도: 평균 O(n log n) | 최악 O(n²) (이미 정렬된 배열 + 나쁜 피벗 선택)
- 공간 복잡도: O(log n) (재귀 스택)
- 불안정(Unstable) 정렬

## 피벗 선택 전략
최악 케이스(이미 정렬된 배열)를 피하기 위해 다양한 피벗 선택 전략이 사용됩니다.

- 첫 번째 원소: 구현 단순, 이미 정렬된 배열에서 O(n²)
- 랜덤 선택: 최악 케이스 확률적으로 회피
- Median-of-Three: 첫·중간·마지막 원소의 중앙값 사용 (실무 표준)

## 왜 실제로 가장 빠른가
캐시 지역성(Cache Locality)이 매우 좋습니다. 제자리 정렬이므로 메모리 접근 패턴이 순차적이어서, 이론적으로 O(n log n)인 병합 정렬보다 실제 속도가 빠른 경우가 많습니다.`,
    steps: [
      '피벗 선택 (마지막 원소 또는 랜덤)',
      '피벗보다 작은 원소들을 왼쪽, 큰 원소들을 오른쪽으로 분할 (Partition)',
      '피벗을 최종 위치에 배치',
      '왼쪽 부분 배열, 오른쪽 부분 배열에 대해 재귀 적용',
      '부분 배열 크기가 1 이하면 종료',
    ],
    examples: [
      'C++ std::sort, Java Arrays.sort(int[]) 내부 알고리즘',
      '대규모 데이터 인메모리 정렬 (평균 케이스 최고 성능)',
      '데이터베이스 인덱스 구축',
      'k번째 원소 찾기 (QuickSelect 변형)',
    ],
  },
  {
    slug: 'heap-sort',
    category: 'algorithm',
    title: '힙 정렬',
    subtitle: '최대 힙을 활용하여 O(n log n)을 보장하는 제자리 정렬',
    tags: ['Sort', 'O(n log n)', 'Heap'],
    complexity: {
      best: 'O(n log n)',
      avg: 'O(n log n)',
      worst: 'O(n log n)',
      space: 'O(1)',
      stable: false,
    },
    description: `힙 정렬은 이진 최대 힙(Max-Heap) 자료구조를 활용한 정렬 알고리즘입니다. 배열을 힙으로 변환한 뒤, 루트(최댓값)를 반복적으로 추출하여 배열 끝에 배치합니다.

## 복잡도
- 시간 복잡도: 최선·평균·최악 모두 O(n log n)
- 공간 복잡도: O(1) (제자리 정렬)
- 불안정(Unstable) 정렬

## 힙(Heap)이란
완전 이진 트리 형태로, 부모 노드가 자식 노드보다 항상 크거나 같은(Max-Heap) 성질을 만족합니다. 배열로 표현할 때 인덱스 i의 왼쪽 자식은 2i+1, 오른쪽 자식은 2i+2입니다.

## 두 단계 흐름
1. Build Max-Heap: 배열을 최대 힙으로 변환 (O(n))
2. Extract Max 반복: 루트(최대값)를 배열 끝과 교환 후 힙 크기를 줄이고 Heapify 수행 (O(n log n))

힙 정렬은 O(n log n) 최악 보장과 O(1) 공간이라는 두 장점을 모두 가지지만, 캐시 지역성이 좋지 않아 실제 속도는 퀵 정렬보다 느린 경우가 많습니다.`,
    steps: [
      'Build Max-Heap: 배열 중간부터 역순으로 Heapify 적용 (O(n))',
      '루트(최대값)를 배열의 마지막 원소와 교환',
      '힙 크기를 1 감소 후 루트에서 Heapify 재적용',
      '2~3단계를 힙 크기가 1이 될 때까지 반복',
      '배열이 오름차순으로 정렬 완료',
    ],
    examples: [
      '우선순위 큐(Priority Queue) 구현',
      '실시간 스트림에서 Top-K 원소 추출',
      '메모리 제약 환경에서 O(n log n) 보장이 필요한 경우',
    ],
  },
  {
    slug: 'counting-sort',
    category: 'algorithm',
    title: '계수 정렬',
    subtitle: '비교 없이 O(n+k)에 정렬하는 비교 기반 하한 극복 알고리즘',
    tags: ['Sort', 'O(n+k)', 'Non-comparison'],
    complexity: {
      best: 'O(n+k)',
      avg: 'O(n+k)',
      worst: 'O(n+k)',
      space: 'O(n+k)',
      stable: true,
    },
    description: `계수 정렬은 원소를 서로 비교하지 않고, 각 값의 등장 횟수를 배열에 기록하여 정렬합니다. 비교 기반 정렬의 이론적 하한인 O(n log n)을 깨뜨립니다.

## 복잡도
- 시간 복잡도: O(n + k) — n: 원소 수, k: 값의 범위(최댓값)
- 공간 복잡도: O(n + k)
- 안정(Stable) 정렬 (구현에 따라 다름)

## 전제 조건과 한계
정수 또는 정수로 변환 가능한 값이어야 하며, 값의 범위(k)가 원소 수(n)에 비해 너무 크면 메모리 낭비가 심합니다. k가 n에 비례하거나 더 작을 때 가장 효율적입니다.

## 동작 방식
1. 각 값의 등장 횟수를 count 배열에 기록
2. count 배열을 누적합으로 변환 (정렬된 위치 정보)
3. 원래 배열을 역순으로 탐색하며 output 배열의 올바른 위치에 배치

라딕스 정렬(Radix Sort)의 내부 서브루틴으로 활용됩니다.`,
    steps: [
      '입력 배열의 최댓값(k)을 찾아 크기 k+1의 count 배열 초기화',
      '각 원소의 등장 횟수를 count 배열에 기록',
      'count 배열을 누적합으로 변환 (각 값의 마지막 위치 정보)',
      '입력 배열을 역순 탐색 → output 배열의 계산된 위치에 원소 배치',
      'output 배열을 원래 배열에 복사',
    ],
    examples: [
      '0~100 범위 시험 점수 정렬',
      'ASCII 문자 정렬',
      'Radix Sort의 내부 서브루틴',
      '히스토그램 기반 이미지 처리',
    ],
  },
  {
    slug: 'radix-sort',
    category: 'algorithm',
    title: '기수 정렬',
    subtitle: '자릿수별로 안정 정렬을 반복하는 O(d·n) 선형 정렬',
    tags: ['Sort', 'O(dn)', 'Non-comparison'],
    complexity: {
      best: 'O(d·n)',
      avg: 'O(d·n)',
      worst: 'O(d·n)',
      space: 'O(n+k)',
      stable: true,
    },
    description: `기수 정렬은 숫자를 자릿수(digit) 별로 분해하고, 각 자릿수에 대해 안정 정렬(보통 계수 정렬)을 반복 적용하여 전체를 정렬합니다. 비교 없이 동작하므로 O(n log n) 하한을 극복합니다.

## 복잡도
- 시간 복잡도: O(d × (n + k)) — d: 최대 자릿수, k: 기수(보통 10 또는 256)
- 공간 복잡도: O(n + k)
- 안정(Stable) 정렬

## LSD vs MSD
- LSD(Least Significant Digit): 낮은 자릿수부터 처리. 구현이 단순하고 안정적.
- MSD(Most Significant Digit): 높은 자릿수부터 처리. 재귀적이며 문자열 정렬에 적합.

## 적용 범위
정수, 고정 길이 문자열, IP 주소 등 키를 자릿수로 분해할 수 있는 경우에 사용합니다. d가 log n보다 작으면 퀵 정렬보다 빠를 수 있습니다. 예를 들어 32비트 정수의 경우 d = 4(8비트씩 4회)로 O(4n) = O(n)에 수렴합니다.`,
    steps: [
      '최대값의 자릿수(d) 파악',
      '1의 자리부터 시작: 해당 자릿수 기준으로 계수 정렬 (안정 정렬 필수)',
      '10의 자리, 100의 자리, ... 순으로 반복',
      'd번의 패스 완료 후 전체 정렬 완료',
    ],
    examples: [
      '전화번호, 우편번호 등 고정 길이 숫자 정렬',
      'IP 주소, MAC 주소 정렬',
      '대규모 정수 배열 정렬 (d << log n인 경우)',
      '문자열 사전 정렬 (MSD Radix Sort)',
    ],
  },
  {
    slug: 'dfs-vs-bfs',
    category: 'algorithm',
    title: 'DFS vs BFS 그래프 탐색',
    subtitle: '깊이 우선 탐색(Stack) vs 너비 우선 탐색(Queue)의 탐색 방식 비교',
    tags: ['Algorithm', 'Graph', 'DFS', 'BFS', 'Traversal'],
    complexity: {
      best: 'O(V+E)',
      avg: 'O(V+E)',
      worst: 'O(V+E)',
      space: 'O(V)',
    },
    description: `그래프 탐색은 하나의 정점으로부터 시작하여 모든 정점들을 한 번씩 방문하는 과정입니다. 대표적인 탐색 방식인 DFS와 BFS는 방문 정점을 관리하는 자료구조에 따라 탐색 방향과 특징이 완전히 갈립니다.

## DFS (Depth-First Search, 깊이 우선 탐색)
현재 노드에서 갈 수 있는 한 방향으로 깊이 파고든 뒤, 더 이상 갈 곳이 없으면 가장 최근의 갈림길로 되돌아와(Backtracking) 다른 방향을 탐색합니다. 스택(Stack) 자료구조 또는 재귀 호출을 사용하여 구현합니다. 미로 찾기, 경로의 특징을 저장해야 하는 경우, 사이클 존재 여부 파악 등에 적합합니다.

## BFS (Breadth-First Search, 너비 우선 탐색)
시작 노드에서 가까운 노드들을 우선하여 넓게 탐색한 뒤, 그 다음 반경의 노드들을 차례로 방문합니다. 큐(Queue) 자료구조를 사용하여 구현합니다. 두 노드 간의 최단 경로(단순 최단 거리)나 최소 비용 경로를 찾을 때 가장 유용합니다.`,
    steps: [
      '시작 노드를 방문 처리하고 스택(DFS) 또는 큐(BFS)에 삽입',
      '자료구조에서 노드를 꺼내어 현재 노드로 지정',
      '현재 노드와 인접한 미방문 노드들을 탐색하여 방문 처리 후 스택/큐에 삽입',
      '자료구조가 비어 있을 때까지 2-3단계를 반복하여 탐색 완료',
    ],
    examples: [
      '네트워크 최단 거리(최단 홉) 찾기 (BFS 필수)',
      '미로 탈출 경로 찾기 (DFS / BFS 둘 다 가능하나 최단 경로는 BFS가 유리)',
      '그래프 내 사이클(Cycle) 존재 감지 (DFS)',
      '체스판 최단 이동 횟수 계산 (BFS)',
    ],
  },
  {
    slug: 'global-post-retrieval',
    category: 'workflow',
    title: '글로벌 게시글 조회 레이턴시 워크플로우',
    subtitle: '미국 사용자 브라우저 요청부터 CPU 마이크로 연산까지의 8단계 레이턴시 탐험',
    tags: ['Networking', 'Infrastructure', 'Hardware', 'Latency'],
    description: `글로벌 서비스에서 사용자가 게시글을 조회할 때 발생하는 레이턴시를 거시 네트워크(macro), 시스템 인프라(infra), 그리고 하드웨어 마이크로(micro) 계층으로 나누어 상세하게 분석합니다.

## 거시 네트워크 계층 (Macro Layer)
대륙을 넘나드는 통신은 물리적 거리 한계로 인해 전체 시나리오 중 가장 큰 레이턴시 지연을 발생시킵니다. 태평양 횡단 해저 광케이블 내부의 빛의 속도 한계와 게이트웨이 장비의 패킷 포워딩 시간으로 인해 150ms 수준의 지연이 발생합니다.

## 시스템 인프라 계층 (Infra Layer)
데이터센터 내부에 진입한 후에는 전파 지연보다는 시스템 소프트웨어 인프라 및 스토리지 I/O 속도가 지배적입니다. 데이터센터 내 통신은 0.5ms 이하로 매우 빠르지만, 영속성 스토리지(HDD/SSD)에서 데이터를 탐색하고 파일을 순차적으로 로드할 때는 물리적 모터 구동 지연이나 셀 접근 지연으로 인해 1ms~10ms 수준의 상대적으로 큰 밀리초 단위 지연이 필연적으로 동반됩니다.

## 하드웨어 마이크로 계층 (Micro Layer)
메모리에 데이터가 적재된 이후, CPU 코어 내부에서 실행되는 연산들은 나노초(ns) 단위로 극단적으로 고속 처리됩니다. 메인 메모리(DRAM) 참조(100ns), L1/L2 캐시 메모리 접근(0.5ns~7ns), 분기 예측 실패 페널티(5ns), 그리고 다중 스레드 동기화를 위한 뮤텍스 잠금(25ns) 등 나노초 단위 미시 세계의 병목 요인들이 존재합니다.

## 하드웨어 레이턴시의 현실적 비유
컴퓨터 시스템의 각 계층이 겪는 지연 시간을 사람이 직관적으로 체감할 수 있도록, 가장 빠른 CPU L1 캐시 접근 시간(0.5ns)을 1초로 늘려 비유해 보겠습니다.

- L1 캐시 참조가 1초라면, L2 캐시 참조는 14초로 짧은 휴식 시간 수준입니다.
- 하지만 메인 메모리(RAM) 참조는 200초(3분 20초)가 소요되어 커피를 타 오는 대기 시간에 맞먹습니다.
- 인프라 계층으로 올라가 SSD에서 임의의 데이터를 읽는 것은 30만 초(약 3.5일)가 걸려 휴가를 다녀와야 하는 수준이 됩니다.
- HDD에서 헤드를 움직여 데이터를 찾는 것은 2,000만 초(약 230일)로, 아기가 태어나는 시간을 대기해야 합니다.
- 마지막으로 대륙 간 패킷 왕복(150ms)은 L1 캐시 대비 3억 배 느린 3억 초(약 9.5년)가 걸립니다.

이처럼 소프트웨어 최적화 시 물리적인 디스크 I/O나 대광대역 네트워크 요청을 단 한 번이라도 줄이는 것이 CPU 연산을 수만 번 줄이는 것보다 압도적으로 성능 향상에 크게 기여하는 물리적 이유입니다.`,
    steps: [
      '미국 사용자 -> 한국 API 서버 — 대륙 간 RTT로 해저 광케이블 물리 속도 한계 지연 발생 (150ms)',
      'API 서버 내부 진입 — 로드 밸런서에서 대상 서버 포트까지 데이터센터 RTT 지연 (0.5ms)',
      '디스크 데이터베이스 조회 — RDBMS 인덱스 미적용 컬럼 탐색으로 HDD 물리 헤더 이동 지연 발생 (10ms)',
      '스토리지 대용량 이미지 로드 — 1MB 크기 정적 리소스를 SSD에서 메모리로 순차 읽기 지연 (1ms)',
      'RAM 영역 데이터 참조 — 캐시 미스로 인해 CPU가 DRAM 주소를 직접 참조하여 적재 지연 (100ns)',
      '문자열 필터링 연산 — 필터링 루프 중 CPU L2 캐시에 히트하여 고속 연산 수행 (7ns)',
      '조건문 분기 처리 — 필터링 조건 분기에서 예측 실패하여 파이프라인 플러시 발생 (5ns)',
      '자원 경합 동기화 — 동시 조회수 카운트 스레드 경쟁으로 뮤텍스 Lock 대기 지연 (25ns)',
    ],
    examples: [
      '글로벌 웹 서비스 성능 최적화 및 CDN 캐싱 전략 수립',
      '하드웨어/스토리지 스펙 선정에 따른 병목 지점 예측',
      'CPU 파이프라인 및 L1/L2 캐시 최적화 코드 설계',
      '멀티스레드 환경의 락 경합 병목 완화 아키텍처 구성',
    ],
  },
];
