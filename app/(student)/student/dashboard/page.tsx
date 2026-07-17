import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import ContinueLearningCard from "@/components/dashboard/ContinueLearningCard";
import ProgressOverview from "@/components/dashboard/ProgressOverview";
import DashboardSection from "@/components/dashboard/DashboardSection";
import EmptyState from "@/components/dashboard/EmptyState";
import { getStudentProfile } from "@/server/services/user.service";
import { getStudentProgress, getStudentCompletedTopics } from "@/server/services/progress.service";
import { getAllCourses } from "@/server/services/course.service";
import { getPublishedQuizzes } from "@/server/services/quiz.service";
import { getResourcesByTopic } from "@/server/services/resource.service";
import { getTopicById } from "@/server/services/topic.service";

function formatExamLabel(exam: string | null | undefined) {
  if (!exam) return "Your upcoming exam";
  if (exam === "BOTH") return "DGCA & EASA";
  return exam;
}

function getLatestTopicProgress(progressRows: { topicId: string; status: string }[]) {
  return progressRows.find((item) => item.status === "IN_PROGRESS") ?? progressRows[0] ?? null;
}

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const studentProfile = await getStudentProfile(session.user.id);

  const [progressRows, completedTopics, courses, quizzes] = await Promise.all([
    getStudentProgress(session.user.id),
    getStudentCompletedTopics(session.user.id),
    getAllCourses(),
    getPublishedQuizzes(),
  ]);

  const latestTopicProgress = getLatestTopicProgress(progressRows as { topicId: string; status: string }[]);
  let currentTopic = null;

  if (latestTopicProgress?.topicId) {
    currentTopic = await getTopicById(latestTopicProgress.topicId);
  }

  const recentResources = currentTopic ? await getResourcesByTopic(currentTopic.id) : [];
  const todayQuiz = quizzes[0] ?? null;
  const studentName = studentProfile?.fullName || session.user.name || "Student";
  const targetExam = formatExamLabel(studentProfile?.targetExam ?? null);
  const modulesCompleted = completedTopics.filter((topic) => topic.status === "COMPLETED").length;
  const topicsCompleted = completedTopics.length;
  const quizScore = progressRows.length > 0 ? Math.round((topicsCompleted / progressRows.length) * 100) : 0;
  const continueProgress = progressRows.length > 0 ? Math.round((topicsCompleted / progressRows.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fbff_0%,_#f8fafc_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar />

        <main className="space-y-6" aria-labelledby="dashboard-heading">
          <WelcomeBanner studentName={studentName} targetExam={targetExam} />

          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            {currentTopic ? (
              <ContinueLearningCard
                topicTitle={currentTopic.title}
                progressPercent={continueProgress}
                href="/modules"
              />
            ) : (
              <DashboardSection
                title="Continue learning"
                description="Your next topic will appear here once you start a lesson."
              >
                <EmptyState
                  title="No active topic yet"
                  description="Pick a module to begin your next study session."
                  actionHref="/modules"
                  actionLabel="Browse modules"
                />
              </DashboardSection>
            )}

            <DashboardSection title="My courses" description="The courses currently available to you.">
              {courses.length > 0 ? (
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{course.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{course.description || "Structured prep for your target exam."}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                          {course.examType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No courses available" description="Courses will appear here as soon as they are published." />
              )}
            </DashboardSection>
          </div>

          <ProgressOverview
            modulesCompleted={modulesCompleted}
            topicsCompleted={topicsCompleted}
            quizScore={quizScore}
          />

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <DashboardSection title="Recent resources" description="Latest materials linked to your current topic.">
              {recentResources.length > 0 ? (
                <div className="space-y-3">
                  {recentResources.slice(0, 4).map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-950">{resource.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{resource.type}</p>
                      </div>
                      <a href={resource.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600">
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No resources yet" description="Resources will appear once your current topic has learning materials." />
              )}
            </DashboardSection>

            <DashboardSection title="Today’s quiz" description="A quick quiz is ready for you to test your understanding.">
              {todayQuiz ? (
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Fresh challenge</p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">{todayQuiz.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{todayQuiz.description || "A focused quiz to reinforce today’s learning."}</p>
                  <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
                    <span>Passing score: {todayQuiz.passingScore}%</span>
                    <span>{todayQuiz.timeLimitMinutes ?? 0} mins</span>
                  </div>
                </div>
              ) : (
                <EmptyState title="No quiz available" description="A quiz will appear here when one is published for your current focus." />
              )}
            </DashboardSection>
          </div>
        </main>
      </div>
    </div>
  );
}
