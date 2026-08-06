import { FiStar } from "react-icons/fi";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "The AI tutor felt like having a senior engineer on call. It explained tricky module 3 concepts until they finally clicked.",
    name: "Rahul Menon",
    role: "DGCA B1 Candidate",
    initials: "RM",
  },
  {
    quote:
      "The mock exams are eerily close to the real thing. Walking into my EASA paper, nothing surprised me.",
    name: "Sofia Lindqvist",
    role: "EASA Part-66 Student",
    initials: "SL",
  },
  {
    quote:
      "The adaptive planner kept me honest. My streak hit 40 days and my analytics showed exactly where to push.",
    name: "Arjun Nair",
    role: "AME Trainee",
    initials: "AN",
  },
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Testimonials
          </p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted by engineers in the making
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="glass flex flex-col rounded-3xl p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex gap-1 text-accent" aria-label="Rated 5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar key={i} className="h-4 w-4 fill-current" aria-hidden />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 text-pretty text-[15px] leading-7 text-foreground">
                {`\u201C${t.quote}\u201D`}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
