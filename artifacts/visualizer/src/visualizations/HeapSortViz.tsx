import SortViz, { SortStep, ComplexityInfo } from "./SortViz";

const PYTHON_CODE = `def heap_sort(arr):
  n = len(arr)
  for i in range(n // 2 - 1, -1, -1):
    heapify(arr, n, i)
  for i in range(n - 1, 0, -1):
    arr[0], arr[i] = arr[i], arr[0]
    heapify(arr, i, 0)

def heapify(arr, size, root):
  largest = root
  l = 2 * root + 1
  r = 2 * root + 2
  if l < size and arr[l] > arr[largest]:
    largest = l
  if r < size and arr[r] > arr[largest]:
    largest = r
  if largest != root:
    arr[root], arr[largest] = arr[largest], arr[root]
    heapify(arr, size, largest)`;

function generateSteps(arr: number[]): SortStep[] {
  const steps: SortStep[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];

  function heapify(size: number, root: number) {
    let largest = root;
    const l = 2 * root + 1;
    const r = 2 * root + 2;
    if (l < size) {
      steps.push({
        array: [...a],
        comparing: [largest, l],
        swapping: [],
        sorted: [...sorted],
        label: `Heapify: 부모 a[${root}]=${a[root]} vs 왼쪽 a[${l}]=${a[l]}`,
        codeLine: 13,
        variables: { size, root, largest, l, r },
      });
      if (a[l] > a[largest]) largest = l;
    }
    if (r < size) {
      steps.push({
        array: [...a],
        comparing: [largest, r],
        swapping: [],
        sorted: [...sorted],
        label: `Heapify: 최댓값 후보 a[${largest}]=${a[largest]} vs 오른쪽 a[${r}]=${a[r]}`,
        codeLine: 15,
        variables: { size, root, largest, l, r },
      });
      if (a[r] > a[largest]) largest = r;
    }
    if (largest !== root) {
      [a[root], a[largest]] = [a[largest], a[root]];
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [root, largest],
        sorted: [...sorted],
        label: `교환: a[${root}]↔a[${largest}] (힙 속성 복구)`,
        codeLine: 18,
        variables: { size, root, largest, "arr[root]": a[root], "arr[largest]": a[largest] },
      });
      heapify(size, largest);
    }
  }

  // Build max heap
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: [],
    label: "Max-Heap 구성 시작",
    codeLine: 3,
    variables: { n },
  });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(n, i);
  }
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: [],
    label: "Max-Heap 구성 완료 — 루트가 최댓값",
    codeLine: 5,
    variables: { n },
  });

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    steps.push({
      array: [...a],
      comparing: [0],
      swapping: [],
      sorted: [...sorted],
      label: `루트 최댓값 a[0]=${a[0]} → 끝으로 이동`,
      codeLine: 6,
      variables: { i, "arr[0]": a[0], "arr[i]": a[i] },
    });
    [a[0], a[i]] = [a[i], a[0]];
    sorted.push(i);
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [0, i],
      sorted: [...sorted],
      label: `a[0] ↔ a[${i}], 인덱스 ${i} 확정`,
      codeLine: 6,
      variables: { i, "arr[0]": a[0], "arr[i]": a[i] },
    });
    heapify(i, 0);
  }
  sorted.push(0);

  const allSorted = Array.from({ length: n }, (_, i) => i);
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
  space: "O(1)",
  stable: false,
};

export default function HeapSortViz() {
  return <SortViz algorithmName="힙 정렬" complexity={complexity} generateSteps={generateSteps} pythonCode={PYTHON_CODE} />;
}

