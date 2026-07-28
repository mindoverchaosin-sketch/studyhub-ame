import { requireStudent } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardSummaryAction } from "@/server/actions/dashboard.actions";
import { getGoalProgressAction, updateGoalProgressAction } from "@/server/actions/progress-insights.actions";
import { generateDailyPlanAction, getContinueLearningAction } from "@/server/actions/study-planner.actions";
import { getProgressInsightsAction } from "@/server/actions/progress-insights.actions";
import { getAchievementsAction } from "@/server/actions/achievement.actions";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
      <div style={{ color: "#64748b", fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, marginTop: 8 }}>{value}</div>
    </div>
  );
}

export default async function StudentDashboardPage() {
  let sessionUser;

  try {
    sessionUser = await requireStudent();
  } catch {
    redirect("/login");
  }

  const summary = await getDashboardSummaryAction(sessionUser.user.id as string);
  const planner = await generateDailyPlanAction(sessionUser.user.id as string);
  const continueLearning = await getContinueLearningAction(sessionUser.user.id as string);
  const insights = await getProgressInsightsAction(sessionUser.user.id as string);
  const goals = await getGoalProgressAction(sessionUser.user.id as string);
  const achievements = await getAchievementsAction(sessionUser.user.id as string);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Student Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <MetricCard label="Readiness" value={`${summary.readinessScore}%`} />
        <MetricCard label="Current Streak" value={summary.currentStreak} />
        <MetricCard label="Modules Completed" value={`${summary.modulesCompleted}/${summary.totalModules}`} />
        <MetricCard label="Questions Solved" value={summary.questionsSolved} />
        <MetricCard label="Mock Exams" value={summary.mockExamsTaken} />
        <MetricCard label="Average Score" value={`${summary.averageMockScore}%`} />
        <MetricCard label="Revision Queue" value={summary.revisionQueueCount} />
        <MetricCard label="Weekly Study Time" value={`${summary.weeklyStudyMinutes} min`} />
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Today&apos;s Study Plan</h2>
          <p style={{ marginBottom: 8 }}><strong>Estimated study time:</strong> {planner.estimatedStudyMinutes} min</p>
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontWeight: 600 }}>Revision tasks</h3>
            {planner.revisionTasks.map((task) => (
              <div key={task.id} style={{ marginTop: 6 }}>
                <div>{task.title}</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>{task.detail}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Practice tasks</h3>
            {planner.practiceTasks.map((task) => (
              <div key={task.id} style={{ marginTop: 6 }}>
                <div>{task.title}</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>{task.detail}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Weak topics</h3>
            {planner.weakTopicTasks.map((task) => (
              <div key={task.id} style={{ marginTop: 6 }}>
                <div>{task.title}</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>{task.detail}</div>
              </div>
            ))}
          </div>
          {planner.mockExamTask ? (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ fontWeight: 600 }}>Mock exam recommendation</h3>
              <div style={{ marginTop: 6 }}>{planner.mockExamTask.title}</div>
              <div style={{ color: "#64748b", fontSize: 14 }}>{planner.mockExamTask.detail}</div>
            </div>
          ) : null}
        </section>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Continue Learning</h2>
          <p><strong>Last module:</strong> {continueLearning.lastModule ?? "—"}</p>
          <p style={{ marginTop: 8 }}><strong>Last lesson:</strong> {continueLearning.lastLesson ?? "—"}</p>
          <p style={{ marginTop: 8 }}><strong>Last quiz:</strong> {continueLearning.lastQuiz ?? "—"}</p>
          <p style={{ marginTop: 8 }}><strong>Last mock exam:</strong> {continueLearning.lastMockExam ?? "—"}</p>
          <a href={continueLearning.resumeUrl} style={{ display: "inline-block", marginTop: 16, padding: "8px 12px", borderRadius: 6, background: "#0f172a", color: "white", textDecoration: "none" }}>Resume</a>
        </section>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Progress Insights</h2>
          <div style={{ marginTop: 8 }}>
            <h3 style={{ fontWeight: 600 }}>Readiness trend</h3>
            {insights.readinessTrend.map((item) => (
              <div key={item.label} style={{ marginTop: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{item.label}</span>
                  <span>{item.value}%</span>
                </div>
                <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden", marginTop: 4 }}>
                  <div style={{ width: `${Math.min(100, item.value)}%`, height: "100%", background: "#2563eb" }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Module completion</h3>
            {insights.moduleCompletion.map((item) => (
              <div key={item.label} style={{ marginTop: 6, fontSize: 14 }}>
                {item.label}: {item.value}%
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Mock score trend</h3>
            {insights.mockScoreTrend.map((item) => (
              <div key={item.label} style={{ marginTop: 6, fontSize: 14 }}>
                {item.label}: {item.value}%
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Topic mastery</h3>
            {insights.topicMastery.map((item) => (
              <div key={item.label} style={{ marginTop: 6, fontSize: 14 }}>
                {item.label}: {item.value}%
              </div>
            ))}
          </div>
        </section>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Goal Tracking</h2>
          <p><strong>Daily question goal:</strong> {goals.dailyQuestionGoal} ({goals.questionsCompletedToday}/{goals.dailyQuestionGoal})</p>
          <p style={{ marginTop: 8 }}><strong>Weekly study goal:</strong> {goals.weeklyStudyGoalMinutes} min ({goals.weeklyStudyMinutesCompleted}/{goals.weeklyStudyGoalMinutes})</p>
          <p style={{ marginTop: 8 }}><strong>Weekly mock goal:</strong> {goals.weeklyMockGoal} ({goals.weeklyMocksCompleted}/{goals.weeklyMockGoal})</p>
          <p style={{ marginTop: 8 }}><strong>Module completion goal:</strong> {goals.moduleCompletionGoal} ({goals.modulesCompleted}/{goals.moduleCompletionGoal})</p>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${goals.completionPercentage}%`, height: "100%", background: "#16a34a" }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 14 }}>{goals.completionPercentage}% complete</div>
          </div>
        </section>

        <section style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Achievements</h2>
          <p><strong>Completion:</strong> {achievements.completionPercentage}%</p>
          <p style={{ marginTop: 8 }}><strong>Unlocked:</strong> {achievements.totalUnlocked}/{achievements.totalAvailable}</p>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>Recently unlocked</h3>
            {achievements.recentAchievements.map((achievement) => (
              <div key={achievement.id} style={{ marginTop: 8, padding: 8, border: "1px solid #e2e8f0", borderRadius: 6 }}>
                <div style={{ fontWeight: 600 }}>{achievement.title}</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>{achievement.description}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 600 }}>In progress</h3>
            {achievements.inProgressAchievements.length === 0 ? (
              <div style={{ marginTop: 6, fontSize: 14 }}>All achievements are unlocked.</div>
            ) : (
              achievements.inProgressAchievements.map((achievement) => (
                <div key={achievement.id} style={{ marginTop: 8, padding: 8, border: "1px solid #e2e8f0", borderRadius: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{achievement.title}</span>
                    <span style={{ fontSize: 14, color: "#64748b" }}>{achievement.progress}%</span>
                  </div>
                  <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{achievement.description}</div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
