import { ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  buildInternationalPhone,
  countryFlagSrc,
  findDialCountry,
  sortedDialCountries,
  type DialCountry,
} from "../lib/country-dial-codes";

const shellCls = [
  "flex overflow-hidden rounded-2xl border border-[#C8A96A]/25 bg-background/80",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-200",
  "hover:border-[#C8A96A]/45 focus-within:border-[#C8A96A] focus-within:bg-card focus-within:ring-2 focus-within:ring-[#C8A96A]/20",
].join(" ");

function FlagImg({ iso, name, size = 18 }: { iso: string; name: string; size?: number }) {
  return (
    <img
      src={countryFlagSrc(iso, 40)}
      srcSet={`${countryFlagSrc(iso, 40)} 1x, ${countryFlagSrc(iso, 80)} 2x`}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      title={name}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
}

type PhoneCountryFieldProps = {
  id: string;
  label: string;
  lang: "ar" | "en";
  searchPlaceholder: string;
  numberPlaceholder: string;
  value: string;
  onChange: (fullPhone: string) => void;
  error?: string;
  required?: boolean;
};

export function PhoneCountryField({
  id,
  label,
  lang,
  searchPlaceholder,
  numberPlaceholder,
  value,
  onChange,
  error,
  required,
}: PhoneCountryFieldProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [iso, setIso] = useState("SA");
  const [local, setLocal] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const country = findDialCountry(iso);
  const countries = useMemo(() => sortedDialCountries(lang), [lang]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => {
      const hay = `${c.nameAr} ${c.nameEn} ${c.dial} +${c.dial} ${c.iso}`.toLowerCase();
      return hay.includes(q);
    });
  }, [countries, query]);

  const pushValue = (nextIso: string, nextLocal: string) => {
    const dial = findDialCountry(nextIso).dial;
    onChange(buildInternationalPhone(dial, nextLocal));
  };

  useEffect(() => {
    if (!value) {
      setLocal("");
      setIso("SA");
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickCountry = (next: DialCountry) => {
    setIso(next.iso);
    setOpen(false);
    setQuery("");
    pushValue(next.iso, local);
  };

  const onLocalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 15);
    setLocal(digits);
    pushValue(iso, digits);
  };

  const countryName = lang === "ar" ? country.nameAr : country.nameEn;

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-2.5 block text-[13px] font-medium tracking-wide text-gold-ink">{label}</span>
      <div className={shellCls} dir="ltr">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={countryName}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex shrink-0 items-center gap-2 border-e border-[#C8A96A]/20 bg-[#C8A96A]/08 px-3 py-3.5 text-sm text-navy outline-none"
        >
          <FlagImg iso={country.iso} name={countryName} size={20} />
          <span className="font-medium tabular-nums">+{country.dial}</span>
          <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="tel-national"
          required={required}
          value={local}
          onChange={(e) => onLocalChange(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            onLocalChange(e.clipboardData.getData("text"));
          }}
          onKeyDown={(e) => {
            if (e.key.length === 1 && !/[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
            }
          }}
          placeholder={numberPlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-sm text-navy outline-none placeholder:text-muted-foreground/55"
        />
      </div>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute start-0 z-30 mt-2 w-full min-w-[18rem] overflow-hidden rounded-2xl border border-[#C8A96A]/25 bg-card shadow-[0_24px_48px_-24px_rgba(15,40,70,0.45)] sm:w-[22rem]"
        >
          <div className="relative border-b border-border/70 p-2.5">
            <Search
              size={14}
              className="pointer-events-none absolute start-5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-border bg-background py-2.5 pe-3 ps-9 text-sm text-navy outline-none focus:border-[#C8A96A]"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">—</li>
            ) : (
              filtered.map((c) => {
                const active = c.iso === iso;
                const name = lang === "ar" ? c.nameAr : c.nameEn;
                return (
                  <li key={`${c.iso}-${c.dial}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => pickCountry(c)}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-start text-sm transition-colors ${
                        active ? "bg-[#C8A96A]/15 text-navy" : "text-navy hover:bg-[#C8A96A]/08"
                      }`}
                    >
                      <FlagImg iso={c.iso} name={name} size={22} />
                      <span className="flex-1 truncate">{name}</span>
                      <span className="tabular-nums text-muted-foreground">+{c.dial}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
