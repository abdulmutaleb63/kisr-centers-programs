let DATA = null;
let STATE = {
  query: '',
  centerId: '',
  lang: 'en', // 'en' or 'ar'
  expanded: new Set(JSON.parse(localStorage.getItem('expandedCenters') || '[]'))
};

async function loadData() {
  const res = await fetch('data/programs.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load data/programs.json');
  return res.json();
}

function saveExpanded() {
  localStorage.setItem('expandedCenters', JSON.stringify([...STATE.expanded]));
}

function t(en, ar) {
  return STATE.lang === 'ar' ? (ar || en || '') : (en || ar || '');
}

function renderToolbarMeta(data) {
  const meta = document.getElementById('metaStamp');
  meta.textContent = `Version ${data.meta?.version ?? '1'} • Last updated: ${data.meta?.last_updated ?? 'N/A'}`;
}

function populateCenterFilter(data) {
  const sel = document.getElementById('centerFilter');
  // clear except first option
  sel.options.length = 1;
  data.centers
    .slice()
    .sort((a,b)=>a.name_en.localeCompare(b.name_en))
    .forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.center_id;
      opt.textContent = `${c.code} — ${c.name_en}`;
      sel.appendChild(opt);
    });
}

function computeFiltered(data) {
  const q = STATE.query.trim().toLowerCase();
  const byCenter = {};
  const centersById = Object.fromEntries(data.centers.map(c => [c.center_id, c]));

  data.programs.forEach(p => {
    (byCenter[p.center_id] ||= []).push(p);
  });

  const centerMatches = (c) => {
    if (!q) return true;
    return [c.name_en, c.name_ar, c.code].some(v => (v||'').toLowerCase().includes(q));
  };

  const programMatches = (p, c) => {
    if (!q) return true;
    return [p.name_en, p.name_ar, p.code, c?.name_en, c?.name_ar, c?.code]
      .some(v => (v||'').toLowerCase().includes(q));
  };

  const result = [];
  data.centers.forEach(center => {
    if (STATE.centerId && center.center_id !== STATE.centerId) return;

    const programs = (byCenter[center.center_id] || [])
      .filter(p => programMatches(p, center))
      .sort((a,b)=>a.name_en.localeCompare(b.name_en));

    if (q && !centerMatches(center) && programs.length === 0) return;
    result.push({ center, programs });
  });

  return result;
}

function renderSummary(list) {
  const totalCenters = list.length;
  const totalPrograms = list.reduce((sum, x) => sum + x.programs.length, 0);
  const summary = document.getElementById('summary');
  summary.textContent = `Showing ${totalCenters} center(s), ${totalPrograms} program(s)`;
}

function render(data) {
  const container = document.getElementById('content');
  container.innerHTML = '';
  const list = computeFiltered(data);
  renderSummary(list);

  list.forEach(({ center, programs }) => {
    const section = document.createElement('section');
    section.className = 'center-card';
    section.id = center.center_id;

    const isExpanded = STATE.expanded.has(center.center_id) || STATE.query || STATE.centerId;

    const header = document.createElement('div');
    header.className = 'center-header';

    const left = document.createElement('div');
    left.className = 'center-title';
    left.innerHTML = `
      <div class="fw-semibold">${t(center.name_en, center.name_ar)}</div>
      <div class="text-secondary small">${t(center.name_ar, center.name_en)}</div>
    `;

    const right = document.createElement('div');
    right.className = 'center-actions';
    right.innerHTML = `
      <span class="center-count small">${programs.length} programs</span>
      <span class="program-code">${center.code}</span>
      <span class="badge text-bg-light badge-status">${center.status || 'active'}</span>
      <button class="btn btn-sm btn-outline-primary" data-toggle="${center.center_id}">
        ${isExpanded ? (STATE.lang === 'ar' ? 'إخفاء' : 'Collapse') : (STATE.lang === 'ar' ? 'عرض' : 'Expand')}
      </button>
    `;

    header.appendChild(left);
    header.appendChild(right);

    const listEl = document.createElement('ul');
    listEl.className = 'program-list';
    listEl.style.display = isExpanded ? '' : 'none';

    programs.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div>
          <div class="fw-medium">${t(p.name_en, p.name_ar)}</div>
          <div class="text-secondary small">${t(p.name_ar, p.name_en)}</div>
        </div>
        <div class="text-end">
          <div class="program-code">${p.code}</div>
          <div class="small text-muted">${p.status || 'active'}</div>
        </div>
      `;
      listEl.appendChild(li);
    });

    section.appendChild(header);
    section.appendChild(listEl);
    container.appendChild(section);
  });

  // wire up per-center toggles
  container.querySelectorAll('button[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-toggle');
      const section = document.getElementById(id);
      const listEl = section.querySelector('.program-list');
      const open = listEl.style.display === 'none';
      listEl.style.display = open ? '' : 'none';
      if (open) STATE.expanded.add(id); else STATE.expanded.delete(id);
      btn.textContent = open ? (STATE.lang === 'ar' ? 'إخفاء' : 'Collapse') : (STATE.lang === 'ar' ? 'عرض' : 'Expand');
      saveExpanded();
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    DATA = await loadData();
    renderToolbarMeta(DATA);
    populateCenterFilter(DATA);
    render(DATA);

    // search
    document.getElementById('searchInput').addEventListener('input', (e) => {
      STATE.query = e.target.value;
      render(DATA);
    });

    // center filter
    document.getElementById('centerFilter').addEventListener('change', (e) => {
      STATE.centerId = e.target.value;
      render(DATA);
    });

    // expand/collapse all
    document.getElementById('expandAllBtn').addEventListener('click', () => {
      const anyCollapsed = document.querySelectorAll('.program-list').length > document.querySelectorAll('.program-list:not([style*="display: none"])').length;
      // if any collapsed, expand all; otherwise collapse all
      STATE.expanded = new Set(anyCollapsed ? DATA.centers.map(c=>c.center_id) : []);
      saveExpanded();
      render(DATA);
    });

    // language toggle
    const langToggle = document.getElementById('langToggle');
    langToggle.addEventListener('change', (e) => {
      STATE.lang = e.target.checked ? 'ar' : 'en';
      document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
      render(DATA);
      // update filter labels to EN (keep options as EN list for now)
    });

    // print
    document.getElementById('printBtn').addEventListener('click', () => window.print());

  } catch (err) {
    document.getElementById('content').innerHTML =
      `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
});
