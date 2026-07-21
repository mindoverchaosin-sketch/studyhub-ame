import Link from "next/link";
import { FiChevronLeft } from "react-icons/fi";

type ModuleHeaderProps = {
  title: string;
  description: string;
  showBackLink?: boolean;
};

export default function ModuleHeader({ title, description, showBackLink = true }: ModuleHeaderProps) {
  return (
    <div className="space-y-4">
      {showBackLink ? (
        <Link href="/student/modules" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
          <FiChevronLeft className="h-4 w-4" />
          Back to modules
        </Link>
      ) : null}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
        <p className="mt-3 text-base leading-8 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
