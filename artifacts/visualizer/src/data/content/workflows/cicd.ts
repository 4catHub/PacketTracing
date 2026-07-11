import { ContentItem } from "../content-types";

export const cicdContent: ContentItem = {
    slug: "cicd",
    category: "workflow",
    title: "CI/CD 파이프라인",
    subtitle: "Code Push → Build → Test → Deploy 자동화 흐름",
    tags: [
    "DevOps",
    "CI/CD",
    "Automation",
    "Pipeline"
],
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
    "개발자가 코드를 Push → GitHub Actions / GitLab CI / Jenkins 트리거 발생",
    "의존성 설치, 소스 컴파일, 빌드 아티팩트 생성",
    "단위 테스트 & 통합 테스트 실행 — 실패 시 파이프라인 중단 및 알림",
    "Lint, 정적 분석, 보안 취약점 스캔(SAST/DAST)",
    "Docker 이미지 빌드 → 컨테이너 레지스트리(ECR, GCR 등) Push",
    "스테이징 환경 배포 → E2E 테스트 & 스모크 테스트",
    "프로덕션 배포 (Blue-Green Deployment 또는 Canary Release)"
],
    examples: [
    "GitHub Actions로 PR 마다 자동 테스트 실행",
    "Kubernetes 클러스터에 Zero-downtime 배포",
    "보안 취약점이 있는 코드가 프로덕션에 도달하기 전 차단",
    "배포 주기를 월 1회에서 하루 수십 회로 단축"
],
};
