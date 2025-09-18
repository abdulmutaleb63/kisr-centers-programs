// js/landing.js — updated for new schema

function tileImageFor(code) {
  const map = {
    ENG: 'img/energy.jpg',
    ENV: 'img/envkisr.jpg',
    WAT: 'img/water.jpg',
    PET: 'img/petr.jpg',
    TE:  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
    QHSW:'img/QHSE.png',
    SSDD:'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop'
  };
  return map[code] || 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop';
}

function renderTiles(centers) {
  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';

  centers
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-lg-3';
      col.innerHTML = `
        <a class="tile card text-decoration-none shadow-sm h-100 border-0 overflow-hidden"
           href="center.html?id=${encodeURIComponent(c.id)}&t=${Date.now()}">
          <div class="tile-img" style="background-image:url('${tileImageFor(c.code)}')"></div>
          <div class="card-body">
            <div class="small text-uppercase text-primary fw-bold">${(c.name || '').replace(/</g,'&lt;')}</div>
            <div class="text-muted small">${c.code ? `Code: ${c.code}` : ''}</div>
          </div>
        </a>`;
      tiles.appendChild(col);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  const tiles = document.getElementById('tiles');
  try {
    const centers = await getCenters(); // from db.js (returns id, code, name)
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
