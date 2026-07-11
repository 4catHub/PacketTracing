import { ContentItem } from "../content-types";

export const radixSortContent: ContentItem = {
    slug: "radix-sort",
    category: "algorithm",
    title: "기수 정렬",
    subtitle: "자릿수별로 안정 정렬을 반복하는 O(d·n) 선형 정렬",
    tags: [
    "Sort",
    "O(dn)",
    "Non-comparison"
],
    description: `기수 정렬은 숫자를 자릿수(digit) 별로 분해하고, 각 자릿수에 대해 안정 정렬(보통 계수 정렬)을 반복 적용하여 전체를 정렬합니다. 비교 없이 동작하므로 O(n log n) 하한을 극복합니다.

## 복잡도
- 시간 복잡도: O(d × (n + k)) — d: 최대 자릿수, k: 기수(보통 10 또는 256)
- 공간 복잡도: O(n + k)
- 안정(Stable) 정렬

## LSD vs MSD
- LSD(Least Significant Digit): 낮은 자릿수부터 처리. 구현이 단순하고 안정적.
- MSD(Most Significant Digit): 높은 자릿수부터 처리. 재귀적이며 문자열 정렬에 적합.

## 적용 범위
정수, 고정 길이 문자열, IP 주소 등 키를 자릿수로 분해할 수 있는 경우에 사용합니다. d가 log n보다 작으면 퀵 정렬보다 빠를 수 있습니다. 예를 들어 32비트 정수의 경우 d = 4(8비트씩 4회)로 O(4n) = O(n)에 수렴합니다.`,
  steps: [
    "최대값의 자릿수(d) 파악",
    "1의 자리부터 시작: 해당 자릿수 기준으로 계수 정렬 (안정 정렬 필수)",
    "10의 자리, 100의 자리, ... 순으로 반복",
    "d번의 패스 완료 후 전체 정렬 완료"
],
    examples: [
    "전화번호, 우편번호 등 고정 길이 숫자 정렬",
    "IP 주소, MAC 주소 정렬",
    "대규모 정수 배열 정렬 (d << log n인 경우)",
    "문자열 사전 정렬 (MSD Radix Sort)"
],
  complexity: {
    best: "O(d·n)",
    avg: "O(d·n)",
    worst: "O(d·n)",
    space: "O(n+k)",
    stable: true
},
};
