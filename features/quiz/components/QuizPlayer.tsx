"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuizPlayerPageData } from "@/features/quiz/types";
import { submitQuizAction } from "@/features/quiz/actions/quiz-player";

type QuizPlayerProps = {
  data: QuizPlayerPageData;
};

type QuizResultState = {
  score: number;
  correct: number;
  incorrect: number;
  passed: boolean;
  accuracy: number;
  durationMinutes: number;
  mode: "practice" | "mock";
  timedOut: boolean;
  review: Array<{
    id: string;
    question: string;
    selectedAnswer: string | null;
    correctAnswer: string | null;
    explanation: string | null;
    isCorrect: boolean;
    isSkipped: boolean;
    isMarkedForReview: boolean;
    isBookmarked: boolean;
  }>;
  weakTopics: Array<{ id: string; title: string; reason: string }>;
  analytics: {
    bestScore: number;
    averageScore: number;
    completionPercent: number;
    recentAttempts: Array<{ id: string; score: number; passed: boolean; attemptedAt: Date; quizTitle: string }>;
  };
};

export default function QuizPlayer({ data }: QuizPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionStates, setQuestionStates] = useState<Record<string, { markedForReview?: boolean; bookmarked?: boolean; skipped?: boolean }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResultState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(data.quiz.timeLimitMinutes ? data.quiz.timeLimitMinutes * 60 : null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mode, setMode] = useState<"practice" | "mock">("practice");
  const [paused, setPaused] = useState(false);
  const [hasLoadedProgress, setHasLoadedProgress] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const storageKey = `quiz-progress-${data.quiz.id}`;

  const questions = data.questions;
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    if (!hasLoadedProgress) {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAnswers(parsed.answers ?? {});
          setQuestionStates(parsed.questionStates ?? {});
          setCurrentIndex(parsed.currentIndex ?? 0);
          setMode(parsed.mode ?? "practice");
          setPaused(parsed.paused ?? false);
          setTimeLeft(parsed.timeLeft ?? (data.quiz.timeLimitMinutes ? data.quiz.timeLimitMinutes * 60 : null));
          setStartedAt(parsed.startedAt ?? Date.now());
        } catch {
          // Ignore malformed saves and continue with defaults.
        }
      }
      setHasLoadedProgress(true);
      return;
    }

    if (!timeLeft || timeLeft <= 0 || submitted || paused) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev || prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft, submitted, paused, hasLoadedProgress, storageKey, data.quiz.timeLimitMinutes]);

  useEffect(() => {
    if (!hasLoadedProgress) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ answers, questionStates, currentIndex, mode, paused, timeLeft, startedAt }));
  }, [answers, questionStates, currentIndex, mode, paused, timeLeft, startedAt, hasLoadedProgress, storageKey]);

  useEffect(() => {
    if (timeLeft === 0 && !submitted && !isSubmitting && mode === "mock") {
      void handleSubmit(true);
    }
  }, [timeLeft, submitted, isSubmitting, mode]);

  const handleAnswer = (option: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    setQuestionStates((prev) => ({ ...prev, [currentQuestion.id]: { ...prev[currentQuestion.id], skipped: false } }));
  };

  const toggleState = (key: "markedForReview" | "bookmarked") => {
    if (!currentQuestion) return;
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        [key]: !prev[currentQuestion.id]?.[key],
      },
    }));
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    setQuestionStates((prev) => ({
      ...prev,
      [currentQuestion.id]: { ...prev[currentQuestion.id], skipped: true },
    }));
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: "" }));
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const paletteStatus = (index: number) => {
    const questionId = questions[index]?.id;
    if (!questionId) return "neutral";
    if (answers[questionId]) return "answered";
    return currentIndex === index ? "current" : "skipped";
  };

  const handleSubmit = async (timedOut = false) => {
    setIsSubmitting(true);
    try {
      const resultData = await submitQuizAction(data.quiz.id, answers, startedAt, {
        questionStates,
        mode,
        durationMinutes: Math.max(1, Math.ceil((Date.now() - startedAt) / 60000)),
        timedOut,
      });
      setResult(resultData);
      setSubmitted(true);
    } catch {
      window.alert("We couldn't submit your quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted && result) {
    return (
      <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Results</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Quiz completed</h2>
          <p className="mt-3 text-sm leading-8 text-slate-600">Your submission has been recorded and your topic progress has been updated.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Score</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{result.score}%</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Correct</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{result.correct}</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Incorrect</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{result.incorrect}</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Time</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{result.durationMinutes} min</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Accuracy</p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{result.accuracy}%</p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Review</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Weak topics and explanations are surfaced from the submission engine.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{result.mode}</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">Weak topics</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                {result.weakTopics.length > 0 ? result.weakTopics.map((topic) => <li key={topic.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">{topic.title}</li>) : <li className="rounded-2xl border border-slate-200 bg-white px-3 py-2">No weak topics detected.</li>}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Analytics</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-600">
                <li>Best score: {result.analytics.bestScore}%</li>
                <li>Average score: {result.analytics.averageScore}%</li>
                <li>Completion: {result.analytics.completionPercent}%</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Answers</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Practice mode shows explanations for every answer.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{result.mode}</span>
          </div>
          <div className="mt-4 space-y-3">
            {result.review.map((item) => (
              <div key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${item.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {item.isCorrect ? "Correct" : "Needs review"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                  <div>
                    <p className="font-medium text-slate-500">Your answer</p>
                    <p className="mt-1">{item.selectedAnswer ?? "Skipped"}</p>
                  </div>
                  <div>
                    <p className="font-medium text-slate-500">Correct answer</p>
                    <p className="mt-1">{item.correctAnswer ?? "Not available"}</p>
                  </div>
                </div>
                {result.mode === "practice" && item.explanation ? <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 text-slate-600">{item.explanation}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => router.push(`/student/topics/${data.quiz.topicId}`)} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Back to topic
          </button>
          <button onClick={() => router.refresh()} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Retry quiz
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="rounded-[2rem] border border-slate-200/80 bg-white p-8 text-sm text-slate-600 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
        No questions are available for this quiz yet.
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{data.quiz.topicTitle}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{data.quiz.title}</h2>
        </div>
        {timeLeft !== null ? <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</div> : null}
      </div>

      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode("practice")} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${mode === "practice" ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>Practice mode</button>
          <button onClick={() => setMode("mock")} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${mode === "mock" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>Mock exam</button>
          {mode === "practice" ? <button onClick={() => setPaused((prev) => !prev)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">{paused ? "Resume" : "Pause"}</button> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Question</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">{currentQuestion.question}</h3>
          <div className="mt-6 grid gap-3">
            {[
              { label: "A", value: currentQuestion.optionA },
              { label: "B", value: currentQuestion.optionB },
              { label: "C", value: currentQuestion.optionC },
              { label: "D", value: currentQuestion.optionD },
            ].map((option) => (
              <button
                key={option.label}
                onClick={() => handleAnswer(option.value)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${answers[currentQuestion.id] === option.value ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
              >
                <span className="mr-2 font-semibold">{option.label}.</span>
                {option.value}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Previous
            </button>
            <button onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
              Next
            </button>
            <button onClick={() => toggleState("markedForReview")} className={`rounded-full px-4 py-2 text-sm font-semibold ${questionStates[currentQuestion.id]?.markedForReview ? "bg-amber-500 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              Mark for review
            </button>
            <button onClick={() => toggleState("bookmarked")} className={`rounded-full px-4 py-2 text-sm font-semibold ${questionStates[currentQuestion.id]?.bookmarked ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
              Bookmark
            </button>
            <button onClick={handleSkip} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Skip
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Question palette</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {questions.map((question, index) => {
                const status = paletteStatus(index);
                return (
                  <button key={question.id} onClick={() => setCurrentIndex(index)} className={`rounded-2xl border px-3 py-2 text-sm font-semibold ${status === "answered" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : status === "current" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700"}`}>
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Submission</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Practice mode lets you pause and review. Mock mode auto-submits on timeout.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <span className="rounded-full bg-white px-3 py-1">{mode === "practice" ? "Pause allowed" : "Auto-submit on timeout"}</span>
              <span className="rounded-full bg-white px-3 py-1">{questions.filter((question) => answers[question.id]).length} answered</span>
              <span className="rounded-full bg-white px-3 py-1">{paused ? "Paused" : "Live"}</span>
            </div>
            <button onClick={() => setShowConfirm(true)} className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {showConfirm ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
          <p className="font-semibold text-slate-950">Confirm submission</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">Once submitted, your answers will be scored and your progress updated.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={() => void handleSubmit(false)} disabled={isSubmitting} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? "Submitting..." : "Confirm"}
            </button>
            <button onClick={() => setShowConfirm(false)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
