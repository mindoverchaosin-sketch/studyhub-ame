const stats = [
  { value: "14+", label: "DGCA modules" },
  { value: "5k+", label: "exam questions" },
  { value: "120+", label: "mock exams" },
] as const;

export default function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8 lg:pb-28">
      <div className="grid gap-4 rounded-[2rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.35)] backdrop-blur md:grid-cols-3 md:p-8 lg:p-10">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl bg-gradient-to-br from-slate-50 to-white p-7 text-center shadow-sm shadow-slate-200/70">
            <p className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{item.value}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.24em] text-slate-600">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
