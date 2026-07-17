import type { ReactNode, HTMLAttributes } from "react";

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
};

export function Container({ children, className = "", as: Component = "div", ...props }: ContainerProps) {
  return (
    <Component className={["mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className].filter(Boolean).join(" ")} {...props}>
      {children}
    </Component>
  );
}

export default Container;
