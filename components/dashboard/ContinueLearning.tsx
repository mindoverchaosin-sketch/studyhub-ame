import { FiBookOpen } from "react-icons/fi";
import DashboardSection from "@/components/dashboard/DashboardSection";
import LearningCard from "@/components/dashboard/LearningCard";
import EmptyState from "@/components/dashboard/EmptyState";
import SkeletonCard from "@/components/dashboard/SkeletonCard";
import type { ContinueLearningItem } from "@/lib/mock/dashboard";

type ContinueLearningProps = {
  items?: ContinueLearningItem[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ContinueLearning({
  items = [],
  loading = false,
  emptyTitle = "No modules started yet",
  emptyDescription = "Pick a module to begin your next study session.",
}: ContinueLearningProps) {
  return (
    <DashboardSection
      title="Continue Learning"
      description="Resume your strongest study momentum with focused, high-value lessons."
    >
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <LearningCard key={item.progress.id} {...item} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FiBookOpen className="h-6 w-6" />}
          title={emptyTitle}
          description={emptyDescription}
          actionHref="/modules"
          actionLabel="Browse modules"
        />
      )}
    </DashboardSection>
  );
}
