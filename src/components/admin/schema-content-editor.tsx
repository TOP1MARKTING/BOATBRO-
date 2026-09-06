import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  CMS_EDITOR_SCHEMAS,
  type CmsEditorField,
  type CmsImageField,
} from "../../lib/cms-editor-schema";
import type { CmsPageId, CmsPageImages } from "../../lib/page-content";
import { PHOTO_NAME_OPTIONS, isPhotoName } from "../../lib/page-content";
import { ADMIN_FIELD_CLS } from "./shared";
import { writePath } from "./content-field-editor";

type BilingualEditorProps = {
  label: string;
  path: string;
  valueAr: string;
  valueEn: string;
  multiline?: boolean;
  onChange: (lang: "ar" | "en", value: string) => void;
};

function BilingualField({ label, path, valueAr, valueEn, multiline = false, onChange }: BilingualEditorProps) {
  const Input = multiline ? "textarea" : "input";
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label} · عربي
        </span>
        <Input
          dir="rtl"
          className={`${ADMIN_FIELD_CLS} ${multiline ? "min-h-[88px] resize-y" : ""}`}
          value={valueAr}
          data-path={`${path}.ar`}
          onChange={(e) => onChange("ar", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label} · English
        </span>
        <Input
          dir="ltr"
          className={`${ADMIN_FIELD_CLS} ${multiline ? "min-h-[88px] resize-y" : ""}`}
          value={valueEn}
          data-path={`${path}.en`}
          onChange={(e) => onChange("en", e.target.value)}
        />
      </label>
    </div>
  );
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isTuplePair(value: unknown): value is [string, string] {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string";
}

function tuplePair(value: unknown): [string, string] {
  if (isTuplePair(value)) return [value[0], value[1]];
  return ["", ""];
}

function readAt(root: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = root;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function SchemaFieldRow({
  field,
  ar,
  en,
  onChangeAr,
  onChangeEn,
}: {
  field: CmsEditorField;
  ar: Record<string, unknown>;
  en: Record<string, unknown>;
  onChangeAr: (next: Record<string, unknown>) => void;
  onChangeEn: (next: Record<string, unknown>) => void;
}) {
  const pathLabel = field.path.join(".");

  if (field.kind === "string") {
    const arText = readString(readAt(ar, field.path));
    const enText = readString(readAt(en, field.path));
    return (
      <BilingualField
        label={field.label}
        path={pathLabel}
        valueAr={arText}
        valueEn={enText}
        multiline={field.multiline ?? Math.max(arText.length, enText.length) > 80}
        onChange={(lang, value) => {
          if (lang === "ar") onChangeAr(writePath(ar, field.path, value));
          else onChangeEn(writePath(en, field.path, value));
        }}
      />
    );
  }

  const arPair = tuplePair(readAt(ar, field.path));
  const enPair = tuplePair(readAt(en, field.path));
  return (
    <div className="rounded-xl border border-border/80 bg-background/60 p-4">
      <p className="mb-3 text-sm font-medium text-navy">{field.label}</p>
      <div className="space-y-3">
        <BilingualField
          label="Title"
          path={`${pathLabel}.0`}
          valueAr={arPair[0]}
          valueEn={enPair[0]}
          onChange={(lang, value) => {
            if (lang === "ar") onChangeAr(writePath(ar, field.path, [value, arPair[1]]));
            else onChangeEn(writePath(en, field.path, [value, enPair[1]]));
          }}
        />
        <BilingualField
          label="Description"
          path={`${pathLabel}.1`}
          valueAr={arPair[1]}
          valueEn={enPair[1]}
          multiline
          onChange={(lang, value) => {
            if (lang === "ar") onChangeAr(writePath(ar, field.path, [arPair[0], value]));
            else onChangeEn(writePath(en, field.path, [enPair[0], value]));
          }}
        />
      </div>
    </div>
  );
}

function SchemaImageField({
  field,
  images,
  defaults,
  onChange,
}: {
  field: CmsImageField;
  images: CmsPageImages;
  defaults: CmsPageImages;
  onChange: (next: CmsPageImages) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {field.label}
      </span>
      <select
        className={ADMIN_FIELD_CLS}
        value={images[field.key] ?? defaults[field.key] ?? ""}
        onChange={(e) => {
          const next = { ...images };
          if (isPhotoName(e.target.value)) next[field.key] = e.target.value;
          onChange(next);
        }}
      >
        {PHOTO_NAME_OPTIONS.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditorSection({
  title,
  hint,
  defaultOpen,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group rounded-[1.35rem] border border-[#C8A96A]/18 bg-card/50"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-2xl px-5 py-4 font-display text-base font-semibold text-navy marker:content-none [&::-webkit-details-marker]:hidden">
        <ChevronDown
          size={18}
          className={`shrink-0 text-gold transition-transform ${open ? "rotate-0" : "-rotate-90"}`}
        />
        {title}
      </summary>
      <div className="space-y-5 border-t border-border/80 px-5 py-5">
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        {children}
      </div>
    </details>
  );
}

export function SchemaContentEditor({
  pageId,
  ar,
  en,
  images,
  defaultImages,
  onChangeAr,
  onChangeEn,
  onChangeImages,
}: {
  pageId: CmsPageId;
  ar: Record<string, unknown>;
  en: Record<string, unknown>;
  images: CmsPageImages;
  defaultImages: CmsPageImages;
  onChangeAr: (next: Record<string, unknown>) => void;
  onChangeEn: (next: Record<string, unknown>) => void;
  onChangeImages: (next: CmsPageImages) => void;
}) {
  const schema = CMS_EDITOR_SCHEMAS[pageId];

  return (
    <div className="space-y-4">
      {schema.sections.map((section, index) => (
        <EditorSection
          key={section.title}
          title={section.title}
          {...(section.hint ? { hint: section.hint } : {})}
          defaultOpen={index === 0}
        >
          <div className="space-y-5">
            {section.fields.map((field) => (
              <SchemaFieldRow
                key={field.path.join(".")}
                field={field}
                ar={ar}
                en={en}
                onChangeAr={onChangeAr}
                onChangeEn={onChangeEn}
              />
            ))}
            {section.images?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {section.images.map((imgField) => (
                  <SchemaImageField
                    key={imgField.key}
                    field={imgField}
                    images={images}
                    defaults={defaultImages}
                    onChange={onChangeImages}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </EditorSection>
      ))}
    </div>
  );
}
