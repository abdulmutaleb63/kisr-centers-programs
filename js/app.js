async function loadData() {
  const res = await fetch('data/programs.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data/programs.json');
  return res.json();
}

function render(data, query = '') {
  const q = query.trim().toLowerCase();
  const centersById = Object.fromEntries(data.centers.map(c => [c.center_id, c]));
  const programsByCenter = {};
  data.programs.forEach(p => {
    (programsByCenter[p.center_id] ||= []).push(p);
  });

  // filter by search (center/program name or code, EN/AR)
  const matches = (text) => (text || '').toLowerCase().includes(q);
  const filteredCenterIds = new Set();

  if (q) {
    // if program matches, keep its center; if center matches, keep center
    data.centers.forEach(c => {
      if (matches(c.name_en) || matches(c.name_ar) || matches(c.code)) {
        filteredCenterIds.add(c.center_id);
      }
    });
    data.programs.forEach(p => {
      const c = centersById[p.center_id];
      if (
        matches(p.name_en) || matches(p.name_ar) || matches(p.code) ||
        matches(c?.name_en) || matches(c?.name_ar) || matches(c?.code)
      ) {
        filteredCenterIds.add(p.center_id);
      }
    });
  }

  const container = document.getElementById('content');
  container.innerHTML = '';

  const centersToRender = q
    ? data.centers.filter(c => filteredCenterIds.has(c.center_id))
    : data.centers;

  centersToRender.forEach(center => {
    const progs = (programsByCenter[center.center_id] || [])
      .filter(p => !q ||
        [p.name_en, p.name_ar, p.code, center.name_en, center.name_ar, center.code]
          .some(t => (t || '').toLowerCase().includes(q))
      )
      .sort((a,b)=>a.name_en.localeCompare(b.name_en));

    // skip empty centers if search filters everything out
    if (q && progs.length === 0) return;

    const card = document.createElement('section');
    card.className = 'center-card';

    const header = document.createElement('div');
    header.className = 'center-header d-flex align-items-center justify-content-between flex-wrap gap-2';
    header.innerHTML = `
      <div>
        <div class="fw-semibold">${center.name_en}</div>
        <div class="text-secondary small">${center.name_ar || ''}</div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <span class="program-code">${center.code}</span>
        <span class="badge text-bg-light badge-status">${center.status || 'active'}</span>
      </div>
    `;

    const list = document.createElement('ul');
    list.className = 'program-list';
    progs.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div class="fw-medium">${p.name_en}</div>
          <div class="text-secondary small">${p.name_ar || ''}</div>
        </div>
        <div class="text-end">
          <div class="program-code">${p.code}</div>
          <div class="small text-muted">${p.status || 'active'}</div>
        </div>
      `;
      list.appendChild(li);
    });

    card.appendChild(header);
    card.appendChild(list);
    container.appendChild(card);
  });

  // meta
  const meta = document.getElementById('metaStamp');
  meta.textContent = `Version ${data.meta?.version ?? '1'} • Last updated: ${data.meta?.last_updated ?? 'N/A'}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await loadData();
    render(data);

    const input = document.getElementById('searchInput');
    input.addEventListener('input', (e) => render(data, e.target.value));
  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
});
