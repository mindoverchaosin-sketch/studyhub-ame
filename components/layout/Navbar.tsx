"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { HTMLAttributes } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import AeroPrepLogo from "@/components/brand/AeroPrepLogo";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/modules", label: "Courses" },
  { href: "/quiz", label: "Mock Tests" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
] as const;

type NavbarProps = HTMLAttributes<HTMLElement> & {
  compact?: boolean;
};

export default function Navbar({ compact = false, className = "", ...props }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const linkClasses = (href: string) =>
    [
      "rounded-full px-3 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
      isActive(href) ? "bg-blue-600/10 text-blue-700 shadow-sm" : "text-slate-700 hover:bg-slate-100 hover:text-blue-700",
    ].join(" ");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return;
  }, [isMenuOpen]);

  return (
    <header className={["sticky top-0 z-50 border-b border-white/70 bg-white/75 shadow-[0_1px_0_rgba(15,23,42,0.05)] backdrop-blur-2xl", compact ? "py-2" : "py-3", className].filter(Boolean).join(" ")} {...props}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="AeroPrep home" className="flex items-center gap-2 text-lg font-semibold text-slate-950 transition duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
          <AeroPrepLogo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkClasses(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:inline-flex">
            Student Login
          </Link>
          <Link href="/admin/login" className="hidden rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:inline-flex">
            Admin Login
          </Link>
          <Link href="/register" className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:inline-flex">
            Get Started
          </Link>

          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 md:hidden" aria-expanded={isMenuOpen} aria-controls="mobile-navigation" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} onClick={() => setIsMenuOpen((current) => !current)}>
            {isMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div id="mobile-navigation" className="border-t border-slate-200 bg-white/95 px-4 py-4 shadow-lg shadow-slate-200/60 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkClasses(item.href)} onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
              <Link href="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 text-center transition hover:border-slate-400 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                Student Login
              </Link>
              <Link href="/admin/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 text-center transition hover:border-slate-400 hover:bg-slate-50" onClick={() => setIsMenuOpen(false)}>
                Admin Login
              </Link>
              <Link href="/register" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white text-center transition hover:bg-blue-700" onClick={() => setIsMenuOpen(false)}>
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
