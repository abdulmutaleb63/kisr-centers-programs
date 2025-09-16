async function loadData() {
  const res = await fetch('data/programs.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data/programs.json');
  return res.json();
}

function tileImageFor(code) {
  // Optional: map a few codes to background images (you can replace URLs later)
  const map = {
    ENG: 'img/energy.jpg',
    ENV: 'img/envkisr.jpg',
    WAT: 'img/water.jpg',
    PET: 'img/petr.jpg',
    TE:  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
    QHSW:'img/water.jpg',
    SSDD:'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop'
  };
  return map[code] || 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop';
}

function renderTiles(data) {
  document.getElementById('metaStamp').textContent =
    `Version ${data.meta?.version ?? '1'} • Last updated: ${data.meta?.last_updated ?? 'N/A'}`;

  const tiles = document.getElementById('tiles');
  tiles.innerHTML = '';

  // Only “centers/divisions/departments” we seeded; already skipping commercialization per your request
  const sorted = data.centers.slice().sort((a,b)=>a.name_en.localeCompare(b.name_en));

  sorted.forEach(c => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-3';
    col.innerHTML = `
      <a class="tile card text-decoration-none shadow-sm h-100 border-0 overflow-hidden" href="center.html?id=${encodeURIComponent(c.center_id)}">
        <div class="tile-img" style="background-image:url('${tileImageFor(c.code)}')"></div>
        <div class="card-body">
          <div class="small text-uppercase text-primary fw-bold">${c.name_en}</div>
          <div class="text-muted small">${c.name_ar || ''}</div>
        </div>
      </a>
    `;
    tiles.appendChild(col);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    renderTiles(data);
  } catch (e) {
    document.getElementById('tiles').innerHTML =
      `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
});
