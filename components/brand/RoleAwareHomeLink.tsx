"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

function getHomeRoute(role?: string | null): string {
  switch (role) {
    case "STUDENT":
      return "/student/dashboard";
    case "INSTRUCTOR":
      return "/instructor/dashboard";
    case "CONTENT_EDITOR":
      return "/content-editor/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    case "SUPER_ADMIN":
      return "/super-admin/dashboard";
    default:
      return "/";
  }
}

export default function RoleAwareHomeLink({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  const { data: session } = useSession();
  const href = getHomeRoute(session?.user?.role as string | undefined);

  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
