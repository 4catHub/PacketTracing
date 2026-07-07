import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def quick_sort(arr, lo, hi):
  if lo < hi:
    p = partition(arr, lo, hi)
    quick_sort(arr, lo, p - 1)
    quick_sort(arr, p + 1, hi)

def partition(arr, lo, hi):
  pivot = arr[hi]
  i = lo - 1
  for j in range(lo, hi):
    if arr[j] <= pivot:
      i += 1
      arr[i], arr[j] = arr[j], arr[i]
  arr[i + 1], arr[hi] = arr[hi], arr[i + 1]
  return i + 1`;

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
      codeLine: 8,
      variables: { lo, hi, pivot, i },
    });
    for (let j = lo; j < hi; j++) {
      steps.push({
        array: [...a],
        comparing: [j, hi],
        swapping: [],
        sorted: [...sorted],
        label: `비교: a[${j}]=${a[j]} vs pivot=${pivot}`,
        codeLine: 11,
        variables: { lo, hi, pivot, i, j, "arr[j]": a[j] },
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
            codeLine: 13,
            variables: { lo, hi, pivot, i, j, "arr[i]": a[i], "arr[j]": a[j] },
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
      codeLine: 14,
      variables: { lo, hi, pivot, pivot_pos: pivotPos },
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
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: allSorted,
    label: "정렬 완료",
    codeLine: 1,
    variables: {},
  });
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
  return <SortViz algorithmName="퀵 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

