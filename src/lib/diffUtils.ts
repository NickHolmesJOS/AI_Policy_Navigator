// Simple line diff utility for side-by-side comparison
export interface DiffLine {
  left: string;
  right: string;
  type: "added" | "removed" | "unchanged";
}

export function diffLines(left: string, right: string): DiffLine[] {
  const leftLines = left.split(/\r?\n/);
  const rightLines = right.split(/\r?\n/);
  const result: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < leftLines.length || j < rightLines.length) {
    if (i < leftLines.length && j < rightLines.length && leftLines[i] === rightLines[j]) {
      result.push({ left: leftLines[i], right: rightLines[j], type: "unchanged" });
      i++; j++;
    } else if (j < rightLines.length && (!leftLines.includes(rightLines[j]) || i >= leftLines.length)) {
      result.push({ left: "", right: rightLines[j], type: "added" });
      j++;
    } else if (i < leftLines.length && (!rightLines.includes(leftLines[i]) || j >= rightLines.length)) {
      result.push({ left: leftLines[i], right: "", type: "removed" });
      i++;
    } else {
      result.push({ left: leftLines[i], right: rightLines[j], type: "unchanged" });
      i++; j++;
    }
  }
  return result;
}
