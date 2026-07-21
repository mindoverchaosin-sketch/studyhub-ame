"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  admin: "Admin",
  modules: "Modules",
  lessons: "Lessons",
  materials: "Study Materials",
  quizzes: "Quizzes",
  "mock-tests": "Mock Tests",
  products: "Products",
  orders: "Orders",
  students: "Students",
  analytics: "Analytics",
  settings: "Settings",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.filter((segment) => segment !== "admin").map((segment) => ({
    label: labels[segment] ?? segment,
    href: `/${segments.slice(0, segments.indexOf(segment) + 1).join("/")}`,
  }));

  return (
    <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500" aria-label="Breadcrumb">
      <Link href="/admin" className="font-medium text-slate-700 transition hover:text-slate-950">
        Admin
      </Link>
      {crumbs.length > 0 ? <span>/</span> : null}
      {crumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center gap-2">
          {index > 0 ? <span>/</span> : null}
          <Link href={crumb.href} className="transition hover:text-slate-950">
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
