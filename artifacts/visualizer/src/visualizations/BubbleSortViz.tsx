import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def bubble_sort(arr):
  n = len(arr)
  for i in range(n - 1):
    swapped = False
    for j in range(n - i - 1):
      if arr[j] > arr[j + 1]:
        arr[j], arr[j + 1] = arr[j + 1], arr[j]
        swapped = True
    if not swapped:
      break
  return arr`;

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [...sorted],
        label: `비교: a[${j}]=${a[j]} vs a[${j + 1}]=${a[j + 1]}`,
        codeLine: 6,
        variables: { i, j, swapped, "arr[j]": a[j], "arr[j+1]": a[j + 1] },
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        steps.push({
          array: [...a],
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sorted],
          label: `교환: ${a[j + 1]} ↔ ${a[j]}`,
          codeLine: 7,
          variables: { i, j, swapped, "arr[j]": a[j], "arr[j+1]": a[j + 1] },
        });
      }
    }
    sorted.push(n - 1 - i);
    if (!swapped) {
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [],
        sorted: [...sorted],
        label: `교환 발생 없음 → 조기 종료`,
        codeLine: 9,
        variables: { i, swapped },
      });
      break;
    }
  }

  // Mark all remaining as sorted
  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: allSorted,
    label: "정렬 완료",
    codeLine: 11,
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

export default function BubbleSortViz() {
  return <SortViz algorithmName="버블 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

