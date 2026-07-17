export function getProgressPercent(completed: number, total: number) {
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

export function getStatusFromPercent(percent: number): "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" {
  if (percent >= 100) return "COMPLETED";
  if (percent > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export function formatExamLabel(exam: string) {
  if (!exam) return "Your upcoming exam";
  if (exam === "BOTH") return "DGCA & EASA";
  return exam;
}
