import { X } from "lucide-react";
import type { GalleryImage } from "../../lib/db";

export function GalleryPicker({
  open,
  images,
  onClose,
  onSelect,
  title,
  empty,
  loading,
}: {
  open: boolean;
  images: GalleryImage[];
  onClose: () => void;
  onSelect: (url: string, image: GalleryImage) => void;
  title: string;
  empty: string;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-navy">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-muted" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : images.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface-2 px-4 py-8 text-center text-sm text-muted-foreground">
              {empty}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {images.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => {
                    onSelect(image.url, image);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-xl border border-border bg-surface-2 text-start transition-colors hover:border-gold"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt={image.alt.ar || image.alt.en || image.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <p className="truncate px-2 py-2 text-[11px] text-muted-foreground">{image.name || image.url}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
