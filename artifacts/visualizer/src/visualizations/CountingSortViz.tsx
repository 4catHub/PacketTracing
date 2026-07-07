import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def counting_sort(arr):
  n = len(arr)
  max_val = max(arr)
  count = [0] * (max_val + 1)
  for num in arr:
    count[num] += 1
  for i in range(1, len(count)):
    count[i] += count[i - 1]
  output = [0] * n
  for i in range(n - 1, -1, -1):
    num = arr[i]
    pos = count[num] - 1
    output[pos] = num
    count[num] -= 1
  return output`;

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;
  const maxVal = Math.max(...a);

  // Phase 1: Count
  const count = new Array(maxVal + 1).fill(0);
  for (let i = 0; i < n; i++) {
    count[a[i]]++;
    steps.push({
      array: [...a],
      comparing: [i],
      swapping: [],
      sorted: [],
      label: `계수: a[${i}]=${a[i]} → count[${a[i]}]=${count[a[i]]}`,
      codeLine: 6,
      variables: { i, "arr[i]": a[i], "count[arr[i]]": count[a[i]] },
    });
  }

  // Phase 2: Build output
  const output = new Array(n);
  // Cumulative count
  for (let v = 1; v <= maxVal; v++) {
    count[v] += count[v - 1];
  }

  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: [],
    label: "누적합 계산 완료 — 각 값의 최종 위치 파악",
    codeLine: 8,
    variables: { max_val: maxVal },
  });

  const result = [...a];
  // Place elements (iterate in reverse for stability)
  for (let i = n - 1; i >= 0; i--) {
    const val = a[i];
    const pos = count[val] - 1;
    output[pos] = val;
    count[val]--;
    result[pos] = val;
    steps.push({
      array: [...result],
      comparing: [],
      swapping: [pos],
      sorted: Array.from({ length: n }, (_, x) => x).filter(x => result[x] !== undefined && output[x] !== undefined && output[x] === result[x] && x >= pos),
      label: `a[${i}]=${val} → output[${pos}] 배치`,
      codeLine: 13,
      variables: { i, num: val, pos, "count[num]": count[val] },
    });
  }

  const allSorted = Array.from({ length: n }, (_, i) => i);
  steps.push({
    array: [...output],
    comparing: [],
    swapping: [],
    sorted: allSorted,
    label: "정렬 완료",
    codeLine: 15,
    variables: {},
  });
  return steps;
}

const complexity: ComplexityInfo = {
  best: "O(n+k)",
  avg: "O(n+k)",
  worst: "O(n+k)",
  space: "O(n+k)",
  stable: true,
};

export default function CountingSortViz() {
  return <SortViz algorithmName="계수 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

