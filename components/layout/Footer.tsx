import Link from "next/link";
import type { HTMLAttributes } from "react";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/pricing", label: "Pricing" },
      { href: "/auth/register", label: "Get Started" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/modules", label: "Courses" },
      { href: "/quiz", label: "Mock Tests" },
      { href: "/about", label: "Why AeroPrep" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: "mailto:support@aeroprep.com", label: "support@aeroprep.com" },
      { href: "tel:+15551234567", label: "+1 (555) 123-4567" },
      { href: "/auth/register", label: "Book a demo" },
    ],
  },
] as const;

type FooterProps = HTMLAttributes<HTMLElement> & {
  compact?: boolean;
};

export default function Footer({ compact = false, className = "", ...props }: FooterProps) {
  return (
    <footer className={["border-t border-slate-200 bg-slate-950 text-slate-300", compact ? "mt-0" : "mt-16", className].filter(Boolean).join(" ")} aria-labelledby="footer-heading" {...props}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-20">
        <div className="lg:col-span-1">
          <h2 id="footer-heading" className="text-xl font-semibold text-white">AeroPrep</h2>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">Premium aviation education for DGCA and EASA aspirants preparing for high-stakes maintenance exams.</p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{column.title}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">© 2026 AeroPrep. All rights reserved.</div>
    </footer>
  );
}
