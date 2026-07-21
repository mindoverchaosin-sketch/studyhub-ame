import Link from "next/link";
import { FaPlane } from "react-icons/fa6";
import { getAdminNavigation } from "@/services/admin.service";

export default async function AdminSidebar() {
  const navigation = await getAdminNavigation();

  return (
    <div className="flex h-full flex-col rounded-[2rem] border border-slate-200/80 bg-slate-950 p-5 text-slate-100 shadow-[0_25px_80px_rgba(15,23,42,0.16)]">
      <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-cyan-300">
          <FaPlane className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin</p>
          <p className="text-base text-white">StudyHub CMS</p>
        </div>
      </Link>

      <nav className="mt-8 space-y-1" aria-label="Admin sidebar navigation">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/10 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Milestone ready</p>
        <p className="mt-2 leading-6">The admin shell is now in place for future publishing and moderation workflows.</p>
      </div>
    </div>
  );
}
