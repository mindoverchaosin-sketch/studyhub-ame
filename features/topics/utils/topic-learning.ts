export function formatResourceLabel(type: string) {
  if (type === "PDF") return "PDF";
  if (type === "VIDEO") return "Video";
  if (type === "IMAGE") return "Image";
  if (type === "LINK") return "External Link";
  return type;
}

export function getProgressStatusLabel(status: string) {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In progress";
  return "Not started";
}

export function getProgressPercent(status: string, score: number | null) {
  if (status === "COMPLETED") return 100;
  if (score && score > 0) return Math.min(100, score);
  return 0;
}
