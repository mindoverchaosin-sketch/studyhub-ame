import Link from "next/link";
import type { ReactNode, HTMLAttributes } from "react";
import { Container } from "@/components/layout/Container";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeaderProps = HTMLAttributes<HTMLElement> & {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  align?: "left" | "center";
  breadcrumbs?: BreadcrumbItem[];
};

export default function PageHeader({ eyebrow, title, description, actions, align = "left", breadcrumbs, className = "", ...props }: PageHeaderProps) {
  const alignment = align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <header className={["border-b border-slate-200/80 bg-white/70 backdrop-blur", className].filter(Boolean).join(" ")} {...props}>
      <Container>
        <div className={["flex flex-col gap-6 py-16 sm:py-20 lg:py-24", alignment].filter(Boolean).join(" ")}>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {breadcrumbs.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {item.href ? (
                    <Link href={item.href} className="transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-slate-700">{item.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
                </div>
              ))}
            </nav>
          ) : null}

          <div className="max-w-3xl space-y-4">
            {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">{eyebrow}</p> : null}
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">{title}</h1>
            {description ? <p className="text-lg leading-8 text-slate-600">{description}</p> : null}
          </div>

          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </Container>
    </header>
  );
}
