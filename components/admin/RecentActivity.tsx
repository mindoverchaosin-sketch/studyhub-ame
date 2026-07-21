import type { RecentActivity as RecentActivityType } from "@/types/admin";
import Card from "@/components/ui/Card";

interface RecentActivityProps {
  items: RecentActivityType[];
}

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card variant="bordered" className="p-5">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </div>
              <span className="text-sm font-medium text-slate-500">{item.timeLabel}</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">By {item.actor}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
