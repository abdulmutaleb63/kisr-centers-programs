function getCenterId() {
  const u = new URL(location.href);
  return (
    u.searchParams.get('id')   ||
    u.searchParams.get('ID')   ||
    u.searchParams.get('Id')   ||
    u.searchParams.get('hnID') ||
    u.searchParams.get('lnID')
  );
}

async function renderCenter(centerId) {
  // Load center from DB
  const centers = await getCenters(); // from db.js (Supabase)
  const center = centers.find(c => c.center_id === centerId);
  const grid = document.getElementById('programGrid');

  if (!center) {
    grid.innerHTML = `<div class="alert alert-warning">Center not found.</div>`;
    return;
  }

  // Titles
  document.getElementById('centerTitle').textContent = center.name_en;
  document.getElementById('centerSubtitle').textContent = center.name_ar || '';

  // Programs from DB
  const progs = await getPrograms(center.center_id);
  grid.innerHTML = '';

  if (!progs.length) {
    grid.innerHTML = `<div class="alert alert-info">No active programs listed.</div>`;
  } else {
    progs.forEach(p => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';

      const enText = p.name_en || '';
      const arText = p.name_ar || '';
      const enAttr = enText.replace(/"/g, '&quot;');
      const arAttr = arText.replace(/"/g, '&quot;');

      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <div class="fw-semibold mb-1 d-flex justify-content-between align-items-center gap-2">
              <span>${enText}</span>
              <button class="btn btn-sm btn-outline-secondary copy-btn"
                      data-text="${enAttr}"
                      title="Copy English name">Copy EN</button>
            </div>
            <div class="text-muted small mb-3 d-flex justify-content-between align-items-center gap-2">
              <span>${arText}</span>
              <button class="btn btn-sm btn-outline-secondary copy-btn"
                      data-text="${arAttr}"
                      title="Copy Arabic name">نسخ</button>
            </div>
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

  // Expose center_id to the Add Program modal wrapper
  const addWrap = document.getElementById('addProgramWrap');
  if (addWrap) {
    addWrap.dataset.centerId = center.center_id;

    // Show/hide Add button based on auth session
    const session = await getSession();
    addWrap.classList.toggle('d-none', !session);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('programGrid');
  try {
    const id = getCenterId ? getCenterId() : (new URL(location.href)).searchParams.get('id');
    if (!id) {
      grid.innerHTML = `<div class="alert alert-warning">Missing center id. Go back to the <a href="index.html">home page</a>.</div>`;
      return;
    }

    await renderCenter(id);

    // Refresh after login or after adding a program
    window.refreshAfterLogin = () => renderCenter(id);

  } catch (e) {
    console.error('Center load error:', e);
    grid.innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${e.message || e}</div>`;
  }
});


// Clipboard handler for all copy buttons
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

// Refresh UI if user returns via Back/Forward
window.addEventListener('pageshow', () => {
  const u = new URL(location.href);
  const id = (u.searchParams.get('id') || u.searchParams.get('ID') || u.searchParams.get('Id') || u.searchParams.get('hnID') || u.searchParams.get('lnID'));
  if (id) renderCenter(id);
});
// Re-run renderCenter if Chrome restores the page from bfcache
window.addEventListener('pageshow', () => {
  const u = new URL(location.href);
  const id =
    u.searchParams.get('id') ||
    u.searchParams.get('ID') ||
    u.searchParams.get('hnID') ||
    u.searchParams.get('lnID');
  if (id) renderCenter(id);
});
