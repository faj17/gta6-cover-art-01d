# Neon Coast — GTA-style multi-panel cover maker

[![make.fun](https://img.shields.io/badge/make.fun-gta6--cover--art--01-ff2e88)](https://make.fun/c/gta6-cover-art-01)
[![Neon Coast on GitHub](https://img.shields.io/badge/github-faj17%2Fgta6--cover--art--01d-00d4ff)](https://github.com/faj17/gta6-cover-art-01d)
[![Live app](https://img.shields.io/badge/live-neon--coast-7b2fff)](https://make.fun/c/gta6-cover-art-01)

Neon Coast turns your photo into a GTA-style multi-panel cover poster: pick a
layout (Hero Split, Comic Grid or Neon Strip), fill several panels with one
photo or several, crop and position each one, write a bold caption, choose a
Vice City sunset or neon colour grade, and export a PNG in the post sizes
1080 × 1080, 1080 × 1350 or 1920 × 1080. Photos are read on your own machine
and never uploaded. All art is original — no Rockstar Games logo, artwork or
font; the lettering is drawn with system fonts on canvas.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `app/index.html` is plain static files that work
offline in desktop Chrome. Or open `app/index.html` from any static server.

1. Pick a layout.
2. Upload a photo per panel (or try a sample scene), then zoom and drag each
   crop into place — or fill every panel with the Panel 1 photo.
3. Write your caption and sub-caption.
4. Pick a colour grade and an export size, then Export PNG.

Share links work too: `?shot=editor&photo=beach&caption=Boulevard%20Queen`
opens the editor with a sample loaded, and `?shot=export` renders and
downloads the PNG as well.

## Hand it in

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes
`dossier.json` with the vendored make.fun library.

---

Built for [make.fun](https://make.fun/c/gta6-cover-art-01) — try Neon Coast
with my referral code `tzsn25v9`: https://make.fun/?ref=tzsn25v9
