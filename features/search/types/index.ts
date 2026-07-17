export type SearchCategory = "course" | "module" | "section" | "topic" | "resource" | "question";

export type SearchResultItem = {
  id: string;
  category: SearchCategory;
  title: string;
  description?: string;
  href: string;
  meta: string;
};

export type SearchResponse = {
  query: string;
  groupedResults: Record<SearchCategory, SearchResultItem[]>;
  totalResults: number;
  suggestions: string[];
};
