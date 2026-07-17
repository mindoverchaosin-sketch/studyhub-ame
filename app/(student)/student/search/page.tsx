import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import SearchPageClient from "@/features/search/components/SearchPage";

type SearchPageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function StudentSearchPage({ searchParams }: SearchPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const initialQuery = params?.q ?? "";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main>
          <SearchPageClient initialQuery={initialQuery} />
        </main>
      </div>
    </div>
  );
}
