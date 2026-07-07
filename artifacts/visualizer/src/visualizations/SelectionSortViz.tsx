import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def selection_sort(arr):
  n = len(arr)
  for i in range(n - 1):
    min_idx = i
    for j in range(i + 1, n):
      if arr[j] < arr[min_idx]:
        min_idx = j
    if min_idx != i:
      arr[i], arr[min_idx] = arr[min_idx], arr[i]
  return arr`;

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({
        array: [...a],
        comparing: [minIdx, j],
        swapping: [],
        sorted: [...sorted],
        label: `최솟값 탐색: a[${j}]=${a[j]} vs 현재 최솟값 a[${minIdx}]=${a[minIdx]}`,
        codeLine: 6,
        variables: { i, min_idx: minIdx, j, "arr[j]": a[j], "arr[min_idx]": a[minIdx] },
      });
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [i, minIdx],
        sorted: [...sorted],
        label: `교환: a[${i}]=${a[i]} ↔ a[${minIdx}]=${a[minIdx]} (최솟값 배치)`,
        codeLine: 9,
        variables: { i, min_idx: minIdx, "arr[i]": a[i], "arr[min_idx]": a[minIdx] },
      });
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
    }
    sorted.push(i);
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [],
      sorted: [...sorted],
      label: `인덱스 ${i} 확정: 값 ${a[i]}`,
      codeLine: 3,
      variables: { i },
    });
  }
  sorted.push(n - 1);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    label: "정렬 완료",
    codeLine: 10,
    variables: {},
  });
  return steps;
}

const complexity: ComplexityInfo = {
  best: "O(n²)",
  avg: "O(n²)",
  worst: "O(n²)",
  space: "O(1)",
  stable: false,
};

export default function SelectionSortViz() {
  return <SortViz algorithmName="선택 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

