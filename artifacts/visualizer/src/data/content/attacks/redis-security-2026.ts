import type { ContentItem } from "../content-types";

export const redisSecurity2026Content: ContentItem = {
  slug: "redis-security-2026",
  category: "attack",
  title: "Redis 2026 보안 권고 — 메모리 손상과 조건부 RCE",
  subtitle: "2026년 5월 5일 Redis 공식 권고 · 5개 CVE의 공격 원리와 해결 과정",
  tags: ["Redis", "RESTORE", "Lua", "Use-After-Free", "RCE", "RedisTimeSeries", "RedisBloom",
    "CVE-2026-23479", "CVE-2026-25243", "CVE-2026-25588", "CVE-2026-25589", "CVE-2026-23631"],
  description: "2026년 5월 5일 Redis는 인증된 사용자가 악용할 수 있는 **5가지 메모리 안전성 취약점**을 공개했습니다. 네 건은 CVSS 7.7(High), 한 건은 CVSS 6.1(Medium)입니다. 취약 경로에 진입하면 메모리 손상과 조건부 원격 코드 실행(RCE)이 가능하지만 **인증 우회나 무조건적인 RCE를 뜻하지 않습니다.** [Redis 공식 권고](https://redis.io/blog/security-advisory-cve202623479-cve202625243-cve-2026-25588-cve202625589-cve-2026-23631/)\n\n### 다섯 CVE의 차이\n\n| CVE | CVSS | 취약 경로 | 성립 조건과 영향 |\n| --- | --- | --- | --- |\n| CVE-2026-23479 | 7.7 High | 차단된 클라이언트의 재실행·축출 | 오류 반환이 처리되지 않아 Use-After-Free(UAF), 조건부 RCE |\n| CVE-2026-25243 | 7.7 High | 기본 RESTORE 역직렬화 | 인증 사용자의 조작된 직렬화 데이터 → 잘못된 메모리 접근 |\n| CVE-2026-25588 | 7.7 High | RESTORE + RedisTimeSeries | 모듈 사용 환경에서 특수 데이터 복원 중 잘못된 메모리 접근 |\n| CVE-2026-25589 | 7.7 High | RESTORE + RedisBloom | 모듈 사용 환경에서 특수 데이터 복원 중 잘못된 메모리 접근 |\n| CVE-2026-23631 | 6.1 Medium | Lua + 복제 동기화 | replica-read-only가 비활성화된 레플리카의 UAF 가능 |\n\n**다섯 CVE는 독립적인 결함**입니다. RESTORE의 세 가지 문제는 하나의 연속 공격 단계가 아니며, 각 모듈의 사용 여부를 확인해야 합니다. 공식 권고는 공통적으로 인증된 접근이 필요한 공격면이라고 명시합니다.\n\n### CVE-2026-23479 — 클라이언트 재개 중 해제 후 사용\n\n차단된 클라이언트의 명령을 다시 실행하는 도중 해당 클라이언트가 축출되는 경우 문제가 생깁니다. 내부 처리 함수 processCommandAndResetClient가 오류 값을 돌려주는 경로를 올바르게 처리하지 않아 이미 해제된 상태를 다시 참조할 수 있습니다.\n\n1. 인증 사용자의 명령이 차단된 뒤 재실행 경로로 이동합니다.\n2. 재실행 도중 클라이언트 축출이 발생합니다.\n3. 오류 반환이 처리되지 않으면 유효하지 않은 클라이언트 상태를 사용할 수 있습니다.\n4. 이 UAF가 추가 악용 조건과 결합하면 Redis 프로세스 권한의 RCE가 가능할 수 있습니다.\n\n### CVE-2026-25243 — 기본 RESTORE의 메모리 접근 오류\n\nRESTORE는 직렬화된 Redis 데이터를 키로 복원하는 명령입니다. 인증된 사용자가 RESTORE를 통해 **특수하게 조작된 직렬화 데이터**를 전달하면 복원 처리 중 유효하지 않은 메모리 접근이 발생할 수 있습니다. 공식 글은 조건부 RCE와 데이터 유출, 서비스 중단 가능성을 설명합니다. 이 페이지는 악용 가능한 바이트 배열이나 재현 명령을 제공하지 않습니다.\n\n### CVE-2026-25588 — RedisTimeSeries RESTORE 처리\n\n**RedisTimeSeries 모듈을 사용하는 경우** 해당 모듈의 RESTORE 경로에서 조작된 직렬화 데이터로 잘못된 메모리 접근을 유도할 수 있습니다. 기본 RESTORE와 구분하며, Redis 본체뿐 아니라 RedisTimeSeries의 설치·수정 버전을 함께 확인해야 합니다.\n\n### CVE-2026-25589 — RedisBloom RESTORE 처리\n\n**RedisBloom 모듈을 사용하는 경우** 모듈의 직렬화 데이터 복원 경로에서 잘못된 메모리 접근이 발생할 수 있습니다. RedisTimeSeries와 다른 취약점이며, 모듈별 보안 수정 빌드를 구분해야 합니다.\n\n### CVE-2026-23631 — Lua·복제 동기화의 UAF\n\n인증된 사용자가 마스터·레플리카 동기화 관련 경로를 악용하면 Lua 스크립팅을 사용하는 Redis에서 UAF가 발생할 수 있습니다. Redis 공식 권고는 **replica-read-only가 비활성화되어 있거나 그렇게 구성될 수 있는 레플리카**를 영향 조건으로 제시합니다. 모든 읽기 전용 레플리카가 이 취약점에 노출된다고 단정해서는 안 됩니다.\n\n### 제품별 수정 릴리스\n\n다음 버전은 **2026년 5월 5일 공식 권고에 표기된 수정 릴리스**입니다. 운영 환경에서는 현재 지원 중인 버전·공급자 백포트·후속 보안 업데이트도 확인합니다.\n\n| 제품 또는 모듈 | 권고에 기재된 수정 릴리스 | 적용 대상 |\n| --- | --- | --- |\n| Redis OSS / CE | 6.2.22, 7.2.14, 7.4.9, 8.2.6, 8.4.3, 8.6.3 | 공식 표에 기재된 해당 계열의 다섯 CVE 수정 |\n| Redis Software | 8.0.10-64, 7.22.2-79, 7.8.6-253, 7.4.6-279, 7.2.4-153 | 앞선 네 CVE의 Software 수정 빌드 |\n| RedisTimeSeries | 1.12.14, 1.10.24, 1.8.23 | CVE-2026-25588 모듈 수정 |\n| RedisBloom | 2.8.20, 2.6.28, 2.4.23 | CVE-2026-25589 모듈 수정 |\n| Redis Cloud | 발표 당시 서비스에 수정 빌드 적용 완료 | Cloud 고유 버전 체계 사용 가능 |\n\nRedis Software의 앞선 네 CVE 영향 범위는 공식 발표 기준 **8.0.6 이하**이며, 이미 수정된 특정 빌드 또는 동일 계열 후속 수정 릴리스는 예외입니다. **CVE-2026-23631은 공식 표에서 OSS의 레플리카 설정 조건으로 별도 제시**되므로 Software의 수정 버전 목록을 그 CVE에 임의로 적용하지 않습니다.\n\n### 운영 환경의 해결 과정\n\n1. **자산 파악:** 실제 실행 중인 Redis OSS/CE, Software, Cloud 버전과 모든 레플리카·클러스터 노드·설치 모듈을 조사합니다. Lua 사용 여부와 replica-read-only 설정을 확인합니다.\n2. **접근 경계 강화:** 신뢰된 네트워크에서만 Redis에 접근하도록 방화벽·네트워크 정책을 설정하고 강한 인증을 적용합니다. ACL로 RESTORE와 스크립트 등 위험도가 큰 명령을 필요한 사용자에게만 허용합니다.\n3. **패치:** 각 제품 계열에 맞는 최신 보안 수정 버전으로 업그레이드합니다. RedisTimeSeries·RedisBloom을 사용한다면 **Redis 본체뿐 아니라 모듈의 수정 버전**도 적용합니다.\n4. **적용 확인:** 배포된 서버·모듈의 실제 실행 버전, 레플리카 상태, 설정 및 서비스 정상 동작을 확인합니다. 복제 구성은 백업과 롤링 업데이트 계획을 먼저 마련합니다.\n5. **침해 점검:** 비인가 접속·네트워크 인그레스/이그레스, 예상 밖 Redis 명령 실행, Redis 크래시(특히 Lua 스택), Redis 사용자 권한의 이상 프로세스, 영속화·설정 파일의 알 수 없는 변경을 확인합니다.\n6. **의심 정황 대응:** 증거 보존·격리·자격 증명 점검·데이터 무결성 검증을 수행합니다. 패치 적용만으로 이미 발생한 침해가 없었다고 결론 내릴 수는 없습니다.\n\n**접속 제한·인증·ACL은 보조 통제이며 보안 패치를 대체하지 않습니다.** Redis는 공식 발표 당시 자사 또는 고객 환경에서 이 취약점들의 악용 증거를 확인하지 못했다고 밝혔지만, 모든 환경의 안전을 보증하지는 않습니다.\n\n### 시각화 해석 및 공식 출처\n\n상단에서 5개 CVE를 전환할 수 있습니다. 요청 사용자·인증/ACL·Redis 명령 처리기·취약 서브시스템·메모리·결과 도형은 유지되며, 현재 단계의 데이터·참조 상태와 경로만 강조합니다. 이는 공식 권고를 바탕으로 한 **개념적인 공격 과정**으로, 검증된 페이로드·실측 타이밍·익스플로잇 실행 결과가 아닙니다.\n\n- [Redis 보안 권고 및 영향·수정 버전 표](https://redis.io/blog/security-advisory-cve202623479-cve202625243-cve-2026-25588-cve202625589-cve-2026-23631/)\n- [Redis 다운로드 및 최신 버전 확인](https://redis.io/downloads/)",
  steps: [
    "인증된 사용자의 접근 — 다섯 취약점은 모두 인증 후 공격면에 해당합니다.",
    "명령·동기화 경로 진입 — 차단 명령 재실행, RESTORE, Lua와 레플리카 동기화 경로가 각각 다릅니다.",
    "취약한 내부 처리 — 축출 오류, 역직렬화, RedisTimeSeries·RedisBloom 복원, 복제 상태가 주요 분기점입니다.",
    "메모리 안전성 위반 — Use-After-Free 또는 잘못된 메모리 접근으로 서버 내부 상태가 손상될 수 있습니다.",
    "조건부 영향 — 악용 환경에 따라 Redis 서버 권한의 RCE, 정보 유출 및 서비스 장애가 가능해집니다.",
    "보안 수정 및 재검증 — 제품·모듈 수정 버전을 적용하고 ACL, 노드 설정, 로그·복제 상태를 점검합니다.",
  ],
  examples: [
    "RESTORE 명령 권한과 인증·ACL 설정 점검",
    "RedisTimeSeries / RedisBloom 사용 여부 및 모듈 수정 버전 확인",
    "Lua 스크립팅과 replica-read-only 비활성화 여부 점검",
    "OSS/CE와 Redis Software 버전 체계 및 공급자 수정 빌드 구분",
    "알 수 없는 연결, Redis 크래시, 이상 프로세스 및 설정 파일 변경 탐지",
  ],
  learningObjectives: [
    "5개 CVE의 공격 전제와 취약 처리 경로를 구분한다.",
    "모듈별 수정 릴리스와 Redis 본체의 버전 체계를 구분한다.",
    "권한 제한과 패치, 사고 대응의 역할이 다른 이유를 설명한다.",
  ],
  commonMistakes: [
    "5개 취약점을 인증 우회형 RCE로 설명하는 것",
    "RedisTimeSeries와 RedisBloom 미설치 환경에도 모듈 관련 CVE가 동일하게 성립한다고 단정하는 것",
    "Lua UAF의 replica-read-only 설정 조건을 생략하는 것",
    "Redis Software 수정 빌드와 OSS/CE 수정 버전을 혼동하는 것",
  ],
  exercises: [
    { question: "CVE-2026-25588에 대해 우선 확인할 환경 조건은?",
      options: ["RedisTimeSeries 사용 여부", "HTTP 헤더 크기", "RedisBloom 비트셋만 확인", "기본 DB 번호"],
      answerIndex: 0, explanation: "해당 CVE는 RedisTimeSeries 모듈의 RESTORE 경로에 관한 취약점입니다." },
    { question: "CVE-2026-23631에서 특히 중요한 레플리카 설정은?",
      options: ["appendonly", "maxmemory", "replica-read-only", "tcp-keepalive"],
      answerIndex: 2, explanation: "공식 권고는 replica-read-only가 비활성화된 레플리카의 Lua·복제 동기화 문제를 지적합니다." },
    { question: "Redis 인증과 내부망 접근 제한만으로 다섯 CVE를 모두 해결할 수 있나요?",
      options: ["예", "아니요, 수정 버전이 필요합니다", "Cloud에서만 불가능합니다"],
      answerIndex: 1, explanation: "이들은 인증 사용자가 유발할 수 있는 결함이므로 네트워크·인증 통제만으로 제거되지 않습니다." },
  ],
  keyTakeaways: [
    "인증 이후 메모리 안전성 문제 5건: 7.7점 네 건, 6.1점 한 건",
    "RESTORE 경로 세 건은 기본 Redis·TimeSeries·Bloom을 구분",
    "Lua UAF에는 복제 노드의 replica-read-only 설정 조건이 있음",
    "서버와 모듈에 각각 맞는 패치를 적용하고 탐지 지표를 조사",
  ],
  related: [
    { slug: "php2shell", category: "attack", relation: "메모리 손상을 통한 RCE 위험 비교" },
    { slug: "log4shell", category: "attack", relation: "인증·입력 조건이 다른 RCE 경로 비교" },
    { slug: "db-replication-sharding", category: "workflow", relation: "Redis 레플리카 동기화 맥락" },
  ],
};
