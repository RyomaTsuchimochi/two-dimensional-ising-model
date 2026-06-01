export interface BinderCrossing {
  temperature: number;
  method: "sign-change" | "min-diff";
  index: number;
}

export function binderCumulant(m2: number, m4: number): number {
  if (m2 === 0) {
    return 0;
  }
  return 1 - m4 / (3 * m2 * m2);
}

export function estimateBinderCrossing(
  temperatures: number[],
  u4a: number[],
  u4b: number[],
): BinderCrossing {
  if (temperatures.length !== u4a.length || temperatures.length !== u4b.length) {
    throw new Error("Temperature and U4 arrays must have the same length.");
  }

  let bestIndex = 0;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < temperatures.length; i++) {
    const temp = temperatures[i];
    const u4ai = u4a[i];
    const u4bi = u4b[i];
    if (temp === undefined || u4ai === undefined || u4bi === undefined) {
      throw new Error("Temperature and U4 arrays contain undefined values.");
    }

    const diff = u4ai - u4bi;
    const absDiff = Math.abs(diff);
    if (absDiff < bestDiff) {
      bestDiff = absDiff;
      bestIndex = i;
    }

    if (i === 0) {
      continue;
    }

    const prevTemp = temperatures[i - 1];
    const prevU4a = u4a[i - 1];
    const prevU4b = u4b[i - 1];
    if (prevTemp === undefined || prevU4a === undefined || prevU4b === undefined) {
      throw new Error("Temperature and U4 arrays contain undefined values.");
    }

    const prevDiff = prevU4a - prevU4b;
    if (prevDiff === 0) {
      return { temperature: prevTemp, method: "sign-change", index: i - 1 };
    }

    if (prevDiff * diff < 0) {
      const tCross = prevTemp + (0 - prevDiff) * (temp - prevTemp) / (diff - prevDiff);
      return { temperature: tCross, method: "sign-change", index: i - 1 };
    }
  }

  const bestTemp = temperatures[bestIndex];
  if (bestTemp === undefined) {
    throw new Error("Temperature list is empty.");
  }
  return { temperature: bestTemp, method: "min-diff", index: bestIndex };
}
