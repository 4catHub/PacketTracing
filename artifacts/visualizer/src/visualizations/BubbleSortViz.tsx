import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

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
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({
          array: [...a],
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sorted],
          label: `교환: ${a[j + 1]} ↔ ${a[j]}`,
        });
        swapped = true;
      }
    }
    sorted.push(n - 1 - i);
    if (!swapped) break;
  }

  // Mark all remaining as sorted
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

export default function BubbleSortViz() {
  return <SortViz algorithmName="버블 정렬" complexity={complexity} generateSteps={generateSteps} />;
}
