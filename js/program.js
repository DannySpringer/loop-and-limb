import { loadData, esc, thumbImg, getProgram, setProgram, encodeProgram, decodeProgram, toast } from './common.js';

const { exercises } = await loadData();
const byId = Object.fromEntries(exercises.map((e) => [e.id, e]));
const listEl = document.getElementById('program');
const bannerEl = document.getElementById('shared-banner');
const emptyEl = document.getElementById('empty');
const toolbar = document.getElementById('toolbar');

// A shared link (?p=...) is shown read-only until the user chooses to save it.
const shared = decodeProgram(new URLSearchParams(location.search).get('p')).filter((i) => byId[i.id]);
let viewingShared = shared.length > 0;

function items() { return viewingShared ? shared : getProgram().filter((i) => byId[i.id]); }

function render() {
  const list = items();
  bannerEl.hidden = !viewingShared;
  emptyEl.hidden = list.length > 0;
  toolbar.hidden = list.length === 0;

  listEl.innerHTML = list.map((it, idx) => {
    const ex = byId[it.id];
    return `
    <li class="program-item">
      ${thumbImg(ex, '')}
      <div>
        <h3><a href="exercise.html?id=${encodeURIComponent(ex.id)}">${idx + 1}. ${esc(ex.name)}</a></h3>
        <div class="print-only">
          <strong>${it.sets} sets × ${it.reps} reps</strong> · hold ${esc(ex.dosage.hold)} · ${esc(ex.dosage.frequency)}
          <ol>${ex.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        </div>
        <div class="row">
          <label>Sets <input type="number" min="1" max="20" value="${it.sets}" data-field="sets" data-idx="${idx}" ${viewingShared ? 'disabled' : ''}></label>
          <label>Reps <input type="number" min="1" max="100" value="${it.reps}" data-field="reps" data-idx="${idx}" ${viewingShared ? 'disabled' : ''}></label>
          ${viewingShared ? '' : `
          <button class="btn" type="button" data-move="-1" data-idx="${idx}" aria-label="Move ${esc(ex.name)} up" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn" type="button" data-move="1" data-idx="${idx}" aria-label="Move ${esc(ex.name)} down" ${idx === list.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn" type="button" data-remove="${idx}" aria-label="Remove ${esc(ex.name)}">Remove</button>`}
        </div>
      </div>
    </li>`;
  }).join('');
}

listEl.addEventListener('change', (e) => {
  const input = e.target.closest('[data-field]');
  if (!input) return;
  const p = getProgram();
  const n = Math.max(1, Math.min(+input.max, Math.round(+input.value) || 1));
  p[+input.dataset.idx][input.dataset.field] = n;
  setProgram(p);
  render();
});

listEl.addEventListener('click', (e) => {
  const p = getProgram();
  const mv = e.target.closest('[data-move]');
  const rm = e.target.closest('[data-remove]');
  if (mv) {
    const i = +mv.dataset.idx, j = i + +mv.dataset.move;
    [p[i], p[j]] = [p[j], p[i]];
  } else if (rm) p.splice(+rm.dataset.remove, 1);
  else return;
  setProgram(p);
  render();
});

document.getElementById('save-shared').addEventListener('click', () => {
  setProgram(shared.map((i) => ({ ...i })));
  viewingShared = false;
  history.replaceState(null, '', 'program.html');
  toast('Saved as your program');
  render();
});

document.getElementById('share').addEventListener('click', async () => {
  const url = new URL('program.html', location.href);
  url.searchParams.set('p', encodeProgram(items()));
  try {
    if (navigator.share) await navigator.share({ title: 'My exercise program', url: url.href });
    else { await navigator.clipboard.writeText(url.href); toast('Link copied'); }
  } catch { /* user cancelled */ }
});

document.getElementById('print').addEventListener('click', () => print());
render();
