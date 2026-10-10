import { ContentItem } from "../content-types";

export const binarySearchBoundsContent: ContentItem = {
  slug: "binary-search-lower-upper-bound",
  category: "algorithm",
  title: "이진 탐색과 Lower/Upper Bound",
  subtitle:
    "정렬된 배열의 탐색 구간을 절반씩 줄여 값과 중복 구간의 경계를 찾는 방법",
  tags: ["Algorithm", "Binary Search", "Lower Bound", "Upper Bound", "Array"],
  description: `이진 탐색(Binary Search)은 정렬된 배열에서 가운데 값을 확인한 뒤, 답이 있을 수 없는 절반을 버리는 탐색 알고리즘입니다. 일반 이진 탐색이 목표값과 같은 원소 하나를 찾는다면, Lower Bound와 Upper Bound는 중복된 값의 시작과 끝 경계를 찾습니다.

### 1. 반열린 탐색 구간 \`[low, high)\`
- **포함 범위:** \`low\`는 현재 후보에 포함되고 \`high\`는 포함되지 않습니다.
- **중간 위치:** \`mid = low + Math.floor((high - low) / 2)\`로 계산합니다.
- **핵심 불변식:** 정답이 존재한다면 매 단계의 후보 구간 \`[low, high)\` 안에 남아 있습니다.
- **종료 조건:** \`low === high\`가 되면 더 나눌 후보가 없으며, 그 위치가 경계 탐색의 결과가 됩니다.

### 2. 일반 이진 탐색
\`values[mid] === target\`이면 즉시 성공합니다. 중복값이 있으면 그중 **어느 위치든** 반환할 수 있으므로 첫 번째 또는 마지막 위치를 보장하지 않습니다. 값이 더 작으면 왼쪽 절반과 \`mid\`를 버리고, 더 크면 오른쪽 절반과 \`mid\`를 버립니다.

### 3. Lower Bound와 Upper Bound
- **Lower Bound:** \`target\` 이상인 값이 처음 나타나는 위치입니다. \`values[mid] < target\`일 때만 \`low\`를 오른쪽으로 옮기고, 같아도 더 앞쪽 경계를 찾기 위해 \`high = mid\`로 줄입니다.
- **Upper Bound:** \`target\`보다 큰 값이 처음 나타나는 위치입니다. \`values[mid] <= target\`이면 같은 값까지 건너뛰도록 \`low = mid + 1\`로 옮깁니다.
- **중복 개수:** 정렬 배열에서 목표값의 개수는 \`upperBound(target) - lowerBound(target)\`입니다.

### 4. 값이 없거나 배열 끝에 있는 경계
Lower Bound와 Upper Bound는 목표값이 없어도 **삽입 위치**를 반환합니다. 모든 원소가 조건을 만족하지 않으면 배열 길이 \`n\`을 반환할 수 있으므로, 시각화의 \`high\`와 결과 포인터는 마지막 원소 다음 칸까지 이동합니다.`,
  steps: [
    "정렬된 배열 전체를 반열린 후보 구간 [low, high)로 설정",
    "가운데 인덱스 mid를 계산하고 values[mid]와 target을 비교",
    "선택한 모드의 비교 조건에 따라 low 또는 high를 갱신하여 후보 구간을 절반으로 축소",
    "일반 탐색은 일치 시 종료하고, 경계 탐색은 low와 high가 만날 때까지 반복",
    "lower bound와 upper bound의 차이로 목표값의 중복 개수를 계산",
  ],
  examples: [
    "정렬된 사용자 목록에서 특정 ID의 존재 여부 확인",
    "점수 구간에서 특정 점수 이상인 첫 학생의 위치 찾기",
    "로그 타임스탬프 배열에서 조회 시작·종료 범위 계산",
    "중복 원소의 시작과 끝을 찾아 등장 횟수 계산",
  ],
  complexity: {
    best: "O(1)",
    avg: "O(log n)",
    worst: "O(log n)",
    space: "O(1)",
  },
  related: [
    {
      slug: "merge-sort",
      category: "algorithm",
      relation: "이진 탐색의 전제인 정렬된 배열을 만드는 안정 정렬",
    },
    {
      slug: "b-plus-tree",
      category: "algorithm",
      relation: "정렬된 키와 경계 탐색을 트리 기반 인덱스로 확장",
    },
  ],
};
