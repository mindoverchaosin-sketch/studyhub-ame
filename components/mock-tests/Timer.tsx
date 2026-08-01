import { FiClock } from "react-icons/fi";

type TimerProps = {
  timeLeft: string;
  isExpired?: boolean;
};

export default function Timer({ timeLeft, isExpired = false }: TimerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-full border px-4 py-2 text-sm font-semibold ${isExpired ? "border-rose-200 bg-rose-50 text-rose-700" : "border-slate-200 bg-slate-50 text-slate-700"}`}
    >
      <span className="mr-2 inline-flex items-center gap-2"><FiClock className="h-4 w-4" />{timeLeft}</span>
      {isExpired ? <span className="font-semibold"> (Time expired)</span> : null}
    </div>
  );
}
