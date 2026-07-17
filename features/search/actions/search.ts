"use server";

import { searchContent } from "@/server/services/search.service";
import type { SearchResponse } from "@/features/search/types";

export async function searchContentAction(query: string): Promise<SearchResponse> {
  return searchContent(query);
}
