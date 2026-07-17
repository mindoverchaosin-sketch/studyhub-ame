import type { ReactNode } from "react"

type Column<T> = {
  key: string
  label: string
  render: (item: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (item: T) => string
}

export default function DataTable<T>({ columns, data, rowKey }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
      <table className="min-w-full border-collapse text-left text-sm text-slate-700">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-5 py-4 font-medium uppercase tracking-[0.18em]">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowKey(item)} className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}>
              {columns.map((column) => (
                <td key={column.key} className="px-5 py-4 align-top">
                  {column.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
