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
  description: `CI/CD는 코드 변경을 자동으로 통합·검증하고 배포 가능한 상태를 유지하거나 실제 배포를 자동화하는 개발·운영 방식입니다. Continuous Delivery는 일반적으로 프로덕션 배포에 승인 단계를 둘 수 있고, Continuous Deployment는 검증 통과 후 자동으로 프로덕션에 반영합니다.

### 1. CI (지속적 통합, Continuous Integration)
개발자가 코드를 중앙 원격 저장소에 Push하는 순간 자동으로 파이프라인이 트리거되어 코드의 무결성을 검증합니다.
- 코드 Push & 웹훅 트리거: GitHub, GitLab 등의 원격 저장소에 커밋/PR 발생 시 CI 러너(Runner)가 즉각 가동됩니다.
- **의존성 설치 및 컴파일:** 패키지 매니저를 통해 라이브러리 종속성을 캐시에서 불러오고 소스 코드를 빌드합니다.
- 정적 분석 (Lint & SAST): 코드 스타일 일관성을 검증하고 소나큐브(SonarQube) 등을 통해 잠재적 보안 취약점을 사전 스캔합니다.
- **자동화 테스트 수행:** 단위 테스트(Unit Test) 및 통합 테스트(Integration Test)를 병렬 실행하여 회귀 버그(Regression)를 방지합니다.
- **테스트 커버리지 및 리포트:** 통과율과 커버리지 리포트를 PR에 게시하고, 실패 시 즉시 Slack/이메일 알림을 전송하여 통합을 차단합니다.

### 2. CD (지속적 제공 및 배포, Continuous Delivery / Deployment)
CI 검증을 통과한 코드를 배포 가능한 아티팩트로 만들고 스테이징에서 확인합니다. Continuous Delivery는 프로덕션 배포 전에 수동 승인을 둘 수 있으며, Continuous Deployment는 추가 수동 승인 없이 자동 배포합니다. 무중단 배포 여부는 별도 배포 전략과 환경 구성에 달려 있습니다.
- **컨테이너 이미지 빌드:** Dockerfile을 기반으로 불변(Immutable) 컨테이너 이미지를 빌드하고 태깅합니다.
- **레지스트리 Push:** 빌드된 이미지를 ECR, Docker Hub 등의 안전한 컨테이너 레지스트리에 업로드합니다.
- 스테이징 배포 & E2E 검증: 실환경과 유사한 스테이징 환경에 배포 후 종단간(E2E) 스모크 테스트를 수행합니다.
- **무중단 프로덕션 배포:** Blue-Green 배포(트래픽 즉각 스왑) 또는 Canary 배포(점진적 카나리 롤아웃) 기법으로 서비스 중단 없이 배포를 완료합니다.
- **실시간 모니터링:** 프로미테우스(Prometheus), 그라파나(Grafana), Sentry를 통해 에러율과 레이턴시를 감시하고 이상 발생 시 자동 롤백(Rollback)합니다.

### 참고 자료
- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)`,
  learningObjectives: ["Continuous Delivery와 Continuous Deployment의 승인 차이를 구분할 수 있다."],
  commonMistakes: ["CI/CD 자동화가 모든 프로젝트에서 동일한 파이프라인 순서와 무중단 배포를 보장하는 것은 아닙니다."],
  keyTakeaways: ["CI는 변경 검증, Delivery는 배포 가능한 상태의 유지, Deployment는 승인 없는 자동 배포로 구분합니다."],
  exercises: [{"question":"테스트 통과 후 운영 배포에 수동 승인을 유지할 수 있는 방식은?","options":["Continuous Delivery","Continuous Deployment만 가능","버전 관리 없이 수동 파일 복사"],"answerIndex":0,"explanation":"Continuous Delivery는 자동 검증과 배포 준비를 수행하며 최종 운영 배포에 승인 단계를 둘 수 있습니다."}],
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
    "GitHub Actions로 PR 마다 자동 테스트 및 Lint 실행",
    "Kubernetes 클러스터에 Zero-downtime 무중단 배포",
    "보안 취약점이 있는 코드가 프로덕션에 도달하기 전 자동 차단",
    "배포 주기를 월 1회에서 하루 수십 회로 단축"
  ],
  related: [
    { slug: "docker-before-after", category: "workflow", relation: "CI/CD 아티팩트 표준 단위인 Docker 이미지 빌드" },
    { slug: "k8s-before-after", category: "workflow", relation: "CI/CD 배포 타겟 오케스트레이션 클러스터" }
  ]
};
