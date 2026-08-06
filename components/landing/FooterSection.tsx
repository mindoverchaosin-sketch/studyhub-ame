import Link from "next/link";
import { PiAirplaneTiltFill } from "react-icons/pi";

const columns = [
  {
    title: "Learning",
    links: [
      { label: "DGCA Path", href: "/modules?path=dgca" },
      { label: "EASA Path", href: "/modules?path=easa" },
      { label: "Mock Exams", href: "/quiz" },
      { label: "Question Bank", href: "/modules" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "AI Tutor", href: "#features" },
      { label: "Study Planner", href: "#features" },
      { label: "Analytics", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "/about" },
      { label: "Privacy", href: "/about" },
    ],
  },
];

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PiAirplaneTiltFill className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Aero<span className="text-primary">Prep</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted-foreground">
            The AI-powered learning platform for Aircraft Maintenance Engineers
            preparing for DGCA and EASA exams.
          </p>
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
              {column.title}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border px-6 py-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 AeroPrep. All rights reserved.</p>
          <p className="font-mono text-xs">Built for future Aircraft Maintenance Engineers.</p>
        </div>
      </div>
    </footer>
  );
}
