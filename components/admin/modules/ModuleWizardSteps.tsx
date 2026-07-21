interface ModuleWizardStepsProps {
  step: number;
}

const steps = ["Basic information", "Learning info", "Publishing", "Access"];

export default function ModuleWizardSteps({ step }: ModuleWizardStepsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {steps.map((label, index) => {
        const current = index + 1;
        const active = current === step;
        const complete = current < step;

        return (
          <div key={label} className={`rounded-[1.25rem] border p-4 text-sm font-medium ${active ? "border-slate-950 bg-slate-950 text-white" : complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600"}`}>
            <p className="font-semibold">{current}. {label}</p>
          </div>
        );
      })}
    </div>
  );
}
