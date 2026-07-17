export type HighlightSegment = {
  text: string;
  isMatch: boolean;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getHighlightedSegments(text: string, query: string): HighlightSegment[] {
  if (!query.trim()) {
    return [{ text, isMatch: false }];
  }

  const escapedQuery = escapeRegExp(query.trim());
  const segments = text.split(new RegExp(`(${escapedQuery})`, "ig"));

  return segments
    .filter((segment) => segment.length > 0)
    .map((segment) => ({
      text: segment,
      isMatch: segment.toLowerCase() === query.trim().toLowerCase(),
    }));
}
