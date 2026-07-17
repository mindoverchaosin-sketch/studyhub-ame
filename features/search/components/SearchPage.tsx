"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchContentAction } from "@/features/search/actions/search";
import type { SearchCategory, SearchResponse, SearchResultItem } from "@/features/search/types";
import { getHighlightedSegments } from "@/features/search/utils/highlight";
import EmptyState from "@/components/dashboard/EmptyState";

const categoryLabels: Record<SearchCategory, string> = {
  course: "Courses",
  module: "Modules",
  section: "Sections",
  topic: "Topics",
  resource: "Resources",
  question: "Questions",
};

function SearchResultCard({ result, query }: { result: SearchResultItem; query: string }) {
  const segments = getHighlightedSegments(result.title, query);

  return (
    <Link href={result.href} className="block rounded-[1.25rem] border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">
            {categoryLabels[result.category]}
          </span>
          <span className="text-sm font-medium text-slate-500">{result.meta}</span>
        </div>
      </div>
      <h3 className="mt-3 text-base font-semibold text-slate-950">
        {segments.map((segment, index) => (
          <span key={`${segment.text}-${index}`} className={segment.isMatch ? "bg-blue-100 text-blue-700" : ""}>
            {segment.text}
          </span>
        ))}
      </h3>
      {result.description ? <p className="mt-2 text-sm leading-7 text-slate-600">{result.description}</p> : null}
    </Link>
  );
}

function SearchPanel({ response, query }: { response: SearchResponse; query: string }) {
  const categories = Object.entries(response.groupedResults) as [SearchCategory, SearchResultItem[]][];

  if (!query.trim()) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Suggestions</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {response.suggestions.map((suggestion) => (
            <span key={suggestion} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {suggestion}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (response.totalResults === 0) {
    return <EmptyState title="No results found" description="Try a broader term or search for a course, topic, or resource by name." />;
  }

  return (
    <div className="space-y-6">
      {categories.map(([category, results]) => (
        <section key={category} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-950">{categoryLabels[category]}</h3>
            <span className="text-sm font-medium text-slate-500">{results.length}</span>
          </div>
          {results.length > 0 ? (
            <div className="grid gap-3">
              {results.map((result) => (
                <SearchResultCard key={result.id} result={result} query={query} />
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export default function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      const data = await searchContentAction(query);
      setResponse(data);
      setIsLoading(false);
      setActiveIndex(0);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const flattenedResults = useMemo(() => {
    if (!response) return [];
    return Object.values(response.groupedResults).flat();
  }, [response]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!flattenedResults.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flattenedResults.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flattenedResults.length) % flattenedResults.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const current = flattenedResults[activeIndex];
      if (current) {
        router.push(current.href);
      }
    }
  };

  return (
    <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.04)] sm:p-8">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Global search</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Search courses, modules, topics, and resources</h2>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a course, module, topic, question, or resource"
            className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 pr-12 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white"
          />
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">⌕</div>
        </div>
      </div>

      {isLoading ? <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Loading results…</div> : null}

      {!isLoading && response ? <SearchPanel response={response} query={query} /> : null}
    </div>
  );
}
