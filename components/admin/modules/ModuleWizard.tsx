"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { moduleWizardDefaults } from "@/lib/mock/modules-admin";
import type { ModuleWizardState } from "@/types/module-admin";
import ModuleWizardSteps from "@/components/admin/modules/ModuleWizardSteps";

export default function ModuleWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ModuleWizardState>(moduleWizardDefaults);

  const progressLabel = useMemo(() => {
    return ["Basic Information", "Learning Information", "Publishing", "Access"][step - 1] ?? "Complete";
  }, [step]);

  const update = (key: keyof ModuleWizardState, value: string | number) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Module wizard</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">Create a new module</h3>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{progressLabel}</div>
      </div>

      <div className="mt-6">
        <ModuleWizardSteps step={step} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {step === 1 ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Title
                <input value={form.title} onChange={(event) => update("title", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Module number
                <input value={form.moduleNumber} onChange={(event) => update("moduleNumber", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Slug
                <input value={form.slug} onChange={(event) => update("slug", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Description
                <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Difficulty
                <select value={form.difficulty} onChange={(event) => update("difficulty", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Estimated hours
                <input type="number" value={form.estimatedHours} onChange={(event) => update("estimatedHours", Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Learning objectives
                <textarea value={form.learningObjectives} onChange={(event) => update("learningObjectives", event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Prerequisites
                <textarea value={form.prerequisites} onChange={(event) => update("prerequisites", event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" />
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Status
                <select value={form.status} onChange={(event) => update("status", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none">
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </label>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">SEO preview</p>
                <p className="mt-2 text-sm text-slate-600">{form.title || "Module title"}</p>
                <p className="mt-1 text-sm text-slate-500">{form.slug || "module-slug"}</p>
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input type="checkbox" checked={form.isPremium} onChange={(event) => update("isPremium", event.target.checked ? 1 : 0)} />
                <span className="text-sm font-medium text-slate-700">Premium Content</span>
                <span className="text-xs text-slate-500">(Require subscription to access)</span>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Product mapping
                <input value={form.productMapping} onChange={(event) => update("productMapping", event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 outline-none" placeholder="Placeholder mapping to future product" />
              </label>
            </>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">Wizard guidance</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>• Keep the module title concise and exam-aligned.</li>
            <li>• Describe learning outcomes in plain language.</li>
            <li>• Use product mapping for future monetization rather than direct pricing.</li>
            <li>• Publish only when the content is ready for review.</li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button disabled={step === 1} onClick={() => setStep((current) => current - 1)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Back</button>
        {step < 4 ? (
          <button onClick={() => setStep((current) => current + 1)} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Next step</button>
        ) : (
          <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Create module</button>
        )}
      </div>
    </Card>
  );
}
