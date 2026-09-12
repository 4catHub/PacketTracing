import { ContentItem } from "../content-types";

export const loadBalancingConsistentHashingContent: ContentItem = {
  slug: "load-balancing-consistent-hashing",
  category: "workflow",
  title: "로드 밸런싱과 Consistent Hashing",
  subtitle:
    "Round Robin, Least Connections, 해시 링과 서버 추가 시 재분배",
  tags: [
    "Load Balancing",
    "Consistent Hashing",
    "Round Robin",
    "Least Connections",
    "Distributed Systems",
  ],
  description: `로드 밸런싱은 지금 도착한 연결을 어느 서버가 처리할지 결정하고, Consistent Hashing은 특정 데이터 키를 어느 서버가 계속 소유할지 결정합니다. 둘 다 트래픽을 여러 노드에 분산하지만, 전자는 실행 중인 부하를 다루고 후자는 서버 증감에도 데이터 위치가 크게 흔들리지 않도록 만드는 문제입니다.

## 1. 요청이 서버에 도달하는 흐름
클라이언트는 개별 서버가 아니라 로드 밸런서의 단일 엔드포인트로 연결합니다. 로드 밸런서는 Health Check를 통과한 서버 집합에서 정책에 맞는 대상을 선택하고 요청 또는 연결을 전달합니다.
- **L4 Load Balancing:** IP, 포트, TCP 연결 정보를 중심으로 빠르게 분산합니다.
- **L7 Load Balancing:** HTTP 경로, 헤더, 쿠키처럼 애플리케이션 계층의 정보를 이용할 수 있습니다.
- **장애 제외:** 비정상 서버는 선택 후보에서 제거하고, 복구 확인 후 다시 편입합니다.
- **상태 경계:** Stateless API는 어느 서버에서도 요청을 처리할 수 있어 재시도와 수평 확장이 단순합니다. 로컬 세션이 필요하면 외부 저장소나 별도의 친화성 정책이 필요합니다.

## 2. Round Robin과 Least Connections
두 정책은 같은 서버 집합을 사용해도 서로 다른 정보를 보고 결정을 내립니다.

| 정책 | 선택 기준 | 장점 | 주의점 |
|---|---|---|---|
| Round Robin | 순환 포인터 | 서버 상태 수집 없이 단순하고 예측 가능 | 연결 시간과 요청 비용 차이를 반영하지 못함 |
| Least Connections | 최소 활성 연결 수 | 장시간 연결이 섞인 환경에서 동시 부하를 더 잘 반영 | 정확한 연결 카운터가 필요하며 CPU·쿼리 비용까지 알지는 못함 |

- **Weighted 정책:** 서버 성능이 다르면 가중치를 적용해 더 강한 서버에 더 많은 연결을 배정합니다.
- **동률 처리:** Least Connections의 최솟값이 같으면 서버 순서, Round Robin, 무작위 선택 같은 보조 규칙을 사용합니다.
- **Slow Start:** 새 서버가 빈 연결 수만 보고 요청을 한꺼번에 받지 않도록 유입량을 점진적으로 늘릴 수 있습니다.

## 3. Consistent Hashing의 해시 링
서버 토큰과 데이터 키를 같은 해시 공간의 링 위에 배치합니다. 각 키는 자신의 위치에서 시계 방향으로 처음 만나는 서버가 소유합니다.
- **결정적 매핑:** 서버 구성이 같으면 같은 \`user_id\`, \`cache_key\`, \`partition_key\`는 같은 서버로 향합니다.
- **일반 나머지 연산과의 차이:** \`hash(key) % N\`은 서버 수 \`N\`이 변하면 많은 키가 다시 매핑됩니다. Consistent Hashing은 새 노드가 인수하는 링 구간으로 이동 범위를 제한합니다.
- **적용 계층:** 분산 캐시, 데이터베이스 샤드, CDN, 오브젝트 스토리지처럼 데이터 위치의 안정성이 필요한 곳에 사용합니다.

## 4. Server D 추가와 안전한 재분배
시각화에서 기존 서버 A, B, C는 각각 30°, 150°, 270°에 있습니다. Server D가 215°에 합류하면 새 소유 구간은 \`150° < h(key) ≤ 215°\`입니다.
- **영향받는 키:** K3(174°)과 K4(201°)만 기존 소유자 C에서 D로 복사됩니다.
- **유지되는 키:** K1, K2, K5, K6의 해시 위치와 소유 서버는 바뀌지 않습니다.
- **전환 순서:** D를 JOINING 상태로 등록하고 대상 구간을 복사한 뒤, 버전이 갱신된 링으로 읽기·쓰기 소유권을 전환합니다. 수렴이 확인되면 C의 이전 복제본을 정리합니다.

## 5. Virtual Node와 운영 기준
물리 서버를 링에 한 점씩만 배치하면 우연히 큰 구간을 소유하는 서버가 생길 수 있습니다. 한 물리 서버를 여러 Virtual Node로 분산하면 키 수와 재분배 작업을 더 균일하게 나눌 수 있습니다.
- **가중치:** 서버 용량에 비례해 Virtual Node 수를 다르게 두거나 가중 토큰을 사용합니다.
- **복제:** 한 키를 시계 방향의 여러 서버에 복제하면 장애 시 다음 복제본이 서비스를 이어갈 수 있습니다.
- **관측:** 요청률, 활성 연결, 지연 시간, 오류율, 저장 키 수와 바이트를 함께 확인해야 실제 균형을 판단할 수 있습니다.
- **선택 기준:** 짧고 균일한 Stateless 요청은 Round Robin, 연결 시간이 다양한 트래픽은 Least Connections, 데이터 친화성과 최소 재배치는 Consistent Hashing에 적합합니다.`,
  steps: [
    "클라이언트 연결이 로드 밸런서에 도착하면 Health Check를 통과한 서버만 선택 후보가 됩니다.",
    "Round Robin은 기존 활성 연결 수를 읽지 않고 A → B → C 순환 포인터에 따라 다음 서버를 선택합니다.",
    "Least Connections는 같은 연결에 대해 활성 연결 수가 가장 작은 서버를 선택하고, 동률은 보조 규칙으로 해소합니다.",
    "Consistent Hashing은 키의 해시 위치에서 시계 방향으로 처음 만나는 서버를 데이터 소유자로 정합니다.",
    "Server D가 215°에 JOINING 상태로 합류하면 `(150°, 215°]` 구간의 K3·K4만 C에서 D로 복사됩니다.",
    "데이터 복사가 끝나면 링 버전을 전환하고, Virtual Node·가중치·복제로 균형과 장애 대응을 보완합니다.",
  ],
  examples: [
    "Stateless API 서버 팜 — 비용이 비슷한 짧은 요청을 Round Robin으로 단순 분산",
    "WebSocket·스트리밍 게이트웨이 — 연결 유지 시간이 달라 Least Connections로 동시 부하 완화",
    "Redis·Memcached 클라이언트 샤딩 — Consistent Hashing으로 캐시 키의 소유 노드를 안정적으로 선택",
    "분산 데이터베이스 샤딩 — 서버 증설 시 이동 데이터 범위를 제한해 리밸런싱 비용 절감",
    "CDN·오브젝트 스토리지 — 객체 키를 노드에 결정적으로 배치하고 복제본 위치 계산",
    "이기종 서버 클러스터 — Weighted 정책과 Virtual Node 개수로 용량 차이를 반영",
  ],
  related: [
    {
      slug: "proxy-vs-reverse-proxy",
      category: "workflow",
      relation: "로드 밸런서의 기반이 되는 Reverse Proxy 요청 전달 구조",
    },
    {
      slug: "api-gateway",
      category: "workflow",
      relation: "라우팅 앞단에서 인증과 Rate Limiting을 함께 수행하는 진입점",
    },
    {
      slug: "cache-replacement",
      category: "algorithm",
      relation: "분산 캐시 내부에서 공간이 부족할 때 항목을 교체하는 정책",
    },
  ],
};
