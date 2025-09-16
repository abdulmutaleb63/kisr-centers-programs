function q(param) {
  const u = new URL(location.href);
  return u.searchParams.get(param);
}
async function loadData() {
  const res = await fetch('data/programs.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data/programs.json');
  return res.json();
}

function renderCenter(data, centerId) {
  const center = data.centers.find(c => c.center_id === centerId);
  if (!center) {
    document.getElementById('programGrid').innerHTML =
      `<div class="alert alert-warning">Center not found.</div>`;
    return;
  }

  document.getElementById('metaStamp').textContent =
    `Version ${data.meta?.version ?? '1'} • Last updated: ${data.meta?.last_updated ?? 'N/A'}`;
  document.getElementById('centerTitle').textContent = center.name_en;
  document.getElementById('centerSubtitle').textContent = center.name_ar || '';

  const grid = document.getElementById('programGrid');
  grid.innerHTML = '';

  const progs = data.programs
    .filter(p => p.center_id === center.center_id && (p.status || 'active').toLowerCase() === 'active')
    .sort((a,b)=>a.name_en.localeCompare(b.name_en));

  if (progs.length === 0) {
    grid.innerHTML = `<div class="alert alert-info">No active programs listed.</div>`;
    return;
  }

  progs.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="fw-semibold mb-1">${p.name_en}</div>
          <div class="text-muted small mb-3">${p.name_ar || ''}</div>
          <div class="mt-auto d-flex align-items-center justify-content-between">
            <span class="badge text-bg-light">${p.code}</span>
            <small class="text-muted">${p.status || 'active'}</small>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const id = q('id');
    const data = await loadData();
    if (!id) {
      document.getElementById('programGrid').innerHTML =
        `<div class="alert alert-warning">Missing center id. Go back to the <a href="index.html">home page</a>.</div>`;
      return;
    }
    renderCenter(data, id);
  } catch (e) {
    document.getElementById('programGrid').innerHTML =
      `<div class="alert alert-danger">Error: ${e.message}</div>`;
  }
});
