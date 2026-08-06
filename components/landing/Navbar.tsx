"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import { PiAirplaneTiltFill } from "react-icons/pi";
import ThemeToggle from "@/components/theme/ThemeToggle";

const navLinks = [
  { label: "Learning Paths", href: "#learning-paths" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav
          className={`mt-3 flex items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-all duration-300 sm:px-5 ${
            scrolled ? "glass shadow-[0_18px_50px_-30px_rgba(8,15,35,0.55)]" : "border border-transparent"
          }`}
          aria-label="Primary"
        >
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_10px_25px_-12px_var(--primary)]">
              <PiAirplaneTiltFill className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Aero<span className="text-primary">Prep</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/modules"
              className="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-16px_var(--primary)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
            >
              Start Learning
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-foreground md:hidden"
            >
              {open ? <FiX className="h-5 w-5" aria-hidden /> : <FiMenu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="glass mt-2 rounded-2xl p-3 md:hidden">
            <div className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/modules"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Start Learning
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
