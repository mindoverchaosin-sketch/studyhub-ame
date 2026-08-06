"use client";

import { useEffect, useState } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("aeroprep-theme", next ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/60 text-foreground/80 backdrop-blur transition-colors hover:text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {mounted && isDark ? <FiSun className="h-4.5 w-4.5" aria-hidden /> : <FiMoon className="h-4.5 w-4.5" aria-hidden />}
    </button>
  );
}
