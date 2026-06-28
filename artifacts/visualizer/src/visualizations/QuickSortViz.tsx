import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const sorted = new Set<number>();

  function partition(lo: number, hi: number): number {
    const pivot = a[hi];
    let i = lo - 1;
    steps.push({
      array: [...a],
      comparing: [hi],
      swapping: [],
      sorted: [...sorted],
      label: `피벗 선택: a[${hi}]=${pivot}`,
    });
    for (let j = lo; j < hi; j++) {
      steps.push({
        array: [...a],
        comparing: [j, hi],
        swapping: [],
        sorted: [...sorted],
        label: `비교: a[${j}]=${a[j]} vs pivot=${pivot}`,
      });
      if (a[j] <= pivot) {
        i++;
        if (i !== j) {
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({
            array: [...a],
            comparing: [],
            swapping: [i, j],
            sorted: [...sorted],
            label: `교환: a[${i}]↔a[${j}]`,
          });
        }
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    const pivotPos = i + 1;
    sorted.add(pivotPos);
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [i + 1, hi],
      sorted: [...sorted],
      label: `피벗 ${pivot} → 최종 위치 [${pivotPos}] 확정`,
    });
    return pivotPos;
  }

  function quickSort(lo: number, hi: number) {
    if (lo >= hi) {
      if (lo === hi) sorted.add(lo);
      return;
    }
    const p = partition(lo, hi);
    quickSort(lo, p - 1);
    quickSort(p + 1, hi);
  }

  quickSort(0, a.length - 1);

  const allSorted = Array.from({ length: a.length }, (_, i) => i);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: allSorted, label: "정렬 완료" });
  return steps;
}

const complexity: ComplexityInfo = {
  best: "O(n log n)",
  avg: "O(n log n)",
  worst: "O(n²)",
  space: "O(log n)",
  stable: false,
};

export default function QuickSortViz() {
  return <SortViz algorithmName="퀵 정렬" complexity={complexity} generateSteps={generateSteps} />;
}
