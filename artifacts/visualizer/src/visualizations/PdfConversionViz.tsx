import { useMemo, useState } from "react";
import WorkflowFocusedViz, {
  type WorkflowTopologyCanvasProps,
} from "./WorkflowFocusedViz";
import PdfConversionScene from "./PdfConversionScene";
import { pdfConversionSpec, type PdfSource } from "./pdf-conversion-model";

export default function PdfConversionViz() {
  const [source, setSource] = useState<PdfSource>("document");
  const [ocr, setOcr] = useState(false);
  const [signed, setSigned] = useState(false);
  const effectiveOcr = source === "image" && ocr;
  const spec = useMemo(
    () => pdfConversionSpec(source, effectiveOcr, signed),
    [source, effectiveOcr, signed],
  );
  const Canvas = useMemo(
    () =>
      function Canvas(props: WorkflowTopologyCanvasProps) {
        return (
          <PdfConversionScene
            {...props}
            source={source}
            ocr={effectiveOcr}
            signed={signed}
          />
        );
      },
    [source, effectiveOcr, signed],
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="원본 종류"
          className="flex rounded-lg border border-border bg-background p-1"
        >
          {(
            [
              ["document", "문서 → PDF"],
              ["image", "사진·스캔 → PDF"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={source === value}
              onClick={() => setSource(value)}
              className={`rounded-md px-3 py-2 text-xs font-semibold ${source === value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {source === "image" && (
          <label className="flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={ocr}
              onChange={(event) => setOcr(event.target.checked)}
              className="accent-primary"
            />
            OCR 텍스트 추가
          </label>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={signed}
            onChange={(event) => setSigned(event.target.checked)}
            className="accent-primary"
          />
          변환 후 전자서명 과정
        </label>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        교육용 시뮬레이션 · 실제 파일 처리 없음 · PDF 변환만으로 위변조가
        차단되지는 않음
      </p>
      <WorkflowFocusedViz
        key={`${source}-${effectiveOcr}-${signed}`}
        spec={spec}
        TopologyCanvas={Canvas}
      />
    </div>
  );
}
