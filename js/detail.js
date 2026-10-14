import { loadData, esc, thumbImg, inProgram, toggleInProgram, addButtonLabel, toast } from './common.js';

// Pinned version; loaded only on this page and only when the viewer is needed.
const MODEL_VIEWER_URL = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';

// theta/phi per preset; the radius comes from exercises.json (written by export.py).
const CAMERAS = {
  front: '0deg 78deg',
  side: '90deg 78deg',
  top: '0deg 5deg',
  above: '78deg 55deg',
};
const BUTTONS = ['front', 'side', 'top'];

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.getElementById('detail');

const data = await loadData();
const id = new URLSearchParams(location.search).get('id');
const ex = data.exercises.find((x) => x.id === id);

if (!ex) {
  root.innerHTML = `<h1>Exercise not found</h1><p><a href="./">Back to the library</a></p>`;
} else {
  document.title = `${ex.name} · Loop & Limb`;
  const d = ex.dosage;
  root.innerHTML = `
    <p><a href="./">← All exercises</a></p>
    <div class="detail-layout">
      <div class="viewer-col">
        <h1>${esc(ex.name)}</h1>
        <p class="lede">${esc(ex.summary)}</p>
        <div class="viewer-shell" id="viewer-shell">${thumbImg(ex, 'viewer-poster')}</div>
        <div class="controls" role="group" aria-label="Animation controls">
          <div class="group">
            <button class="btn primary" id="play" type="button" disabled>Loading…</button>
            <button class="btn" id="speed" type="button" aria-label="Playback speed" disabled>1×</button>
            <button class="btn" id="loop" type="button" aria-pressed="true" disabled>Loop</button>
          </div>
          <div class="group" aria-label="Camera">
            ${BUTTONS.map((k) => `<button class="btn" type="button" data-cam="${k}" disabled>${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}
          </div>
        </div>
        <p class="lede" style="font-size:.9rem">Drag to rotate · pinch or scroll to zoom.</p>
      </div>
      <div>
        <button class="btn" id="add" type="button" aria-pressed="${inProgram(ex.id)}">${addButtonLabel(inProgram(ex.id))}</button>
        <h2>Dosage</h2>
        <dl class="dose">
          <div><dt>Sets</dt><dd>${d.sets}</dd></div>
          <div><dt>Reps</dt><dd>${d.reps}</dd></div>
          <div><dt>Hold</dt><dd>${esc(d.hold)}</dd></div>
          <div><dt>How often</dt><dd>${esc(d.frequency)}</dd></div>
        </dl>
        <h2>How to do it</h2>
        <ol class="steps">${ex.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
        <div class="tips">
          <section class="do"><h2>Do</h2><ul>${ex.do.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>
          <section class="avoid"><h2>Avoid</h2><ul>${ex.avoid.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></section>
        </div>
      </div>
    </div>`;

  document.getElementById('add').addEventListener('click', (e) => {
    const added = toggleInProgram(ex);
    e.currentTarget.setAttribute('aria-pressed', added);
    e.currentTarget.textContent = addButtonLabel(added);
    toast(added ? 'Added to your program' : 'Removed from your program');
  });

  initViewer(ex, data.model);
}

async function initViewer(ex, modelUrl) {
  await import(MODEL_VIEWER_URL);
  const shell = document.getElementById('viewer-shell');
  const mv = document.createElement('model-viewer');
  Object.assign(mv, { src: modelUrl, poster: ex.thumb, alt: `3D figure demonstrating ${ex.name}` });
  mv.setAttribute('camera-controls', '');
  mv.setAttribute('touch-action', 'pan-y');
  mv.setAttribute('interaction-prompt', 'none');
  mv.setAttribute('shadow-intensity', '1');
  mv.setAttribute('min-camera-orbit', 'auto 0deg auto');
  const radius = ex.radius ? `${ex.radius}m` : 'auto';
  const orbit = (view) => `${CAMERAS[view] || CAMERAS.front} ${radius}`;
  mv.setAttribute('camera-orbit', orbit(ex.camera));
  if (ex.target) mv.setAttribute('camera-target', ex.target);
  mv.setAttribute('max-camera-orbit', `auto auto ${ex.radius ? ex.radius * 2 + 'm' : 'auto'}`);
  mv.setAttribute('animation-name', ex.clip);
  if (!reducedMotion) mv.setAttribute('autoplay', '');

  const play = document.getElementById('play');
  const speed = document.getElementById('speed');
  const loop = document.getElementById('loop');
  const camBtns = document.querySelectorAll('[data-cam]');
  let looping = true;

  const syncPlay = () => {
    play.textContent = mv.paused ? '▶ Play' : '❚❚ Pause';
    play.setAttribute('aria-label', mv.paused ? 'Play animation' : 'Pause animation');
  };
  const start = () => mv.play(looping ? undefined : { repetitions: 1 });

  mv.addEventListener('load', () => {
    [play, speed, loop, ...camBtns].forEach((b) => (b.disabled = false));
    syncPlay();
  });
  mv.addEventListener('play', syncPlay);
  mv.addEventListener('pause', syncPlay);
  mv.addEventListener('finished', syncPlay);
  mv.addEventListener('error', () => { play.textContent = 'Model failed to load'; });

  play.addEventListener('click', () => {
    if (mv.paused) {
      // If a one-shot play reached the end, rewind first.
      if (!looping && mv.currentTime >= mv.duration - 0.05) mv.currentTime = 0;
      start();
    } else mv.pause();
  });
  speed.addEventListener('click', () => {
    mv.timeScale = mv.timeScale === 1 ? 0.5 : 1;
    speed.textContent = mv.timeScale === 1 ? '1×' : '0.5×';
  });
  loop.addEventListener('click', () => {
    looping = !looping;
    loop.setAttribute('aria-pressed', looping);
    if (!mv.paused) start();
  });
  camBtns.forEach((b) => b.addEventListener('click', () => {
    mv.cameraOrbit = orbit(b.dataset.cam);
    mv.cameraTarget = ex.target || 'auto auto auto';
  }));

  // model-viewer shows the same thumbnail as its poster until the GLB is ready.
  shell.querySelector('.viewer-poster')?.remove();
  shell.append(mv);
}
