import type { ReactNode } from "react";
import { PHOTO_NAME_OPTIONS, isPhotoName, type CmsPageImages } from "../../lib/page-content";
import { ADMIN_FIELD_CLS, AdminSection } from "./shared";

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

function tuplePair(value: unknown): [string, string] {
  if (isTuplePair(value)) return [value[0], value[1]];
  return ["", ""];
}

function writePath(obj: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  if (!path.length) return obj;
  const next = structuredClone(obj);
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const existing = cur[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[path[path.length - 1]!] = value;
  return next;
}

function humanizeKey(key: string) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function isTuplePair(value: unknown): value is [string, string] {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string";
}

function ContentNodes({
  label,
  pathPrefix,
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
}: {
  label: string;
  pathPrefix: string[];
  valueAr: Record<string, unknown>;
  valueEn: Record<string, unknown>;
  onChangeAr: (next: Record<string, unknown>) => void;
  onChangeEn: (next: Record<string, unknown>) => void;
}) {
  const keys = Array.from(new Set([...Object.keys(valueAr), ...Object.keys(valueEn)])).sort();

  return (
    <AdminSection title={label}>
      <div className="space-y-5">
        {keys.map((key) => {
          const arVal = valueAr[key];
          const enVal = valueEn[key];
          const path = [...pathPrefix, key];
          const pathLabel = path.join(".");

          if (typeof arVal === "string" || typeof enVal === "string") {
            const arText = readString(arVal);
            const enText = readString(enVal);
            return (
              <BilingualField
                key={pathLabel}
                label={humanizeKey(key)}
                path={pathLabel}
                valueAr={arText}
                valueEn={enText}
                multiline={Math.max(arText.length, enText.length) > 80}
                onChange={(lang, value) => {
                  if (lang === "ar") onChangeAr(writePath(valueAr, [key], value));
                  else onChangeEn(writePath(valueEn, [key], value));
                }}
              />
            );
          }

          if (isTuplePair(arVal) || isTuplePair(enVal)) {
            const arPair = tuplePair(arVal);
            const enPair = tuplePair(enVal);
            return (
              <div key={pathLabel} className="rounded-xl border border-border/80 bg-background/60 p-4">
                <p className="mb-3 text-sm font-medium text-navy">{humanizeKey(key)}</p>
                <div className="space-y-3">
                  <BilingualField
                    label="Title"
                    path={`${pathLabel}.0`}
                    valueAr={arPair[0]}
                    valueEn={enPair[0]}
                    onChange={(lang, value) => {
                      if (lang === "ar") onChangeAr(writePath(valueAr, [key], [value, arPair[1]]));
                      else onChangeEn(writePath(valueEn, [key], [value, enPair[1]]));
                    }}
                  />
                  <BilingualField
                    label="Description"
                    path={`${pathLabel}.1`}
                    valueAr={arPair[1]}
                    valueEn={enPair[1]}
                    multiline
                    onChange={(lang, value) => {
                      if (lang === "ar") onChangeAr(writePath(valueAr, [key], [arPair[0], value]));
                      else onChangeEn(writePath(valueEn, [key], [enPair[0], value]));
                    }}
                  />
                </div>
              </div>
            );
          }

          if (Array.isArray(arVal) || Array.isArray(enVal)) {
            const arArr = Array.isArray(arVal) ? arVal : [];
            const enArr = Array.isArray(enVal) ? enVal : [];
            const len = Math.max(arArr.length, enArr.length);
            const items: ReactNode[] = [];
            for (let i = 0; i < len; i++) {
              const arItem = arArr[i];
              const enItem = enArr[i];
              if (isTuplePair(arItem) || isTuplePair(enItem)) {
                const arPair = tuplePair(arItem);
                const enPair = tuplePair(enItem);
                items.push(
                  <div key={`${pathLabel}.${i}`} className="rounded-xl border border-border/60 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {humanizeKey(key)} #{i + 1}
                    </p>
                    <div className="space-y-3">
                      <BilingualField
                        label="Title"
                        path={`${pathLabel}.${i}.0`}
                        valueAr={arPair[0]}
                        valueEn={enPair[0]}
                        onChange={(lang, value) => {
                          const nextAr = [...arArr] as unknown[];
                          const nextEn = [...enArr] as unknown[];
                          if (lang === "ar") nextAr[i] = [value, arPair[1]];
                          else nextEn[i] = [value, enPair[1]];
                          if (lang === "ar") onChangeAr(writePath(valueAr, [key], nextAr));
                          else onChangeEn(writePath(valueEn, [key], nextEn));
                        }}
                      />
                      <BilingualField
                        label="Description"
                        path={`${pathLabel}.${i}.1`}
                        valueAr={arPair[1]}
                        valueEn={enPair[1]}
                        multiline
                        onChange={(lang, value) => {
                          const nextAr = [...arArr] as unknown[];
                          const nextEn = [...enArr] as unknown[];
                          if (lang === "ar") nextAr[i] = [arPair[0], value];
                          else nextEn[i] = [enPair[0], value];
                          if (lang === "ar") onChangeAr(writePath(valueAr, [key], nextAr));
                          else onChangeEn(writePath(valueEn, [key], nextEn));
                        }}
                      />
                    </div>
                  </div>,
                );
              } else if (arItem && typeof arItem === "object" && !Array.isArray(arItem)) {
                items.push(
                  <ContentNodes
                    key={`${pathLabel}.${i}`}
                    label={`${humanizeKey(key)} #${i + 1}`}
                    pathPrefix={[...path, String(i)]}
                    valueAr={(arItem as Record<string, unknown>) ?? {}}
                    valueEn={(enItem as Record<string, unknown>) ?? {}}
                    onChangeAr={(next) => {
                      const clone = [...arArr] as unknown[];
                      clone[i] = next;
                      onChangeAr(writePath(valueAr, [key], clone));
                    }}
                    onChangeEn={(next) => {
                      const clone = [...enArr] as unknown[];
                      clone[i] = next;
                      onChangeEn(writePath(valueEn, [key], clone));
                    }}
                  />,
                );
              }
            }
            return (
              <div key={pathLabel} className="space-y-3">
                <p className="text-sm font-medium text-navy">{humanizeKey(key)}</p>
                {items}
              </div>
            );
          }

          if (isPlainObject(arVal) || isPlainObject(enVal)) {
            return (
              <ContentNodes
                key={pathLabel}
                label={humanizeKey(key)}
                pathPrefix={path}
                valueAr={isPlainObject(arVal) ? arVal : {}}
                valueEn={isPlainObject(enVal) ? enVal : {}}
                onChangeAr={(next) => onChangeAr(writePath(valueAr, [key], next))}
                onChangeEn={(next) => onChangeEn(writePath(valueEn, [key], next))}
              />
            );
          }

          return null;
        })}
      </div>
    </AdminSection>
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function ContentFieldEditor({
  ar,
  en,
  onChangeAr,
  onChangeEn,
}: {
  ar: Record<string, unknown>;
  en: Record<string, unknown>;
  onChangeAr: (next: Record<string, unknown>) => void;
  onChangeEn: (next: Record<string, unknown>) => void;
}) {
  const roots = Array.from(new Set([...Object.keys(ar), ...Object.keys(en)]));

  return (
    <div className="space-y-6">
      {roots.map((root) => (
        <ContentNodes
          key={root}
          label={humanizeKey(root)}
          pathPrefix={[root]}
          valueAr={isPlainObject(ar[root]) ? (ar[root] as Record<string, unknown>) : {}}
          valueEn={isPlainObject(en[root]) ? (en[root] as Record<string, unknown>) : {}}
          onChangeAr={(next) => onChangeAr(writePath(ar, [root], next))}
          onChangeEn={(next) => onChangeEn(writePath(en, [root], next))}
        />
      ))}
    </div>
  );
}

export function ContentImageEditor({
  images,
  defaults,
  labels,
  onChange,
}: {
  images: CmsPageImages;
  defaults: CmsPageImages;
  labels: Record<string, string>;
  onChange: (next: CmsPageImages) => void;
}) {
  const keys = Object.keys(defaults);
  if (!keys.length) return null;

  return (
    <AdminSection title="Images">
      <div className="grid gap-4 sm:grid-cols-2">
        {keys.map((key) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {labels[key] ?? humanizeKey(key)}
            </span>
            <select
              className={ADMIN_FIELD_CLS}
              value={images[key] ?? defaults[key] ?? ""}
              onChange={(e) => {
                const next = { ...images };
                if (isPhotoName(e.target.value)) next[key] = e.target.value;
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
        ))}
      </div>
    </AdminSection>
  );
}

export { writePath, humanizeKey };
