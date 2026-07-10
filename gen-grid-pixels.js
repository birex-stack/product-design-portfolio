import fs from "fs";

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSvg(color, seed, cols, rows, count, opacities) {
  const rand = mulberry32(seed);
  const used = new Set();
  const rects = [];

  while (rects.length < count) {
    const col = Math.floor(rand() * cols);
    const row = Math.floor(rand() * rows);
    const key = `${col},${row}`;
    if (used.has(key)) continue;
    used.add(key);

    const opacity = opacities[Math.floor(rand() * opacities.length)];
    rects.push(
      `<rect x="${col * 8}" y="${row * 8}" width="8" height="8" fill="rgba(${color},${opacity.toFixed(3)})"/>`
    );
  }

  const size = cols * 8;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    rects.join("") +
    "</svg>";

  return svg;
}

const light = makeSvg(
  "22,22,22",
  41,
  64,
  64,
  480,
  [0.018, 0.024, 0.031, 0.038, 0.045, 0.052, 0.059, 0.066, 0.074, 0.082, 0.09, 0.098, 0.106]
);

const dark = makeSvg(
  "255,255,255",
  89,
  64,
  64,
  480,
  [0.045, 0.058, 0.072, 0.086, 0.1, 0.115, 0.13, 0.145, 0.16, 0.175, 0.19, 0.205, 0.22]
);

fs.writeFileSync("grid-pixel-fill-light.svg", light);
fs.writeFileSync("grid-pixel-fill-dark.svg", dark);
