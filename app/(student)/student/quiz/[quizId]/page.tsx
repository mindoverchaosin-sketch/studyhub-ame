import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import EmptyState from "@/components/dashboard/EmptyState";
import QuizPlayer from "@/features/quiz/components/QuizPlayer";
import { getQuizPlayerPageData } from "@/features/quiz/actions/quiz-player";

type QuizPageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPlayerPage({ params }: QuizPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { quizId } = await params;
  const data = await getQuizPlayerPageData(quizId);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />
        <main>
          {data ? (
            <QuizPlayer data={data} />
          ) : (
            <EmptyState title="Quiz not found" description="The requested quiz could not be found or is not published yet." />
          )}
        </main>
      </div>
    </div>
  );
}
