export type LocalizedText = { ar: string; en: string };

export type ParagraphBlock = {
  id: string;
  type: "paragraph";
  text: LocalizedText;
};

export type HeadingBlock = {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: LocalizedText;
};

export type QuoteBlock = {
  id: string;
  type: "quote";
  text: LocalizedText;
};

export type ImageBlock = {
  id: string;
  type: "image";
  url: string;
  alt: LocalizedText;
  caption: LocalizedText;
  afterBlockId: string | "end";
};

export type PostBlock = ParagraphBlock | HeadingBlock | QuoteBlock | ImageBlock;

export type ContentLink = {
  id: string;
  kind: "external" | "internal";
  href: string;
  label: LocalizedText;
  paragraphId: string;
  targetBlockId?: string;
};

export type LocalizedFaq = {
  question: LocalizedText;
  answer: LocalizedText;
};

export function emptyLocalized(): LocalizedText {
  return { ar: "", en: "" };
}

export function pickLocalized(value: LocalizedText | undefined, lang: "ar" | "en", fallback = "") {
  if (!value) return fallback;
  return (lang === "en" ? value.en : value.ar).trim() || value.ar.trim() || value.en.trim() || fallback;
}

export function parseTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function tagsToString(tags: string[]) {
  return tags.join(", ");
}

export function newBlockId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}`;
}

export function newLinkId() {
  return `lnk_${Math.random().toString(36).slice(2, 10)}`;
}

export function createParagraph(): ParagraphBlock {
  return { id: newBlockId(), type: "paragraph", text: emptyLocalized() };
}

export function createHeading(level: 2 | 3 = 2): HeadingBlock {
  return { id: newBlockId(), type: "heading", level, text: emptyLocalized() };
}

export function createQuote(): QuoteBlock {
  return { id: newBlockId(), type: "quote", text: emptyLocalized() };
}

export function createImage(afterBlockId: string | "end" = "end"): ImageBlock {
  return {
    id: newBlockId(),
    type: "image",
    url: "",
    alt: emptyLocalized(),
    caption: emptyLocalized(),
    afterBlockId,
  };
}

export function blocksPlainText(blocks: PostBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "image") return block.alt.ar + " " + block.alt.en;
      return `${block.text.ar} ${block.text.en}`;
    })
    .join(" ");
}

export function orderedBlocksWithImages(blocks: PostBlock[]) {
  const paragraphs = blocks.filter((b) => b.type !== "image") as Exclude<PostBlock, ImageBlock>[];
  const images = blocks.filter((b) => b.type === "image") as ImageBlock[];
  const result: PostBlock[] = [];

  for (const block of paragraphs) {
    result.push(block);
    for (const image of images.filter((img) => img.afterBlockId === block.id)) {
      result.push(image);
    }
  }
  for (const image of images.filter((img) => img.afterBlockId === "end")) {
    result.push(image);
  }
  return result;
}

export function migrateLegacyBody(body: string): PostBlock[] {
  const trimmed = body.trim();
  if (!trimmed) return [createParagraph()];
  return [{ id: newBlockId(), type: "paragraph", text: { ar: trimmed, en: trimmed } }];
}

export function applyLinkToText(text: string, label: string, href: string, external: boolean) {
  if (!label.trim() || !text.includes(label)) return text;
  const token = `[[LINK:${href}:${external ? "1" : "0"}:${label}]]`;
  return text.replace(label, token);
}

export type ParsedToken =
  | { kind: "text"; value: string }
  | { kind: "link"; href: string; label: string; external: boolean };

const LINK_RE = /\[\[LINK:([^:\]]+):([01]):([^\]]+)\]\]/g;

export function parseLinkedText(text: string): ParsedToken[] {
  const parts: ParsedToken[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_RE)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ kind: "text", value: text.slice(last, index) });
    parts.push({
      kind: "link",
      href: match[1] ?? "",
      external: match[2] === "1",
      label: match[3] ?? "",
    });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts.length ? parts : [{ kind: "text", value: text }];
}

export function insertExternalLinkInParagraph(
  paragraph: ParagraphBlock,
  lang: "ar" | "en",
  label: LocalizedText,
  url: string,
) {
  const pick = lang === "en" ? label.en.trim() || label.ar.trim() : label.ar.trim() || label.en.trim();
  if (!pick) return paragraph;
  const next = { ...paragraph, text: { ...paragraph.text } };
  for (const key of ["ar", "en"] as const) {
    const source = label[key].trim();
    if (source && next.text[key].includes(source)) {
      next.text[key] = applyLinkToText(next.text[key], source, url, true);
    }
  }
  return next;
}

export function insertInternalLinkInParagraph(
  paragraph: ParagraphBlock,
  label: LocalizedText,
  targetBlockId: string,
) {
  const href = `#${targetBlockId}`;
  const next = { ...paragraph, text: { ...paragraph.text } };
  for (const key of ["ar", "en"] as const) {
    const source = label[key].trim();
    if (source && next.text[key].includes(source)) {
      next.text[key] = applyLinkToText(next.text[key], source, href, false);
    }
  }
  return next;
}
