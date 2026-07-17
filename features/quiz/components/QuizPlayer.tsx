"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuizPlayerPageData } from "@/features/quiz/types";
import { submitQuizAction } from "@/features/quiz/actions/quiz-player";

type QuizPlayerProps = {
  data: QuizPlayerPageData;
};

export default function QuizPlayer({ data }: QuizPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<null | { score: number; correct: number; incorrect: number; passed: boolean; durationMinutes: number }>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(data.quiz.timeLimitMinutes ? data.quiz.timeLimitMinutes * 60 : null);
  const [showConfirm, setShowConfirm] = useState(false);

  const questions = data.questions;
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  useMemo(() => {
    if (!timeLeft || timeLeft <= 0 || submitted) return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleAnswer = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
  };

  const paletteStatus = (index: number) => {
    const questionId = questions[index]?.id;
    if (!questionId) return "neutral";
    if (answers[questionId]) return "answered";
    return currentIndex === index ? "current" : "skipped";
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const resultData = await submitQuizAction(data.quiz.id, answers, Date.now());
    setResult(resultData);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted && result) {
    return (
      <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.04)]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Results</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Quiz completed</h2>
          <p className="mt-3 text-sm leading-8 text-slate-600">Your submission has been recorded and your topic progress has been updated.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
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

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Question {currentIndex + 1} / {questions.length}</span>
        <span>{data.quiz.passingScore}% passing score</span>
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
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Submit</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Review your selections and submit when you are ready.</p>
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
            <button onClick={handleSubmit} disabled={isSubmitting} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
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
