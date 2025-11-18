// js/landing.js — render tiles with real <img> covers (no background-image CSS)

// map center code -> HTML-relative image path
function tileSrcFor(code) {
  const map = {
    EBRC: 'img/energy.jpg',
    ELSRC: 'img/envkisr.jpg',
    WRC: 'img/water.jpg',
    PRC: 'img/petr.jpg',
    TED:  'img/ted.avif',   // use any local image you have
    QHSWED:'img/QHSE.png',
    SSDD:'img/CODE.jpg'     // use any local image you have
  };
  return map[code] || 'img/energy.jpg';
}

// fallback if a specific file is missing
const DEFAULT_TILE_SRC = 'img/energy.jpg';

function renderTiles(centers) {
  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';

  // 🔥 ADD: hide these centers
  const hiddenCodes = ["SSDD", "QHSWED"];
  const visibleCenters = centers.filter(c => !hiddenCodes.includes(c.code));

  visibleCenters
    .slice()
    .sort((a,b) => String(a.name||'').localeCompare(String(b.name||'')))
    .forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-lg-4';

      const imgSrc = tileSrcFor(c.code || '');

      // escape helpers
      const esc = s => String(s ?? '').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
      const safeName = esc(c.name);
      const safeCode = esc(c.code);

      col.innerHTML = `
        <a class="tile card text-decoration-none shadow-sm h-100 border-0 overflow-hidden"
           href="center.html?id=${encodeURIComponent(c.id)}&t=${Date.now()}">

          <img class="tile-cover"
               src="${imgSrc}"
               alt="${safeName}"
               onerror="this.onerror=null; this.src='${DEFAULT_TILE_SRC}'">

          <div class="card-body">
            <div class="small text-uppercase text-primary fw-bold">${safeCode}</div>
            <div class="fw-semibold">${safeName}</div>
          </div>
        </a>
      `;
      tiles.appendChild(col);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  const tiles = document.getElementById('tiles');
  try {
    const centers = await getCenters(); // from db.js
    if (!centers?.length) {
      tiles.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">No centers returned from database.</div></div>`;
      return;
    }
    renderTiles(centers);
  } catch (e) {
    console.error(e);
    tiles.innerHTML = `<div class="col-12"><div class="alert alert-danger mb-0"><strong>Load error:</strong> ${e.message || e}</div></div>`;
  }
});
