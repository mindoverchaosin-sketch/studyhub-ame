import { FiBookOpen, FiDollarSign, FiLayers, FiUsers } from "react-icons/fi";
import type { AdminStats } from "@/types/admin";
import StatsCard from "@/components/admin/StatsCard";

interface DashboardCardsProps {
  stats: AdminStats;
}

export default function DashboardCards({ stats }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <StatsCard title="Total students" value={stats.totalStudents} icon={<FiUsers className="h-5 w-5" />} />
      <StatsCard title="Total modules" value={stats.totalModules} icon={<FiBookOpen className="h-5 w-5" />} />
      <StatsCard title="Study materials" value={stats.totalStudyMaterials} icon={<FiLayers className="h-5 w-5" />} />
      <StatsCard title="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={<FiDollarSign className="h-5 w-5" />} />
      <StatsCard title="Premium users" value={stats.premiumUsers} icon={<FiUsers className="h-5 w-5" />} />
      <StatsCard title="Pending drafts" value={stats.pendingDrafts} icon={<FiBookOpen className="h-5 w-5" />} />
    </div>
  );
}
