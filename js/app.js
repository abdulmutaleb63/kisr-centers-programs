// app.js — unified “all centers & programs” view, now using Supabase (no auth, no JSON)

// State
let STATE = {
  query: "",
  centerId: "",
  lang: "en", // 'en' or 'ar' (we only have one name per item, so we mirror it)
  expanded: new Set(JSON.parse(localStorage.getItem("expandedCenters") || "[]")),
};

// Utilities
function saveExpanded() {
  localStorage.setItem("expandedCenters", JSON.stringify([...STATE.expanded]));
}
function t(en, ar) { return STATE.lang === "ar" ? (ar || en || "") : (en || ar || ""); }
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[m])); }

// Load from Supabase
async function loadData() {
  // centers(id, code, name)
  const centers = await getCenters();

  // programs(id, center_id, program_name, status, description, created_by, created_at)
  const { data: programs, error } = await supa
    .from("programs")
    .select("id, center_id, program_name, status, description, created_by, created_at");
  if (error) throw error;

  return { centers, programs, meta: { version: "live", last_updated: new Date().toISOString() } };
}

// Meta stamp
function renderToolbarMeta(data) {
  const meta = document.getElementById("metaStamp");
  if (!meta) return;
  meta.textContent = `Live • Last updated: ${new Date(data.meta?.last_updated || Date.now()).toLocaleString()}`;
}

// Center filter
function populateCenterFilter(data) {
  const sel = document.getElementById("centerFilter");
  if (!sel) return;
  sel.options.length = 1; // keep first option
  data.centers
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
    .forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = `${c.code || "—"} — ${c.name}`;
      sel.appendChild(opt);
    });
}

// Compute filtered + grouped list
function computeFiltered(data) {
  const q = STATE.query.trim().toLowerCase();

  const byCenter = {};
  data.programs.forEach(p => {
    (byCenter[p.center_id] ||= []).push(p);
  });

  const centersById = Object.fromEntries(data.centers.map(c => [c.id, c]));

  const centerMatches = (c) => {
    if (!q) return true;
    return [c.name, c.code].some(v => (v || "").toLowerCase().includes(q));
  };

  const programMatches = (p, c) => {
    if (!q) return true;
    return [
      p.program_name, p.description, p.created_by,
      c?.name, c?.code
    ].some(v => (v || "").toLowerCase().includes(q));
  };

  const result = [];
  data.centers.forEach(center => {
    if (STATE.centerId && center.id !== STATE.centerId) return;
    const programs = (byCenter[center.id] || [])
      .filter(p => programMatches(p, center))
      .sort((a, b) => String(a.program_name || "").localeCompare(String(b.program_name || "")));

    if (q && !centerMatches(center) && programs.length === 0) return;
    result.push({ center, programs });
  });
  return result;
}

// Summary
function renderSummary(list) {
  const el = document.getElementById("summary");
  if (!el) return;
  const totalCenters = list.length;
  const totalPrograms = list.reduce((sum, x) => sum + x.programs.length, 0);
  el.textContent = `Showing ${totalCenters} center(s), ${totalPrograms} program(s)`;
}

// Main render
function render(data) {
  const container = document.getElementById("content");
  if (!container) return;
  container.innerHTML = "";

  const list = computeFiltered(data);
  renderSummary(list);

  list.forEach(({ center, programs }) => {
    const section = document.createElement("section");
    section.className = "center-card";
    section.id = center.id;

    const isExpanded = STATE.expanded.has(center.id) || STATE.query || STATE.centerId;

    const header = document.createElement("div");
    header.className = "center-header";

    const left = document.createElement("div");
    left.className = "center-title";
    left.innerHTML = `
      <div class="fw-semibold">${escapeHtml(t(center.name, center.name))}</div>
      <div class="text-secondary small">${escapeHtml(center.code || "")}</div>
    `;

    const right = document.createElement("div");
    right.className = "center-actions";
    right.innerHTML = `
      <span class="center-count small">${programs.length} programs</span>
      <span class="badge text-bg-light badge-status">active</span>
      <button class="btn btn-sm btn-outline-primary" data-toggle="${center.id}">
        ${isExpanded ? (STATE.lang === "ar" ? "إخفاء" : "Collapse") : (STATE.lang === "ar" ? "عرض" : "Expand")}
      </button>
    `;

    header.appendChild(left);
    header.appendChild(right);

    const listEl = document.createElement("ul");
    listEl.className = "program-list";
    listEl.style.display = isExpanded ? "" : "none";

    programs.forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <div class="fw-medium">${escapeHtml(t(p.program_name, p.program_name))}</div>
          ${p.description ? `<div class="text-secondary small">${escapeHtml(p.description)}</div>` : ""}
        </div>
        <div class="text-end">
          <div class="small text-muted">${escapeHtml(p.status || "Active")}</div>
          <div class="small text-muted">${p.created_by ? escapeHtml(p.created_by) + " · " : ""}${new Date(p.created_at).toLocaleDateString()}</div>
        </div>
      `;
      listEl.appendChild(li);
    });

    const wrap = document.createElement("div");
    wrap.appendChild(header);
    wrap.appendChild(listEl);
    container.appendChild(wrap);
  });

  // Toggle handlers
  container.querySelectorAll("button[data-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-toggle");
      const section = document.getElementById(id);
      const listEl = section.querySelector(".program-list");
      const open = listEl.style.display === "none";
      listEl.style.display = open ? "" : "none";
      if (open) STATE.expanded.add(id); else STATE.expanded.delete(id);
      btn.textContent = open ? (STATE.lang === "ar" ? "إخفاء" : "Collapse") : (STATE.lang === "ar" ? "عرض" : "Expand");
      saveExpanded();
    });
  });
}

// Boot
document.addEventListener("DOMContentLoaded", async () => {
  const content = document.getElementById("content");
  try {
    content && (content.innerHTML = `<div class="alert alert-secondary">Loading…</div>`);
    const DATA = await loadData();

    renderToolbarMeta(DATA);
    populateCenterFilter(DATA);
    render(DATA);

    // search
    const searchInput = document.getElementById("searchInput");
    searchInput && searchInput.addEventListener("input", (e) => {
      STATE.query = e.target.value;
      render(DATA);
    });

    // center filter
    const centerFilter = document.getElementById("centerFilter");
    centerFilter && centerFilter.addEventListener("change", (e) => {
      STATE.centerId = e.target.value;
      render(DATA);
    });

    // expand/collapse all
    const expandAllBtn = document.getElementById("expandAllBtn");
    expandAllBtn && expandAllBtn.addEventListener("click", () => {
      const allIds = DATA.centers.map(c => c.id);
      const anyCollapsed = document.querySelectorAll(".program-list").length >
                           document.querySelectorAll('.program-list:not([style*="display: none"])').length;
      STATE.expanded = new Set(anyCollapsed ? allIds : []);
      saveExpanded();
      render(DATA);
    });

    // language toggle (kept for future bilingual fields)
    const langToggle = document.getElementById("langToggle");
    langToggle && langToggle.addEventListener("change", (e) => {
      STATE.lang = e.target.checked ? "ar" : "en";
      document.documentElement.dir = STATE.lang === "ar" ? "rtl" : "ltr";
      render(DATA);
    });

    // print
    const printBtn = document.getElementById("printBtn");
    printBtn && printBtn.addEventListener("click", () => window.print());

  } catch (err) {
    console.error(err);
    if (content) {
      content.innerHTML = `<div class="alert alert-danger">Error: ${escapeHtml(err.message || String(err))}</div>`;
    }
  }
});
