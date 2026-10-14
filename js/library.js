import { loadData, esc, thumbImg, inProgram, toggleInProgram, addButtonLabel, toast } from './common.js';

const REGIONS = ['knee', 'hip', 'shoulder', 'back', 'ankle', 'neck'];
const POSITIONS = ['standing', 'sitting', 'kneeling', 'lying'];

const form = document.getElementById('filters');
const grid = document.getElementById('grid');
const status = document.getElementById('result-status');

const chips = (name, values, type) =>
  values.map((v) => `<label class="chip"><input type="${type}" name="${name}" value="${v}"><span>${v}</span></label>`).join('');
form.querySelector('[data-regions]').insertAdjacentHTML('beforeend', chips('region', REGIONS, 'checkbox'));
form.querySelector('[data-positions]').insertAdjacentHTML(
  'beforeend',
  `<label class="chip"><input type="radio" name="position" value="" checked><span>Any</span></label>` + chips('position', POSITIONS, 'radio'),
);

const { exercises } = await loadData();

function render() {
  const fd = new FormData(form);
  const q = (fd.get('q') || '').toString().trim().toLowerCase();
  const regions = fd.getAll('region');
  const position = fd.get('position');

  const list = exercises.filter((ex) =>
    (!q || `${ex.name} ${ex.summary} ${ex.regions.join(' ')}`.toLowerCase().includes(q)) &&
    (!regions.length || regions.some((r) => ex.regions.includes(r))) &&
    (!position || ex.position === position),
  );

  grid.innerHTML = list.map((ex) => `
    <li class="card">
      ${thumbImg(ex)}
      <div class="body">
        <h3><a href="exercise.html?id=${encodeURIComponent(ex.id)}">${esc(ex.name)}</a></h3>
        <div class="tags"><span>${esc(ex.position)}</span>${ex.regions.map((r) => `<span>${esc(r)}</span>`).join('')}</div>
        <button class="btn" type="button" data-add="${esc(ex.id)}" aria-pressed="${inProgram(ex.id)}">${addButtonLabel(inProgram(ex.id))}</button>
      </div>
    </li>`).join('');
  status.textContent = list.length ? `${list.length} exercise${list.length > 1 ? 's' : ''}` : '';
  document.getElementById('empty').hidden = list.length > 0;
}

form.addEventListener('input', render);
form.addEventListener('submit', (e) => e.preventDefault());
grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const added = toggleInProgram(exercises.find((x) => x.id === btn.dataset.add));
  btn.setAttribute('aria-pressed', added);
  btn.textContent = addButtonLabel(added);
  toast(added ? 'Added to your program' : 'Removed from your program');
});
render();
