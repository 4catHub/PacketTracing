import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def merge_sort(arr, lo, hi):
  if lo >= hi:
    return
  mid = (lo + hi) // 2
  merge_sort(arr, lo, mid)
  merge_sort(arr, mid + 1, hi)
  merge(arr, lo, mid, hi)

def merge(arr, lo, mid, hi):
  left = arr[lo:mid+1]
  right = arr[mid+1:hi+1]
  i = j = 0
  k = lo
  while i < len(left) and j < len(right):
    if left[i] <= right[j]:
      arr[k] = left[i]
      i += 1
    else:
      arr[k] = right[j]
      j += 1
    k += 1
  while i < len(left):
    arr[k] = left[i]
    i += 1
    k += 1
  while j < len(right):
    arr[k] = right[j]
    j += 1
    k += 1`;

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
        codeLine: 14,
        variables: { lo, mid, hi, i, j, k, "left[i]": left[i], "right[j]": right[j] },
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
        codeLine: 16,
        variables: { lo, mid, hi, i, j, k, "arr[k]": a[k] },
      });
      k++;
    }
    while (i < left.length) {
      a[k] = left[i++];
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [k],
        sorted: [],
        label: `a[${k}] = ${a[k]} (나머지 복사)`,
        codeLine: 23,
        variables: { lo, mid, hi, i, j, k, "arr[k]": a[k] },
      });
      k++;
    }
    while (j < right.length) {
      a[k] = right[j++];
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [k],
        sorted: [],
        label: `a[${k}] = ${a[k]} (나머지 복사)`,
        codeLine: 27,
        variables: { lo, mid, hi, i, j, k, "arr[k]": a[k] },
      });
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
      codeLine: 7,
      variables: { lo, mid, hi },
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
      codeLine: 4,
      variables: { lo, mid, hi },
    });
    mergeSort(lo, mid);
    mergeSort(mid + 1, hi);
    merge(lo, mid, hi);
  }

  mergeSort(0, a.length - 1);

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
  worst: "O(n log n)",
  space: "O(n)",
  stable: true,
};

export default function MergeSortViz() {
  return <SortViz algorithmName="병합 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

