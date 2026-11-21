// main.js — the Neon Coast editor UI. Wires the controls to the cover engine
// (cover.js): photo upload per panel with crop and position, sample scenes,
// layouts, grades, caption editing, live preview and PNG export. Photos are
// read on the user's own machine and never uploaded anywhere.

import { LAYOUTS, GRADES, SIZES, blankState, blankPanel, drawCover, exportCover } from './cover.js';
import { shotParams, loadSample } from './shots.js';

const state = blankState();
const preview = document.getElementById('preview');
const pctx = preview.getContext('2d');
const statusEl = document.getElementById('status');
const panelList = document.getElementById('panels');
const SAMPLES = ['beach', 'street', 'drive'];

function setStatus(msg) {
  statusEl.textContent = msg;
}

// The preview canvas keeps the export aspect ratio; CSS scales it to fit.
function render() {
  const size = SIZES[state.size];
  preview.width = size.w;
  preview.height = size.h;
  drawCover(pctx, size.w, size.h, state);
}

function panelCount() {
  return LAYOUTS[state.layout].panels.length;
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('could not read that image'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('could not read that file'));
    reader.readAsDataURL(file);
  });
}

function buildPanelControls() {
  panelList.innerHTML = '';
  for (let i = 0; i < panelCount(); i += 1) {
    const panel = state.panels[i] || blankPanel();
    state.panels[i] = panel;
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <h3>Panel ${i + 1}</h3>
      <label>Photo <input type="file" accept="image/*" data-panel="${i}" data-kind="file"></label>
      <label>Or a sample scene
        <select data-panel="${i}" data-kind="sample">
          <option value="">— no photo yet —</option>
          ${SAMPLES.map((s) => `<option value="${s}"${panel.sample === s ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </label>
      <label>Zoom <input type="range" min="1" max="2.5" step="0.05" value="${panel.zoom}" data-panel="${i}" data-kind="zoom"></label>
      <label>Left / right <input type="range" min="-1" max="1" step="0.05" value="${panel.ox}" data-panel="${i}" data-kind="ox"></label>
      <label>Up / down <input type="range" min="-1" max="1" step="0.05" value="${panel.oy}" data-panel="${i}" data-kind="oy"></label>`;
    panelList.appendChild(card);
  }
  panelList.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const img = await readFileAsImage(file);
        const panel = state.panels[Number(input.dataset.panel)];
        panel.img = img;
        panel.sample = '';
        panel.zoom = 1;
        panel.ox = 0;
        panel.oy = 0;
        buildPanelControls();
        render();
        setStatus(`Panel ${Number(input.dataset.panel) + 1} loaded: ${file.name}`);
      } catch (err) {
        setStatus(err.message);
      }
    });
  });
  panelList.querySelectorAll('select[data-kind="sample"]').forEach((select) => {
    select.addEventListener('change', async () => {
      const idx = Number(select.dataset.panel);
      if (!select.value) {
        state.panels[idx].img = null;
        state.panels[idx].sample = '';
        render();
        return;
      }
      try {
        state.panels[idx].img = await loadSample(select.value);
        state.panels[idx].sample = select.value;
        state.panels[idx].zoom = 1;
        state.panels[idx].ox = 0;
        state.panels[idx].oy = 0;
        buildPanelControls();
        render();
        setStatus(`Panel ${idx + 1} filled with the ${select.value} scene.`);
      } catch (err) {
        setStatus(err.message);
      }
    });
  });
  panelList.querySelectorAll('input[type="range"]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const panel = state.panels[Number(slider.dataset.panel)];
      panel[slider.dataset.kind] = Number(slider.value);
      render();
    });
  });
}

function buildPickers() {
  const layoutBox = document.getElementById('layouts');
  layoutBox.innerHTML = '';
  Object.entries(LAYOUTS).forEach(([key, layout]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = layout.name;
    btn.dataset.layout = key;
    btn.className = state.layout === key ? 'picked' : '';
    btn.addEventListener('click', () => {
      state.layout = key;
      buildPickers();
      buildPanelControls();
      render();
    });
    layoutBox.appendChild(btn);
  });
  const gradeBox = document.getElementById('grades');
  gradeBox.innerHTML = '';
  Object.entries(GRADES).forEach(([key, grade]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = grade.name;
    btn.dataset.grade = key;
    btn.className = state.grade === key ? 'picked' : '';
    btn.addEventListener('click', () => {
      state.grade = key;
      buildPickers();
      render();
    });
    gradeBox.appendChild(btn);
  });
  const sizeBox = document.getElementById('sizes');
  sizeBox.innerHTML = '';
  Object.entries(SIZES).forEach(([key, size]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = size.label;
    btn.dataset.size = key;
    btn.className = state.size === key ? 'picked' : '';
    btn.addEventListener('click', () => {
      state.size = key;
      buildPickers();
      render();
    });
    sizeBox.appendChild(btn);
  });
}

function fillAllWithFirst() {
  const first = state.panels[0] && state.panels[0].img;
  if (!first) {
    setStatus('Load a photo into Panel 1 first, then fill the rest with it.');
    return;
  }
  for (let i = 1; i < panelCount(); i += 1) {
    state.panels[i].img = first;
    state.panels[i].sample = state.panels[0].sample;
    state.panels[i].zoom = 1;
    state.panels[i].ox = 0;
    state.panels[i].oy = 0;
  }
  buildPanelControls();
  render();
  setStatus('All panels now use the Panel 1 photo — each with its own crop.');
}

document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  render();
});
document.getElementById('sub').addEventListener('input', (e) => {
  state.sub = e.target.value;
  render();
});
document.getElementById('fillAll').addEventListener('click', fillAllWithFirst);
document.getElementById('export').addEventListener('click', async () => {
  setStatus('Exporting PNG…');
  const info = await exportCover(state);
  setStatus(`Exported ${info.name} — ${(info.bytes / 1024).toFixed(0)} KiB, ready to share.`);
  window.__neonExported = info;
});

// Apply a share / screenshot link, then optionally auto-export.
async function applyShot() {
  const p = shotParams();
  if (p.layout && LAYOUTS[p.layout]) state.layout = p.layout;
  if (p.grade && GRADES[p.grade]) state.grade = p.grade;
  if (p.size && SIZES[p.size]) state.size = p.size;
  if (p.caption) {
    state.caption = p.caption;
    document.getElementById('caption').value = p.caption;
  }
  if (p.sub) {
    state.sub = p.sub;
    document.getElementById('sub').value = p.sub;
  }
  if (p.photo) {
    try {
      const img = await loadSample(p.photo);
      for (let i = 0; i < panelCount(); i += 1) {
        state.panels[i].img = img;
        state.panels[i].sample = p.photo;
        state.panels[i].zoom = 1;
        state.panels[i].ox = 0;
        state.panels[i].oy = 0;
      }
    } catch (err) {
      setStatus(err.message);
    }
  }
  buildPickers();
  buildPanelControls();
  render();
  if (p.shot === 'export') {
    const info = await exportCover(state);
    window.__neonExported = info;
    document.title = `exported ${info.name}`;
  }
  if (p.shot) document.title = `Neon Coast — ${p.shot}`;
}

buildPickers();
buildPanelControls();
render();
applyShot();
