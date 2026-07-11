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
    description: `Docker는 애플리케이션의 실행 환경 전체를 컨테이너로 격리하여 배포 및 유지보수의 편의성을 극대화합니다.

## 배포 과정의 혁신
전통적인 방식에서는 서버마다 필요한 OS 패키지와 라이브러리 버전을 직접 수동 설치하므로 환경 불일치와 버전 충돌 위험이 높습니다. 반면 Docker 환경은 개발 PC에서 작성한 Dockerfile을 기반으로 완성된 이미지를 빌드한 후, 운영 서버에서 단 한 줄의 명령어로 그대로 실행하므로 개발 환경과 프로덕션 환경의 완벽한 일치가 보장됩니다.

## 유지보수 단계의 이점

- 로그 분석: 각 앱마다 파일 위치가 달라 뒤지기 번거롭던 문제를 stdout/stderr 표준 출력으로 통일하여 docker logs 명령어 한 줄로 조회할 수 있습니다.    
- 헬스체크: 포트나 프로세스를 직접 감시하는 크론 스크립트 대신, Dockerfile에 HEALTHCHECK 선언을 해두면 데몬이 상태를 실시간 확인하고 비정상 컨테이너를 복구할 수 있습니다.    
- 볼륨 관리: 호스트 OS의 경로에 앱 데이터가 어지럽게 섞이는 전통 방식과 달리, 컨테이너 라이프사이클과 독립된 전용 Docker 볼륨을 구성하여 안전하게 보존하고 마운트할 수 있습니다.`,
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
};
