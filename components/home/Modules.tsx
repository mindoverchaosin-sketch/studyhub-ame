import SectionHeading from "@/components/ui/SectionHeading";

const modules = [
  {
    title: "Airframe & Systems",
    description: "Master structural systems, avionics, and maintenance procedures with exam-aligned lessons.",
    lessons: "24 lessons",
    mcqs: "1,200 MCQs",
  },
  {
    title: "Electrical Fundamentals",
    description: "Build confidence in circuits, power systems, and troubleshooting scenarios.",
    lessons: "18 lessons",
    mcqs: "980 MCQs",
  },
  {
    title: "Propulsion",
    description: "Study turbine engines, fuel systems, and performance concepts with concise notes.",
    lessons: "16 lessons",
    mcqs: "840 MCQs",
  },
  {
    title: "Human Factors",
    description: "Prepare for operational safety, CRM, and human performance questions with clarity.",
    lessons: "12 lessons",
    mcqs: "640 MCQs",
  },
] as const;

export default function Modules() {
  return (
    <section id="modules" className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Popular modules"
          title="Study the exact topics examiners expect."
        />
        <p className="max-w-xl text-base leading-8 text-slate-600">
          Every module is designed for aviation students who want structured preparation, sharper recall, and faster progress.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-4">
        {modules.map((module) => (
          <article
            key={module.title}
            className="group rounded-[1.5rem] border border-slate-200/80 bg-white p-7 shadow-[0_12px_45px_-24px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_-28px_rgba(37,99,235,0.35)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-sm font-semibold text-blue-600">
              {module.title.charAt(0)}
            </div>
            <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em] text-slate-950">{module.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">{module.description}</p>
            <div className="mt-6 space-y-2 text-sm font-medium text-slate-700">
              <p>{module.lessons}</p>
              <p>{module.mcqs}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
