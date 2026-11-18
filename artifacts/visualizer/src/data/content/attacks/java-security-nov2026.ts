import type { ContentItem } from "../content-types";

export const javaSecurityNov2026Content: ContentItem = {
  slug: "java-security-nov2026",
  category: "attack",
  title: "Java 보안 업데이트 — XXE·힙 손상·통신 경계",
  subtitle:
    "2026년 11월의 6개 CVE를 공격 조건, 구성요소 내부의 변화, 패치와 운영 확인으로 따라가기",
  tags: ["Java", "Java4Shell", "XXE", "SSRF", "JIT", "JGSS", "JSSE"],
  description: `외부 XML·Base64·통신 입력이 Java의 처리 경계를 넘을 때 생기는 위험을 살펴보고, CVE별 적용 조건과 수정 배포 후 확인 순서를 비교합니다.

## 여섯 취약점은 어떻게 다른가?

**확인 기준: 2026-11-18.** Oracle의 11월 CSPU 중 요청된 여섯 항목을 다룹니다. NVD 본문은 **2026-11-18 저장 PDF 6종** 으로 대조했습니다. 아래 첫 표의 CVSS는 **Oracle 제품 맥락의 3.1 점수** 입니다. 아래 표의 영향 버전은 Oracle이 나열한 지원 빌드이며, 전체 도입 버전이나 모든 OpenJDK 배포판의 범위를 뜻하지 않습니다. [Oracle 위험도 표와 적용 조건](https://www.oracle.com/security-alerts/cspunov2026.html)

| CVE | 구성요소 / 점수 | Oracle Java SE 영향 빌드 | 공격 조건과 영향 |
| --- | --- | --- | --- |
| **CVE-2026-86144** | JavaFX·libxml2 / **7.5** | 8u511b33; 별도 JavaFX 21.0.13, 25.0.5, 27.0.1 | **사용자 상호작용 필요**. Oracle Note 2의 비신뢰 코드·샌드박스 배포에 적용 |
| **CVE-2026-114938** | Compiler / **8.1** | 8u511b33-perf, 17.0.21.0.3, 21.0.13.0.3, 25.0.5.0.3, 27.0.1.0.3 | 해당 API에 공급되는 데이터; 기밀성·무결성·가용성 영향 높음 |
| **CVE-2026-114939** | JGSS / **7.4** | 8u511b33, 8u511b33-perf, 11.0.33.0.3, 17.0.21.0.3, 21.0.13.0.3, 25.0.5.0.3, 27.0.1.0.3 | **Note 2**; 정보 노출·변조 |
| **CVE-2026-114940** | JSSE·TLS / **7.4** | 위 JGSS 행과 동일 | **Note 3**; API 경로 및 비신뢰 코드 배포, 정보 노출·변조 |
| **CVE-2026-114941** | Compiler / **7.0** | 21.0.13.0.3, 25.0.5.0.3, 27.0.1.0.3 | API 경로; 가용성 높음, 기밀성·무결성 낮음 |
| **CVE-2026-114942** | Libraries / **7.0** | 21.0.13.0.3, 25.0.5.0.3, 27.0.1.0.3 | API 경로; 가용성 높음, 기밀성·무결성 낮음 |

여섯 항목 모두 Oracle 표에서 네트워크·인증 불필요·높은 공격 복잡도로 분류됩니다. **인증 불필요가 곧 모든 Java 서버에서 악용 가능하다는 뜻은 아닙니다.** Note 2는 비신뢰 Java 코드를 실행하고 샌드박스에 의존하는 배포에 관한 조건이며, 관리자 설치 코드만 실행하는 일반 서버에는 적용되지 않는다고 Oracle이 설명합니다. Note 1은 컴포넌트 API에 입력되는 데이터 경로, Note 3은 두 배포 유형을 포함합니다.

### NVD 점수와 CWE를 어떻게 읽나?

NVD는 **NIST 자체 평가** 와 **CNA가 제공한 평가** 를 구분합니다. PDF의 114938~114942는 **RECEIVED** 상태이며 NIST 점수는 **N/A · 평가 전** 입니다. 표시된 8.1·7.4·7.0은 Oracle CNA 점수입니다. 취약점이 없거나 위험이 0이라는 뜻이 아닙니다.

| CVE | NIST / NVD 평가 | CNA 평가 | CWE와 제공 주체 |
| --- | --- | --- | --- |
| **86144** | **7.8 High** | MITRE **5.6 Medium** | **CWE-669** · 자원 영역 간 잘못된 전달 / MITRE |
| **114938** | 평가 전 | Oracle **8.1 High** | **CWE-122** · 힙 기반 버퍼 오버플로 / CISA-ADP |
| **114939 / 114940** | 평가 전 | Oracle **7.4 High** | 저장본에 CWE 값 없음 |
| **114941 / 114942** | 평가 전 | Oracle **7.0 High** | 저장본에 CWE 값 없음 |

86144는 **같은 식별자라도 평가 주체·제품 맥락이 다른 경우** 입니다. NVD의 libxml2 평가 **7.8**, MITRE **5.6**, Oracle JavaFX 제품 평가 **7.5** 를 섞어 하나의 점수로 부르지 않습니다. NVD 벡터는 로컬·낮은 권한 필요·사용자 상호작용 불필요이고, Oracle 표는 JavaFX 배포 조건에서 네트워크·상호작용 필요로 평가합니다. 하나의 벡터를 다른 제품의 공격 조건에 그대로 대입하지 않습니다.

[86144 · NVD 점수·CWE](https://nvd.nist.gov/vuln/detail/cve-2026-86144) · [114938 · Oracle 점수·CISA-ADP CWE](https://nvd.nist.gov/vuln/detail/cve-2026-114938) · [114939 · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114939) · [114940 · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114940) · [114941 · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114941) · [114942 · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114942)

### GraalVM도 제품별로 대조

| 대상 CVE | Oracle GraalVM for JDK | Oracle GraalVM Enterprise Edition |
| --- | --- | --- |
| 114938 / 114939 / 114940 | **17.0.21.0.3, 21.0.13.0.3** | **21.3.20.0.3** |
| 114941 / 114942 | **21.0.13.0.3** | 해당 NVD 저장본의 영향 제품 목록에 없음 |

제품 목록에 없다는 사실을 모든 과거·미지원 버전의 안전 판정으로 확대하지 않습니다. 운영 중인 공급자·제품·전체 빌드를 해당 CVE의 목록과 대조합니다.

## CVE-2026-86144 · XInclude가 보안 설정을 이어받지 못함

libxml2는 XML 문서를 읽고, **XInclude** 는 문서 안에서 다른 자원을 포함하는 기능입니다. 공개 설명에 따르면 2.15.4 이전의 **xmlXIncludeProcess / xmlXIncludeProcessTree** 에서 파싱 옵션인 **parseFlags** 가 후속 처리로 전달되지 않습니다. 그 결과 네트워크 제한 옵션 **XML_PARSE_NONET** 에 의존하던 코드에서도, 인터넷에 접근하는 커스텀 리소스 로더가 연결되면 예상 밖 자원 접근이 가능해집니다. [NVD의 원인·영향 범위](https://nvd.nist.gov/vuln/detail/cve-2026-86144) · [Ubuntu 백포트 기록](https://ubuntu.com/security/CVE-2026-86144) · [NVD가 연결한 업스트림 수정](https://github.com/GNOME/libxml2/commit/b63cd517afecb76582dd9488c55e54ceaf50de61)

1. 외부에서 온 문서가 포함 자원 참조를 가지고 처리 경로에 진입합니다.
2. 상위 파서는 네트워크 접근 제한을 설정하지만, XInclude 처리로 넘어갈 때 옵션 전달이 빠집니다.
3. 커스텀 로더가 외부 또는 내부 자원으로 요청을 보낼 수 있습니다. **요청을 대신 수행하는 주체** 가 애플리케이션 프로세스라는 점이 SSRF의 핵심입니다.
4. XXE·SSRF 또는 느린 자원에 의한 서비스 지연이 발생할 수 있습니다. 특정 파일 유출이나 특정 내부 주소 접근이 항상 성공한다는 의미는 아닙니다.

### 실제 패치에서 바뀐 부분

NVD가 Patch로 연결한 **b63cd517afec** 수정은 옵션 전달과 회귀 시험을 함께 포함합니다.

| 처리 지점 | 수정 전 → 수정 후 |
| --- | --- |
| 문서 단위 XInclude | 기본 플래그 0 → **문서의 parseFlags 전달** |
| 트리 단위 XInclude | 기본 플래그 0 → **소속 문서의 parseFlags 전달** |
| 텍스트 자원 로딩 | 자원 읽기 전에 **하위 파서에 XInclude의 옵션 적용** |
| 회귀 시험 | 네트워크 제한 상태에서 외부 포함 요청이 거부되고 fallback이 선택되는지 확인 |

시각화의 수정 경로는 **옵션 유지 → 네트워크 요청 거부 → fallback 처리** 를 따릅니다. fallback은 테스트 XML에서 제공하는 대체 내용이며, 모든 문서가 자동으로 대체 내용을 가진다는 뜻은 아닙니다. [수정 코드·회귀 시험](https://github.com/GNOME/libxml2/commit/b63cd517afecb76582dd9488c55e54ceaf50de61)

**수정의 핵심은 하위 처리까지 옵션을 전파하는 것** 입니다. 업스트림 기준 2.15.4와 배포판의 보안 백포트는 버전 표기가 다를 수 있습니다. JavaFX에 번들된 네이티브 라이브러리는 해당 JavaFX 공급자의 수정 배포로 교체합니다. OS의 libxml2 패키지만 갱신해 번들 라이브러리까지 고쳐졌다고 판단하지 않습니다.

시각화는 libxml2의 공개 원인을 설명합니다. 이 일반적인 원인 모델과 **Oracle JavaFX 제품의 Note 2·사용자 상호작용 조건** 은 함께 확인해야 합니다. Java의 JAXP 설정 예제를 이 네이티브 libxml2 경로의 직접 수정으로 제시하지 않습니다.

## CVE-2026-114938 · Base64에서 힙 경계를 넘는 쓰기

연구진이 **Java4Shell** 로 명명한 문제입니다. Compiler라는 분류는 여기서 애플리케이션의 소스 코드 컴파일 요청보다 **HotSpot의 JIT 최적화 경로** 를 가리킵니다. C2가 사용하는 x86-64 Base64 intrinsic에서 패딩이 있는 꼬리 부분의 저장 마스크 계산이 잘못되어 출력 영역 밖으로 쓸 수 있습니다. [발견 연구진의 기술 분석](https://calif.io/java4shell/) · [NVD · CWE-122 분류](https://nvd.nist.gov/vuln/detail/cve-2026-114938)

시각화의 바이트 칸은 정확한 exploit 오프셋을 재현하지 않는 **경계 설명용 모형** 입니다. 외부 입력 → Base64 디코더 → AVX-512 최적화 → 출력 경계 밖 쓰기 → 힙 손상 순서로 강조됩니다. 메모리 손상은 JVM 충돌이나 정보 노출로 이어질 수 있고, 연구진은 조건부 원격 코드 실행도 보고했습니다. 모든 서비스에서 동일한 결과가 보장되지는 않습니다.

**영향 여부는 버전·CPU·실제 코드 경로를 함께 확인** 합니다. Red Hat은 OpenJDK 17.0.6 이후의 관련 배포와 x86-64 AVX-512 VBMI 경로, 공격자 제어 Base64 입력을 조건으로 설명합니다. ARM64와 해당 CPU 기능이 없는 환경은 이 하드웨어 경로와 구분합니다. Oracle 표의 특수 **8u511b33-perf** 와 일반 OpenJDK 8을 동일시하지 않습니다. [Red Hat 운영 권고](https://access.redhat.com/security/vulnerabilities/RHSB-2026-018)

## JGSS·JSSE · 통신에서 신뢰를 세우는 경계

**CVE-2026-114939** 는 JGSS, **CVE-2026-114940** 은 JSSE에 속합니다. JGSS는 Kerberos 등을 통한 보안 컨텍스트와 메시지 보호에, JSSE는 Java의 TLS 통신에 관여합니다. Oracle은 두 항목의 기밀성·무결성 영향을 공개합니다. **구체적인 취약 함수·토큰·TLS 메시지·우회 방식은 확인한 자료만으로 확정하지 않습니다.** 시각화는 JGSS의 **비신뢰 코드·샌드박스 경계** 와 JSSE의 **통신 상대·TLS 채널·보호 레코드** 를 분리합니다. 구성요소의 역할과 공지된 영향 범위를 보여주는 개념 모델이며, 특정 Kerberos 티켓 위조나 TLS 인증서 우회를 재현하지 않습니다. [JGSS · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114939) · [JSSE · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114940) · [JGSS 기능 문서](https://docs.oracle.com/en/java/javase/25/security/java-generic-security-services-java-gss-api1.html) · [JSSE 기능 문서](https://docs.oracle.com/en/java/javase/25/security/java-secure-socket-extension-jsse-reference-guide.html)

- **JGSS:** 비신뢰 코드 배포라는 Note 2 조건을 먼저 확인합니다. 일반 서버의 SSO 전체가 이 CVE에 취약하다고 확대하지 않습니다.
- **JSSE:** TLS가 외부와 만나는 경로와 해당 API 사용 여부를 점검합니다. TLS 종료가 프록시에 있어도 Java의 외부 API 호출 등 별도 TLS 경로가 있는지 확인합니다.
- **업데이트 후 검증:** Kerberos 정상 로그인·정당하지 않은 인증 거부, TLS 정상 연결·실패 연결을 회귀 점검합니다. 이는 운영 권장 절차이며 공개되지 않은 exploit의 재현 시험은 아닙니다.

같은 업데이트의 JDK 17 릴리스 노트에는 Kerberos cross-realm transited 필드 검사 강화도 나옵니다. **이 변경을 CVE-2026-114939의 정확한 원인·패치라고 단정할 연결 근거는 확인하지 못했습니다.** cross-realm을 사용하는 환경은 업데이트 후 호환성 확인에 참고합니다. [JDK 17 업데이트 노트](https://www.oracle.com/java/technologies/javase/17-0-21-1-relnotes.html)

## CVE-2026-114941·114942 · API 입력에서 중단·데이터 영향까지

Compiler와 Libraries라는 **서로 다른 구성요소** 에 해당합니다. 첨부 NVD 본문은 **hang 또는 반복 가능한 crash에 의한 전체 서비스 거부** 와 일부 데이터의 **조회·갱신·삽입·삭제** 가능성을 명시합니다. C:L/I:L/A:H에서 L은 영향이 없다는 뜻이 아닙니다. 두 저장본의 CWE 표는 비어 있고 구체적인 취약 메서드, 트리거 입력, 세부 수정 코드는 제시되지 않습니다. 따라서 **114941도 Base64 문제라고 가정하거나, 114942를 역직렬화 취약점이라고 부르지 않습니다.**

Compiler는 **컴파일 처리 경로와 실행 상태 계기판**, Libraries는 **공용 API 모듈과 반환 데이터의 조회·변경 갈래** 로 구분합니다. 컴파일 도형은 역할을 설명하는 것으로 특정 컴파일 단계가 결함 위치라고 확정하지 않습니다. 점선과 물음표는 상세 동작을 확정하지 않았다는 표시입니다. 입력 크기 제한·타임아웃·프로세스 격리는 운영상 피해를 줄이는 보조 수단이며, 이 CVE의 취약 경로를 제거했다고 증명하지 않습니다. [Compiler · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114941) · [Libraries · NVD](https://nvd.nist.gov/vuln/detail/cve-2026-114942)

## 해결 과정 · 임시 완화 → 수정 배포 → 실행 상태 확인

**공급자가 공개한 수정** 과 **운영자가 수행할 검증 절차** 를 구분합니다. 여기서는 특정 서비스에서 실제 침해가 발생하고 복구됐다는 사고 회고를 주장하지 않습니다.

### 1. 실행 환경과 진입 경로 확인

- 서비스별 Java 공급자·전체 빌드·실행 경로, 컨테이너 이미지와 번들 JRE, 별도 JavaFX를 수집합니다.
- Base64·XML·TLS·JGSS 중 실제 사용하는 경로를 표시합니다. 114938은 JVM에 노출되는 CPU 기능도 확인합니다.
- 셸의 기본 java와 서비스의 java가 다를 수 있으므로 실행 프로세스의 경로와 시작 로그를 대조합니다.

### 2. 114938의 임시 완화

Red Hat과 연구진은 해당 HotSpot 환경에서 **-XX:-UseBASE64Intrinsics** 로 Base64 가속 경로를 끄는 방법을 안내합니다. **-XX:UseAVX=2** 는 더 넓게 AVX-512 사용을 제한하는 대안입니다. CPU·JVM 지원 여부와 성능을 사전 확인하고 재시작 후 실제 프로세스에 반영됐는지 점검합니다. UseAVX 옵션을 ARM64에 일괄 적용하지 않습니다. **이 옵션은 다른 다섯 CVE를 해결하지 않습니다.** [완화 안내](https://access.redhat.com/security/vulnerabilities/RHSB-2026-018)

### 3. 수정된 런타임·JavaFX로 교체

Oracle은 2026-11-17 수정 배포를 제공했습니다. 다음은 해당 릴리스의 **Oracle JDK 보안 기준** 입니다. 다른 공급자는 자체 수정 빌드와 백포트 권고를 따릅니다. JavaFX·GraalVM은 별도 제품의 공지를 확인합니다. [Oracle JDK 전체 기준표](https://www.oracle.com/java/technologies/javase/27all-relnotes.html)

| JDK 계열 | Oracle 수정 보안 기준 |
| --- | --- |
| 8 | **1.8.0_513-b04** |
| 11 / 17 | **11.0.33.1+4 / 17.0.21.1+4** |
| 21 / 25 / 27 | **21.0.13.1+4 / 25.0.5.1+4 / 27.0.1.1+4** |

### 4. 프로세스 재시작과 회귀 확인

컨테이너는 수정된 베이스 이미지로 재빌드·재배포하고, 서비스 프로세스가 새 런타임을 사용하는지 확인합니다. 단순 패키지 설치나 개발 PC의 버전 확인만으로 완료하지 않습니다. 정상 XML·Base64 처리, 외부 자원 접근 정책, TLS·Kerberos 연결, 오류율·재시작·메모리 지표를 점검합니다. 비정상 입력 시험은 통제된 검증 환경에서 수행합니다.

**실행 버전 확인은 패치 상태 확인이며 침해 부재의 증명은 아닙니다.** 침해 판단에는 해당 서비스의 접근·네트워크·프로세스 관측 자료가 필요합니다.

## 출처를 읽을 때 주의할 점

NVD 6건은 **2026-11-18 저장본의 본문·Metrics·Weakness Enumeration·Affected Products** 를 확인했습니다. 86144의 최초 공개는 **2026-09-05**, 마지막 수정은 **09-16** 이며, 나머지 5건의 NVD 공개·수정일은 **2026-11-18** 로 표시됩니다. Oracle 수정 배포일 11-17과 NVD 수록일을 구분합니다.

NVD와 Oracle은 영향·적용 조건·평가 근거, 연구진 분석은 Base64의 세부 원인, NVD가 연결한 libxml2 수정 커밋은 패치·회귀 시험, JDK 릴리스 노트는 수정 보안 기준의 근거입니다. **NVD를 읽었다는 사실과 exploit의 세부 원인이 공개됐다는 사실은 별개** 입니다. JGSS·JSSE·114941·114942에는 확인한 저장본을 넘어서는 공격 절차를 붙이지 않았습니다.`,
  steps: [
    "공격 조건 확인 — CVE를 선택하고 비신뢰 코드·입력 경로·CPU 등 필요한 전제조건을 확인합니다.",
    "입력 전달 — 문서·Base64·통신 입력이 해당 구성요소에 도달하는 방향을 따라갑니다.",
    "경계 변화 — 옵션 누락·메모리 경계 밖 쓰기 또는 상세 미공개 처리 지점을 구분합니다.",
    "결과 관찰 — 네트워크 접근·힙 손상·정보 노출·변조·가용성 영향을 확인합니다.",
    "패치와 확인 — 임시 완화의 범위를 구분하고 공급자 수정 배포, 재시작, 회귀 검증으로 마무리합니다.",
  ],
  examples: [
    "Java 17 백엔드에서 Base64 입력, 실행 중인 HotSpot 빌드, CPU 기능을 함께 조사하는 사례.",
    "JavaFX의 번들 libxml2와 OS 패키지를 구분해 수정 대상을 찾는 사례.",
    "JGSS와 JSSE의 적용 조건을 비교하고 API·샌드박스·TLS 경로를 분리해 점검하는 사례.",
  ],
  learningObjectives: [
    "6개 CVE의 전제조건과 피해 범위를 구분할 수 있다.",
    "공개된 원인 설명과 상세 미공개 개념 모델을 구분하고 패치 적용을 검증할 수 있다.",
  ],
  keyTakeaways: [
    "Java 버전만으로 판단하지 않고 구성요소·배포 조건·하드웨어·실제 입력 경로를 함께 확인합니다.",
    "Base64 임시 완화는 114938의 특정 경로만 대상으로 하며 전체 보안 업데이트를 대신하지 않습니다.",
  ],
  commonMistakes: [
    "JavaFX·JGSS의 Note 2를 무시하고 모든 Java 서버에 동일하게 적용하는 것.",
    "파일 설치만 끝내고 기존 JVM을 계속 실행하는 것.",
    "상세 미공개 CVE에 특정 exploit이나 수정 코드를 추정해 붙이는 것.",
  ],
  exercises: [
    {
      question: "Base64 intrinsic을 비활성화했다면 무엇을 더 해야 할까요?",
      options: [
        "다른 CVE도 포함한 공급자 수정 배포로 교체하고 재시작·회귀 검증한다.",
        "여섯 취약점이 모두 해결됐으므로 업데이트를 생략한다.",
        "ARM64에도 UseAVX=2를 일괄 적용한다.",
      ],
      answerIndex: 0,
      explanation:
        "임시 완화는 114938의 특정 최적화 경로에 한정됩니다. 전체 패치 적용과 실제 프로세스 확인이 필요합니다.",
    },
  ],
  related: [
    {
      slug: "log4shell",
      category: "attack",
      relation: "외부 입력에서 Java 런타임까지의 신뢰 경계 비교",
    },
    {
      slug: "https-handshake",
      category: "workflow",
      relation: "JSSE의 TLS 통신 배경",
    },
    {
      slug: "docker-before-after",
      category: "workflow",
      relation: "컨테이너 이미지와 번들 런타임 교체",
    },
  ],
};
