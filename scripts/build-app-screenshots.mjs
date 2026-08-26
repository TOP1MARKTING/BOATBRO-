import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const WIDTHS = [360, 480, 720];
const source = path.resolve("public/media/Boatpro icons 2.png");
const outDir = path.resolve("public/media");

/** Crop regions tuned to the long BoatPro app screenshot (720×6228). */
const crops = [
  { name: "app-home", top: 0, height: 820 },
  { name: "app-featured", top: 820, height: 760 },
  { name: "app-categories", top: 1580, height: 880 },
  { name: "app-vessels", top: 2460, height: 440 },
  { name: "app-explore", top: 2900, height: 850 },
];

/** End after agencies — before “Recommended for you”. */
const SCROLL_HEIGHT = 3750;

await mkdir(outDir, { recursive: true });

for (const width of WIDTHS) {
  const output = path.join(outDir, `app-scroll-${width}.webp`);
  await sharp(source)
    .extract({ left: 0, top: 0, width: 720, height: SCROLL_HEIGHT })
    .resize(width, Math.round(SCROLL_HEIGHT * (width / 720)), { fit: "fill" })
    .webp({ quality: 85 })
    .toFile(output);
  console.log(`Wrote ${output}`);
}

for (const { name, top, height } of crops) {
  for (const width of WIDTHS) {
    const output = path.join(outDir, `${name}-${width}.webp`);
    await sharp(source)
      .extract({ left: 0, top, width: 720, height })
      .resize(width, Math.round(height * (width / 720)), { fit: "fill" })
      .webp({ quality: 85 })
      .toFile(output);
    console.log(`Wrote ${output}`);
  }
}
