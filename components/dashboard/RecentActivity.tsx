type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

type RecentActivityProps = {
  items?: ActivityItem[];
};

export default function RecentActivity({ items = [] }: RecentActivityProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.title} className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
          <div>
            <p className="font-semibold text-slate-950">{item.title}</p>
            <p className="mt-1 text-sm leading-7 text-slate-600">{item.detail}</p>
          </div>
          <span className="shrink-0 text-sm font-medium text-slate-500">{item.time}</span>
        </div>
      ))}
    </div>
  );
}
