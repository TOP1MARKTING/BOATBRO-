export type ImageCompressProfile = "gallery" | "post" | "license" | "licenseIcon";

const PROFILES: Record<ImageCompressProfile, { maxWidth: number; maxHeight: number; maxBytes: number }> = {
  gallery: { maxWidth: 1920, maxHeight: 1920, maxBytes: 700_000 },
  post: { maxWidth: 1400, maxHeight: 1400, maxBytes: 200_000 },
  license: { maxWidth: 1400, maxHeight: 1400, maxBytes: 450_000 },
  licenseIcon: { maxWidth: 256, maxHeight: 256, maxBytes: 80_000 },
};

const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid-image"));
    };
    img.src = url;
  });
}

function fitDimensions(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function dataUrlByteLength(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("encode-failed"))),
      mimeType,
      quality,
    );
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(blob);
  });
}

export async function compressImageFile(file: File, profile: ImageCompressProfile = "gallery") {
  if (typeof window === "undefined") {
    throw new Error("client-only");
  }
  const inputType = ACCEPTED_TYPES.has(file.type) ? file.type : "image/jpeg";
  const outputType = inputType === "image/png" ? "image/png" : "image/jpeg";
  const { maxWidth, maxHeight, maxBytes } = PROFILES[profile];

  const img = await loadImageFromFile(file);
  const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  let quality = outputType === "image/png" ? 1 : 0.88;
  let dataUrl = await blobToDataUrl(await canvasToBlob(canvas, outputType, quality));

  while (dataUrlByteLength(dataUrl) > maxBytes && quality > 0.45) {
    quality -= 0.08;
    dataUrl = await blobToDataUrl(await canvasToBlob(canvas, outputType, quality));
  }

  if (dataUrlByteLength(dataUrl) > maxBytes && outputType !== "image/jpeg") {
    quality = 0.82;
    dataUrl = await blobToDataUrl(await canvasToBlob(canvas, "image/jpeg", quality));
    while (dataUrlByteLength(dataUrl) > maxBytes && quality > 0.45) {
      quality -= 0.08;
      dataUrl = await blobToDataUrl(await canvasToBlob(canvas, "image/jpeg", quality));
    }
  }

  if (dataUrlByteLength(dataUrl) > maxBytes) {
    throw new Error("file-too-large");
  }

  return {
    dataUrl,
    mimeType: dataUrl.startsWith("data:image/png") ? "image/png" : "image/jpeg",
    byteLength: dataUrlByteLength(dataUrl),
  };
}
