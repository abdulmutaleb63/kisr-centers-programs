// js/center.js — simplified to new schema (no auth) + robust hero cover image

/** Map a center code to its hero background image */
function heroImageFor(code) {
  const map = {
    ENG: 'img/energy.jpg',
    ENV: 'img/envkisr.jpg',
    WAT: 'img/water.jpg',
    PET: 'img/petr.jpg',
    TE:  'img/tech.jpg', // swap to local if you add one; else use an Unsplash URL
    QHSW:'img/QHSE.png',
    SSDD:'img/dev.jpg'   // swap to local if you add one; else use an Unsplash URL
  };
  return map[code] || 'img/energy.jpg';
}

/** Safely apply the hero background (gradient + image) and log what happened */
function applyHeroBackground(code) {
  const headerEl = document.querySelector('header.center-hero') || document.querySelector('header');
  if (!headerEl) return;

  headerEl.classList.add('center-hero');

  const url = heroImageFor(code);

  // Preload to avoid flicker; fall back to gradient only if it fails
  const img = new Image();
  img.onload = () => {
    headerEl.style.background =
      `linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,.35)), url("${url}") center / cover no-repeat`;
    // Clear any leftover backgroundColor that could hide the image
    headerEl.style.backgroundColor = 'transparent';
    // Ensure the element paints (rare, but helps in some Edge repaint quirks)
    headerEl.offsetHeight; // force reflow
    console.info('Hero applied:', url);
  };
  img.onerror = () => {
    headerEl.style.background = `linear-gradient(180deg, rgba(0,0,0,.22), rgba(0,0,0,.35))`;
    console.warn('Hero image failed to load, using gradient only:', url);
  };
  img.src = url;
}

/** Get center id from URL */
function getCenterId() {
  const u = new URL(location.href);
  return (
    u.searchParams.get('id') ||
    u.searchParams.get('ID') ||
    u.searchParams.get('Id') ||
    u.searchParams.get('hnID') ||
    u.searchParams.get('lnID')
  );
}

/** Render center header + program cards */
async function renderCenter(centerId) {
  const grid = document.getElementById('programGrid');

  // Load center
  const centers = await getCenters(); // from db.js
  const center = centers.find((c) => c.id === centerId);

  if (!center) {
    grid.innerHTML =
      `<div class="col-12"><div class="alert alert-warning mb-0">Center not found.</div></div>`;
    document.getElementById('centerTitle').textContent = 'Center not found';
    document.getElementById('centerSubtitle').textContent = '';
    return;
  }

  // HERO COVER IMAGE (robust)
  applyHeroBackground(center.code);

  // Titles
  document.getElementById('centerTitle').textContent = center.name;
  document.getElementById('centerSubtitle').textContent = `Code: ${center.code || '-'}`;

  // Expose center_id to Add Program wrapper (used by center.html inline script)
  const addWrap = document.getElementById('addProgramWrap');
  if (addWrap) addWrap.dataset.centerId = center.id;

  // Load programs
  grid.innerHTML =
    `<div class="col-12"><div class="alert alert-secondary mb-0">Loading programs…</div></div>`;

  const progs = await getPrograms(center.id); // from db.js
  grid.innerHTML = '';

  if (!progs.length) {
    grid.innerHTML =
      `<div class="col-12"><div class="alert alert-info mb-0">No programs yet for this center.</div></div>`;
    return;
  }

  // Render program cards
  progs.forEach((p) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const name = p.program_name || '';
    const nameAttr = name.replace(/"/g, '&quot;'); // for data-text
    const descHtml = p.description ? `<p class="mt-2 mb-3 text-muted small">${escapeHtml(p.description)}</p>` : '';

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h5 class="card-title mb-0">${escapeHtml(name)}</h5>
            <span class="badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${escapeHtml(p.status || '')}</span>
          </div>
          ${descHtml}
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-outline-secondary copy-btn" data-text="${nameAttr}" title="Copy program name">Copy</button>
            <small class="text-muted">
              ${(p.created_by ? `${escapeHtml(p.created_by)} · ` : '')}${new Date(p.created_at).toLocaleDateString()}
            </small>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('programGrid');
  try {
    const id = getCenterId();
    if (!id) {
      grid.innerHTML =
        `<div class="col-12"><div class="alert alert-warning mb-0">Missing center id. Go back to the <a href="index.html">home page</a>.</div></div>`;
      document.getElementById('centerTitle').textContent = 'No center selected';
      document.getElementById('centerSubtitle').textContent = '';
      return;
    }

    await renderCenter(id);

  } catch (e) {
    console.error('Center load error:', e);
    grid.innerHTML =
      `<div class="col-12"><div class="alert alert-danger mb-0"><strong>Error:</strong> ${e.message || e}</div></div>`;
  }
});

// Clipboard handler for "Copy" buttons
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const text = (btn.dataset.text || '').trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = '✓ Copied';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  } catch (err) {
    alert('Copy failed: ' + err);
  }
});

// Re-apply hero on bfcache restore and after all resources load
window.addEventListener('pageshow', () => {
  const id = getCenterId();
  if (id) {
    // Re-apply hero in case browser restored from cache
    getCenters().then(cs => {
      const c = cs.find(x => x.id === id);
      if (c) applyHeroBackground(c.code);
    }).catch(() => {});
  }
});
window.addEventListener('load', () => {
  const id = getCenterId();
  if (id) {
    getCenters().then(cs => {
      const c = cs.find(x => x.id === id);
      if (c) applyHeroBackground(c.code);
    }).catch(() => {});
  }
});
