// js/center.js — no auth + hero cover via CSS classes + abbreviation UI

/** Map a center code to the CSS class we’ll add (must match centers.code in DB) */
function heroClassFor(code) {
  const allowed = ['EBRC','ELSRC','WRC','PRC','TED','QHSWED','SSDD'];
  return allowed.includes(code) ? `hero-${code}` : 'hero-ENG';
}

/** Get center id from URL */
function getCenterId() {
  const u = new URL(location.href);
  return (
    u.searchParams.get("id") ||
    u.searchParams.get("ID") ||
    u.searchParams.get("Id") ||
    u.searchParams.get("hnID") ||
    u.searchParams.get("lnID")
  );
}

/** Render center header + program cards */
async function renderCenter(centerId) {
  const grid = document.getElementById("programGrid");

  // Load center
  const centers = await getCenters(); // from db.js
  const center = centers.find((c) => c.id === centerId);

  if (!center) {
    grid.innerHTML =
      `<div class="col-12"><div class="alert alert-warning mb-0">Center not found.</div></div>`;
    document.getElementById("centerTitle").textContent = "Center not found";
    document.getElementById("centerSubtitle").textContent = "";
    return;
  }

  // ---- HERO COVER IMAGE (CSS class based) ----
  const headerEl = document.querySelector("header.center-hero") || document.querySelector("header");
  if (headerEl) {
    headerEl.classList.add("center-hero");
    // remove any previous hero-* class
    headerEl.className = headerEl.className.replace(/\bhero-[A-Z]+\b/g, "").trim();
    headerEl.classList.add(heroClassFor(center.code || 'ENG'));
  }
  // --------------------------------------------

  // Titles
  document.getElementById("centerTitle").textContent = center.name;
  document.getElementById("centerSubtitle").textContent = `Code: ${center.code || "-"}`;

  // Expose center_id to Add Program wrapper (used by center.html inline script)
  const addWrap = document.getElementById("addProgramWrap");
  if (addWrap) addWrap.dataset.centerId = center.id;

  // Load programs
  grid.innerHTML =
    `<div class="col-12"><div class="alert alert-secondary mb-0">Loading programs…</div></div>`;

  const progs = await getPrograms(center.id); // from db.js
  grid.innerHTML = "";

  if (!progs.length) {
    grid.innerHTML =
      `<div class="col-12"><div class="alert alert-info mb-0">No programs yet for this center.</div></div>`;
    return;
  }

  // Render program cards (now shows abbreviation + copy buttons)
  progs.forEach((p) => {
    const col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    const name = p.program_name || "";
    const nameAttr = name.replace(/"/g, "&quot;"); // for data-text

    const code = p.program_code || "";
    const codeAttr = code.replace(/"/g, "&quot;");

    const descHtml = p.description
      ? `<p class="mt-2 mb-3 text-muted small">${escapeHtml(p.description)}</p>`
      : "";

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <h5 class="card-title mb-0">${escapeHtml(name)}</h5>
            <span class="badge ${p.status === 'Active' ? 'bg-success' : 'bg-secondary'}">
              ${escapeHtml(p.status || '')}
            </span>
          </div>

          ${code ? `
          <div class="mt-1 d-flex align-items-center gap-2">
            <span class="badge text-bg-light">${escapeHtml(code)}</span>
            <button class="btn btn-sm btn-outline-secondary copy-btn"
                    data-text="${codeAttr}"
                    title="Copy abbreviation">Copy code</button>
          </div>` : ''}

          ${descHtml}

          <div class="mt-auto d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-outline-secondary copy-btn"
                    data-text="${nameAttr}"
                    title="Copy program name">Copy name</button>
            <small class="text-muted">
              ${(p.created_by ? `${escapeHtml(p.created_by)} · ` : "")}${new Date(p.created_at).toLocaleDateString()}
            </small>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("programGrid");
  try {
    const id = getCenterId();
    if (!id) {
      grid.innerHTML =
        `<div class="col-12"><div class="alert alert-warning mb-0">Missing center id. Go back to the <a href="index.html">home page</a>.</div></div>`;
      document.getElementById("centerTitle").textContent = "No center selected";
      document.getElementById("centerSubtitle").textContent = "";
      return;
    }

    await renderCenter(id);

  } catch (e) {
    console.error("Center load error:", e);
    grid.innerHTML =
      `<div class="col-12"><div class="alert alert-danger mb-0"><strong>Error:</strong> ${e.message || e}</div></div>`;
  }
});

// Clipboard handler for "Copy" buttons (works for both code + name)
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const text = (btn.dataset.text || "").trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    const original = btn.textContent;
    btn.textContent = "✓ Copied";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
    }, 1200);
  } catch (err) {
    alert("Copy failed: " + err);
  }
});

// Re-apply hero class on bfcache restore
window.addEventListener("pageshow", () => {
  const id = getCenterId();
  if (!id) return;
  getCenters().then(cs => {
    const c = cs.find(x => x.id === id);
    const headerEl = document.querySelector("header.center-hero") || document.querySelector("header");
    if (c && headerEl) {
      headerEl.classList.add("center-hero");
      headerEl.className = headerEl.className.replace(/\bhero-[A-Z]+\b/g, "").trim();
      headerEl.classList.add(heroClassFor(c.code || 'ENG'));
    }
  }).catch(()=>{});
});
