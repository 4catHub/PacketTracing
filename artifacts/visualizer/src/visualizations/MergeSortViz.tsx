import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];

  function merge(lo: number, mid: number, hi: number) {
    const left = a.slice(lo, mid + 1);
    const right = a.slice(mid + 1, hi + 1);
    let i = 0, j = 0, k = lo;
    while (i < left.length && j < right.length) {
      steps.push({
        array: [...a],
        comparing: [lo + i, mid + 1 + j],
        swapping: [],
        sorted: [],
        label: `병합 [${lo}..${hi}]: left[${i}]=${left[i]} vs right[${j}]=${right[j]}`,
      });
      if (left[i] <= right[j]) {
        a[k] = left[i++];
      } else {
        a[k] = right[j++];
      }
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [k],
        sorted: [],
        label: `a[${k}] = ${a[k]} 배치`,
      });
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      steps.push({ array: [...a], comparing: [], swapping: [k], sorted: [], label: `a[${k}] = ${a[k]} (나머지 복사)` });
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      steps.push({ array: [...a], comparing: [], swapping: [k], sorted: [], label: `a[${k}] = ${a[k]} (나머지 복사)` });
      k++;
    }
    // Mark merged segment as sorted visually
    const sortedRange = Array.from({ length: hi - lo + 1 }, (_, x) => lo + x);
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [],
      sorted: sortedRange,
      label: `[${lo}..${hi}] 병합 완료`,
    });
  }

  function mergeSort(lo: number, hi: number) {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    steps.push({
      array: [...a],
      comparing: [lo, hi],
      swapping: [],
      sorted: [],
      label: `분할: [${lo}..${hi}] → [${lo}..${mid}] + [${mid + 1}..${hi}]`,
    });
    mergeSort(lo, mid);
    mergeSort(mid + 1, hi);
    merge(lo, mid, hi);
  }

  mergeSort(0, a.length - 1);

  const allSorted = Array.from({ length: a.length }, (_, i) => i);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: allSorted, label: "정렬 완료" });
  return steps;
}

const complexity: ComplexityInfo = {
  best: "O(n log n)",
  avg: "O(n log n)",
  worst: "O(n log n)",
  space: "O(n)",
  stable: true,
};

export default function MergeSortViz() {
  return <SortViz algorithmName="병합 정렬" complexity={complexity} generateSteps={generateSteps} />;
}
