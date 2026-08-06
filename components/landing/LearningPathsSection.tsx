import Link from "next/link";
import { FiArrowRight, FiCheck } from "react-icons/fi";

type Path = {
  flag: string;
  region: string;
  title: string;
  description: string;
  tags: string[];
  href: string;
  cta: string;
  featured?: boolean;
};

const paths: Path[] = [
  {
    flag: "🇮🇳",
    region: "DGCA",
    title: "Aircraft Maintenance Engineer",
    description: "India · Directorate General of Civil Aviation",
    tags: ["DGCA B1", "DGCA B2"],
    href: "/modules?path=dgca",
    cta: "Explore DGCA",
    featured: true,
  },
  {
    flag: "🇪🇺",
    region: "EASA",
    title: "European Aviation Safety Agency",
    description: "Europe · Part-66 licensing framework",
    tags: ["Combined B1 + B2", "17 Modules"],
    href: "/modules?path=easa",
    cta: "Explore EASA",
  },
];

export default function LearningPathsSection() {
  return (
    <section id="learning-paths" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Learning Paths
          </p>
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Choose your certification track
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground">
            Structured, exam-aligned curricula built for the licence you&apos;re
            working toward.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {paths.map((path) => (
            <article
              key={path.region}
              className={`glass group relative overflow-hidden rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-1 ${
                path.featured ? "ring-1 ring-primary/30" : ""
              }`}
            >
              <div
                aria-hidden
                className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100"
              />
              <div className="relative flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background/60 text-2xl">
                  {path.flag}
                </span>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {path.region}
                  </h3>
                  <p className="text-sm text-muted-foreground">{path.description}</p>
                </div>
              </div>

              <p className="relative mt-6 text-base font-medium text-foreground">
                {path.title}
              </p>

              <ul className="relative mt-5 flex flex-wrap gap-2">
                {path.tags.map((tag) => (
                  <li
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    <FiCheck className="h-3.5 w-3.5 text-accent" aria-hidden />
                    {tag}
                  </li>
                ))}
              </ul>

              <Link
                href={path.href}
                className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_35px_-18px_var(--primary)] transition-transform hover:-translate-y-0.5"
              >
                {path.cta}
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
