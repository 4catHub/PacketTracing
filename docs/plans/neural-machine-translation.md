# 한영·영한 번역 과정 시각화

- 학습 질문: 원문이 어떤 표현을 거쳐 다른 어순의 번역문이 되며, 모델마다 결과가 왜 달라지는가?
- 경로: `/workflows/neural-machine-translation`, 네트워크 카테고리.
- 구성: 고정된 번역 작업대 + 활성 연산 + 동기화된 실행 순서. 기존 공통 플레이어와 trace 사용.
- 전용 SVG 장면: 원문 종이, 토큰 조각/ID, 임베딩 행렬, 인코더의 문맥 행렬, 디코더의 원문 참조/후보 막대/피드백 루프, 출력 종이. 단순 노드 아이콘 대신 데이터 형태의 변화를 표현.
- 3×2 작업대가 좁은 화면에서는 2×3, 휴대폰에서는 1열로 재배치되며 재생 중 위치는 고정.
- 예제 전환: `나는 사과를 먹는다.` ↔ `I eat apples.`. 분할/ID/행렬/후보 확률/정렬은 모두 교육용 고정 예시로 표시. API 번역 기능은 포함하지 않음.
- 상태: 전체 → 입력 → 토큰화 → 임베딩/위치 → 원문 Self-Attention → 목표 토큰별 Cross-Attention/후보 선택/접두사 피드백 → EOS → 복원. pause/resume, 단계 직접 선택, 예제 변경 시 처음부터 시작.
- 설명: 학습과 추론, 토큰/벡터/위치, Q/K/V와 masked attention, 어순 변화, 자기회귀와 beam/sampling, decoder-only LLM과 차이, 데이터·토크나이저·가중치·지시·디코딩에 따른 번역 차이, 생략/다의어/검증 한계.
- 원칙: 실제 측정/상용 서비스 내부 구조로 오인하지 않게 명시. Attention을 정답 설명이나 1:1 사전으로 표현하지 않음.
- 검증: 상태/스펙 불변식, visualizer 및 workspace typecheck, production build/SSG/content audit, desktop/narrow × light/dark, pause·전환·EOS·루프·reduced motion·라우트 이탈.

## 자체 검증 결과

- 요구사항: 번역 원리 페이지, 한영/영한 예제, 과정에 맞는 도형, 상세 설명 영역, PR 단위 변경으로 구현.
- 상태 검증: 두 방향의 토큰별 생성 수·원문 참조 위치·EOS와 복원 순서·루프 초기화·actor 참조 검증 통과.
- UI: desktop 1348px, iframe viewport 390px/700px에서 작업대 확인. desktop/390px light·dark 확인. 390px 가로 overflow 및 도형 밖 텍스트 검사에서 문제 없음. 단계 직접 선택, 완료 후 반복, 일시정지 유지, 재생 재개, 방향 변경, 홈 이동 및 재진입 확인.
- 발견 및 수정: 선택 이전 접두사와 선택 후 출력을 분리, trace의 생성 연산 주체를 디코더로 정정, 작은 폭의 지나친 축소를 작업대 컨테이너 기준 1/2/3열 배치로 보완.
- 콘텐츠: 실제 모델 추론/내부 측정이 아닌 교육용 예시임을 명시. Encoder–Decoder와 Decoder-only를 구분하고 공개 1차 자료 5개 연결.
- 정적 검증: workspace typecheck, visualizer typecheck, 콘텐츠 등록 61개/관련 링크 151개, Vite production bundle, SSG 69경로 생성·검증 통과.
- 환경 제약: `tsx` CLI의 IPC socket 생성이 EPERM으로 차단되어 동일 스크립트를 `node --import tsx`로 실행. preview에 필요한 PORT/BASE_PATH는 임시로 설정 후 원래 package.json 복원. 브라우저 OS의 실제 reduced-motion 설정 전환은 검증하지 못했으며, 경로 모션 비활성화/결정적 snapshot 전환 분기는 코드로 확인. 상용 번역 모델의 실제 품질 비교는 이 교육용 페이지의 범위에 포함되지 않음.
- 빌드 경고: 공통 진입 번들의 500kB 초과 경고가 남아 있으며 이번 페이지는 별도 lazy chunk로 생성됨.
