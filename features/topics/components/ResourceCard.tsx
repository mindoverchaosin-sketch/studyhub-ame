import Link from "next/link";
import { FiBookOpen, FiCamera, FiExternalLink, FiLink, FiLock, FiPlayCircle } from "react-icons/fi";
import { formatResourceLabel } from "@/features/topics/utils/topic-learning";

type ResourceCardProps = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  locked: boolean;
  lessonId: string;
  moduleId: string;
};

export default function ResourceCard({ id, title, description, type, locked, lessonId, moduleId }: ResourceCardProps) {
  const iconMap = {
    PDF: FiBookOpen,
    VIDEO: FiPlayCircle,
    IMAGE: FiCamera,
    LINK: FiLink,
  } as const;

  const Icon = iconMap[type as keyof typeof iconMap] ?? FiLink;

  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{description || formatResourceLabel(type)}</p>
        </div>
      </div>
      {locked ? <Link href="/student/dashboard/billing?reason=resource-access&feature=premiumModules" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700"><FiLock className="h-4 w-4" />Upgrade</Link> : <Link href={`/api/student/resources/${id}?lessonId=${encodeURIComponent(lessonId)}&moduleId=${encodeURIComponent(moduleId)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"><FiExternalLink className="h-4 w-4" />Open</Link>}
    </div>
  );
}
