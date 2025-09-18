// helper: map center code -> image path (HTML-relative)
function tileSrcFor(code) {
  const map = {
    ENG: 'img/energy.jpg',
    ENV: 'img/envkisr.jpg',
    WAT: 'img/water.jpg',
    PET: 'img/petr.jpg',
    TE:  'img/tech.jpg',   // use any local placeholder you have
    QHSW:'img/QHSE.png',
    SSDD:'img/dev.jpg'     // use any local placeholder you have
  };
  return map[code] || 'img/energy.jpg';
}

// optional default if the specific image 404s
const DEFAULT_TILE_SRC = 'img/energy.jpg';

function renderTiles(centers) {
  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';

  centers
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-lg-4';

      const imgSrc = tileSrcFor(c.code);

      col.innerHTML = `
        <a class="tile card text-decoration-none shadow-sm h-100 border-0 overflow-hidden"
           href="center.html?id=${encodeURIComponent(c.id)}&t=${Date.now()}">

          <!-- real image so the browser will fetch it and you can see it in Network -->
          <img class="tile-cover" src="${imgSrc}" alt="${(c.name || '').replace(/"/g, '&quot;')}"
               onerror="this.onerror=null; this.src='${DEFAULT_TILE_SRC}'">

          <div class="card-body">
            <div class="small text-uppercase text-primary fw-bold">${(c.code || '').replace(/</g,'&lt;')}</div>
            <div class="fw-semibold">${(c.name || '').replace(/</g,'&lt;')}</div>
          </div>
        </a>`;
      tiles.appendChild(col);
    });
}
