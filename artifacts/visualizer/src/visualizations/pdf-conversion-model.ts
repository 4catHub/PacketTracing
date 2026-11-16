import type {
  WorkflowVisualizationSpec,
  WorkflowVisualizationStep,
  WorkflowWaterfallSpan,
} from "./workflow-visualization";

export type PdfSource = "document" | "image";
const span = (
  actorId: string,
  label: string,
  start: number,
  end: number,
): WorkflowWaterfallSpan => ({ actorId, label, start, end });

export function pdfConversionSpec(
  source: PdfSource,
  ocr: boolean,
  signed: boolean,
): WorkflowVisualizationSpec {
  const image = source === "image";
  const steps: WorkflowVisualizationStep[] = [
    {
      title: "원본 해석 · 확장자 대신 내용을 읽기",
      summary: image
        ? "사진의 픽셀·크기·방향을 읽습니다. 이미지 안에 보이는 글자는 아직 PDF 텍스트가 아닙니다."
        : "편집 문서의 문단·표·스타일·글꼴·삽입 이미지를 읽습니다. 문서를 통째로 촬영하는 과정은 아닙니다.",
      activeActorIds: ["source", "parser"],
      transitions: [
        {
          from: "source",
          to: "parser",
          label: image ? "픽셀 · 방향" : "문단 · 스타일",
          kind: "state",
        },
      ],
      spans: [
        span("source", "원본 데이터 읽기", 0, 0.25),
        span("parser", image ? "이미지 해석" : "문서 구조 해석", 0.25, 1),
      ],
    },
    {
      title: "페이지 배치 · 종이 위 좌표 확정",
      summary: image
        ? "용지·여백을 정하고 사진의 비율과 방향을 맞춥니다. 입력 픽셀 수가 저절로 늘어나는 것은 아닙니다."
        : "용지·여백·줄바꿈을 계산하고 제목·본문·표·이미지의 위치를 확정합니다. 원본 앱과 엔진이 다르면 배치가 달라질 수 있습니다.",
      activeActorIds: ["parser", "layout"],
      transitions: [
        { from: "parser", to: "layout", label: "요소 → 좌표", kind: "state" },
      ],
      spans: [
        span("parser", "요소 크기 계산", 0, 0.35),
        span(
          "layout",
          image ? "사진 크기·배치" : "줄바꿈·페이지 나눔",
          0.35,
          1,
        ),
      ],
    },
    {
      title:
        image && ocr
          ? "객체 구성 · 이미지 + OCR 텍스트"
          : "객체 구성 · 무엇을 어떻게 그릴까?",
      summary: image
        ? ocr
          ? "이미지 객체를 만들고 OCR로 추정한 글자를 검색용 텍스트로 더합니다. 그림에서는 개념상 분리해 표시하며, 실제 검색용 글자는 보이지 않게 배치할 수 있습니다. 인식 오류 검토가 필요합니다."
          : "사진을 이미지 객체로 만들고 페이지에 배치하는 명령을 구성합니다. OCR을 선택하지 않아 검색 가능한 텍스트는 추가하지 않습니다."
        : "텍스트·벡터 경로·이미지를 각각 명령과 객체로 구성합니다. 페이지는 콘텐츠 스트림과 필요한 리소스를 참조합니다.",
      activeActorIds: ["layout", "objects"],
      transitions: [
        {
          from: "layout",
          to: "objects",
          label: image && ocr ? "이미지 + 인식 문자" : "그리기 명령",
          kind: "state",
        },
      ],
      spans:
        image && ocr
          ? [
              span("layout", "이미지 위치 확정", 0, 0.2),
              span("objects", "OCR 문자 추정", 0.2, 0.75),
              span("objects", "검색용 텍스트 추가", 0.75, 1),
            ]
          : [
              span("layout", "배치 정보 전달", 0, 0.25),
              span(
                "objects",
                image ? "이미지 객체 구성" : "텍스트·벡터·이미지 구성",
                0.25,
                1,
              ),
            ],
    },
    {
      title: "리소스 준비 · 글꼴 포함과 압축",
      summary: image
        ? "이미지 인코딩·해상도·압축 설정을 적용합니다. JPEG 재압축이나 다운샘플링을 하면 세부 정보가 줄 수 있습니다. OCR 텍스트의 저장 방식은 도구에 따라 다릅니다."
        : "사용 글꼴을 전체 또는 서브셋으로 포함하고 이미지·스트림을 압축합니다. 임베딩 가능 여부와 품질 설정은 변환기에 따라 달라집니다.",
      activeActorIds: ["objects"],
      spans: [
        span(
          "objects",
          image ? "이미지 인코딩" : "글꼴·이미지 리소스 준비",
          0,
          0.6,
        ),
        span("objects", "스트림 압축", 0.6, 1),
      ],
    },
    {
      title: "PDF 기록 · 객체와 찾아가는 주소록",
      summary:
        "Catalog·Pages·Page와 콘텐츠·리소스를 기록하고 xref 테이블 또는 스트림 등으로 객체 위치를 찾게 합니다. 원본 파일을 단순히 이름만 바꿔 저장하는 것이 아닙니다.",
      activeActorIds: ["objects", "file"],
      transitions: [
        { from: "objects", to: "file", label: "객체 → 파일", kind: "state" },
      ],
      spans: [
        span("objects", "객체 참조 연결", 0, 0.3),
        span("file", "객체·xref·trailer 기록", 0.3, 1),
      ],
    },
    {
      title: "뷰어 렌더링 · 변환 결과 확인",
      summary: image
        ? ocr
          ? "페이지 이미지를 그리고 검색용 OCR 텍스트를 사용할 수 있게 합니다. 사진 속 글자와 인식 결과가 일치하는지 대조합니다."
          : "뷰어가 페이지 위에 이미지를 그립니다. 모양은 보이지만 이미지 안의 글자를 검색할 텍스트는 없습니다."
        : "뷰어가 글꼴·텍스트·벡터·이미지를 읽어 페이지를 그립니다. 줄바꿈·표·글꼴·검색 결과를 원본과 대조합니다.",
      activeActorIds: ["file", "viewer"],
      transitions: [
        { from: "file", to: "viewer", label: "명령 → 화면", kind: "response" },
      ],
      spans: [
        span("file", "문서·페이지 구조 읽기", 0, 0.3),
        span("viewer", "리소스 해석·화면 그리기", 0.3, 1),
      ],
    },
  ];
  if (signed)
    steps.push(
      {
        title: "선택 · 최종 PDF에 인증서 기반 서명",
        summary:
          "변환·검토를 마친 PDF의 서명 범위에 대해 개인키 기반 서명값과 인증서 정보를 추가합니다. 그림은 개념 설명이며 실제 키·해시·서명을 생성하지 않습니다.",
        activeActorIds: ["file", "signature"],
        transitions: [
          {
            from: "file",
            to: "signature",
            label: "최종본에 서명",
            kind: "state",
          },
        ],
        spans: [
          span("file", "검토한 최종본 준비", 0, 0.2),
          span("signature", "해시·서명값·인증서 기록", 0.2, 1),
        ],
      },
      {
        title: "선택 · 수신자가 서명 상태 검증",
        summary:
          "서명 범위의 무결성·인증서 신뢰와 상태·허용된 변경 여부를 확인합니다. 서명은 변경 탐지를 돕지만 사진이나 문서의 원래 내용이 사실이라는 보장은 아닙니다.",
        activeActorIds: ["signature", "viewer"],
        transitions: [
          {
            from: "signature",
            to: "viewer",
            label: "서명 검증",
            kind: "response",
          },
        ],
        spans: [
          span("signature", "서명·인증서 정보 읽기", 0, 0.25),
          span("viewer", "무결성·신뢰·변경 확인", 0.25, 1),
        ],
      },
    );
  return {
    title: "PDF 변환 작업대",
    motionTone: "friendly",
    autoplayMs: 5000,
    overviewMs: 2800,
    overviewSummary:
      "원본 → 해석 → 페이지 배치 → PDF 객체 → 파일 → 뷰어. 각 작업대의 모양은 유지되고 현재 처리와 데이터 방향만 바뀝니다. 아래 단계 이름을 눌러 자세히 볼 수 있습니다.",
    waterfallLabel: "현재 연산의 순서 · 교육용 상대 비중",
    actors: [
      { id: "source", label: "원본", x: 15, y: 20, accent: "blue" },
      { id: "parser", label: "해석기", x: 50, y: 20, accent: "blue" },
      { id: "layout", label: "페이지 배치", x: 85, y: 20, accent: "violet" },
      { id: "objects", label: "PDF 객체", x: 85, y: 60, accent: "violet" },
      { id: "file", label: "PDF 파일", x: 50, y: 60, accent: "emerald" },
      { id: "viewer", label: "뷰어", x: 15, y: 60, accent: "emerald" },
      { id: "signature", label: "전자서명", x: 50, y: 90, accent: "amber" },
    ],
    topologyLinks: [
      { from: "source", to: "parser" },
      { from: "parser", to: "layout" },
      { from: "layout", to: "objects" },
      { from: "objects", to: "file" },
      { from: "file", to: "viewer" },
      ...(signed
        ? [
            { from: "file", to: "signature" },
            { from: "signature", to: "viewer" },
          ]
        : []),
    ],
    steps,
  };
}
