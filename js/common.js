// Shared helpers: data loading, program storage, small UI bits.

let cache;
export async function loadData() {
  cache ??= fetch('data/exercises.json').then((r) => {
    if (!r.ok) throw new Error(`exercises.json: HTTP ${r.status}`);
    return r.json();
  });
  return cache;
}

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Thumbnail with a graceful fallback (a simple SVG) if the image is missing.
export const FALLBACK_THUMB =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f6e3da"/><circle cx="50" cy="30" r="9" fill="#c2502b"/><path d="M50 40v26M50 48l-16 10M50 48l16 10M50 66l-12 20M50 66l12 20" stroke="#c2502b" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`,
  );
export function thumbImg(ex, cls = 'thumb') {
  return `<img class="${cls}" src="${esc(ex.thumb)}" alt="${esc(ex.name)} — mid-movement pose" loading="lazy" width="512" height="512" onerror="this.onerror=null;this.src='${FALLBACK_THUMB}'">`;
}

/* ---------- Program (localStorage) ---------- */
const KEY = 'loopandlimb.program.v1';

export function getProgram() {
  try { return JSON.parse(localStorage.getItem(KEY)) ?? []; } catch { return []; }
}
export function setProgram(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  updateCount();
}
export function inProgram(id) { return getProgram().some((i) => i.id === id); }
export function toggleInProgram(ex) {
  const p = getProgram();
  const idx = p.findIndex((i) => i.id === ex.id);
  if (idx >= 0) p.splice(idx, 1);
  else p.push({ id: ex.id, sets: ex.dosage.sets, reps: ex.dosage.reps });
  setProgram(p);
  return idx < 0;
}

// Share format: ?p=glute_bridge.2x10,clamshell.3x12   (IDs + numbers only, no personal data)
export function encodeProgram(items) {
  return items.map((i) => `${i.id}.${i.sets}x${i.reps}`).join(',');
}
export function decodeProgram(str) {
  return (str || '').split(',').map((part) => {
    const m = /^([a-z0-9_-]+)\.(\d{1,2})x(\d{1,3})$/i.exec(part.trim());
    return m && { id: m[1], sets: +m[2], reps: +m[3] };
  }).filter(Boolean);
}

/* ---------- UI ---------- */
export function updateCount() {
  const el = document.querySelector('[data-program-count]');
  if (!el) return;
  const n = getProgram().length;
  el.textContent = n;
  el.hidden = n === 0;
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.setAttribute('role', 'status');
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 2200);
}

export function addButtonLabel(added) {
  return added ? '✓ In my program' : '+ Add to program';
}

updateCount();

if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
