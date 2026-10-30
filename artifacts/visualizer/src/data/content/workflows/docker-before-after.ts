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
- **Docker 컨테이너 배포:** 코드와 런타임 종속성을 불변의 Docker 이미지(\`Dockerfile\`)로 패키징하여, 호환되는 컨테이너 런타임과 플랫폼 아키텍처, 필요한 환경 설정을 갖춘 호스트에서 일관된 실행 환경을 재현할 수 있습니다.

### 2. 운영 및 유지보수 3대 핵심 비교
- **로그 분석 단일화:** 전통 방식에서 서버 경로 곳곳에 흩어져 있던 로그 파일들을 표준 출력(\`stdout\`/\`stderr\`)으로 일원화하여, \`docker logs\` 명령어 하나로 즉시 확인하고 ELK/Fluentd 파이프라인으로 전송합니다.
- **상태 감시 및 자가 치유:** 복잡한 감시 데몬 대신 Dockerfile 내 \`HEALTHCHECK\` 지시자를 선언하여, Docker Engine이 컨테이너의 건강 상태를 healthy/unhealthy로 표시합니다. 다만 HEALTHCHECK만으로 자동 재시작되지는 않으며 재시작 정책·외부 감시기·오케스트레이터의 복구 설정이 별도로 필요합니다.
- **데이터 영속성 (Volume 격리):** 컨테이너 내부 파일시스템과 분리된 전용 Docker 볼륨(\`docker volume\`)을 호스트에 마운트하여, 컨테이너가 삭제되거나 업그레이드되어도 DB 데이터가 안전하게 보존됩니다.

### 참고 자료
- [Dockerfile HEALTHCHECK 공식 문서](https://docs.docker.com/reference/dockerfile/#healthcheck)`,
  learningObjectives: ["컨테이너 상태 감지와 자동 재시작·복구의 차이를 설명할 수 있다."],
  commonMistakes: ["Docker HEALTHCHECK만으로 unhealthy 컨테이너가 자동 재시작되지는 않습니다. 복구 정책은 별도로 설계해야 합니다."],
  keyTakeaways: ["재시작 정책과 헬스체크, 데이터 영속성, 컨테이너 런타임 호환성을 각각 점검합니다."],
  exercises: [{"question":"Dockerfile의 HEALTHCHECK만 지정하면 컨테이너가 unhealthy 상태에서 반드시 자동 재시작되나요?","options":["아니요, 상태 감지만 수행합니다.","예, 항상 즉시 재시작합니다.","Docker 이미지가 자동 삭제됩니다."],"answerIndex":0,"explanation":"HEALTHCHECK는 건강 상태를 보고하며 자동 복구는 별도의 구성에 달려 있습니다."}],
  steps: [
    "전통적 배포 vs Docker 배포: 수동 의존성 컴파일과 서버 환경 차이 발생 vs 완성된 Docker 이미지 배포 및 즉각 실행",
    "로그 분석: 파일 서버 경로를 직접 탐색하는 파편화된 로그 vs docker logs 및 표준 출력(stdout/stderr) 단일화",
    "헬스체크: 프로세스 모니터링 데몬 수동 설치 vs Dockerfile 내 HEALTHCHECK 정의로 상태 감지(자동 복구는 별도 설정 필요)",
    "볼륨 관리: 호스트 OS 파일시스템에 생성된 데이터 산재 vs 독립적으로 분리 마운트되어 관리 및 백업이 용이한 Docker 볼륨"
  ],
  examples: [
    "개발/스테이징/프로덕션 환경 일치 보장",
    "마이크로서비스별 독립적인 런타임 버전 관리",
    "docker logs를 활용한 중앙 집중형 로그 파이프라인 연동",
    "HEALTHCHECK로 상태를 관측하고 별도의 오케스트레이터 복구 정책과 연동",
    "docker volume을 이용한 DB 데이터 백업 및 마이그레이션 격리"
  ],
  related: [
    { slug: "k8s-before-after", category: "workflow", relation: "Docker 컨테이너들을 대규모 관리하는 Kubernetes 오케스트레이션" },
    { slug: "cicd", category: "workflow", relation: "Docker 이미지 자동 빌드 및 컨테이너 배포 파이프라인" }
  ]
};
