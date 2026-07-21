type ActivityItem = {
  title: string;
  detail: string;
  time: string;
};

const activityItems: ActivityItem[] = [
  {
    title: "Completed Airframes revision",
    detail: "You reviewed the latest notes and marked the topic as understood.",
    time: "15 min ago",
  },
  {
    title: "Attempted a practice quiz",
    detail: "Your score improved compared with the previous session.",
    time: "1 hour ago",
  },
  {
    title: "Added a new bookmark",
    detail: "Saved a key reference for your next recap session.",
    time: "Yesterday",
  },
];

export default function RecentActivity() {
  return (
    <div className="space-y-3">
      {activityItems.map((item) => (
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
