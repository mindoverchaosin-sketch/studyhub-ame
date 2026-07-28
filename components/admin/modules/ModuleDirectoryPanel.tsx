import Link from "next/link";
import Card from "@/components/ui/Card";
import type { ModuleDirectoryDTO } from "@/server/application/dto/module-management.dto";

interface ModuleDirectoryPanelProps {
  directory: ModuleDirectoryDTO;
  query: string;
  examType: string;
  status: string;
  sortBy: string;
  page: number;
}

type FilterValue = "ALL" | "DGCA" | "EASA" | "BOTH" | "DRAFT" | "PUBLISHED" | "ARCHIVED" | "SCHEDULED";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

function buildHref(current: string, options: Record<string, string | number | undefined>) {
  const params = new URLSearchParams(current);

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `/admin/modules?${queryString}` : "/admin/modules";
}

function statusTone(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-700";
    case "ARCHIVED":
      return "bg-slate-200 text-slate-700";
    case "SCHEDULED":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default function ModuleDirectoryPanel({ directory, query, examType, status, sortBy, page }: ModuleDirectoryPanelProps) {
  const baseQuery = new URLSearchParams();
  if (query) baseQuery.set("query", query);
  if (examType && examType !== "ALL") baseQuery.set("examType", examType);
  if (status && status !== "ALL") baseQuery.set("status", status);
  if (sortBy && sortBy !== "updated") baseQuery.set("sortBy", sortBy);

  const currentParams = baseQuery.toString();

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="border-slate-200/80 p-0">
        <div className="flex flex-col gap-6 border-b border-slate-200 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Module directory</h2>
            <p className="mt-1 text-sm text-slate-600">Search modules, filter by exam pathway, and review publication state from one administrative workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", value: "ALL" },
              { label: "DGCA", value: "DGCA" },
              { label: "EASA", value: "EASA" },
              { label: "BOTH", value: "BOTH" },
            ].map((option) => {
              const href = buildHref(currentParams, { examType: option.value, page: 1 });
              const active = examType === option.value;

              return (
                <Link key={option.value} href={href} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-200 p-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total modules</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{directory.summary.totalCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{directory.summary.publishedCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Draft & archived</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{directory.summary.draftCount + directory.summary.archivedCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <form method="get" action="/admin/modules" className="flex w-full max-w-xl items-center gap-2">
            <input type="text" name="query" defaultValue={query} placeholder="Search modules" className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-slate-500" />
            <input type="hidden" name="examType" value={examType} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="sortBy" value={sortBy} />
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">Search</button>
          </form>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "All", value: "ALL" },
              { label: "Draft", value: "DRAFT" },
              { label: "Published", value: "PUBLISHED" },
              { label: "Archived", value: "ARCHIVED" },
              { label: "Scheduled", value: "SCHEDULED" },
            ].map((option) => {
              const href = buildHref(currentParams, { status: option.value, page: 1 });
              const active = status === option.value;

              return (
                <Link key={option.value} href={href} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {option.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { label: "Recently updated", value: "updated" },
              { label: "Title", value: "title" },
              { label: "Created", value: "created" },
            ].map((option) => {
              const href = buildHref(currentParams, { sortBy: option.value, page: 1 });
              const active = sortBy === option.value;

              return (
                <Link key={option.value} href={href} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {directory.items.map((module) => (
            <div key={module.id} className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{module.moduleNumber}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">{module.examType}</span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(module.status)}`}>{module.status}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900">{module.title}</h3>
                    <Link href={`/admin/modules/${module.id}`} className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline">
                      View details
                    </Link>
                  </div>
                  <p className="text-sm text-slate-600">{module.description || "No description yet."}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lessons</p>
                  <p className="mt-1 font-semibold text-slate-900">{module.lessonCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Resources</p>
                  <p className="mt-1 font-semibold text-slate-900">{module.resourceCount}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDate(module.updatedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {directory.items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-600">No modules match the current filters. Try broadening the search.</div>
        ) : null}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">Page {directory.pagination.page} of {directory.pagination.totalPages}</p>
        <div className="flex gap-2">
          <Link href={buildHref(currentParams, { page: Math.max(1, page - 1) })} className={`rounded-full border px-3 py-2 text-sm font-medium ${page <= 1 ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
            Previous
          </Link>
          <Link href={buildHref(currentParams, { page: Math.min(directory.pagination.totalPages, page + 1) })} className={`rounded-full border px-3 py-2 text-sm font-medium ${page >= directory.pagination.totalPages ? "pointer-events-none border-slate-200 text-slate-400" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
