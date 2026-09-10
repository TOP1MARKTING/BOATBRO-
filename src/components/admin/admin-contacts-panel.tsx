import { useMemo, useState } from "react";
import { MessageCircle, Phone, Printer } from "lucide-react";
import { deleteContact, setContactStatus, type ContactRecord } from "../../lib/db";
import { localizeContactUserType } from "../../lib/contact-user-type";
import { phoneToTelHref, phoneToWhatsAppUrl } from "../../lib/site";
import {
  ADMIN_BADGE_ACTIVE,
  ADMIN_BADGE_MUTED,
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD_CLS,
  ADMIN_FIELD_CLS,
  AdminEmptyState,
  AdminFilterBar,
  AdminPanelShell,
} from "./shared";

type StatusFilter = "all" | "new" | "handled";

type PrintLabels = {
  brand: string;
  title: string;
  name: string;
  email: string;
  phone: string;
  boats: string;
  location: string;
  details: string;
  type: string;
  date: string;
  status: string;
  popupBlocked: string;
  rangeTitle: string;
  rangeCount: string;
  period: string;
};

function FieldRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background/50 px-2.5 py-2">
      <p className="text-[10px] font-medium leading-none text-[#A8894E]">{label}</p>
      <p
        className="mt-1 break-words text-[12px] font-medium leading-5 text-navy"
        dir={ltr ? "ltr" : undefined}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function openPrintHtml(html: string, popupBlocked: string) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    window.alert(popupBlocked);
    return;
  }
  const revoke = () => URL.revokeObjectURL(url);
  win.addEventListener("load", () => {
    window.setTimeout(revoke, 60_000);
  });
  window.setTimeout(revoke, 120_000);
}

function formatDay(value: Date | null, lang: "ar" | "en") {
  if (!value) return "—";
  return value.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: Date | null, lang: "ar" | "en") {
  if (!value) return "—";
  return value.toLocaleString(lang === "ar" ? "ar-SA" : "en-GB");
}

function startOfDay(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function endOfDay(isoDate: string) {
  const d = new Date(`${isoDate}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function printLogoUrl() {
  return `${window.location.origin}/logo.png`;
}

function printStyles() {
  return `
    @page { margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, "Geeza Pro", Arial, sans-serif;
      color: #0a1628;
      background: #f4f1ea;
      line-height: 1.7;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      padding: 18px 14px 28px;
      background: #fff;
      border: 1px solid #e8dfcf;
      box-shadow: 0 10px 40px rgba(15, 40, 70, 0.08);
    }
    .report-head {
      text-align: center;
      padding: 22px 18px 18px;
      margin-bottom: 20px;
      border-radius: 18px;
      background:
        radial-gradient(circle at top, rgba(200,169,106,0.18), transparent 55%),
        linear-gradient(180deg, #0a1628 0%, #13233d 100%);
      color: #fff;
      position: relative;
      overflow: hidden;
    }
    .report-head::after {
      content: "";
      position: absolute;
      inset-inline: 18%;
      bottom: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, #C8A96A, transparent);
    }
    .logo-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 12px;
    }
    .logo-wrap img {
      width: 78px;
      height: 78px;
      object-fit: contain;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      padding: 6px;
      border: 1px solid rgba(200,169,106,0.45);
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    }
    .brand {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #F5E6C8;
    }
    .sub {
      margin: 6px 0 0;
      color: #E6D3A3;
      font-size: 15px;
      font-weight: 600;
    }
    .meta {
      margin: 14px auto 0;
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px 14px;
      padding: 8px 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(200,169,106,0.28);
      color: rgba(255,255,255,0.88);
      font-size: 12px;
    }
    .meta strong { color: #F5E6C8; font-weight: 700; }
    .card {
      border: 1px solid #e8dfcf;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 0 6px 18px rgba(15, 40, 70, 0.05);
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      padding: 14px 16px;
      background: linear-gradient(135deg, #0f2744 0%, #0a1628 70%);
      color: #fff;
      border-bottom: 2px solid #C8A96A;
    }
    .card-head h2 { margin: 0; font-size: 17px; font-weight: 700; }
    .card-head .type { margin: 5px 0 0; color: #E6D3A3; font-size: 12px; }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 11px;
      font-weight: 700;
      background: linear-gradient(135deg, #D4B87A, #C8A96A);
      color: #0a1628;
      white-space: nowrap;
    }
    .card-body { padding: 14px 16px 16px; background: #fff; }
    table { width: 100%; border-collapse: separate; border-spacing: 0; overflow: hidden; border-radius: 12px; border: 1px solid #efe7d8; }
    th, td {
      padding: 10px 12px;
      text-align: start;
      vertical-align: top;
      font-size: 12.5px;
      border-bottom: 1px solid #f0e8da;
    }
    tr:last-child th, tr:last-child td { border-bottom: none; }
    th {
      width: 34%;
      background: #faf6ee;
      color: #A8894E;
      font-weight: 700;
    }
    td { background: #fff; font-weight: 560; word-break: break-word; color: #132033; }
    .details {
      margin-top: 12px;
      border: 1px solid #efe7d8;
      border-radius: 12px;
      padding: 12px 14px;
      background: linear-gradient(180deg, #fcfaf5 0%, #fff 100%);
    }
    .details-label {
      color: #A8894E;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .details-body { white-space: pre-wrap; font-size: 13px; color: #132033; }
    .foot {
      margin-top: 20px;
      padding-top: 12px;
      border-top: 1px solid #e8dfcf;
      color: #8a8376;
      font-size: 11px;
      text-align: center;
    }
    .foot strong { color: #A8894E; }
    @media print {
      body { background: #fff; }
      .sheet { border: none; box-shadow: none; padding: 0; max-width: none; }
    }
  `;
}

function printReportHead(labels: PrintLabels, metaHtml = "") {
  return `
    <div class="report-head">
      <div class="logo-wrap">
        <img src="${escapeHtml(printLogoUrl())}" alt="BoatPro" />
      </div>
      <p class="brand">${escapeHtml(labels.brand)}</p>
      <p class="sub">${escapeHtml(labels.rangeTitle || labels.title)}</p>
      ${metaHtml ? `<div class="meta">${metaHtml}</div>` : ""}
    </div>
  `;
}

function printSingleContact(
  item: ContactRecord,
  labels: PrintLabels,
  statusValue: string,
  typeValue: string,
  lang: "ar" | "en",
) {
  const rows = [
    [labels.name, item.name],
    [labels.type, typeValue],
    [labels.status, statusValue],
    [labels.email, item.email],
    [labels.phone, item.phone],
    [labels.boats, item.boatsCount || "—"],
    [labels.location, item.address || "—"],
    [labels.date, formatDateTime(item.createdAt, lang)],
  ] as const;

  const html = `<!doctype html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)} — ${escapeHtml(item.name)}</title>
  <style>${printStyles()}</style>
</head>
<body>
  <div class="sheet">
    ${printReportHead(
      { ...labels, rangeTitle: labels.title },
      `<span>${escapeHtml(labels.date)}: <strong>${escapeHtml(formatDateTime(item.createdAt, lang))}</strong></span>`,
    )}
    <div class="card">
      <div class="card-head">
        <div>
          <h2>${escapeHtml(item.name || "—")}</h2>
          <p class="type">${escapeHtml(typeValue || "—")}</p>
        </div>
        <span class="badge">${escapeHtml(statusValue)}</span>
      </div>
      <div class="card-body">
        <table>
          <tbody>
            ${rows
              .map(
                ([label, value]) =>
                  `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div class="details">
          <div class="details-label">${escapeHtml(labels.details)}</div>
          <div class="details-body">${escapeHtml(item.content || "—")}</div>
        </div>
      </div>
    </div>
    <div class="foot"><strong>${escapeHtml(labels.brand)}</strong> — ${escapeHtml(labels.title)}</div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    });
  </script>
</body>
</html>`;

  openPrintHtml(html, labels.popupBlocked);
}

function printContactsRange(
  items: ContactRecord[],
  labels: PrintLabels,
  lang: "ar" | "en",
  fromLabel: string,
  toLabel: string,
  statusOf: (item: ContactRecord) => string,
  typeOf: (item: ContactRecord) => string,
) {
  const cards = items
    .map((item, index) => {
      const typeValue = typeOf(item);
      const rows = [
        [labels.name, item.name],
        [labels.type, typeValue],
        [labels.status, statusOf(item)],
        [labels.email, item.email],
        [labels.phone, item.phone],
        [labels.boats, item.boatsCount || "—"],
        [labels.location, item.address || "—"],
        [labels.date, formatDateTime(item.createdAt, lang)],
      ] as const;
      return `
      <div class="card">
        <div class="card-head">
          <div>
            <h2>${index + 1}. ${escapeHtml(item.name || "—")}</h2>
            <p class="type">${escapeHtml(typeValue || "—")}</p>
          </div>
          <span class="badge">${escapeHtml(statusOf(item))}</span>
        </div>
        <div class="card-body">
          <table>
            <tbody>
              ${rows
                .map(
                  ([label, value]) =>
                    `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <div class="details">
            <div class="details-label">${escapeHtml(labels.details)}</div>
            <div class="details-body">${escapeHtml(item.content || "—")}</div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.rangeTitle)} — ${escapeHtml(fromLabel)} → ${escapeHtml(toLabel)}</title>
  <style>${printStyles()}</style>
</head>
<body>
  <div class="sheet">
    ${printReportHead(
      labels,
      `<span>${escapeHtml(labels.period)}: <strong>${escapeHtml(fromLabel)}</strong> — <strong>${escapeHtml(toLabel)}</strong></span>
       <span>${escapeHtml(labels.rangeCount)}: <strong>${items.length}</strong></span>`,
    )}
    ${cards}
    <div class="foot"><strong>${escapeHtml(labels.brand)}</strong> — ${escapeHtml(labels.rangeTitle)}</div>
  </div>
  <script>
    window.addEventListener("load", function () {
      setTimeout(function () { window.focus(); window.print(); }, 350);
    });
  </script>
</body>
</html>`;

  openPrintHtml(html, labels.popupBlocked);
}

function buildPrintLabels(
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"],
  lang: "ar" | "en",
): PrintLabels {
  return {
    brand: "BoatPro",
    title: t.admin.contacts,
    name: t.contact.name,
    email: t.contact.mail,
    phone: t.contact.phone,
    boats: t.admin.boatsCount,
    location: t.admin.locationField,
    details: t.contact.content,
    type: t.contact.userType,
    date: lang === "ar" ? "التاريخ" : "Date",
    status: lang === "ar" ? "الحالة" : "Status",
    popupBlocked:
      lang === "ar"
        ? "اسمح بالنوافذ المنبثقة من المتصفح لإتمام الطباعة."
        : "Please allow pop-ups in your browser to print.",
    rangeTitle: t.admin.printRangeTitle,
    rangeCount: t.admin.printRangeCount,
    period: lang === "ar" ? "الفترة" : "Period",
  };
}

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
  const [fromDate, setFromDate] = useState(todayIso);
  const [toDate, setToDate] = useState(todayIso);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.address.toLowerCase().includes(q) ||
        item.boatsCount.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.userType.toLowerCase().includes(q)
      );
    });
  }, [contacts, query, statusFilter]);

  const rangeCount = useMemo(() => {
    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);
    if (!from || !to) return 0;
    return contacts.filter((item) => {
      if (!item.createdAt) return false;
      return item.createdAt >= from && item.createdAt <= to;
    }).length;
  }, [contacts, fromDate, toDate]);

  const onPrintRange = () => {
    const from = startOfDay(fromDate);
    const to = endOfDay(toDate);
    if (!from || !to) {
      window.alert(t.admin.printRangeNeedDates);
      return;
    }
    if (from > to) {
      window.alert(t.admin.printRangeNeedDates);
      return;
    }
    const items = contacts
      .filter((item) => item.createdAt && item.createdAt >= from && item.createdAt <= to)
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
    if (items.length === 0) {
      window.alert(t.admin.printRangeEmpty);
      return;
    }
    printContactsRange(
      items,
      buildPrintLabels(t, lang),
      lang,
      formatDay(from, lang),
      formatDay(to, lang),
      (item) => (item.status === "new" ? t.admin.newCount : t.admin.handled),
      (item) => localizeContactUserType(item.userType, t),
    );
  };

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

      <div className={`${ADMIN_CARD_CLS} mb-3 flex max-w-3xl flex-wrap items-end gap-2.5 p-3`}>
        <label className="min-w-[8.5rem] flex-1 sm:flex-none">
          <span className="mb-1 block text-[10px] font-medium text-[#A8894E]">{t.admin.printFrom}</span>
          <input
            type="date"
            className={`${ADMIN_FIELD_CLS} py-2 text-[13px]`}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label className="min-w-[8.5rem] flex-1 sm:flex-none">
          <span className="mb-1 block text-[10px] font-medium text-[#A8894E]">{t.admin.printTo}</span>
          <input
            type="date"
            className={`${ADMIN_FIELD_CLS} py-2 text-[13px]`}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          className={`${ADMIN_BTN_PRIMARY} inline-flex min-h-10 items-center gap-2 px-4 text-[12px]`}
          onClick={onPrintRange}
        >
          <Printer size={13} strokeWidth={2} />
          {t.admin.printRange}
          <span className="rounded-full bg-[#0a1628]/15 px-2 py-0.5 text-[10px]">{rangeCount}</span>
        </button>
      </div>

      <div className="max-w-3xl space-y-3">
        {filtered.length === 0 ? <AdminEmptyState message={t.admin.noContacts} /> : null}
        {filtered.map((item) => {
          const statusLabel = item.status === "new" ? t.admin.newCount : t.admin.handled;
          const typeLabel = localizeContactUserType(item.userType, t);
          return (
            <article key={item.id} className={`${ADMIN_CARD_CLS} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2.5">
                <div className="min-w-0">
                  <p className="font-display text-base font-semibold text-navy">{item.name || "—"}</p>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-[#A8894E]">{typeLabel}</p>
                </div>
                <span className={item.status === "new" ? ADMIN_BADGE_ACTIVE : ADMIN_BADGE_MUTED}>
                  {statusLabel}
                </span>
              </div>

              <div className="space-y-2.5 px-3.5 py-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <FieldRow label={t.contact.mail} value={item.email} ltr />
                  <FieldRow label={t.contact.phone} value={item.phone} ltr />
                  <FieldRow label={t.admin.boatsCount} value={item.boatsCount} />
                  <FieldRow label={t.admin.locationField} value={item.address} />
                </div>

                <div className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-2">
                  <p className="text-[10px] font-medium leading-none text-[#A8894E]">{t.contact.content}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[12px] leading-5 text-navy">
                    {item.content || "—"}
                  </p>
                </div>

                <p className="text-[11px] text-muted-foreground">{formatDateTime(item.createdAt, lang)}</p>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/60 bg-[#C8A96A]/10 px-3.5 py-2.5">
                <a
                  href={phoneToTelHref(item.phone)}
                  className={`${ADMIN_BTN_PRIMARY} inline-flex min-h-9 items-center gap-1.5 px-3.5 text-[12px] no-underline`}
                >
                  <Phone size={13} strokeWidth={2} />
                  {t.admin.callContact}
                </a>
                <a
                  href={phoneToWhatsAppUrl(item.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ADMIN_BTN_SECONDARY} inline-flex min-h-9 items-center gap-1.5 px-3.5 text-[12px] no-underline`}
                >
                  <MessageCircle size={13} strokeWidth={2} />
                  {t.admin.whatsappContact}
                </a>
                <button
                  type="button"
                  className={`${ADMIN_BTN_SECONDARY} inline-flex min-h-9 items-center gap-1.5 px-3.5 text-[12px]`}
                  onClick={() =>
                    printSingleContact(item, buildPrintLabels(t, lang), statusLabel, typeLabel, lang)
                  }
                >
                  <Printer size={13} strokeWidth={2} />
                  {t.admin.printContact}
                </button>
                <button
                  type="button"
                  className={`${ADMIN_BTN_SECONDARY} min-h-9 px-3.5 text-[12px]`}
                  onClick={() =>
                    void setContactStatus(item.id, item.status === "new" ? "handled" : "new").then(onChange)
                  }
                >
                  {item.status === "new" ? t.admin.markHandled : t.admin.markNew}
                </button>
                <button
                  type="button"
                  className={`${ADMIN_BTN_GHOST} min-h-9 px-3 text-[12px]`}
                  onClick={() => {
                    if (confirm(t.admin.confirmDelete)) void deleteContact(item.id).then(onChange);
                  }}
                >
                  {t.admin.delete}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AdminPanelShell>
  );
}
