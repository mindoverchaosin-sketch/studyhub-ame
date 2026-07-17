export default function AircraftIllustration() {
  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-[1.5rem] bg-[linear-gradient(145deg,_#1e3a8a_0%,_#2563eb_38%,_#0891b2_100%)] p-8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] sm:p-10">
      <svg viewBox="0 0 420 280" className="h-full w-full max-w-[360px]" role="img" aria-label="Illustration of an aircraft for AeroPrep">
        <defs>
          <linearGradient id="wingGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle cx="210" cy="132" r="110" fill="rgba(255,255,255,0.12)" />
        <path d="M95 144L178 124L204 92L236 104L283 116L336 128L310 142L262 150L220 166L180 162L120 172L80 166Z" fill="url(#wingGlow)" />
        <path d="M143 125L208 98L250 110L260 132L208 146L145 140Z" fill="#f8fbff" fillOpacity="0.92" />
        <path d="M104 141L132 132L176 124L197 116L214 115L224 122L160 151L128 154Z" fill="#dbeafe" fillOpacity="0.85" />
        <path d="M225 101L274 93L312 109L290 116L250 116Z" fill="#eff6ff" fillOpacity="0.9" />
        <path d="M307 108L330 102L354 116L332 126L318 122Z" fill="#dbeafe" fillOpacity="0.9" />
        <path d="M178 124L210 92L238 106L210 118Z" fill="#e0f2fe" fillOpacity="0.95" />
        <circle cx="208" cy="132" r="7" fill="#0f172a" />
      </svg>

      <div className="absolute bottom-6 left-6 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur">
        Exam-ready
      </div>
      <div className="absolute bottom-6 right-6 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur">
        Adaptive flow
      </div>
    </div>
  );
}
