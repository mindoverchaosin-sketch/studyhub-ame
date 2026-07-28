import { searchRepository } from '@/server/repositories/search.repository'
import type { SearchCategory, SearchResponse, SearchResultItem } from "@/features/search/types";

function createResult(
  category: SearchCategory,
  id: string,
  title: string,
  description: string | null | undefined,
  href: string,
  meta: string,
): SearchResultItem {
  return {
    id,
    category,
    title,
    description: description ?? undefined,
    href,
    meta,
  };
}

export async function searchContent(query: string): Promise<SearchResponse> {
  const normalized = query.trim().toLowerCase();
  const suggestions = ["Aircraft", "Electrical", "PDF", "Quiz", "Systems", "Maintenance"];

  if (!normalized) {
    return {
      query: "",
      groupedResults: {
        course: [],
        module: [],
        section: [],
        topic: [],
        resource: [],
        question: [],
      },
      totalResults: 0,
      suggestions,
    };
  }

  const resp = await searchRepository.searchAll(normalized)

  const groupedResults = {
    course: resp.groupedResults.course,
    module: resp.groupedResults.module,
    section: [],
    topic: [],
    resource: [],
    question: [],
  } satisfies Record<SearchCategory, SearchResultItem[]>

  const totalResults = Object.values(groupedResults).reduce((sum, group) => sum + group.length, 0);

  return {
    query: normalized,
    groupedResults,
    totalResults,
    suggestions,
  };
}
