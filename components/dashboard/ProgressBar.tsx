type ProgressBarProps = {
  progress: number;
  className?: string;
};

export default function ProgressBar({ progress, className = "" }: ProgressBarProps) {
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={["h-2.5 w-full overflow-hidden rounded-full bg-slate-100", className].filter(Boolean).join(" ")}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
        style={{ width: `${safeProgress}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safeProgress}
        aria-label="Learning progress"
      />
    </div>
  );
}
