export type Category = 'workflow' | 'algorithm';

export interface ContentItem {
  slug: string;
  category: Category;
  title: string;
  subtitle: string;
  tags: string[];
  description: string;
  examples: string[];
}

export const contentData: ContentItem[] = [
  {
    slug: 'google-dns',
    category: 'workflow',
    title: 'google.com을 주소창에 입력하면 어떤 일이 일어나는가',
    subtitle: 'Browser to Server: The Lifecycle of a Web Request',
    tags: ['Networking', 'DNS', 'HTTP', 'Browser'],
    description: `웹 브라우저의 주소창에 URL을 입력하고 엔터를 누르는 순간부터 화면에 웹 페이지가 렌더링될 때까지의 과정은 수많은 네트워크 프로토콜과 시스템의 정교한 협력을 통해 이루어집니다. 이 시각화는 캐시 확인부터 DNS 조회, TCP 핸드셰이크, HTTP 요청, 브라우저 렌더링에 이르는 전체 흐름을 단계별로 보여줍니다.

각 단계는 밀리초 단위로 발생하지만, 전 세계에 분산된 인프라를 거치며 신뢰성 있고 안전한 통신을 보장하기 위한 중요한 역할을 수행합니다. 분산 시스템과 웹 아키텍처의 기본을 이해하는 데 필수적인 개념입니다.`,
    examples: [
      '웹 사이트 접속 및 페이지 렌더링 과정 이해',
      '네트워크 지연 시간(Latency) 최적화 포인트 파악',
      '프론트엔드 성능 최적화(Critical Rendering Path)의 기초',
      '웹 애플리케이션 보안(TLS/SSL) 계층 이해'
    ]
  },
  {
    slug: 'rest-vs-grpc',
    category: 'workflow',
    title: 'REST API vs gRPC',
    subtitle: 'Comparing Modern API Architectures',
    tags: ['API', 'Architecture', 'Microservices', 'Protocols'],
    description: `마이크로서비스 아키텍처에서 서비스 간 통신 방식은 시스템 전체의 성능과 확장성에 큰 영향을 미칩니다. 전통적으로 가장 널리 사용되는 REST(Representational State Transfer)와 구글에서 개발한 고성능 RPC 프레임워크인 gRPC는 서로 다른 장단점을 가지고 있습니다.

REST는 HTTP/1.1을 기반으로 가독성이 높은 JSON 형식을 사용하여 범용성과 호환성이 뛰어납니다. 반면 gRPC는 HTTP/2를 기반으로 효율적인 이진 직렬화 포맷인 Protocol Buffers(Protobuf)를 사용하여 페이로드 크기를 줄이고 양방향 스트리밍을 지원합니다. 이 시각화를 통해 두 프로토콜의 통신 방식과 성능 차이를 직접 비교해 볼 수 있습니다.`,
    examples: [
      '마이크로서비스 간 내부 통신(Internal Communication)',
      '모바일 애플리케이션의 데이터 동기화',
      '실시간 양방향 데이터 스트리밍 서비스',
      'Public API 및 서드파티 연동 시스템 구축'
    ]
  },
  {
    slug: 'sieve-of-eratosthenes',
    category: 'algorithm',
    title: '에라토스테네스의 체',
    subtitle: 'Sieve of Eratosthenes: Finding Primes Efficiently',
    tags: ['Algorithm', 'Math', 'Optimization'],
    description: `에라토스테네스의 체(Sieve of Eratosthenes)는 고대 그리스의 수학자 에라토스테네스가 고안한 소수(Prime Number)를 찾는 빠르고 효율적인 알고리즘입니다. 특정 범위 내의 모든 소수를 찾아야 할 때 널리 사용되며, 시간 복잡도는 O(N log log N)으로 매우 우수합니다.

알고리즘의 동작 방식은 간단합니다. 2부터 시작하여 특정 수의 배수들을 차례대로 지워나갑니다(체로 거릅니다). 지워지지 않고 남은 수들이 바로 소수입니다. 이 대화형 시각화를 통해 배수들이 걸러지는 과정과 남은 소수들의 패턴을 직관적으로 이해할 수 있습니다.`,
    examples: [
      '암호학(Cryptography)의 기초가 되는 큰 소수 탐색',
      '코딩 테스트 및 알고리즘 문제 해결(소수 판별 최적화)',
      '정수론(Number Theory) 및 수학적 패턴 분석',
      '데이터 압축 및 해싱 알고리즘'
    ]
  }
];