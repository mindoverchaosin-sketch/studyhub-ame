import AeroPrepLogo from "@/components/brand/AeroPrepLogo";

type LoadingOverlayProps = {
  message?: string
}

export default function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[1.5rem] bg-white/80 text-slate-900">
      <div className="flex flex-col items-center gap-3">
        <AeroPrepLogo variant="icon" className="h-12 w-12" />
        <p className="text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}
