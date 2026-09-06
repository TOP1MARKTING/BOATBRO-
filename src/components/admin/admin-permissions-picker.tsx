import { ASSIGNABLE_TABS, type AdminPermissions, type AdminTab } from "../../lib/admin-permissions";

export function AdminPermissionsPicker({
  value,
  onChange,
  labels,
  hint,
  disabled = false,
  tabs = ASSIGNABLE_TABS,
}: {
  value: AdminPermissions;
  onChange: (next: AdminPermissions) => void;
  labels: Record<AdminTab, string>;
  hint?: string;
  disabled?: boolean;
  tabs?: readonly AdminTab[];
}) {
  return (
    <div>
      {hint ? <p className="mb-4 text-[13px] leading-6 text-muted-foreground">{hint}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {tabs.map((tab) => (
          <label
            key={tab}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[13px] transition-colors ${
              value[tab]
                ? "border-[#C8A96A]/40 bg-[#C8A96A]/10 text-navy"
                : "border-border bg-card text-muted-foreground hover:border-[#C8A96A]/25"
            } ${disabled ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              type="checkbox"
              className="size-4 shrink-0 rounded border-border accent-[#C8A96A]"
              checked={value[tab]}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, [tab]: e.target.checked })}
            />
            <span className="font-medium">{labels[tab]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
