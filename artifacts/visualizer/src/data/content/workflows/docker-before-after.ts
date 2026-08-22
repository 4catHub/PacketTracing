import { ContentItem } from "../content-types";

export const dockerBeforeAfterContent: ContentItem = {
  slug: "docker-before-after",
  category: "workflow",
  title: "Docker 적용 전/후 차이",
  subtitle: "배포 방식 및 유지보수(로그, 헬스체크, 볼륨) 차이 비교",
  tags: [
    "Docker",
    "Container",
    "DevOps",
    "Isolation",
    "Maintenance"
  ],
  description: `Docker는 애플리케이션의 소스 코드와 실행 환경(OS 계층, 라이브러리, 환경 변수) 전체를 가볍고 격리된 컨테이너(Container)로 패키징하여 배포 및 유지보수의 패러다임을 혁신합니다.

### 1. 배포 프로세스의 패러다임 전환
- **기존 전통적 배포:** 운영 서버마다 필요한 JDK, Python, Node 런타임과 OS 패키지를 수동 설치해야 하므로 '내 로컬에서는 되는데 서버에서는 안 되는' 환경 불일치(Matrix Hell)가 발생합니다.
- **Docker 컨테이너 배포:** 코드와 런타임 종속성을 불변의 Docker 이미지(\`Dockerfile\`)로 패키징하여, 어느 호스트 OS에서든 \`docker run\` 명령어 단 한 줄로 완벽히 동일하게 구동됩니다.

### 2. 운영 및 유지보수 3대 핵심 비교
- **로그 분석 단일화:** 전통 방식에서 서버 경로 곳곳에 흩어져 있던 로그 파일들을 표준 출력(\`stdout\`/\`stderr\`)으로 일원화하여, \`docker logs\` 명령어 하나로 즉시 확인하고 ELK/Fluentd 파이프라인으로 전송합니다.
- **상태 감시 및 자가 치유:** 복잡한 감시 데몬 대신 Dockerfile 내 \`HEALTHCHECK\` 지시자를 선언하여, 컨테이너 데몬이 서비스 이상을 실시간 감지하고 자동 재시작을 수행합니다.
- **데이터 영속성 (Volume 격리):** 컨테이너 내부 파일시스템과 분리된 전용 Docker 볼륨(\`docker volume\`)을 호스트에 마운트하여, 컨테이너가 삭제되거나 업그레이드되어도 DB 데이터가 안전하게 보존됩니다.`,
  steps: [
    "전통적 배포 vs Docker 배포: 수동 의존성 컴파일과 서버 환경 차이 발생 vs 완성된 Docker 이미지 배포 및 즉각 실행",
    "로그 분석: 파일 서버 경로를 직접 탐색하는 파편화된 로그 vs docker logs 및 표준 출력(stdout/stderr) 단일화",
    "헬스체크: 프로세스 모니터링 데몬 수동 설치 vs Dockerfile 내 HEALTHCHECK 정의를 통한 컨테이너 상태 자동 감시",
    "볼륨 관리: 호스트 OS 파일시스템에 생성된 데이터 산재 vs 독립적으로 분리 마운트되어 관리 및 백업이 용이한 Docker 볼륨"
  ],
  examples: [
    "개발/스테이징/프로덕션 환경 일치 보장",
    "마이크로서비스별 독립적인 런타임 버전 관리",
    "docker logs를 활용한 중앙 집중형 로그 파이프라인 연동",
    "HEALTHCHECK 선언을 통한 컨테이너 자가 치유(Self-Healing) 환경 구성",
    "docker volume을 이용한 DB 데이터 백업 및 마이그레이션 격리"
  ],
  related: [
    { slug: "k8s-before-after", category: "workflow", relation: "Docker 컨테이너들을 대규모 관리하는 Kubernetes 오케스트레이션" },
    { slug: "cicd", category: "workflow", relation: "Docker 이미지 자동 빌드 및 컨테이너 배포 파이프라인" }
  ]
};
