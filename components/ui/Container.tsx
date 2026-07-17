import type { HTMLAttributes, ReactNode } from "react";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

export default function Container({ children, className = "", ...props }: ContainerProps) {
  return (
    <div className={["mx-auto w-full max-w-7xl px-6 lg:px-8", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </div>
  );
}
