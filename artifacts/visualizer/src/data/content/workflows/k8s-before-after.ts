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
  description: `Kubernetes(k8s)는 수많은 컨테이너화된 애플리케이션의 배포, 확장(Scaling), 로드 밸런싱 및 자가 치유(Self-healing)를 자동화하는 클라우드 네이티브 오케스트레이션 플랫폼입니다.

### 1. Kubernetes 도입 이전의 운영 한계 (Before k8s)
단일 VM 또는 수동 Docker 운영 환경에서의 구조적 한계점입니다.
- **단일 장애점 (SPOF):** 서버 하드웨어나 프로세스가 다운되면 즉각 전체 서비스 장애로 확산됩니다.
- **수동 스케일링 지연:** 트래픽 급증 시 엔지니어가 수동으로 서버를 프로비저닝하고 로드 밸런서를 설정해야 하므로 대응이 늦어집니다.
- **배포 시 다운타임 발생:** 신규 버전 배포 시 기존 프로세스를 중단하고 재시작하는 동안 사용자 요청 유실이 발생합니다.
- **파편화된 리소스 관리:** 서버별 CPU/메모리 사용률이 불균형하여 하드웨어 자원이 심각하게 낭비됩니다.

### 2. Kubernetes 도입 이후의 오케스트레이션 혁신 (After k8s)
선언적 구성(Declarative Configuration)을 통해 클러스터가 목표 상태(Desired State)를 스스로 유지합니다.
- **자가 치유 (Self-Healing):** 파드(Pod)가 예기치 않게 죽거나 노드에 장애가 생기면, 컨트롤 플레인이 즉시 건강한 다른 워커 노드에 새 파드를 자동 재스케줄링합니다.
- 수평 자동 확장 (HPA, Horizontal Pod Autoscaler): 실시간 CPU/메모리 부하 및 커스텀 메트릭에 따라 파드 복제본(Replicas) 수를 동적으로 늘리고 줄입니다.
- **롤링 업데이트 (Rolling Update):** 구버전 파드를 새 버전 파드로 하나씩 점진 교체하여 무중단(Zero-downtime) 배포를 보장합니다.
- 서비스 디스커버리 & 로드 밸런싱: \`Service\` 오브젝트가 동적으로 생성/소멸하는 파드들의 IP를 자동 추적하고 트래픽을 균등 분산합니다.
- **선언적 인프라 (GitOps):** YAML 매니페스트 파일로 클러스터의 모든 구성을 코드로 정의(IaC)하여 배포 자동화를 완성합니다.`,
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
  related: [
    { slug: "docker-before-after", category: "workflow", relation: "K8s 파드 내부에서 가동되는 기본 컨테이너 런타임" },
    { slug: "cicd", category: "workflow", relation: "K8s 클러스터로 신규 아티팩트를 배포하는 자동화 파이프라인" },
    { slug: "api-gateway", category: "workflow", relation: "K8s 외부 트래픽을 파드로 안전하게 인그레스 라우팅" }
  ]
};
