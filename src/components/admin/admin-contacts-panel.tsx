import { useMemo, useState } from "react";
import { deleteContact, setContactStatus, type ContactRecord } from "../../lib/db";
import { ADMIN_FIELD_CLS, AdminFilterBar, AdminPanelShell } from "./shared";

type StatusFilter = "all" | "new" | "handled";

export function AdminContactsPanel({
  contacts,
  onChange,
  t,
  lang,
}: {
  contacts: ContactRecord[];
  onChange: () => Promise<void>;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  lang: "ar" | "en";
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.userType.toLowerCase().includes(q)
      );
    });
  }, [contacts, query, statusFilter]);

  return (
    <AdminPanelShell title={t.admin.contacts} hideTitle>
      <AdminFilterBar>
        <input
          className={`${ADMIN_FIELD_CLS} max-w-xs`}
          placeholder={t.admin.searchContacts}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className={`${ADMIN_FIELD_CLS} w-auto min-w-[140px]`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">{t.admin.filterAll}</option>
          <option value="new">{t.admin.newCount}</option>
          <option value="handled">{t.admin.handled}</option>
        </select>
        <span className="text-[12px] text-muted-foreground">
          {filtered.length} / {contacts.length}
        </span>
      </AdminFilterBar>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            {t.admin.noContacts}
          </p>
        ) : null}
        {filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-semibold text-navy">{item.name}</p>
                <p className="mt-1 text-[12px] font-medium text-gold-ink">{item.userType}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  item.status === "new" ? "bg-gold/15 text-gold-ink" : "bg-navy/5 text-muted-foreground"
                }`}
              >
                {item.status === "new" ? t.admin.newCount : t.admin.handled}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{item.content}</p>
            <div className="mt-4 grid gap-1 break-words text-[13px] text-foreground/80">
              <p dir="ltr">{item.email}</p>
              <p dir="ltr">{item.phone}</p>
              {item.address ? <p>{item.address}</p> : null}
              <p className="text-muted-foreground">
                {item.createdAt?.toLocaleString(lang === "ar" ? "ar-SA" : "en-GB")}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full border border-gold/50 px-4 py-2 text-[12px] font-medium text-gold-ink hover:bg-gold hover:text-white"
                onClick={() =>
                  void setContactStatus(item.id, item.status === "new" ? "handled" : "new").then(onChange)
                }
              >
                {item.status === "new" ? t.admin.markHandled : t.admin.markNew}
              </button>
              <button
                type="button"
                className="text-[12px] text-destructive"
                onClick={() => {
                  if (confirm(t.admin.confirmDelete)) void deleteContact(item.id).then(onChange);
                }}
              >
                {t.admin.delete}
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminPanelShell>
  );
}
