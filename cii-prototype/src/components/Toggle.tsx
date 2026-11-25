export function Toggle({
  checked, onChange, label, description, disabled,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <label className={`flex min-h-[44px] cursor-pointer items-center justify-between gap-4 ${disabled ? 'opacity-50' : ''}`}>
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        {description && <span className="block text-sm text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}
