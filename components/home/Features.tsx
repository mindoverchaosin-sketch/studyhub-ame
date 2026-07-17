import SectionHeading from "@/components/ui/SectionHeading";

const features = [
  {
    title: "Mock Exams",
    description: "Simulate real exam conditions with timed papers and detailed performance insights.",
  },
  {
    title: "Study Notes",
    description: "Access concise, high-yield summaries tailored to DGCA and EASA syllabi.",
  },
  {
    title: "Flashcards",
    description: "Reinforce tricky topics with spaced repetition and quick recall drills.",
  },
  {
    title: "Progress Tracking",
    description: "Monitor your study streaks, chapter mastery, and weak areas in real time.",
  },
  {
    title: "AI Assistant",
    description: "Get contextual explanations and revision guidance whenever you need it.",
  },
  {
    title: "Previous Papers",
    description: "Practice with curated question banks from recent exam patterns and trends.",
  },
] as const;

export default function Features() {
  return (
    <section id="about" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
      <SectionHeading
        eyebrow="Why AeroPrep"
        title="Everything a serious aviation student needs to prepare with confidence."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-8 shadow-[0_16px_60px_-28px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_-30px_rgba(37,99,235,0.28)]">
            <h3 className="text-xl font-semibold tracking-[-0.01em] text-slate-950">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
