import type { InputHTMLAttributes } from "react";
import { borderRadius, transitions } from "@/constants/theme";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className = "", style, ...props }: InputProps) {
  const inputId = props.id ?? `${props.name ?? "field"}-input`;

  return (
    <div className="w-full">
      {label ? (
        <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={["w-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white", error ? "border-rose-300" : "", className]
          .filter(Boolean)
          .join(" ")}
        style={{
          borderRadius: borderRadius.xl,
          transitionDuration: transitions.base,
          ...style,
        }}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      {hint && !error ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default Input;
