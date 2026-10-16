import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const WIDTHS = [480, 960, 1440];
const assetsDir = path.resolve("C:/Users/Eng Ahmed/.cursor/projects/d-boatpro-Boatbro/assets");
const outDir = path.resolve("public/media");

const sources = [
  { name: "hero-about", file: "hero-about-source.png" },
  { name: "hero-contact", file: "hero-contact-source.png" },
  { name: "hero-blog", file: "hero-blog-source.png" },
  { name: "hero-features", file: "hero-features-source.png" },
] ;

await mkdir(outDir, { recursive: true });

for (const { name, file } of sources) {
  const input = path.join(assetsDir, file);
  for (const width of WIDTHS) {
    const output = path.join(outDir, `${name}-${width}.webp`);
    await sharp(input)
      .resize(width, Math.round(width * (9 / 16)), { fit: "cover", position: "left" })
      .webp({ quality: 82 })
      .toFile(output);
    console.log(`Wrote ${output}`);
  }
}
