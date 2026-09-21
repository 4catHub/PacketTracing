import { ContentItem } from "../content-types";

export const androidLocalFirstFinanceContent: ContentItem = {
  slug: "android-local-first-finance",
  category: "workflow",
  title: "Android Local-first 금융 데이터 아키텍처",
  subtitle:
    "Room을 로컬 Source of Truth로 두고, Stateless BFF를 통해 금융 데이터를 수동 증분 동기화하는 로그인 없는 앱 구조",
  tags: [
    "Android",
    "Local-first",
    "Offline-first",
    "Room",
    "DataStore",
    "BFF",
    "Keystore",
  ],
  description: `로그인 없는 Android 앱에서 금융 거래와 구독 정보를 서버 DB가 아니라 **기기 로컬 저장소를 중심으로 관리**하는 구조입니다. 제품 관점에서는 Local-first를 지향하고, 구현 패턴은 Android의 Offline-first 아키텍처처럼 Room을 앱의 로컬 Source of Truth로 사용합니다. 앱 화면은 금융 API를 직접 조회하지 않고 Room을 읽으며, 네트워크는 사용자가 명시적으로 동기화를 요청할 때 로컬 데이터를 갱신하는 수단으로만 사용합니다.

### 1. 앱 설치 공간이 사용자 데이터 경계가 된다
회원 계정과 서버의 사용자 DB가 없으므로 MVP에서는 하나의 앱 설치 공간 자체가 사용자 범위입니다. `Account`, `Transaction`, `Subscription` 같은 Room Entity에 별도의 `user_id`를 반복해서 넣지 않아도 됩니다. 대신 앱 삭제나 기기 교체 시 로컬 데이터가 사라질 수 있으므로 백업·기기간 동기화는 별도 기능으로 취급합니다.

### 2. 저장소는 데이터 성격에 따라 분리한다
- **Room:** 거래내역, 계좌 표시정보, 탐지된 구독, 사용자가 확정한 구독처럼 관계와 조회가 필요한 구조화 데이터를 저장합니다.
- **DataStore:** `lastSyncedAt`, 온보딩 여부, 앱 설정처럼 작고 독립적인 상태를 저장합니다.
- **Keystore-backed encryption:** access token이나 refresh token 같은 민감한 값을 평문 DB에 넣지 않고, Android Keystore가 보호하는 암호화 키를 이용해 안전하게 보관합니다.
- **앱에 넣지 않는 비밀:** 금융 API의 `client_secret`처럼 모든 앱 설치본에 동일하게 포함되는 비밀은 앱에서 보호할 수 없으므로 서버 측에 둡니다.

### 3. BFF는 사용자 DB가 아니라 보안 경계다
Android 앱은 금융 API를 직접 호출하는 대신 **Stateless NestJS BFF**를 거칩니다. BFF는 서버 측 비밀키를 보관하고 금융 API 요청을 중계하지만, 거래내역을 영구 저장하지 않습니다. 따라서 초기 MVP에서 회원 DB, 사용자별 PostgreSQL, 탈퇴 데이터 정리 같은 서버 데이터 생명주기를 만들지 않고도 클라이언트 비밀을 보호할 수 있습니다.

### 4. 평상시 읽기와 네트워크 동기화를 분리한다
앱을 열 때는 네트워크 호출 없이 Room을 즉시 조회합니다. 사용자가 새로고침 또는 계좌 갱신을 눌렀을 때만 DataStore의 `lastSyncedAt`을 읽고, 그 시점 이후의 거래만 증분으로 요청합니다. 응답은 먼저 Room의 거래 원본에 반영한 뒤 분석을 다시 실행하고, 성공한 시점에만 `lastSyncedAt`을 갱신합니다.

### 5. 거래 원본과 구독 결과를 분리한다
구독은 원본 데이터가 아니라 **거래내역으로부터 파생되는 분석 결과**로 취급합니다.

```text
FinancialTransaction (Raw)
        ↓
MerchantTransaction (Normalized)
        ↓
SubscriptionCandidate
        ↓
사용자 확인
        ↓
Subscription
```

이렇게 원본과 파생 데이터를 나누면 탐지 알고리즘이 바뀌어도 기존 거래내역을 다시 분석할 수 있고, 가격 인상 감지나 결제 주기 변화 같은 기능도 추가하기 쉽습니다.

### 6. Local-first의 다음 단계는 백업과 동기화다
MVP에서는 로그인과 클라우드 DB를 생략해 범위를 줄일 수 있습니다. 이후 필요해지면 로컬 백업, Google Drive 백업, 계정 기반 기기간 동기화를 추가할 수 있습니다. 이때 로그인은 단순 회원가입보다 **백업·복구·기기간 동기화를 제공하기 위한 기능**으로 도입하는 편이 현재 구조와 자연스럽게 이어집니다.`,
  steps: [
    "앱 실행 — Compose UI는 네트워크를 기다리지 않고 Repository를 통해 Room의 Account·Transaction·Subscription을 즉시 읽어 현재 구독 현황을 표시한다.",
    "수동 갱신 요청 — 사용자가 새로고침을 누르면 Repository가 DataStore에서 lastSyncedAt을 읽어 증분 조회 기준 시점을 결정한다.",
    "민감정보 준비 — 앱은 평문 DB가 아니라 Keystore-backed 암호화로 보호된 인증 재료를 사용하고, 필요하면 금융기관 재인증을 시작한다.",
    "Stateless BFF 호출 — Android는 since=lastSyncedAt 같은 동기화 범위와 인증 정보를 NestJS BFF로 보내며, BFF는 서버 DB에 사용자 거래를 저장하지 않는다.",
    "금융 API 증분 조회 — BFF가 서버 측 client_secret 등 앱에 넣을 수 없는 비밀을 사용해 금융 API를 호출하고 마지막 동기화 이후 거래만 반환한다.",
    "원본 거래 저장 — 앱은 새 FinancialTransaction을 Room에 추가한다. 이 거래 데이터가 이후 모든 구독 분석의 재실행 가능한 근거가 된다.",
    "정규화·구독 탐지 — Raw 거래를 MerchantTransaction으로 정규화하고 SubscriptionCandidate를 생성한다. 사용자 확인 결과는 Subscription으로 별도 저장한다.",
    "동기화 완료 — 성공한 시점에 DataStore의 lastSyncedAt을 갱신한다. Compose는 다시 Room을 관찰해 최신 구독 상태를 표시하며 네트워크 연결은 필수가 아니게 된다.",
  ],
  examples: [
    "앱 실행 직후 네트워크 없이 지난 구독과 월 결제 예상액을 즉시 표시",
    "마지막 동기화 이후 거래만 받아 데이터 사용량과 분석 범위를 최소화",
    "Netflix 월 결제 금액이 17,000원에서 18,500원으로 바뀐 것을 과거 거래와 비교해 감지",
    "구독 탐지 알고리즘 개선 후 서버 재수집 없이 Room의 거래 원본을 다시 분석",
    "MVP 이후 Google Drive 백업 또는 로그인 기반 기기간 동기화를 선택적으로 추가",
  ],
  related: [
    {
      slug: "oauth-flow",
      category: "workflow",
      relation: "금융기관 재인증과 네이티브 앱의 OAuth Authorization Code 흐름",
    },
    {
      slug: "api-gateway",
      category: "workflow",
      relation: "앱과 외부 금융 API 사이에 서버 측 보안 경계를 두는 이유",
    },
    {
      slug: "jwt-vs-session",
      category: "workflow",
      relation: "로그인 없는 MVP와 서버 세션을 두는 전통적 사용자 식별 구조의 차이",
    },
  ],
};
