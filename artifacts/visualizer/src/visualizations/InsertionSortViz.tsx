import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

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
    });
    while (j >= 0 && a[j] > key) {
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [],
        label: `a[${j}]=${a[j]} > key=${key} → 오른쪽으로 이동`,
      });
      a[j + 1] = a[j];
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [j + 1],
        sorted: [],
        label: `a[${j + 1}] ← ${a[j + 1]} (이동)`,
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
    });
  }

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push({ array: [...a], comparing: [], swapping: [], sorted: allSorted, label: "정렬 완료" });
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
  return <SortViz algorithmName="삽입 정렬" complexity={complexity} generateSteps={generateSteps} />;
}
