import Link from "next/link";
import Container from "@/components/ui/Container";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Modules", href: "/modules" },
      { label: "Mock Exams", href: "/quiz" },
      { label: "Flashcards", href: "/student/dashboard" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Study Notes", href: "/modules" },
      { label: "Previous Papers", href: "/quiz" },
      { label: "FAQ", href: "/about" },
      { label: "Support", href: "/about" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/register" },
      { label: "Contact", href: "/register" },
      { label: "Privacy", href: "/about" },
    ],
  },
] as const;

export default function FooterSection() {
  return (
    <footer className="border-t border-slate-200 bg-[linear-gradient(180deg,_#020617_0%,_#0f172a_100%)] text-slate-300">
      <Container className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:py-20">
        <div>
          <p className="text-xl font-semibold text-white">AeroPrep</p>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
            Premium aviation education for DGCA and EASA aspirants preparing for high-stakes maintenance exams.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{column.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/10 px-6 py-6 text-center text-sm text-slate-500 lg:px-8">
        © 2026 AeroPrep. All rights reserved.
      </div>
    </footer>
  );
}
