import Link from 'next/link';

export interface AdminContentTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
}

export default function AdminContentTable<T extends Record<string, unknown>>({ title, items, columns, emptyLabel, hrefBuilder }: { title: string; items: T[]; columns: AdminContentTableColumn<T>[]; emptyLabel: string; hrefBuilder?: (item: T) => string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {hrefBuilder ? <Link href={hrefBuilder(items[0] as T) ?? '#'} className="text-sm font-semibold text-blue-600">Manage</Link> : null}
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{emptyLabel}</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {columns.map((column) => <th key={String(column.key)} className="px-4 py-3 font-semibold">{column.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item) => (
                <tr key={String(item.id)} className="align-top">
                  {columns.map((column) => <td key={String(column.key)} className="px-4 py-3 text-slate-700">{column.render ? column.render(item) : String(item[column.key] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
