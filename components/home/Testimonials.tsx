import SectionHeading from "@/components/ui/SectionHeading";

const testimonials = [
  {
    quote: "AeroPrep helped me turn scattered notes into a focused revision plan before my DGCA paper.",
    name: "Aarav S.",
    role: "Aircraft Maintenance Student",
  },
  {
    quote: "The mock exams felt close to the real thing and sharpened my timing dramatically.",
    name: "Meera P.",
    role: "EASA Prep Candidate",
  },
  {
    quote: "The flashcards and study notes made it easy to revise on the go between shifts.",
    name: "Rohan D.",
    role: "AME Apprentice",
  },
] as const;

export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-28">
      <SectionHeading
        eyebrow="Student voices"
        title="Trusted by ambitious aviation learners worldwide."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {testimonials.map((testimonial) => (
          <figure key={testimonial.name} className="rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-8 shadow-[0_16px_60px_-30px_rgba(15,23,42,0.35)]">
            <blockquote className="text-base leading-8 text-slate-700">“{testimonial.quote}”</blockquote>
            <figcaption className="mt-6">
              <p className="font-semibold text-slate-950">{testimonial.name}</p>
              <p className="mt-1 text-sm text-slate-600">{testimonial.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
