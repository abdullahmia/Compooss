"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's moment: the Compooss leaf drawn in JSON characters, with tags
 * pointing at real things from the product. The leaf is rendered once into a
 * small offscreen canvas, sampled per cell, and drawn as glyphs whose
 * character and colour follow its light. A few cells change each tick so it
 * feels alive, the loop pauses off screen and never runs for reduced motion.
 */

// The leaf from the app icon, in its own 1024-unit space.
const LEAF_PATH =
  "M512 236C585 312 650 410 652 530 654 640 594 716 512 748 430 716 370 640 372 530 374 410 439 312 512 236Z";
const VEIN_PATH = "M512 378 521 700 503 700Z";

// Where the leaf sits in the square scene, in scene units (0 to 1).
const LEAF_CENTER = { x: 512, y: 516 };
const LEAF_SCALE = 0.86 / 560;
const ANGLE = (18 * Math.PI) / 180;
const SCENE_CENTER = { x: 0.56, y: 0.48 };

const CELL = 9;
/**
 * Characters by how much light a cell gets: punctuation in the shadows, JSON
 * brackets in the mid-tones and ObjectId hex digits where the leaf is lit.
 */
const GLYPH_SETS = [".:", ',:"', "{}[]", "0123456789abcdef"];

function glyphSet(b: number) {
  if (b < 0.38) return GLYPH_SETS[0];
  if (b < 0.52) return GLYPH_SETS[1];
  if (b < 0.68) return GLYPH_SETS[2];
  return GLYPH_SETS[3];
}
const FPS = 8;

/** Dark to light, the app's green in the middle. */
const RAMP: [number, [number, number, number]][] = [
  [0, [12, 42, 26]],
  [0.35, [19, 107, 58]],
  [0.6, [40, 175, 96]],
  [0.8, [111, 220, 155]],
  [1, [214, 248, 227]],
];

function project(x: number, y: number) {
  const dx = x - LEAF_CENTER.x;
  const dy = y - LEAF_CENTER.y;
  return {
    x: SCENE_CENTER.x + (dx * Math.cos(ANGLE) - dy * Math.sin(ANGLE)) * LEAF_SCALE,
    y: SCENE_CENTER.y + (dx * Math.sin(ANGLE) + dy * Math.cos(ANGLE)) * LEAF_SCALE,
  };
}

type Callout = {
  label: string;
  anchor: { x: number; y: number };
  tag: { x: number; y: number };
  /** Hidden on phones, where the scene is too narrow for every tag. */
  wide?: boolean;
};

const CALLOUTS: Callout[] = [
  { label: "ecommerce_dev.orders", anchor: project(520, 300), tag: { x: 0.34, y: 0.12 } },
  { label: '{ status: "shipped" }', anchor: project(392, 560), tag: { x: 0.17, y: 0.34 }, wide: true },
  { label: "127 documents", anchor: project(636, 540), tag: { x: 0.76, y: 0.74 } },
  { label: "localhost:6969", anchor: project(470, 700), tag: { x: 0.16, y: 0.66 }, wide: true },
];

function rampColor(b: number) {
  for (let i = 1; i < RAMP.length; i++) {
    const [stop, color] = RAMP[i];
    const [prevStop, prev] = RAMP[i - 1];
    if (b <= stop) {
      const t = (b - prevStop) / (stop - prevStop);
      const mix = prev.map((c, j) => Math.round(c + (color[j] - c) * t));
      return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
    }
  }
  const last = RAMP[RAMP.length - 1][1];
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

/** A stable pseudo-random value per cell, so the dust doesn't move on resize. */
function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Renders the shaded leaf on a small canvas and returns its brightness and coverage per cell. */
function sampleLeaf(columns: number, rows: number) {
  const supersample = 4;
  const width = columns * supersample;
  const height = rows * supersample;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  const unit = LEAF_SCALE * height;
  ctx.translate(SCENE_CENTER.x * width, SCENE_CENTER.y * height);
  ctx.rotate(ANGLE);
  ctx.scale(unit, unit);
  ctx.translate(-LEAF_CENTER.x, -LEAF_CENTER.y);

  const leaf = new Path2D(LEAF_PATH);

  // Light from the upper left of the leaf.
  const light = ctx.createLinearGradient(420, 280, 640, 760);
  light.addColorStop(0, "rgb(255,255,255)");
  light.addColorStop(1, "rgb(70,70,70)");
  ctx.fillStyle = light;
  ctx.fill(leaf);

  ctx.save();
  ctx.clip(leaf);

  // Darker towards the edges, so the leaf reads as having volume.
  ctx.filter = `blur(${Math.max(1, 0.03 * height)}px)`;
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 60;
  ctx.stroke(leaf);
  ctx.filter = "none";

  // A soft highlight on the upper half.
  const shine = ctx.createRadialGradient(470, 410, 0, 470, 410, 190);
  shine.addColorStop(0, "rgba(255,255,255,0.6)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.fill(leaf);

  // The midrib and side veins.
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fill(new Path2D(VEIN_PATH));
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  for (let y = 420; y <= 660; y += 48) {
    const halfWidth = 132 * Math.pow(Math.sin((Math.PI * (y - 296)) / 452), 0.8);
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(512, y);
      ctx.quadraticCurveTo(512 + side * halfWidth * 0.45, y - 30, 512 + side * halfWidth * 0.85, y - 70);
      ctx.stroke();
    }
  }
  ctx.restore();

  // The stem.
  ctx.fillStyle = "rgb(150,150,150)";
  ctx.beginPath();
  ctx.roundRect(502, 700, 20, 96, 5);
  ctx.fill();

  const pixels = ctx.getImageData(0, 0, width, height).data;
  const brightness = new Float32Array(columns * rows);
  const coverage = new Float32Array(columns * rows);
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      let lit = 0;
      let alpha = 0;
      for (let sy = 0; sy < supersample; sy++) {
        for (let sx = 0; sx < supersample; sx++) {
          const i = ((row * supersample + sy) * width + column * supersample + sx) * 4;
          lit += pixels[i] * pixels[i + 3];
          alpha += pixels[i + 3];
        }
      }
      const cell = row * columns + column;
      coverage[cell] = alpha / (255 * supersample * supersample);
      brightness[cell] = alpha > 0 ? lit / alpha / 255 : 0;
    }
  }
  return { brightness, coverage };
}

export function LeafScene({ className = "" }: { className?: string }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    if (!scene || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const family =
      getComputedStyle(document.documentElement).getPropertyValue("--font-plex-mono").trim() ||
      "monospace";
    let frame = 0;
    let visible = true;
    let cancelled = false;

    const draw = async () => {
      await document.fonts.load(`500 ${CELL}px ${family}`).catch(() => undefined);
      if (cancelled) return;

      // Cells stretch a little so the grid fills the scene exactly and the
      // tags, placed in percent, land on the right part of the leaf.
      const size = scene.clientWidth;
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const columns = Math.max(16, Math.round(size / CELL));
      const rows = columns;
      const cellSize = size / columns;
      canvas.width = Math.round(size * ratio);
      canvas.height = Math.round(size * ratio);

      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      // A touch larger than the cell, so the glyphs read as one surface.
      ctx.font = `500 ${cellSize * 1.15}px ${family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const { brightness, coverage } = sampleLeaf(columns, rows);
      const leafCells: { column: number; row: number; glyphs: string; color: string }[] = [];

      for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
          const cell = row * columns + column;
          const x = column * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;
          if (coverage[cell] > 0.35) {
            // Lift the shadows so the whole silhouette reads on the page.
            const b = 0.2 + 0.8 * brightness[cell];
            const glyphs = glyphSet(b);
            const color = rampColor(b);
            ctx.fillStyle = color;
            ctx.fillText(glyphs[Math.floor(hash(row, column) * glyphs.length)], x, y);
            leafCells.push({ column, row, glyphs, color });
          } else {
            // A thin dust of dots around the leaf, fading with distance.
            const dx = column / columns - SCENE_CENTER.x;
            const dy = row / rows - SCENE_CENTER.y;
            const nearness = Math.max(0, 1 - Math.hypot(dx, dy) / 0.62);
            const chance = nearness * nearness * 0.5;
            const roll = hash(column, row);
            if (roll < chance) {
              ctx.fillStyle = `rgba(83,198,131,${(0.08 + nearness * 0.22).toFixed(2)})`;
              ctx.fillText(roll < chance * 0.2 ? ":" : ".", x, y);
            }
          }
        }
      }
      canvas.style.opacity = "1";

      if (reducedMotion || leafCells.length === 0) return;
      const perTick = Math.max(4, Math.round(leafCells.length * 0.015));
      let last = 0;
      const loop = (now: number) => {
        frame = requestAnimationFrame(loop);
        if (!visible || document.hidden || now - last < 1000 / FPS) return;
        last = now;
        for (let i = 0; i < perTick; i++) {
          const cell = leafCells[Math.floor(Math.random() * leafCells.length)];
          const x = cell.column * cellSize;
          const y = cell.row * cellSize;
          ctx.clearRect(x, y, cellSize, cellSize);
          ctx.fillStyle = cell.color;
          const glyph = cell.glyphs[Math.floor(Math.random() * cell.glyphs.length)];
          ctx.fillText(glyph, x + cellSize / 2, y + cellSize / 2);
        }
      };
      frame = requestAnimationFrame(loop);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(scene);

    let width = scene.clientWidth;
    const resize = new ResizeObserver(() => {
      if (scene.clientWidth === width) return;
      width = scene.clientWidth;
      cancelAnimationFrame(frame);
      draw();
    });
    resize.observe(scene);

    draw();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <div ref={sceneRef} aria-hidden="true" className={`relative aspect-square ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 ease-out"
      />

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {CALLOUTS.map((callout) => (
          <line
            key={callout.label}
            x1={callout.anchor.x * 100}
            y1={callout.anchor.y * 100}
            x2={callout.tag.x * 100}
            y2={callout.tag.y * 100}
            stroke="var(--color-accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className={callout.wide ? "hidden sm:inline" : ""}
          />
        ))}
      </svg>

      {CALLOUTS.map((callout) => (
        <span
          key={`${callout.label}-anchor`}
          style={{ left: `${callout.anchor.x * 100}%`, top: `${callout.anchor.y * 100}%` }}
          className={`absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 border border-accent bg-deep ${callout.wide ? "hidden sm:block" : ""}`}
        />
      ))}

      {CALLOUTS.map((callout) => (
        <span
          key={`${callout.label}-tag`}
          style={{ left: `${callout.tag.x * 100}%`, top: `${callout.tag.y * 100}%` }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[4px] bg-accent px-2 py-1 font-mono text-xs font-medium text-deep ${callout.wide ? "hidden sm:block" : ""}`}
        >
          {callout.label}
        </span>
      ))}
    </div>
  );
}
