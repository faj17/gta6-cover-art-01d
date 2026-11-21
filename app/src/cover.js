// cover.js — the Neon Coast cover engine. Pure canvas drawing, no network.
// A cover is a set of photo panels in a comic-poster layout, a Vice City
// sunset / neon colour grade over each panel, and bold caption lettering on a
// band across the bottom. Everything here is original art: no Rockstar logo,
// artwork or font — lettering is system heavy fonts drawn on canvas.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080 (square post)' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350 (portrait post)' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080 (wide post)' },
};

// Panel rectangles are fractions of the cover (x, y, w, h). The caption band
// is drawn over the bottom of the panels, GTA-poster style.
export const LAYOUTS = {
  hero: {
    name: 'Hero Split',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
  },
  grid: {
    name: 'Comic Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  strip: {
    name: 'Neon Strip',
    panels: [
      { x: 0, y: 0, w: 0.34, h: 1 },
      { x: 0.34, y: 0, w: 0.33, h: 1 },
      { x: 0.67, y: 0, w: 0.33, h: 1 },
    ],
  },
};

export const GRADES = {
  sunset: { name: 'Vice Sunset', top: '#ff9a3c', mid: '#ff2e63', bot: '#7b2ff7' },
  neon: { name: 'Neon Nights', top: '#00e5ff', mid: '#ff2e88', bot: '#2b0a4a' },
  vice: { name: 'Vice Teal', top: '#ffd166', mid: '#ef476f', bot: '#118ab2' },
};

// One panel's state: an image (or null for a painted placeholder), a zoom and
// a crop offset, and the name of the sample scene it shows, if any — the
// editor's sample dropdown reads this so it never disagrees with the canvas.
export function blankPanel() {
  return { img: null, zoom: 1, ox: 0, oy: 0, sample: '' };
}

export function blankState() {
  return {
    layout: 'hero',
    grade: 'sunset',
    size: 'square',
    caption: 'NEON COAST',
    sub: 'VICE CITY • AFTER DARK',
    panels: [blankPanel(), blankPanel(), blankPanel(), blankPanel()],
  };
}

export function panelsFor(state) {
  return LAYOUTS[state.layout].panels;
}

// Cover-fit draw of one photo inside a panel rect, with zoom and crop offset.
// A panel the user has not cropped yet (zoom 1, offsets 0) gets a seeded
// default crop — a slightly tighter zoom and a different shift per panel —
// so one photo filling several panels does not show the same crop four times.
function drawPhoto(ctx, img, rect, panel, seed) {
  let zoom = panel.zoom;
  let ox = panel.ox;
  let oy = panel.oy;
  if (zoom === 1 && ox === 0 && oy === 0) {
    zoom = 1.22;
    ox = ((seed * 37) % 10) / 10 - 0.5;
    oy = ((seed * 53) % 10) / 10 - 0.5;
  }
  const scale = Math.max(rect.w / img.width, rect.h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const overflowX = Math.max(0, dw - rect.w);
  const overflowY = Math.max(0, dh - rect.h);
  const dx = rect.x + (rect.w - dw) / 2 + ox * overflowX * 0.5;
  const dy = rect.y + (rect.h - dh) / 2 + oy * overflowY * 0.5;
  ctx.drawImage(img, dx, dy, dw, dh);
}

// Painted placeholder when a panel has no photo yet: a sunset gradient with
// a sun disc, skyline blocks and a horizon glow — original art, drawn fresh.
function drawPlaceholder(ctx, rect, grade, seed) {
  const g = GRADES[grade];
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, g.top);
  grad.addColorStop(0.55, g.mid);
  grad.addColorStop(1, g.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  // Sun disc, placed differently per panel so placeholders do not repeat.
  const sx = rect.x + rect.w * (0.3 + 0.4 * ((seed * 37) % 10) / 10);
  const sy = rect.y + rect.h * 0.34;
  const sr = Math.min(rect.w, rect.h) * 0.2;
  const glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 2.2);
  glow.addColorStop(0, 'rgba(255,240,180,0.95)');
  glow.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  // Skyline blocks along the bottom of the panel.
  ctx.fillStyle = 'rgba(20,8,40,0.85)';
  let bx = rect.x;
  let i = 0;
  while (bx < rect.x + rect.w) {
    const bw = rect.w * (0.14 + 0.07 * (((seed + i) * 53) % 5) / 4);
    const bh = rect.h * (0.16 + 0.14 * (((seed + i * 3) * 29) % 5) / 4);
    ctx.fillRect(bx, rect.y + rect.h - bh, bw, bh);
    bx += bw + rect.w * 0.02;
    i += 1;
  }
}

// The colour grade: a warm-to-violet wash, a vignette and a halftone dot row
// along the panel's top edge — the sunset / neon look of the posters.
function drawGrade(ctx, rect, grade) {
  const g = GRADES[grade];
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, g.top);
  wash.addColorStop(0.5, g.mid);
  wash.addColorStop(1, g.bot);
  ctx.globalAlpha = 0.38;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.save();
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,30,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  // Halftone dots: a comic-print row fading down from the top edge.
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  const step = Math.max(14, rect.w / 42);
  for (let y = rect.y + step * 0.5; y < rect.y + rect.h * 0.16; y += step) {
    const fade = 1 - (y - rect.y) / (rect.h * 0.16);
    for (let x = rect.x + step * 0.5; x < rect.x + rect.w; x += step) {
      ctx.globalAlpha = 0.2 * fade;
      ctx.beginPath();
      ctx.arc(x, y, step * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawPanel(ctx, rect, panel, grade, seed, gutter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (panel.img) drawPhoto(ctx, panel.img, rect, panel, seed);
  else drawPlaceholder(ctx, rect, grade, seed);
  drawGrade(ctx, rect, grade);
  ctx.restore();
  // Comic gutter: a dark frame line around the panel.
  ctx.strokeStyle = '#0d0518';
  ctx.lineWidth = gutter;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

// Bold caption lettering: heavy italic system font, dark outline, a sunset
// gradient fill and a hard offset shadow — poster lettering, no font file.
function drawCaption(ctx, W, H, state) {
  const bandH = H * 0.19;
  const bandY = H - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, H);
  band.addColorStop(0, 'rgba(13,5,24,0)');
  band.addColorStop(0.35, 'rgba(13,5,24,0.88)');
  band.addColorStop(1, 'rgba(13,5,24,0.96)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);
  // Thin neon rule above the caption.
  const g = GRADES[state.grade];
  ctx.fillStyle = g.mid;
  ctx.fillRect(0, bandY, W, Math.max(3, H * 0.006));
  ctx.fillStyle = g.top;
  ctx.fillRect(0, bandY + Math.max(3, H * 0.006), W, Math.max(2, H * 0.003));

  const caption = (state.caption || 'NEON COAST').toUpperCase();
  let size = H * 0.105;
  const font = (s) => `italic 900 ${s}px "Arial Black", "Helvetica Neue", Impact, sans-serif`;
  ctx.font = font(size);
  while (ctx.measureText(caption).width > W * 0.92 && size > H * 0.03) {
    size *= 0.94;
    ctx.font = font(size);
  }
  const cx = W / 2;
  const cy = bandY + bandH * 0.62;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  // Hard offset shadow, then dark outline, then gradient fill.
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(caption, cx + size * 0.06, cy + size * 0.07);
  ctx.strokeStyle = '#12041f';
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(caption, cx, cy);
  const fill = ctx.createLinearGradient(0, cy - size * 0.55, 0, cy + size * 0.55);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.45, g.top);
  fill.addColorStop(1, g.mid);
  ctx.fillStyle = fill;
  ctx.fillText(caption, cx, cy);

  const sub = (state.sub || '').toUpperCase();
  if (sub) {
    const subSize = Math.max(12, H * 0.028);
    ctx.font = `700 ${subSize}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.92;
    ctx.letterSpacing = `${subSize * 0.35}px`;
    ctx.fillText(sub, cx, bandY + bandH * 0.9);
    ctx.letterSpacing = '0px';
    ctx.globalAlpha = 1;
  }
}

// Top-left series tag, drawn on the cover itself.
function drawTag(ctx, W, H, state) {
  const tag = 'NEON COAST • ORIGINAL POSTER';
  const size = Math.max(11, H * 0.02);
  ctx.font = `800 ${size}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const pad = size * 0.9;
  const tw = ctx.measureText(tag).width + pad * 2;
  const th = size * 2.1;
  ctx.fillStyle = 'rgba(13,5,24,0.82)';
  ctx.fillRect(W * 0.03, H * 0.03, tw, th);
  ctx.fillStyle = GRADES[state.grade].top;
  ctx.fillRect(W * 0.03, H * 0.03, Math.max(3, size * 0.28), th);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(tag, W * 0.03 + pad, H * 0.03 + th / 2 + size * 0.05);
}

// Render a full cover onto ctx at W x H from a state object.
export function drawCover(ctx, W, H, state) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, 0, W, H);
  const rects = panelsFor(state);
  const gutter = Math.max(4, W * 0.006);
  rects.forEach((r, i) => {
    const rect = {
      x: r.x * W + (r.x > 0 ? gutter / 2 : 0),
      y: r.y * H + (r.y > 0 ? gutter / 2 : 0),
      w: r.w * W - (r.x > 0 ? gutter / 2 : 0) - (r.x + r.w < 1 ? gutter / 2 : 0),
      h: r.h * H - (r.y > 0 ? gutter / 2 : 0) - (r.y + r.h < 1 ? gutter / 2 : 0),
    };
    drawPanel(ctx, rect, state.panels[i] || blankPanel(), state.grade, i + 1, gutter);
  });
  drawCaption(ctx, W, H, state);
  drawTag(ctx, W, H, state);
}

// Render the state's current export size onto a fresh canvas and return it.
export function renderCover(state) {
  const size = SIZES[state.size] || SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), size.w, size.h, state);
  return canvas;
}

// Download the rendered cover as a PNG file.
export function exportCover(state) {
  const canvas = renderCover(state);
  const size = SIZES[state.size] || SIZES.square;
  const name = `neon-coast-${size.w}x${size.h}.png`;
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve({ name, bytes: blob ? blob.size : 0, w: size.w, h: size.h });
    }, 'image/png');
  });
}
