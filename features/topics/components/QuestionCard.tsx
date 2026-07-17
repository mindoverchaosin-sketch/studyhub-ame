import type { TopicLearningQuestion } from "@/features/topics/types";

type QuestionCardProps = {
  question: TopicLearningQuestion;
};

export default function QuestionCard({ question }: QuestionCardProps) {
  return (
    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
      <p className="font-semibold text-slate-950">{question.question}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[question.optionA, question.optionB, question.optionC, question.optionD].map((option, index) => (
          <div key={option} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="mr-2 font-semibold text-slate-950">{String.fromCharCode(65 + index)}.</span>
            {option}
          </div>
        ))}
      </div>
    </div>
  );
}
