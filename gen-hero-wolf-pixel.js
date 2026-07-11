import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CELL = 8;
const GRID_COLS = 32;
const GRID_ROWS = 32;

const SOURCE = path.resolve(
  __dirname,
  "../.cursor/projects/c-Users-macie-product-design-portfolio/assets/c__Users_macie_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_image-bfa359f4-2a6a-4309-9eff-b3495d69911b.png"
);

function isBackground(r, g, b) {
  return r > 238 && g > 238 && b > 238;
}

function opacityForPixel(r, g, b) {
  if (isBackground(r, g, b)) return null;

  const lum = 0.299 * r + 0.587 * g + 0.114 * b;

  if (lum <= 45) return 0.17;
  if (lum <= 95) return 0.13;
  if (lum <= 145) return 0.095;
  if (lum <= 195) return 0.075;
  return 0.16;
}

function shouldDropBottomRow(pixels, maxRow) {
  const bottom = pixels.filter((pixel) => pixel.row === maxRow);
  const span = Math.max(...bottom.map((p) => p.col)) - Math.min(...bottom.map((p) => p.col)) + 1;
  return bottom.length >= 20 || span >= 24;
}

async function main() {
  const { createCanvas, loadImage } = await import("canvas");
  const image = await loadImage(SOURCE);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, image.width, image.height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (!isBackground(data[i], data[i + 1], data[i + 2])) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const pixels = [];

  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let col = 0; col < GRID_COLS; col += 1) {
      const x = minX + Math.floor(((col + 0.5) / GRID_COLS) * (maxX - minX + 1));
      const y = minY + Math.floor(((row + 0.5) / GRID_ROWS) * (maxY - minY + 1));
      const i = (y * width + x) * 4;
      const opacity = opacityForPixel(data[i], data[i + 1], data[i + 2]);
      if (!opacity) continue;
      pixels.push({ col, row, opacity });
    }
  }

  if (!pixels.length) {
    throw new Error("No wolf pixels generated");
  }

  const minCol = Math.min(...pixels.map((p) => p.col));
  const maxCol = Math.max(...pixels.map((p) => p.col));
  let minRow = Math.min(...pixels.map((p) => p.row));
  let maxRow = Math.max(...pixels.map((p) => p.row));

  if (shouldDropBottomRow(pixels, maxRow)) {
    maxRow -= 1;
  }

  const trimmed = pixels.filter(
    (pixel) =>
      pixel.row >= minRow &&
      pixel.row <= maxRow &&
      pixel.col >= minCol &&
      pixel.col <= maxCol
  );

  const rects = trimmed.map(
    (p) =>
      `<rect x="${(p.col - minCol) * CELL}" y="${(p.row - minRow) * CELL}" width="${CELL}" height="${CELL}" fill="rgba(190,190,190,${p.opacity.toFixed(3)})"/>`
  );

  const outWidth = (maxCol - minCol + 1) * CELL;
  const outHeight = (maxRow - minRow + 1) * CELL;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="0 0 ${outWidth} ${outHeight}">` +
    rects.join("") +
    "</svg>";

  fs.writeFileSync(path.join(__dirname, "hero-wolf-pixel.svg"), svg);
  console.log(
    `Wrote ${rects.length} pixels (${outWidth}x${outHeight}) to hero-wolf-pixel.svg`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
