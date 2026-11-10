import type { ContentItem } from "../content-types";

export const infrastructureStages = [
  {
    title: "단일 서버",
    change: "웹 서버, 앱, DB를 한 VM에 배치",
    state: "낮은 QPS의 MVP. 웹 서버, 모놀리스, DB가 CPU·메모리·디스크를 공유",
    solution: "웹 서버가 동적 요청을 앱으로 전달. 앱과 DB는 같은 호스트에서 통신",
    benefit: "배포 지점과 운영 비용이 적고 서비스 검증이 빠름",
    tradeoff: "호스트 장애가 전체 중단으로 이어짐. 앱 연산과 DB I/O가 서로 경합",
    signal: "CPU·메모리·디스크 대기와 P95를 함께 확인. 자원 증설로 버틸 여지가 있는지 점검",
  },
  {
    title: "앱과 DB 분리",
    change: "DB를 별도 호스트 또는 관리형 DB로 이전",
    state: "앱 CPU 사용량이 오르면 DB 처리까지 느려짐. 한 VM에서 독립 증설이 어려움",
    solution: "DB를 별도 사설 네트워크 엔드포인트로 이전. 연결 풀, 연결 제한, 백업 정책 설정",
    benefit: "앱 컴퓨팅과 DB 용량을 독립 조정. DB 유지보수 범위 분리",
    tradeoff: "DB 왕복 지연과 네트워크 장애 가능성 추가. 단일 앱·DB의 중단 위험은 각각 존재",
    signal: "앱 CPU·요청 대기와 DB 연결 수를 따로 관측. 앱만 포화되면 복제 검토",
  },
  {
    title: "로드 밸런싱",
    change: "웹 진입점을 LB로 교체하고 여러 AZ에 같은 앱 배포",
    state: "앱 한 대의 처리량에 도달. 앱 배포와 장애가 서비스 가용성에 직결",
    solution: "L4는 연결 단위, L7은 HTTP 경로·헤더 기준으로 분배 가능. 이 예시는 L7과 헬스 체크 적용",
    benefit: "같은 모놀리스를 수평 확장. 정상 인스턴스에 요청 분배, 수요에 따라 자동 증설",
    tradeoff: "인스턴스별 로컬 세션을 공유 저장소로 외부화하거나 토큰으로 처리. 전체 DB 풀 예산과 AZ 장애 시 여유 용량 필요",
    signal: "인스턴스별 QPS·P95·오류율 비교. 앱을 늘려도 DB 읽기나 정적 전송이 포화되는지 확인",
  },
  {
    title: "캐시와 CDN",
    change: "API 데이터 캐시와 정적 파일 배포 경로 분리",
    state: "인기 게시물 조회가 DB에 반복 도달. 이미지와 영상 전송이 앱 대역폭 점유",
    solution: "Cache-Aside는 캐시 미스 시 DB를 읽고 TTL과 함께 저장. 정적 파일은 Object Storage를 원본으로 CDN에서 전달",
    benefit: "캐시 적중 시 DB 읽기 감소. CDN 적중 시 원본까지 왕복하지 않아 지연과 전송 부담 감소",
    tradeoff: "TTL 동안 오래된 값 노출 가능. 쓰기 후 무효화, 버전 키, 동시 미스 제어 필요",
    signal: "캐시·CDN 적중률, 원본 전송량, 미스 시 DB P99 관측. 업로드 대기가 길면 작업 분리 검토",
  },
  {
    title: "비동기 작업",
    change: "업로드 접수와 변환 작업을 브로커·워커로 분리",
    state: "영상 변환·알림 같은 긴 작업이 HTTP 연결과 처리 스레드를 오래 점유",
    solution: "작업을 영속적으로 접수한 뒤 202 반환. 브로커에서 받은 워커가 파일 변환. DB 상태와 이벤트를 함께 기록할 땐 Outbox 검토",
    benefit: "HTTP 접수 시간 단축. 워커를 독립 증설해 변동 부하를 흡수",
    tradeoff: "중복 전달을 멱등 키로 처리. 지수 백오프·DLQ·동시성 제한으로 재시도 폭주와 적체 제어",
    signal: "Queue Lag·가장 오래된 작업·실패율 관측. 생산 속도가 소비 한도를 지속 초과하면 백프레셔와 용량 조정",
  },
  {
    title: "DB 확장",
    change: "DB 읽기 복제본 도입, 최신 읽기와 일반 읽기 분리",
    state: "캐시 미스, 조회 집계, 쓰기가 Primary에 집중. 앱 수 증가에 따라 DB 풀 합계도 증가",
    solution: "인덱스·실행 계획과 풀 크기부터 조정. 지연 허용 읽기는 Replica, 쓰기와 최신성이 필요한 읽기는 Primary",
    benefit: "읽기 부하 분산. 데이터 정리·스캔에는 테이블 파티셔닝, 단일 쓰기 노드가 한계면 샤딩 검토",
    tradeoff: "비동기 복제 지연으로 방금 쓴 값이 안 보일 수 있음. 샤딩은 핫 키, 재분배, 교차 샤드 트랜잭션 비용 추가",
    signal: "DB Connections·복제 지연·쿼리 P99·쓰기 IOPS 관측. 배포와 도메인별 자원 요구가 계속 충돌하는지 확인",
  },
  {
    title: "서비스 분리",
    change: "카탈로그와 미디어의 배포·데이터 소유권 분리",
    state: "모듈화된 모놀리스에서도 배포 일정과 장애 범위를 분리하기 어려움. 영상 처리가 카탈로그와 다른 자원 요구",
    solution: "미디어를 독립 배포 단위로 분리하고 메타데이터 DB를 소유. 이 예시의 Gateway는 HTTP 라우팅을 담당",
    benefit: "서비스별 배포·확장 주기 확보. 미디어 장애가 카탈로그 읽기로 전파되는 범위를 줄일 수 있음",
    tradeoff: "동기 호출은 지연과 장애 전파를 추가. 비동기 경계는 최종 정합성 필요. 여러 서비스 쓰기는 Saga의 보상 실패까지 고려",
    signal: "변경 실패율·배포 대기 시간·서비스 간 호출 P99 관측. 운영 부담이 커지면 배포 자동화 검토",
  },
  {
    title: "운영 자동화",
    change: "앱 복제본을 컨테이너로 운영하고 배포·관측 제어 계층 추가",
    state: "복제본과 서비스가 늘어 수동 배포·복구가 느려지고 환경 차이가 누적",
    solution: "Docker 이미지와 Kubernetes Deployment로 배치. Service로 검색·분배, CI/CD로 Rolling 또는 별도 트래픽 분할 기반 Canary",
    benefit: "준비된 복제본 중심으로 배포. 메트릭·로그·분산 트레이스로 요청과 장애를 연결",
    tradeoff: "클러스터 운영, 권한과 리소스 제한 관리, 관측 비용 증가. Probe 오류나 잘못된 자동화는 장애 범위를 넓힐 수 있음",
    signal: "롤아웃 실패·복구 시간·Pod 재시작·오류 예산 확인. 인입과 내부 호출의 장애 양상을 구분",
  },
  {
    title: "보안과 복원력",
    change: "API 인입 WAF와 워크로드 정책 적용",
    state: "공개 API의 공격·급증과 내부 의존성 장애가 다른 요청에 영향",
    solution: "엣지 DDoS 방어와 WAF 규칙, Gateway 한도와 인증, 서비스별 인가 적용. 내부 mTLS·접근 정책·비밀 회전 관리",
    benefit: "악성 요청을 앞에서 차단하고 의존성 장애 전파를 제한. Timeout·Circuit Breaker로 대기 자원 보호",
    tradeoff: "WAF 오탐·인증서 만료·Retry 폭주 가능. 짧은 재시도 예산과 멱등성 필요. Mesh는 정책 구현 선택지",
    signal: "차단율·429·다운스트림 타임아웃·지역별 SLO 관측. 리전 장애와 원거리 지연 요구를 분리",
  },
  {
    title: "글로벌 분산",
    change: "Geo DNS와 별도 리전 추가, 리전 간 DB 복제",
    state: "단일 리전 내 여러 AZ로 서버 장애는 격리 가능. 리전 전체 장애와 먼 지역의 RTT는 여전히 문제",
    solution: "Geo/상태 기반 DNS가 API 엔드포인트 선택에 관여. 예시는 A가 쓰기 소유, B는 읽기용 API를 독립 제공",
    benefit: "사용자 가까이 읽기 제공. B에서 쓰기를 복구하려면 승격·기존 쓰기 차단·라우팅 전환 절차가 필요",
    tradeoff: "DNS TTL로 전환이 지연될 수 있음. Active-Passive는 대기 용량, Active-Active 쓰기는 소유권·충돌 정책 필요",
    signal: "지역별 P99·복제 지연·실제 복구 시간을 측정. RPO는 허용 데이터 손실 범위, RTO는 복구 시간 목표",
  },
  {
    title: "데이터와 비용 최적화",
    change: "검색 읽기 모델과 분석 파이프라인을 운영 DB에서 분리",
    state: "검색·집계가 운영 DB와 자원 경합. 영상 변환은 요청 서버와 다른 컴퓨팅 요구",
    solution: "변경 이벤트로 검색 인덱스를 갱신. 스트림 처리 후 Lake 또는 Warehouse로 적재. 읽기·쓰기 모델을 CQRS로 분리 가능",
    benefit: "온라인 조회와 분석의 용량·비용을 독립 관리. 미디어 작업은 별도 워커 풀 또는 가속기 검토",
    tradeoff: "인덱싱 지연, 이벤트 재처리·스키마 호환, 중복 저장 비용 발생. CQRS는 이벤트 소싱 없이도 가능",
    signal: "인덱스 신선도·스트림 지연·변환당 비용·리전 전송량으로 다음 투자와 용량 계획 결정",
  },
] as const;

export const webInfrastructureEvolutionContent: ContentItem = {
  slug: "web-infrastructure-evolution",
  category: "workflow",
  title: "단일 서버에서 글로벌 서비스까지",
  subtitle: "가상 미디어 서비스의 11단계 성장 경로와 YouTube·Instagram·Netflix 공개 사례",
  tags: ["인프라", "스케일링", "시스템 디자인", "Multi-Region"],
  description: `### 확장 순서를 결정하는 병목

한 미디어 서비스가 게시물 조회, 파일 업로드, 영상 변환, 검색을 제공한다고 가정한다. 초기에는 낮은 부하와 적은 운영 인력 덕분에 한 서버로 충분하다. 첫 병목은 워크로드마다 다르다. 영상 변환은 CPU, 반복 조회는 DB, 파일 배포는 네트워크가 먼저 포화될 수 있다. 각 단계의 지표는 관측 후보이며 도입 임계치나 실측값을 가정하지 않는다.

모놀리스는 하나의 배포 단위, 모노레포는 코드 저장소 구성이다. 모놀리스도 복제해 수평 확장할 수 있다. 팀별 릴리스 주기, 장애 격리, 컴퓨팅 요구가 달라질 때 모듈러 모놀리스에서 서비스 추출을 검토한다. 서비스 분리 뒤에는 네트워크 호출과 일관성 비용이 생긴다. Gateway는 공통 인입 정책과 라우팅이 필요할 때 선택한다.

### 독립적으로 도입할 수 있는 확장 트랙

| 트랙 | 도입을 검토할 신호 | 지도에서 살펴볼 단계 |
| --- | --- | --- |
| 배포와 보안 | 반복 배포, 공격성 요청, 접근 정책 필요. 소규모 서비스도 CI/CD·WAF·백업 적용 가능 | 08–09 |
| 전달과 읽기 | 정적 파일의 전송 비용 또는 반복 조회 증가. CDN과 캐시를 각각 도입 가능 | 04 |
| 백그라운드 작업 | 이메일, 알림, 영상 변환 등 즉시 완료가 필요 없는 작업 | 05 |
| 데이터 배치 | 읽기·쓰기·저장 용량 병목을 각각 측정해 복제·파티셔닝·샤딩 선택 | 06, 11 |
| 지역과 복구 | 데이터 거주 요건, 먼 지역의 지연, 리전 장애에 대한 복구 목표 | 10 |

### 실제 서비스의 공개 사례

다음은 출처가 공개한 시점과 범위의 사례다. 단계 번호는 개념 연결이며 각 회사의 도입 순서나 2026년의 전체 내부 구조를 뜻하지 않는다.

| 서비스 | 해결할 문제와 공개된 접근 | 연결 단계 | 자료와 공개 날짜 |
| --- | --- | --- | --- |
| YouTube | 다양한 기기·대역폭에 맞는 영상 변환의 비용을 줄이기 위해 전용 VCU와 조정 소프트웨어 도입. GGC 엣지에서 인기 콘텐츠를 캐싱하고, MySQL 수평 확장용 Vitess를 자체 개발 | 04, 05, 06, 11 | [YouTube VCU](https://blog.youtube/inside-youtube/new-era-video-infrastructure/) · 2021-04-21 / [CNCF Vitess](https://www.cncf.io/blog/2018/02/05/cncf-host-vitess/) · 2018-02-05 / [Google GGC](https://peering.google.com/static/js/site/modules/pages/infrastructure.html) · 게시일 미표기 |
| Instagram | 사용자 데이터 증가에 PostgreSQL 수평 파티셔닝과 쿼리 튜닝 적용. 과거 사진 ID를 사용자 ID로 매핑해 샤드를 찾는 데 Redis 사용. 업로드 영상의 기본 인코딩 비용 절감. Explore는 후보 검색·순위화를 단계화 | 04, 05, 06, 11 | [Instagram Redis](https://medium.com/instagram-engineering/storing-hundreds-of-millions-of-simple-key-value-pairs-in-redis-1091ae80f74c) · 2011-11-01 / [Instagram PostgreSQL](https://medium.com/instagram-engineering/handling-growth-with-postgres-5-tips-from-instagram-d5d7e7ffdfcb) · 2013-01-17 / [Meta 인코딩](https://engineering.fb.com/2022/11/04/video-engineering/instagram-video-processing-encoding-reduction/) · 2022-11-04 / [Meta Explore](https://engineering.fb.com/2023/08/09/ml-applications/scaling-instagram-explore-recommendations-system/) · 2023-08-09 |
| Netflix | Open Connect 장비를 ISP·IX에 배치해 재생 데이터 전달을 현지화. 고객 대면 서비스는 AWS 멀티 리전에서 운영. 서비스 계층은 마이크로서비스로 전환. API 의존성에 타임아웃·스레드 풀 격리·Circuit Breaker를 적용하고, Chaos Kong으로 리전 트래픽 우회를 연습 | 04, 07, 09, 10 | [Netflix Open Connect](https://openconnect.netflix.com/Open-Connect-Briefing-Paper.pdf) · 2021 / [Netflix 클라우드 이전](https://about.netflix.com/en/news/completing-the-netflix-cloud-migration) · 2016-02-12 / [Netflix API 복원력](https://netflixtechblog.com/fault-tolerance-in-a-high-volume-distributed-system-91ab4faae74a) · 2012-02-29 / [Netflix Chaos Kong](https://netflixtechblog.com/chaos-engineering-upgraded-878d341f15fa) · 2015-09-25 |

YouTube의 공개 자료는 영상 전달, 변환, DB 확장을 각각 설명한다. Instagram의 Explore는 추천 화면 범위이며 홈 피드 전체로 일반화할 수 없다. Netflix의 Open Connect 재생 바이트 전송과 클라우드의 서비스 요청 처리는 서로 다른 경로다.

### 초기·중간·대규모 구조 비교

| 구분 | 초기 · 01 | 중간 · 06 | 대규모 · 10–11 |
| --- | --- | --- | --- |
| 구성 | 한 VM의 웹·앱·DB | 다중 AZ 앱 복제본, 캐시, Primary·Replica, 큐 | 지역 API, 도메인 서비스, 리전 간 복제, 검색·분석 계층 |
| 네트워크와 데이터 | 호스트 내부 DB 연결 | LB 인입, 캐시 미스 시 DB, CDN은 객체 원본 조회 | DNS가 지역 선택에 관여, API·정적 파일·복제 경로 분리 |
| 장애 범위 | 호스트 장애 시 서비스 중단 | 앱 장애는 헬스 체크로 우회, 공유 DB는 여전히 중요 | 지역·서비스 경계로 격리 가능, 공통 제어 계층과 복제 의존성 존재 |
| 운영과 비용 | 한 번 배포, 고정 호스트 비용 | 풀 예산과 백로그 관리, 복제·캐시·전송 비용 | 독립 배포와 복구 훈련, 중복 용량·전송·관측 비용 |

### 같은 요청의 경로 비교

\`GET /posts/42\`는 동적 API다. 인증이 필요한 요청은 캐시 정책이 명확할 때만 공유 캐시에 저장한다. 이미지나 영상 파일을 가져오는 후속 요청은 별도 CDN 경로를 쓴다.

| 구간 | 요청과 응답 |
| --- | --- |
| 초기 | Client → Web → Monolith → 같은 VM의 DB. 조회 결과가 같은 경로를 역순으로 반환 |
| 중간 | Client → L7 LB → Monolith → Cache. 미스면 Monolith → 허용된 DB Replica, Cache 채움 뒤 응답 |
| 서비스 분리 이후 | Client → WAF → LB → Gateway → Catalog → Cache 또는 DB. 게시물 읽기는 브로커 완료를 기다리지 않음 |

### 확장 전략 비교

| 전략 | 해결하는 병목 | 비용 또는 조건 |
| --- | --- | --- |
| Scale-up | 단일 노드의 CPU·RAM·디스크 한계 | 구조가 단순하나 상한과 장애 범위 유지 |
| Scale-out | 앱·워커 동시 처리량 | 상태 외부화와 공유 계층의 여유 필요 |
| Replication | 읽기 부하와 장애 복구용 사본 | 복제 지연, 장애 승격과 읽기 일관성 |
| Partitioning | 큰 테이블의 스캔·보존 관리 | 쿼리에 분할 키가 있어야 가지치기 효과 |
| Sharding | 단일 노드의 쓰기·저장 한계 | 여러 노드로 분산. 핫 키·재샤딩·교차 샤드 비용 |
| Caching | 반복 조회와 원본 왕복 | TTL·무효화·동시 미스·권한별 캐시 키 관리 |
| Async Processing | 오래 걸리는 작업이 요청 경로 점유 | 접수와 완료를 구분. 지연·중복·실패를 별도로 추적 |
`,
  steps: infrastructureStages.map(({ title, change }) => `${title} · ${change}`),
  examples: [
    "앱 복제본을 늘린 뒤 DB 연결 대기가 증가했다면, 복제본별 풀 크기와 DB의 연결 예산을 함께 확인한다.",
    "방금 등록한 게시물을 작성자 화면에 바로 표시해야 한다면, 해당 읽기는 Primary로 보내고 오래된 값이 허용되는 조회만 Replica에 보낸다.",
    "업로드 완료와 재생 가능 상태를 분리하면, 브로커에 작업을 기록한 뒤 접수 응답을 반환하고 변환 상태는 나중에 조회할 수 있다.",
  ],
  related: [
    { category: "workflow", slug: "load-balancing-consistent-hashing", relation: "로드 밸런서의 분배 방식" },
    { category: "workflow", slug: "cdn-cache-invalidation", relation: "엣지 캐시와 무효화" },
    { category: "workflow", slug: "message-queue-event-driven", relation: "비동기 전달과 재시도" },
    { category: "workflow", slug: "db-replication-sharding", relation: "읽기 복제와 데이터 분할" },
    { category: "workflow", slug: "monolith-vs-msa", relation: "서비스 경계와 배포 단위" },
  ],
  learningObjectives: [
    "관측 지표로 앱, DB, 네트워크 병목을 구분한다.",
    "캐시·큐·복제를 도입했을 때 요청과 데이터 경로가 어떻게 달라지는지 읽는다.",
    "서비스 및 리전 분리에 따르는 운영·비용·정합성의 변화를 설명한다.",
  ],
  keyTakeaways: [
    "서버 수를 늘려도 공유 DB, 디스크, 네트워크가 포화되면 처리량이 제한된다.",
    "단계는 가상 서비스의 성장 사례다. 실제 도입 순서는 병목과 복구 목표에 따라 달라진다.",
    "CDN은 파일 전달, 큐는 작업 대기, DB Replica는 읽기 분산과 복제본 유지에 각각 쓰인다.",
  ],
  exercises: [
    {
      question: "영상 업로드 요청의 응답 시간 대부분이 변환 작업에서 쓰인다. 사용자가 즉시 재생할 필요가 없다면 어떤 변경이 적합할까?",
      options: ["변환을 워커로 옮기고 영속적으로 접수한 뒤 202 응답", "읽기 Replica 추가", "DB와 앱을 동일한 호스트에 배치"],
      answerIndex: 0,
      explanation: "접수와 완료를 분리하면 변환이 HTTP 연결을 점유하는 시간을 줄이고, 변환 워커를 따로 확장할 수 있다.",
    },
    {
      question: "앱 서버를 늘렸지만 DB Primary의 쓰기 IOPS가 계속 포화된다. 먼저 확인할 것은?",
      options: ["쓰기 쿼리와 인덱스 비용, 단일 노드의 쓰기 한계", "정적 파일의 CDN 적중률", "읽기 Replica를 쓰기 대상으로 바로 사용"],
      answerIndex: 0,
      explanation: "쓰기 병목의 원인을 측정한 뒤 쿼리 개선이나 쓰기 소유권 분할을 검토한다. 일반적인 읽기 Replica는 Primary 쓰기 부하를 분산하지 않는다.",
    },
  ],
};
