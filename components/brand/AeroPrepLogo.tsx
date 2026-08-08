import { useId } from "react";

type AeroPrepLogoProps = {
  variant?: "horizontal" | "icon";
  className?: string;
  invert?: boolean;
  title?: string;
};

export default function AeroPrepLogo({
  variant = "horizontal",
  className = "",
  invert = false,
  title = "AeroPrep",
}: AeroPrepLogoProps) {
  const iconFill = invert ? "#ffffff" : "#ffffff";
  const gradientFrom = invert ? "#93c5fd" : "#2563eb";
  const gradientTo = invert ? "#5eead4" : "#06b6d4";
  const textClass = invert ? "text-white" : "text-slate-950";

  const id = useId();
  const gradientId = `aeroprep-logo-gradient-${id}`;
  const gradientIconId = `aeroprep-logo-gradient-icon-${id}`;

  const logo = (
    <span className="inline-flex items-center gap-3">
      <svg
        width="40"
        height="40"
        viewBox="0 0 64 64"
        role="img"
        aria-hidden="true"
        className="h-10 w-10 flex-none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="64" height="64" rx="18" fill={`url(#${gradientId})`} />
        <path
          d="M21 44 L32 20 L43 44 L36 44 L32 32 L28 44 Z"
          fill={iconFill}
        />
        <path
          d="M19 36 L45 36 L49 30 L15 30 Z"
          fill={iconFill}
          opacity="0.8"
        />
      </svg>
      <span className={["font-semibold tracking-tight", textClass].join(" ")}>AeroPrep</span>
    </span>
  );

  if (variant === "icon") {
    return (
      <span className={className} aria-label={title} role="img">
        <svg
          width="40"
          height="40"
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="h-10 w-10"
        >
          <defs>
            <linearGradient id={gradientIconId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientFrom} />
              <stop offset="100%" stopColor={gradientTo} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="64" height="64" rx="18" fill={`url(#${gradientIconId})`} />
          <path d="M21 44 L32 20 L43 44 L36 44 L32 32 L28 44 Z" fill={iconFill} />
          <path d="M19 36 L45 36 L49 30 L15 30 Z" fill={iconFill} opacity="0.8" />
        </svg>
      </span>
    );
  }

  return <span className={["inline-flex items-center gap-3", className].filter(Boolean).join(" ")} aria-label={title}>{logo}</span>;
}
