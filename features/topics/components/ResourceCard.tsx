import Link from "next/link";
import { FiBookOpen, FiCamera, FiLink, FiPlayCircle } from "react-icons/fi";
import { formatResourceLabel } from "@/features/topics/utils/topic-learning";

type ResourceCardProps = {
  title: string;
  description: string | null;
  type: string;
  url: string;
};

export default function ResourceCard({ title, description, type, url }: ResourceCardProps) {
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
      <Link href={url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-600 transition hover:text-blue-700">
        Open
      </Link>
    </div>
  );
}
