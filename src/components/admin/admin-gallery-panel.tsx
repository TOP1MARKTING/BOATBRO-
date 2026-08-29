import { Copy, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  deleteGalleryImage,
  listGalleryImages,
  updateGalleryImage,
  uploadGalleryImage,
  type GalleryImage,
} from "../../lib/db";
import type { LocalizedText } from "../../lib/post-content";
import { ADMIN_FIELD_CLS, AdminPanelShell } from "./shared";

function BilingualMini({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label>
        <span className="mb-1 block text-[11px] text-muted-foreground">{label} · EN</span>
        <input className={`${ADMIN_FIELD_CLS} px-3 py-2`} value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
      </label>
      <label>
        <span className="mb-1 block text-[11px] text-muted-foreground">{label} · AR</span>
        <input className={`${ADMIN_FIELD_CLS} px-3 py-2`} value={value.ar} onChange={(e) => onChange({ ...value, ar: e.target.value })} />
      </label>
    </div>
  );
}

export function AdminGalleryPanel({
  uid,
  t,
}: {
  uid: string;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
}) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      setImages(await listGalleryImages());
    } catch (err) {
      const code = typeof err === "object" && err && "code" in err ? String((err as { code: string }).code) : "";
      setError(
        code === "permission-denied" ? t.cta.firestoreDenied : t.admin.error,
      );
    } finally {
      setLoading(false);
    }
  }, [t.admin.error, t.cta.firestoreDenied]);

  useEffect(() => {
    void load();
  }, [load]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMessage("");
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        await uploadGalleryImage(file, uid);
      }
      await load();
      setMessage(t.admin.gallerySaved);
    } catch (err) {
      const msg = err instanceof Error && err.message === "file-too-large" ? t.admin.galleryTooLarge : t.admin.error;
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const onCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t.admin.galleryCopied);
    } catch {
      setError(t.admin.error);
    }
  };

  const onDelete = async (image: GalleryImage) => {
    if (!confirm(t.admin.galleryDeleteConfirm)) return;
    setError("");
    try {
      await deleteGalleryImage(image);
      setImages((prev) => prev.filter((item) => item.id !== image.id));
      setMessage(t.admin.galleryDeleted);
    } catch {
      setError(t.admin.error);
    }
  };

  const onSaveMeta = async (image: GalleryImage, alt: LocalizedText, caption: LocalizedText) => {
    try {
      await updateGalleryImage(image.id, { alt, caption, name: image.name });
      setMessage(t.admin.gallerySaved);
    } catch {
      setError(t.admin.error);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t.admin.galleryHint}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-[13px] font-medium text-white hover:bg-gold/90">
          <Upload size={16} />
          {uploading ? t.admin.galleryUploading : t.admin.galleryUpload}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files).then(() => { e.target.value = ""; })}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-gold-ink">{message}</p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card px-8 py-16 text-center text-sm text-muted-foreground">
          {t.admin.galleryEmpty}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {images.map((image) => (
            <GalleryCard
              key={image.id}
              image={image}
              t={t}
              onCopy={() => void onCopy(image.url)}
              onDelete={() => void onDelete(image)}
              onSaveMeta={(alt, caption) => void onSaveMeta(image, alt, caption)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryCard({
  image,
  t,
  onCopy,
  onDelete,
  onSaveMeta,
}: {
  image: GalleryImage;
  t: ReturnType<typeof import("../../lib/i18n").useLang>["t"];
  onCopy: () => void;
  onDelete: () => void;
  onSaveMeta: (alt: LocalizedText, caption: LocalizedText) => void;
}) {
  const [alt, setAlt] = useState(image.alt);
  const [caption, setCaption] = useState(image.caption);
  const dirty = alt.ar !== image.alt.ar || alt.en !== image.alt.en || caption.ar !== image.caption.ar || caption.en !== image.caption.en;

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img src={image.url} alt={alt.ar || alt.en || image.name} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <p className="truncate text-[12px] font-medium text-navy">{image.name}</p>
        <BilingualMini label={t.admin.imageAlt} value={alt} onChange={setAlt} />
        <BilingualMini label={t.admin.imageCaption} value={caption} onChange={setCaption} />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12px] hover:border-gold"
          >
            <Copy size={14} />
            {t.admin.galleryCopyUrl}
          </button>
          {dirty ? (
            <button
              type="button"
              onClick={() => onSaveMeta(alt, caption)}
              className="rounded-full bg-navy-deep px-3 py-1.5 text-[12px] text-white"
            >
              {t.admin.save}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] text-destructive hover:bg-destructive/10"
          >
            <Trash2 size={14} />
            {t.admin.delete}
          </button>
        </div>
      </div>
    </article>
  );
}
