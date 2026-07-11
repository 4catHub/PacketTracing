import { ContentItem } from "../content-types";

export const k8sBeforeAfterContent: ContentItem = {
    slug: "k8s-before-after",
    category: "workflow",
    title: "Kubernetes 적용 전/후 차이",
    subtitle: "단일 서버 장애 vs 자동 복구·스케일링 클러스터 비교",
    tags: [
    "Kubernetes",
    "k8s",
    "DevOps",
    "Orchestration"
],
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
    "(Before) 단일 서버 장애 → 서비스 전체 다운, 수동 복구까지 수분~수시간",
    "(Before) 트래픽 급증 → 수동 스케일 아웃, 느린 대응",
    "k8s Deployment 작성: 원하는 Pod 수(replicas)와 컨테이너 이미지 선언",
    "(After) Pod 장애 감지 → kubelet이 자동으로 새 Pod 재스케줄링 (수초 내)",
    "(After) HPA: CPU 70% 초과 시 Pod 자동 추가, 부하 감소 시 자동 축소",
    "(After) Rolling Update: 구 버전 Pod를 하나씩 교체 → 무중단 배포 보장"
],
    examples: [
    "프로덕션 파드 장애 시 수초 내 자동 복구",
    "이커머스 블랙프라이데이: 트래픽 급증 시 파드 자동 스케일 아웃",
    "Blue-Green 배포로 새 버전 즉시 롤백 가능한 무중단 릴리즈",
    "GitOps: Git에 YAML 푸시 → ArgoCD가 클러스터에 자동 적용"
],
};
