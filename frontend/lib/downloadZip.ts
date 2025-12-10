// downloadZip.ts – Instagram processing (blurred padding only)
import JSZip from "jszip";
import { saveAs } from "file-saver";

const RATIOS: Record<string, number> = {
  "1-1": 1 / 1,
  "4-5": 4 / 5,
  "3-4": 3 / 4,
  "9-16": 9 / 16,
};

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

async function loadImageBlob(url: string): Promise<Blob> {
  const r = await fetch(url);
  return await r.blob();
}

async function processBlur(imageBlob: Blob, ratio: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const iw = img.width;
      const ih = img.height;

      const inputAspect = iw / ih;
      const outputAspect = ratio;

      let outW: number;
      let outH: number;

      if (inputAspect > outputAspect) {
        outW = iw;
        outH = Math.round(iw / outputAspect);
      } else {
        outH = ih;
        outW = Math.round(ih * outputAspect);
      }

      const canvas = createCanvas(outW, outH);
      const ctx = canvas.getContext("2d")!;

      // blurred background
      ctx.filter = "blur(80px)";
      ctx.drawImage(img, 0, 0, outW, outH);

      // foreground (original size)
      ctx.filter = "none";
      const offsetX = (outW - iw) / 2;
      const offsetY = (outH - ih) / 2;
      ctx.drawImage(img, offsetX, offsetY, iw, ih);

      canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.9);
    };

    img.src = URL.createObjectURL(imageBlob);
  });
}

export async function downloadZip(
  images: string[],
  mode: "selected" | "all" | "instagram" = "selected"
): Promise<void> {
  if (!images.length) return;

  const zip = new JSZip();
  const originalFolder = zip.folder("original")!;
  const processedFolder = zip.folder("processed/blurred")!;

  for (const url of images) {
    const blob = await loadImageBlob(url);
    const fileName = url.split("/").pop() || `img-${Date.now()}.jpg`;

    // original
    originalFolder.file(fileName, blob);

    // processed versions
    for (const label of Object.keys(RATIOS)) {
      const outBlob = await processBlur(blob, RATIOS[label]);
      processedFolder
        .folder(label)!
        .file(fileName.replace(/\.\w+$/, ".jpg"), outBlob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `instagram-${mode}-${Date.now()}.zip`);
}
