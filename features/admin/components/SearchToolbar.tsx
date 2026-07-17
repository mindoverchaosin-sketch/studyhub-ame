"use client"

import type { ChangeEvent } from "react"

type SearchToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  placeholder?: string
}

export default function SearchToolbar({ query, onQueryChange, placeholder = "Search..." }: SearchToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block w-full sm:w-96">
        <span className="sr-only">Search</span>
        <input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
          placeholder={placeholder}
        />
      </label>
    </div>
  )
}
