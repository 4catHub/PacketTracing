import { ContentItem } from "../content-types";

export const androidLocalFirstFinanceContent: ContentItem = {
  slug: "android-local-first-finance",
  category: "workflow",
  title: "구독 모아보기 서비스 아키텍처",
  subtitle:
    "금융계좌 연결부터 거래 동기화, 구독 탐지·확정, 가격 변동 감지까지 이어지는 Android Local-first 서비스의 전체 데이터 흐름",
  tags: [
    "Subscription",
    "Android",
    "Local-first",
    "Financial Data",
    "Room",
    "BFF",
    "Recurring Payment",
  ],
  description: "구독 모아보기 서비스의 핵심은 **구독 목록을 저장하는 앱**이 아니라, 금융기관의 거래 원천 데이터를 안전하게 가져와 반복 결제를 찾아내고 사용자가 신뢰할 수 있는 구독 상태로 계속 갱신하는 데이터 파이프라인입니다. 로그인 없는 MVP에서는 Android 기기의 Room이 사용자에게 보여주는 상태의 기준이 되고, NestJS BFF는 금융 제공자와 통신하기 위한 보안 경계를 담당합니다.\n\n### 1. 서비스의 책임 경계\n- **Compose UI:** 구독 목록, 월 예상 결제액, 가격 변동, 연결 상태를 보여주며 Room에서 만들어진 화면용 상태만 관찰합니다.\n- **Repository / Use Case:** 금융 연결, 동기화, 거래 패치, 분석 실행 순서를 조정합니다. UI가 금융 API를 직접 호출하지 않게 합니다.\n- **Room:** `FinancialConnection`, 원본 `FinancialTransaction`, 정규화된 `MerchantTransaction`, `SubscriptionCandidate`, 확정된 `Subscription`, 사용자 보정값을 보관합니다.\n- **DataStore:** 온보딩, 정렬 방식, 알림 설정처럼 작은 앱 설정을 저장합니다. 여러 금융 연결의 동기화 cursor처럼 관계형 데이터는 Room에 두는 편이 안전합니다.\n- **Keystore-backed protection:** 기기에 보관해야 하는 인증 재료나 로컬 암호화 키를 보호합니다.\n- **Stateless NestJS BFF:** 앱에 둘 수 없는 `client_secret`을 보관하고 토큰 교환 및 금융 데이터 요청을 중계합니다. 거래내역 자체는 서버 DB에 영구 저장하지 않습니다.\n- **금융 데이터 제공자:** 계좌·거래의 원천이며 OAuth/동의, 거래 동기화 API를 제공합니다.\n\n### 2. 금융 연결은 데이터 수집보다 먼저 설계해야 한다\n사용자가 계좌 연결을 시작하면 앱은 BFF를 통해 금융 제공자의 인증·동의 흐름을 시작합니다. 네이티브 앱에 공통 `client_secret`을 포함시키면 비밀로 유지할 수 없으므로 서버 측 경계가 필요합니다.\n\n다만 **BFF를 완전히 stateless하게 둘 수 있는지는 금융 제공자의 credential 보관 정책에 달려 있습니다.** 제공자가 기기 보관 또는 서버가 암호화한 opaque credential 전달을 허용한다면 서버에 사용자 DB 없이 운영할 수 있습니다. 반대로 refresh token이나 provider access token을 서버에서만 보관해야 하는 계약이라면 최소한의 credential vault는 필요합니다. 이 경우에도 거래·구독 데이터까지 서버에 저장해야 한다는 뜻은 아닙니다.\n\n### 3. 초기 동기화는 거래 원본을 만드는 과정이다\n최초 연결에서는 필요한 범위의 과거 거래를 페이지 단위로 가져와 `FinancialTransaction`에 저장합니다. 구독 탐지 결과만 저장하고 거래 원본을 버리면 나중에 탐지 알고리즘을 바꾸거나 가격 변동을 재계산하기 어렵습니다.\n\n동기화 상태는 계좌 전체에 하나의 시간값을 두기보다 금융 연결별로 관리합니다.\n\n```text\nFinancialConnection\n ├─ providerConnectionId\n ├─ syncCursor\n ├─ lastSuccessfulSyncAt\n └─ authState\n```\n\n금융 제공자가 cursor/delta API를 지원하면 이를 우선 사용합니다. 거래는 나중에 수정되거나 삭제될 수 있으므로 `added / modified / removed`를 모두 반영해야 합니다. cursor가 없는 API라면 최근 며칠을 겹쳐 다시 조회하고 외부 거래 ID 기준의 idempotent upsert로 중복을 제거합니다.\n\n### 4. 구독은 거래에서 파생되는 별도 모델이다\n서비스의 데이터 흐름은 다음처럼 분리합니다.\n\n```text\nFinancialTransaction (원본)\n        ↓\nMerchantTransaction (가맹점 정규화)\n        ↓\nSubscriptionCandidate (반복 결제 후보)\n        ↓\n사용자 확인 / 무시 / 직접 추가\n        ↓\nSubscription + UserOverride\n```\n\n가맹점 이름 정규화, 결제 간격, 금액 허용 오차, 최근 결제일을 이용해 후보를 만들고 `confidence`와 다음 예상 결제일을 계산합니다. MVP에서는 설명 가능한 규칙 기반 탐지로 시작해도 충분하며, 원본 거래를 보존하면 이후 분석기를 교체할 수 있습니다.\n\n### 5. 사용자 판단은 분석 결과보다 오래 살아야 한다\n사용자가 \"이 결제는 구독이다\", \"이 후보는 구독이 아니다\", \"표시 이름을 바꾼다\", \"직접 구독을 추가한다\"라고 결정한 값은 분석 결과와 분리해 보관해야 합니다. 재동기화나 분석기 버전 변경 때 `SubscriptionCandidate`를 다시 만들더라도 `UserOverride`를 덮어쓰지 않아야 합니다.\n\n이 분리가 없으면 알고리즘을 개선할 때마다 사용자가 이전에 확인한 구독이 다시 후보 상태로 돌아가거나 무시한 결제가 되살아나는 문제가 생깁니다.\n\n### 6. 평상시 사용은 로컬 읽기, 새로고침만 원격 동기화다\n앱 실행 시에는 Room의 `Subscription`과 관련 projection을 즉시 읽어 구독 현황을 표시합니다. 네트워크 연결은 필수가 아닙니다.\n\n사용자가 새로고침하면 연결별 `syncCursor`를 기준으로 금융 API의 변경분을 가져옵니다. 모든 페이지를 성공적으로 받아 원본 거래 패치를 반영한 뒤에만 cursor를 전진시켜야 합니다. 중간 페이지에서 실패했다면 이전 cursor를 유지해 다음 시도에서 누락 없이 다시 받을 수 있어야 합니다.\n\n### 7. 거래 변경 뒤에는 필요한 범위만 재분석한다\n새 거래가 추가되거나 기존 거래가 수정·삭제되면 영향을 받은 가맹점과 기간만 다시 분석할 수 있습니다. 예를 들어 Netflix 결제가 17,000원에서 18,500원으로 바뀌었다면 최근 반복 결제 시퀀스를 비교해 \"구독료 1,500원 인상\" 상태를 만들 수 있습니다.\n\n분석 로직 자체가 바뀌는 경우에는 `analysisVersion`을 올리고 전체 또는 필요한 범위를 재계산합니다. 원본 거래와 사용자 보정값을 분리해 두었기 때문에 서버에서 데이터를 다시 받지 않고도 재분석할 수 있습니다.\n\n### 8. 실패해도 기존 구독 화면은 유지해야 한다\n인증 만료, 금융기관 장애, 네트워크 실패가 발생해도 기존 Room 데이터는 그대로 보여줍니다. 연결 상태만 `REAUTH_REQUIRED` 또는 `SYNC_FAILED`로 표시하고 사용자가 다시 연결할 수 있게 합니다.\n\n주의할 부분은 다음과 같습니다.\n- 외부 거래 ID에 unique 제약을 두고 동기화를 idempotent하게 처리합니다.\n- pending 거래가 posted 거래로 바뀌는 제공자 규칙을 고려합니다.\n- raw 거래나 토큰을 로그·크래시 리포트에 남기지 않습니다.\n- cursor와 거래 패치는 가능한 한 같은 로컬 트랜잭션에서 커밋합니다.\n- 앱 삭제 시 Room과 credential이 사라지는 것은 로그인 없는 MVP의 명시적인 제한입니다.\n- 이후 백업·기기간 동기화가 필요해지면 로그인은 회원가입 자체보다 복구·동기화를 위한 기능으로 추가합니다.",
  steps: [
  "금융 연결 시작 — 사용자가 계좌 연결을 선택하면 Android 앱이 BFF를 통해 금융 제공자의 인증·동의 흐름을 시작한다. client_secret은 앱에 포함하지 않는다.",
  "연결 credential 확립 — 인증 코드와 PKCE 검증을 거쳐 금융 연결 자격을 만든다. provider 정책이 허용하면 기기에 보호해 보관하고, 서버 보관이 필수라면 최소 credential vault를 둔다.",
  "초기 거래 동기화 — 필요한 과거 거래를 페이지 단위로 받아 FinancialTransaction에 저장하고, FinancialConnection별 syncCursor를 함께 관리한다.",
  "가맹점 정규화 — 원본 merchant description을 정리해 동일 사업자의 결제를 같은 merchant key로 묶는 MerchantTransaction을 만든다.",
  "구독 후보 탐지 — 결제 간격, 금액 허용 오차, 최근 결제일을 분석해 SubscriptionCandidate와 confidence, 다음 예상 결제일을 계산한다.",
  "사용자 확인 — 후보를 구독으로 확정하거나 무시하고, 직접 추가·이름 수정 같은 사용자 판단은 UserOverride로 분석 결과와 분리해 저장한다.",
  "구독 모아보기 — 평상시 앱 실행은 네트워크 없이 Room의 Subscription projection을 읽어 현재 구독과 월 예상 결제액을 즉시 표시한다.",
  "수동 증분 동기화 — 새로고침 시 각 FinancialConnection의 syncCursor로 added·modified·removed 거래를 조회하고, 모든 페이지가 성공했을 때만 cursor를 전진시킨다.",
  "변경분 재분석 — 거래 패치로 영향을 받은 가맹점만 다시 분석하고 가격 인상, 결제 주기 변경, 해지 가능성을 Subscription 상태에 반영한다.",
  "실패와 재인증 — 인증 만료나 금융 API 장애가 발생해도 기존 구독은 유지하고 연결 상태만 REAUTH_REQUIRED 또는 SYNC_FAILED로 표시한다."
],
  examples: [
  "Netflix 월 결제가 17,000원에서 18,500원으로 바뀌면 새 거래를 기준으로 가격 인상 상태를 생성",
  "같은 카드 거래가 다시 내려와도 externalTransactionId unique + upsert로 중복 저장 방지",
  "pending 거래가 posted 거래로 변경되면 새 거래를 추가하는 대신 기존 원본 거래를 수정",
  "사용자가 구독이 아니라고 무시한 반복 결제는 분석기를 다시 돌려도 UserOverride를 통해 계속 제외",
  "금융기관 인증이 만료돼도 마지막으로 확인된 구독 목록은 오프라인에서 계속 조회"
],
  related: [
    {
      slug: "oauth-flow",
      category: "workflow",
      relation: "금융기관 연결 단계에서 사용하는 Authorization Code + PKCE 인증 흐름",
    },
    {
      slug: "api-gateway",
      category: "workflow",
      relation: "앱에 둘 수 없는 secret과 외부 API 호출을 서버 경계에서 보호하는 이유",
    },
    {
      slug: "db-indexing",
      category: "workflow",
      relation: "거래 ID unique 제약, 계좌·가맹점·날짜 조회를 위한 로컬 인덱스 설계",
    },
  ],
};
