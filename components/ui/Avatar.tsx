import Image from "next/image";
import type { ReactNode } from "react";

type AvatarProps = {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  fallback?: ReactNode;
};

const sizeClasses = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
  lg: "h-14 w-14 text-lg",
} as const;

export default function Avatar({ name, src, size = "md", fallback }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm ${sizeClasses[size]}`.trim()} aria-label={name}>
      {src ? <Image src={src} alt={name} fill className="object-cover" /> : fallback ?? initials}
    </div>
  );
}
