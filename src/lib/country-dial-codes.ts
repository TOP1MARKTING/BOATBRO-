export type DialCountry = {
  iso: string;
  dial: string;
  nameAr: string;
  nameEn: string;
};

/** Priority countries shown first (Saudi default market + neighbors). */
export const PRIORITY_DIAL_ISOS = [
  "SA",
  "EG",
  "AE",
  "KW",
  "BH",
  "QA",
  "OM",
  "JO",
  "LB",
  "IQ",
  "YE",
  "SD",
  "MA",
  "DZ",
  "TN",
  "LY",
  "PS",
  "TR",
  "US",
  "GB",
] as const;

export const DIAL_COUNTRIES: DialCountry[] = [
  { iso: "SA", dial: "966", nameAr: "السعودية", nameEn: "Saudi Arabia" },
  { iso: "EG", dial: "20", nameAr: "مصر", nameEn: "Egypt" },
  { iso: "AE", dial: "971", nameAr: "الإمارات", nameEn: "United Arab Emirates" },
  { iso: "KW", dial: "965", nameAr: "الكويت", nameEn: "Kuwait" },
  { iso: "BH", dial: "973", nameAr: "البحرين", nameEn: "Bahrain" },
  { iso: "QA", dial: "974", nameAr: "قطر", nameEn: "Qatar" },
  { iso: "OM", dial: "968", nameAr: "عُمان", nameEn: "Oman" },
  { iso: "JO", dial: "962", nameAr: "الأردن", nameEn: "Jordan" },
  { iso: "LB", dial: "961", nameAr: "لبنان", nameEn: "Lebanon" },
  { iso: "IQ", dial: "964", nameAr: "العراق", nameEn: "Iraq" },
  { iso: "YE", dial: "967", nameAr: "اليمن", nameEn: "Yemen" },
  { iso: "SD", dial: "249", nameAr: "السودان", nameEn: "Sudan" },
  { iso: "MA", dial: "212", nameAr: "المغرب", nameEn: "Morocco" },
  { iso: "DZ", dial: "213", nameAr: "الجزائر", nameEn: "Algeria" },
  { iso: "TN", dial: "216", nameAr: "تونس", nameEn: "Tunisia" },
  { iso: "LY", dial: "218", nameAr: "ليبيا", nameEn: "Libya" },
  { iso: "PS", dial: "970", nameAr: "فلسطين", nameEn: "Palestine" },
  { iso: "SY", dial: "963", nameAr: "سوريا", nameEn: "Syria" },
  { iso: "TR", dial: "90", nameAr: "تركيا", nameEn: "Turkey" },
  { iso: "IR", dial: "98", nameAr: "إيران", nameEn: "Iran" },
  { iso: "US", dial: "1", nameAr: "الولايات المتحدة", nameEn: "United States" },
  { iso: "CA", dial: "1", nameAr: "كندا", nameEn: "Canada" },
  { iso: "GB", dial: "44", nameAr: "بريطانيا", nameEn: "United Kingdom" },
  { iso: "FR", dial: "33", nameAr: "فرنسا", nameEn: "France" },
  { iso: "DE", dial: "49", nameAr: "ألمانيا", nameEn: "Germany" },
  { iso: "IT", dial: "39", nameAr: "إيطاليا", nameEn: "Italy" },
  { iso: "ES", dial: "34", nameAr: "إسبانيا", nameEn: "Spain" },
  { iso: "NL", dial: "31", nameAr: "هولندا", nameEn: "Netherlands" },
  { iso: "BE", dial: "32", nameAr: "بلجيكا", nameEn: "Belgium" },
  { iso: "CH", dial: "41", nameAr: "سويسرا", nameEn: "Switzerland" },
  { iso: "AT", dial: "43", nameAr: "النمسا", nameEn: "Austria" },
  { iso: "SE", dial: "46", nameAr: "السويد", nameEn: "Sweden" },
  { iso: "NO", dial: "47", nameAr: "النرويج", nameEn: "Norway" },
  { iso: "DK", dial: "45", nameAr: "الدنمارك", nameEn: "Denmark" },
  { iso: "FI", dial: "358", nameAr: "فنلندا", nameEn: "Finland" },
  { iso: "IE", dial: "353", nameAr: "أيرلندا", nameEn: "Ireland" },
  { iso: "PT", dial: "351", nameAr: "البرتغال", nameEn: "Portugal" },
  { iso: "GR", dial: "30", nameAr: "اليونان", nameEn: "Greece" },
  { iso: "PL", dial: "48", nameAr: "بولندا", nameEn: "Poland" },
  { iso: "CZ", dial: "420", nameAr: "التشيك", nameEn: "Czechia" },
  { iso: "RO", dial: "40", nameAr: "رومانيا", nameEn: "Romania" },
  { iso: "HU", dial: "36", nameAr: "المجر", nameEn: "Hungary" },
  { iso: "RU", dial: "7", nameAr: "روسيا", nameEn: "Russia" },
  { iso: "UA", dial: "380", nameAr: "أوكرانيا", nameEn: "Ukraine" },
  { iso: "IN", dial: "91", nameAr: "الهند", nameEn: "India" },
  { iso: "PK", dial: "92", nameAr: "باكستان", nameEn: "Pakistan" },
  { iso: "BD", dial: "880", nameAr: "بنغلاديش", nameEn: "Bangladesh" },
  { iso: "LK", dial: "94", nameAr: "سريلانكا", nameEn: "Sri Lanka" },
  { iso: "NP", dial: "977", nameAr: "نيبال", nameEn: "Nepal" },
  { iso: "CN", dial: "86", nameAr: "الصين", nameEn: "China" },
  { iso: "JP", dial: "81", nameAr: "اليابان", nameEn: "Japan" },
  { iso: "KR", dial: "82", nameAr: "كوريا الجنوبية", nameEn: "South Korea" },
  { iso: "PH", dial: "63", nameAr: "الفلبين", nameEn: "Philippines" },
  { iso: "ID", dial: "62", nameAr: "إندونيسيا", nameEn: "Indonesia" },
  { iso: "MY", dial: "60", nameAr: "ماليزيا", nameEn: "Malaysia" },
  { iso: "SG", dial: "65", nameAr: "سنغافورة", nameEn: "Singapore" },
  { iso: "TH", dial: "66", nameAr: "تايلاند", nameEn: "Thailand" },
  { iso: "VN", dial: "84", nameAr: "فيتنام", nameEn: "Vietnam" },
  { iso: "AU", dial: "61", nameAr: "أستراليا", nameEn: "Australia" },
  { iso: "NZ", dial: "64", nameAr: "نيوزيلندا", nameEn: "New Zealand" },
  { iso: "ZA", dial: "27", nameAr: "جنوب أفريقيا", nameEn: "South Africa" },
  { iso: "NG", dial: "234", nameAr: "نيجيريا", nameEn: "Nigeria" },
  { iso: "KE", dial: "254", nameAr: "كينيا", nameEn: "Kenya" },
  { iso: "ET", dial: "251", nameAr: "إثيوبيا", nameEn: "Ethiopia" },
  { iso: "GH", dial: "233", nameAr: "غانا", nameEn: "Ghana" },
  { iso: "BR", dial: "55", nameAr: "البرازيل", nameEn: "Brazil" },
  { iso: "AR", dial: "54", nameAr: "الأرجنتين", nameEn: "Argentina" },
  { iso: "MX", dial: "52", nameAr: "المكسيك", nameEn: "Mexico" },
  { iso: "CL", dial: "56", nameAr: "تشيلي", nameEn: "Chile" },
  { iso: "CO", dial: "57", nameAr: "كولومبيا", nameEn: "Colombia" },
  { iso: "PE", dial: "51", nameAr: "بيرو", nameEn: "Peru" },
  { iso: "AF", dial: "93", nameAr: "أفغانستان", nameEn: "Afghanistan" },
  { iso: "AL", dial: "355", nameAr: "ألبانيا", nameEn: "Albania" },
  { iso: "AM", dial: "374", nameAr: "أرمينيا", nameEn: "Armenia" },
  { iso: "AZ", dial: "994", nameAr: "أذربيجان", nameEn: "Azerbaijan" },
  { iso: "BA", dial: "387", nameAr: "البوسنة", nameEn: "Bosnia" },
  { iso: "BG", dial: "359", nameAr: "بلغاريا", nameEn: "Bulgaria" },
  { iso: "BY", dial: "375", nameAr: "بيلاروسيا", nameEn: "Belarus" },
  { iso: "CY", dial: "357", nameAr: "قبرص", nameEn: "Cyprus" },
  { iso: "GE", dial: "995", nameAr: "جورجيا", nameEn: "Georgia" },
  { iso: "HK", dial: "852", nameAr: "هونغ كونغ", nameEn: "Hong Kong" },
  { iso: "HR", dial: "385", nameAr: "كرواتيا", nameEn: "Croatia" },
  { iso: "IL", dial: "972", nameAr: "إسرائيل", nameEn: "Israel" },
  { iso: "IS", dial: "354", nameAr: "آيسلندا", nameEn: "Iceland" },
  { iso: "KZ", dial: "7", nameAr: "كازاخستان", nameEn: "Kazakhstan" },
  { iso: "LT", dial: "370", nameAr: "ليتوانيا", nameEn: "Lithuania" },
  { iso: "LU", dial: "352", nameAr: "لوكسمبورغ", nameEn: "Luxembourg" },
  { iso: "LV", dial: "371", nameAr: "لاتفيا", nameEn: "Latvia" },
  { iso: "MD", dial: "373", nameAr: "مولدوفا", nameEn: "Moldova" },
  { iso: "ME", dial: "382", nameAr: "الجبل الأسود", nameEn: "Montenegro" },
  { iso: "MK", dial: "389", nameAr: "مقدونيا", nameEn: "North Macedonia" },
  { iso: "MM", dial: "95", nameAr: "ميانمار", nameEn: "Myanmar" },
  { iso: "MT", dial: "356", nameAr: "مالطا", nameEn: "Malta" },
  { iso: "MV", dial: "960", nameAr: "المالديف", nameEn: "Maldives" },
  { iso: "RS", dial: "381", nameAr: "صربيا", nameEn: "Serbia" },
  { iso: "SI", dial: "386", nameAr: "سلوفينيا", nameEn: "Slovenia" },
  { iso: "SK", dial: "421", nameAr: "سلوفاكيا", nameEn: "Slovakia" },
  { iso: "TW", dial: "886", nameAr: "تايوان", nameEn: "Taiwan" },
  { iso: "UZ", dial: "998", nameAr: "أوزبكستان", nameEn: "Uzbekistan" },
];

export function countryFlagSrc(iso: string, width = 40) {
  return `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png`;
}

export function findDialCountry(iso: string) {
  return DIAL_COUNTRIES.find((c) => c.iso === iso) ?? DIAL_COUNTRIES[0]!;
}

export function buildInternationalPhone(dial: string, localRaw: string) {
  let local = localRaw.replace(/\D/g, "");
  if (local.startsWith("0")) local = local.slice(1);
  if (!local) return "";
  return `+${dial}${local}`;
}

export function sortedDialCountries(lang: "ar" | "en") {
  const priority = new Set<string>(PRIORITY_DIAL_ISOS);
  const head = PRIORITY_DIAL_ISOS.map((iso) => findDialCountry(iso));
  const rest = DIAL_COUNTRIES.filter((c) => !priority.has(c.iso)).sort((a, b) =>
    (lang === "ar" ? a.nameAr : a.nameEn).localeCompare(lang === "ar" ? b.nameAr : b.nameEn, lang === "ar" ? "ar" : "en"),
  );
  // de-dupe head by iso in case of missing
  const seen = new Set<string>();
  const uniqueHead = head.filter((c) => {
    if (seen.has(c.iso)) return false;
    seen.add(c.iso);
    return true;
  });
  return [...uniqueHead, ...rest];
}
