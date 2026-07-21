import { requireStudent } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import EmptyState from "@/components/dashboard/EmptyState";
import TopicHeader from "@/features/topics/components/TopicHeader";
import TopicSectionCard from "@/features/topics/components/TopicSectionCard";
import ResourceCard from "@/features/topics/components/ResourceCard";
import QuestionCard from "@/features/topics/components/QuestionCard";
import { getTopicLearningPageData } from "@/features/topics/actions/topic-learning";

type TopicLearningPageProps = {
  params: Promise<{ topicSlug: string }>;
};

export default async function TopicLearningPage({ params }: TopicLearningPageProps) {
  try {
    await requireStudent();
  } catch {
    redirect("/login");
  }

  const { topicSlug } = await params;
  const data = await getTopicLearningPageData(topicSlug);

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <main className="space-y-6">
          <TopicHeader
            title={data.topic.title}
            breadcrumb={data.breadcrumb}
            estimatedMinutes={data.topic.estimatedMinutes}
            difficulty={data.topic.difficulty}
          />

          <TopicSectionCard title="Overview" description="A concise overview of the topic and what to focus on.">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm leading-8 text-slate-600">{data.topic.description || "This topic is ready for study and revision."}</p>
            </div>
          </TopicSectionCard>

          <TopicSectionCard title="Resources" description="Reference materials for this topic.">
            {data.resources.length > 0 ? (
              <div className="space-y-3">
                {data.resources.map((resource) => (
                  <ResourceCard key={resource.id} {...resource} />
                ))}
              </div>
            ) : (
              <EmptyState title="No resources yet" description="Resources for this topic will appear as soon as they are published." />
            )}
          </TopicSectionCard>

          <TopicSectionCard title="Practice Questions" description="Work through the available questions one at a time.">
            {data.questions.length > 0 ? (
              <div className="space-y-4">
                {data.questions.slice(0, 1).map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            ) : (
              <EmptyState title="No practice questions yet" description="Practice questions for this topic will appear when they are published." />
            )}
          </TopicSectionCard>

          <TopicSectionCard title="Topic Quiz" description="A summary of the quiz available for this topic.">
            {data.quiz ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                <div>
                  <p className="font-semibold text-slate-950">{data.quiz.title}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{data.quiz.description || "A quick assessment for the key ideas in this topic."}</p>
                </div>
                <button className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                  Start Quiz
                </button>
              </div>
            ) : (
              <EmptyState title="No quiz available" description="A quiz will be linked here when one is published for this topic." />
            )}
          </TopicSectionCard>

          <TopicSectionCard title="Progress" description="Your current progress for this topic.">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Completion</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{data.progress.completed ? "Completed" : data.progress.status}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Time spent</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{data.progress.timeSpentMinutes} min</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-medium text-slate-500">Quiz score</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{data.progress.score ?? "—"}</p>
              </div>
            </div>
          </TopicSectionCard>

          <TopicSectionCard title="Navigation" description="Move to the previous or next topic in the sequence.">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {data.navigation.previousTopic ? (
                <Link href={`/student/topics/${data.navigation.previousTopic.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  ← {data.navigation.previousTopic.title}
                </Link>
              ) : (
                <span className="text-sm text-slate-400">No previous topic</span>
              )}

              {data.navigation.nextTopic ? (
                <Link href={`/student/topics/${data.navigation.nextTopic.slug}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                  {data.navigation.nextTopic.title} →
                </Link>
              ) : (
                <span className="text-sm text-slate-400">No next topic</span>
              )}
            </div>
          </TopicSectionCard>
        </main>
      </div>
    </div>
  );
}
