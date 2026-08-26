import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const WIDTHS = [480, 960, 1440];
const assetsDir = path.resolve("C:/Users/Eng Ahmed/.cursor/projects/d-boatpro-Boatbro/assets");
const outDir = path.resolve("public/media");

const sources = [
  { name: "service-guest-charter", file: "service-guest-charter-source.png" },
  { name: "service-guest-booking", file: "service-guest-booking-source.png" },
  { name: "service-guest-options", file: "service-guest-options-source.png" },
  { name: "service-owner-marketing", file: "service-owner-marketing-source.png" },
  { name: "service-owner-payments", file: "service-owner-payments-source.png" },
  { name: "service-owner-logistics", file: "service-owner-logistics-source.png" },
  { name: "service-owner-growth", file: "service-owner-growth-source.png" },
  { name: "service-marina-owners", file: "service-marina-owners-source.png" },
  { name: "service-marina-occupancy", file: "service-marina-occupancy-source.png" },
  { name: "service-marina-booking", file: "service-marina-booking-source.png" },
  { name: "service-marina-reach", file: "service-marina-reach-source.png" },
];

await mkdir(outDir, { recursive: true });

for (const { name, file } of sources) {
  const input = path.join(assetsDir, file);
  for (const width of WIDTHS) {
    const output = path.join(outDir, `${name}-${width}.webp`);
    await sharp(input)
      .resize(width, Math.round(width * (3 / 4)), { fit: "cover", position: "centre" })
      .webp({ quality: 82 })
      .toFile(output);
    console.log(`Wrote ${output}`);
  }
}
