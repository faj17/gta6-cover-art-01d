// shots.js — screenshot / share-link support for Neon Coast.
// A link like ?shot=editor&photo=beach&caption=Boulevard%20Queen&layout=grid
// opens the app with a sample photo loaded and the caption set, so a cover can
// be reproduced from a URL alone. ?shot=export renders and downloads the PNG
// as well, which is how the exported-cover screenshots were taken.

export function shotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || '',
    photo: q.get('photo') || '',
    caption: q.get('caption') || '',
    sub: q.get('sub') || '',
    layout: q.get('layout') || '',
    grade: q.get('grade') || '',
    size: q.get('size') || '',
  };
}

// Load one of the app's own sample scenes (original art, under app/samples/).
export function loadSample(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`sample not found: ${name}`));
    img.src = `./samples/${name}.jpg`;
  });
}
