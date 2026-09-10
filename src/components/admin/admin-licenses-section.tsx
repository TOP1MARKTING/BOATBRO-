import { ImagePlus, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  createLicense,
  deleteLicense,
  listLicenses,
  updateLicense,
  type License,
} from "../../lib/db";
import type { LocalizedText } from "../../lib/post-content";
import {
  ADMIN_BTN_GHOST,
  ADMIN_BTN_PRIMARY,
  ADMIN_BTN_SECONDARY,
  ADMIN_CARD_CLS,
  ADMIN_FIELD_CLS,
  AdminEmptyState,
  AdminFlash,
  AdminSection,
} from "./shared";

const emptyName = (): LocalizedText => ({ ar: "", en: "" });

function FilePickButton({
  label,
  onPick,
  disabled,
}: {
  label: string;
  onPick: (file: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`${ADMIN_BTN_SECONDARY} inline-flex min-h-9 cursor-pointer items-center gap-1.5 px-3 text-[12px] ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <Upload size={13} strokeWidth={2} />
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onPick(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function PreviewBox({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return (
      <div className="flex size-16 items-center justify-center rounded-xl border border-dashed border-border/80 bg-background/50 text-muted-foreground">
        <ImagePlus size={16} strokeWidth={1.75} />
      </div>
    );
  }
  return (
    <div className="size-16 overflow-hidden rounded-xl border border-border/70 bg-background/60">
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

export function AdminLicensesSection({
  uid,
  t,
}: {
  uid: string;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
}) {
  const [items, setItems] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [draftName, setDraftName] = useState<LocalizedText>(emptyName);
  const [draftNumber, setDraftNumber] = useState("");
  const [draftIcon, setDraftIcon] = useState<File | null>(null);
  const [draftIconPreview, setDraftIconPreview] = useState("");

  const [edits, setEdits] = useState<Record<string, { name: LocalizedText; number: string }>>({});

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const list = await listLicenses();
      setItems(list);
      setEdits(
        Object.fromEntries(list.map((item) => [item.id, { name: { ...item.name }, number: item.number }])),
      );
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      setError(code === "permission-denied" ? t.cta.firestoreDenied : t.admin.error);
    } finally {
      setLoading(false);
    }
  }, [t.admin.error, t.cta.firestoreDenied]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!draftIcon) {
      setDraftIconPreview("");
      return;
    }
    const url = URL.createObjectURL(draftIcon);
    setDraftIconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draftIcon]);

  const failMessage = (err: unknown) => {
    if (err instanceof Error) {
      if (err.message === "file-too-large") return t.admin.galleryTooLarge;
      if (err.message === "invalid-license") return t.admin.licensesRequired;
    }
    const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
    if (code === "permission-denied") return t.cta.firestoreDenied;
    return t.admin.error;
  };

  const onCreate = async () => {
    setBusyId("new");
    setMessage("");
    setError("");
    try {
      await createLicense({ name: draftName, number: draftNumber }, uid, { authorityIcon: draftIcon });
      setDraftName(emptyName());
      setDraftNumber("");
      setDraftIcon(null);
      await load();
      setMessage(t.admin.licensesSaved);
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onSave = async (item: License) => {
    const edit = edits[item.id];
    if (!edit) return;
    setBusyId(item.id);
    setMessage("");
    setError("");
    try {
      await updateLicense(item.id, { name: edit.name, number: edit.number, clearImage: true });
      await load();
      setMessage(t.admin.licensesSaved);
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onReplaceIcon = async (item: License, file: File | null) => {
    if (!file) return;
    setBusyId(item.id);
    setMessage("");
    setError("");
    try {
      await updateLicense(item.id, { clearImage: true }, { authorityIcon: file });
      await load();
      setMessage(t.admin.licensesSaved);
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onClearIcon = async (item: License) => {
    setBusyId(item.id);
    setError("");
    try {
      await updateLicense(item.id, { clearAuthorityIcon: true, clearImage: true });
      await load();
      setMessage(t.admin.licensesSaved);
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (item: License) => {
    if (!confirm(t.admin.licensesDeleteConfirm)) return;
    setBusyId(item.id);
    setError("");
    try {
      await deleteLicense(item.id);
      await load();
      setMessage(t.admin.licensesDeleted);
    } catch (err) {
      setError(failMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminSection title={t.admin.licenses} hint={t.admin.licensesHint}>
      {error ? <AdminFlash tone="error">{error}</AdminFlash> : null}
      {message ? <AdminFlash tone="ok">{message}</AdminFlash> : null}

      <div className={`${ADMIN_CARD_CLS} space-y-4 p-4`}>
        <p className="text-[13px] font-semibold text-navy">{t.admin.licensesAdd}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-[11px] text-muted-foreground">{t.admin.licensesName} · AR</span>
            <input
              className={`${ADMIN_FIELD_CLS} px-3 py-2`}
              value={draftName.ar}
              onChange={(e) => setDraftName((prev) => ({ ...prev, ar: e.target.value }))}
            />
          </label>
          <label>
            <span className="mb-1 block text-[11px] text-muted-foreground">{t.admin.licensesName} · EN</span>
            <input
              className={`${ADMIN_FIELD_CLS} px-3 py-2`}
              value={draftName.en}
              onChange={(e) => setDraftName((prev) => ({ ...prev, en: e.target.value }))}
            />
          </label>
        </div>
        <label className="block max-w-sm">
          <span className="mb-1 block text-[11px] text-muted-foreground">{t.admin.licensesNumber}</span>
          <input
            dir="ltr"
            className={`${ADMIN_FIELD_CLS} px-3 py-2`}
            value={draftNumber}
            onChange={(e) => setDraftNumber(e.target.value)}
          />
        </label>
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">{t.admin.licensesAuthorityIcon}</p>
          <div className="flex items-center gap-3">
            <PreviewBox src={draftIconPreview} alt="" />
            <FilePickButton label={t.admin.galleryUpload} onPick={setDraftIcon} disabled={busyId === "new"} />
          </div>
        </div>
        <button
          type="button"
          className={ADMIN_BTN_PRIMARY}
          disabled={busyId === "new"}
          onClick={() => void onCreate()}
        >
          {busyId === "new" ? t.admin.loading : t.admin.licensesAdd}
        </button>
      </div>

      {loading ? <div className="h-28 animate-pulse rounded-2xl bg-card/80" /> : null}
      {!loading && items.length === 0 ? <AdminEmptyState message={t.admin.licensesEmpty} /> : null}

      <div className="space-y-3">
        {items.map((item) => {
          const edit = edits[item.id] ?? { name: item.name, number: item.number };
          const busy = busyId === item.id;
          return (
            <article key={item.id} className={`${ADMIN_CARD_CLS} space-y-3 p-4`}>
              <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">{t.admin.licensesAuthorityIcon}</p>
                  <PreviewBox src={item.authorityIconUrl} alt={edit.name.ar || edit.name.en} />
                  <div className="flex flex-wrap gap-2">
                    <FilePickButton
                      label={t.admin.licensesReplaceIcon}
                      onPick={(file) => void onReplaceIcon(item, file)}
                      disabled={busy}
                    />
                    {item.authorityIconUrl ? (
                      <button
                        type="button"
                        className={`${ADMIN_BTN_GHOST} min-h-9 px-3 text-[12px]`}
                        disabled={busy}
                        onClick={() => void onClearIcon(item)}
                      >
                        {t.admin.licensesRemoveIcon}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label>
                      <span className="mb-1 block text-[11px] text-muted-foreground">{t.admin.licensesName} · AR</span>
                      <input
                        className={`${ADMIN_FIELD_CLS} px-3 py-2`}
                        value={edit.name.ar}
                        disabled={busy}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [item.id]: { ...edit, name: { ...edit.name, ar: e.target.value } },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="mb-1 block text-[11px] text-muted-foreground">{t.admin.licensesName} · EN</span>
                      <input
                        className={`${ADMIN_FIELD_CLS} px-3 py-2`}
                        value={edit.name.en}
                        disabled={busy}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            [item.id]: { ...edit, name: { ...edit.name, en: e.target.value } },
                          }))
                        }
                      />
                    </label>
                  </div>
                  <label className="block max-w-sm">
                    <span className="mb-1 block text-[11px] text-muted-foreground">{t.admin.licensesNumber}</span>
                    <input
                      dir="ltr"
                      className={`${ADMIN_FIELD_CLS} px-3 py-2`}
                      value={edit.number}
                      disabled={busy}
                      onChange={(e) =>
                        setEdits((prev) => ({
                          ...prev,
                          [item.id]: { ...edit, number: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
                <button type="button" className={ADMIN_BTN_PRIMARY} disabled={busy} onClick={() => void onSave(item)}>
                  {busy ? t.admin.loading : t.admin.save}
                </button>
                <button
                  type="button"
                  className={`${ADMIN_BTN_GHOST} inline-flex items-center gap-1.5 text-red-600`}
                  disabled={busy}
                  onClick={() => void onDelete(item)}
                >
                  <Trash2 size={13} strokeWidth={2} />
                  {t.admin.delete}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AdminSection>
  );
}
