import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def radix_sort(arr):
  max_val = max(arr)
  place = 1
  while max_val // place > 0:
    counting_sort_by_digit(arr, place)
    place *= 10
  return arr

def counting_sort_by_digit(arr, place):
  n = len(arr)
  output = [0] * n
  count = [0] * 10
  for num in arr:
    digit = (num // place) % 10
    count[digit] += 1
  for i in range(1, 10):
    count[i] += count[i - 1]
  for i in range(n - 1, -1, -1):
    num = arr[i]
    digit = (num // place) % 10
    pos = count[digit] - 1
    output[pos] = num
    count[digit] -= 1
  for i in range(n):
    arr[i] = output[i]`;

function getDigit(num: number, place: number): number {
  return Math.floor(num / Math.pow(10, place)) % 10;
}

function countingSortByDigit(arr: number[], place: number, steps: SortStep[], sorted: number[]): number[] {
  const n = arr.length;
  const count = new Array(10).fill(0);

  for (let i = 0; i < n; i++) {
    const d = getDigit(arr[i], place);
    count[d]++;
    steps.push({
      array: [...arr],
      comparing: [i],
      swapping: [],
      sorted: [],
      label: `자릿수 ${Math.pow(10, place)}의 자리: a[${i}]=${arr[i]} → 숫자 ${d}`,
      codeLine: 15,
      variables: { place: Math.pow(10, place), i, "arr[i]": arr[i], digit: d, "count[digit]": count[d] },
    });
  }

  // Cumulative
  for (let i = 1; i < 10; i++) count[i] += count[i - 1];

  const output = new Array(n);
  const display = [...arr];
  for (let i = n - 1; i >= 0; i--) {
    const d = getDigit(arr[i], place);
    const pos = count[d] - 1;
    output[pos] = arr[i];
    display[pos] = arr[i];
    count[d]--;
    steps.push({
      array: [...display],
      comparing: [],
      swapping: [pos],
      sorted: [...sorted],
      label: `${arr[i]} → 위치 [${pos}] 배치 (${Math.pow(10, place)}의 자리 기준)`,
      codeLine: 22,
      variables: { place: Math.pow(10, place), i, num: arr[i], digit: d, pos, "count[digit]": count[d] },
    });
  }

  steps.push({
    array: [...output],
    comparing: [],
    swapping: [],
    sorted: [...sorted],
    label: `${Math.pow(10, place)}의 자리 패스 완료`,
    codeLine: 24,
    variables: { place: Math.pow(10, place) },
  });

  return output;
}

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const maxVal = Math.max(...arr);
  const maxDigits = Math.floor(Math.log10(maxVal)) + 1;

  let a = [...arr];
  for (let place = 0; place < maxDigits; place++) {
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [],
      sorted: [],
      label: `── 패스 ${place + 1}: ${Math.pow(10, place)}의 자리 기준 정렬 ──`,
      codeLine: 4,
      variables: { place: Math.pow(10, place) },
    });
    a = countingSortByDigit(a, place, steps, []);
  }

  const allSorted = Array.from({ length: a.length }, (_, i) => i);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: allSorted,
    label: "정렬 완료",
    codeLine: 7,
    variables: {},
  });
  return steps;
}

const complexity: ComplexityInfo = {
  best: "O(d·n)",
  avg: "O(d·n)",
  worst: "O(d·n)",
  space: "O(n+k)",
  stable: true,
};

export default function RadixSortViz() {
  return <SortViz algorithmName="기수 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

