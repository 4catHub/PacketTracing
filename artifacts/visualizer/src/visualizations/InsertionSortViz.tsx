import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def insertion_sort(arr):
  n = len(arr)
  for i in range(1, n):
    key = arr[i]
    j = i - 1
    while j >= 0 and arr[j] > key:
      arr[j + 1] = arr[j]
      j -= 1
    arr[j + 1] = key
  return arr`;

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({
      array: [...a],
      comparing: [i],
      swapping: [],
      sorted: [],
      label: `key = a[${i}] = ${key} — 올바른 위치 탐색`,
      codeLine: 4,
      variables: { i, key, j },
    });
    while (j >= 0 && a[j] > key) {
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [],
        label: `a[${j}]=${a[j]} > key=${key} → 오른쪽으로 이동`,
        codeLine: 6,
        variables: { i, key, j, "arr[j]": a[j] },
      });
      a[j + 1] = a[j];
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [j + 1],
        sorted: [],
        label: `a[${j + 1}] ← ${a[j + 1]} (이동)`,
        codeLine: 7,
        variables: { i, key, j, "arr[j]": a[j] },
      });
      j--;
    }
    a[j + 1] = key;
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [j + 1],
      sorted: [],
      label: `a[${j + 1}] ← key=${key} 삽입`,
      codeLine: 9,
      variables: { i, key, j },
    });
  }

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: allSorted,
    label: "정렬 완료",
    codeLine: 10,
    variables: {},
  });
  return steps;
}

const complexity: ComplexityInfo = {
  best: "O(n)",
  avg: "O(n²)",
  worst: "O(n²)",
  space: "O(1)",
  stable: true,
};

export default function InsertionSortViz() {
  return <SortViz algorithmName="삽입 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

