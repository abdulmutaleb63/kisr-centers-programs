// js/db.js  — simplified (no auth), wired to your Supabase
// Adds program_code (abbreviation) support

// === Supabase client (your project) ===
const SUPABASE_URL = "https://abvbsvidylgeavqevuaq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidmJzdmlkeWxnZWF2cWV2dWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxODExNzcsImV4cCI6MjA3Mzc1NzE3N30.ObsCtITyrdRmQ6ISzLIvy-SrtI4Yj0X15BdwS_-NDn8";

// Create client (no auth persistence needed now)
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// Auth stubs (kept to avoid breakage if referenced elsewhere)
// -----------------------------
async function signIn(_email, _password) {
  console.warn("Auth disabled: signIn() is a no-op.");
  throw new Error("Login is disabled for this tool.");
}
async function signOut() {
  console.warn("Auth disabled: signOut() is a no-op.");
  return;
}
async function getSession() {
  // Always anonymous now
  return null;
}
function onAuthChange(cb) {
  // Immediately report "no session"
  try { cb(null); } catch {}
}

// -----------------------------
// Data access (matches schema)
// centers(id, code, name)
// programs(id, center_id, program_name, program_code, status, description, created_by, created_at)
// -----------------------------

// READ: centers list
async function getCenters() {
  const { data, error } = await supa
    .from("centers")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

// READ: programs for a center (includes program_code)
async function getPrograms(centerId) {
  const { data, error } = await supa
    .from("programs")
    .select("id, center_id, program_name, program_code, status, description, created_by, created_at")
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// helper: normalize program_code (trim + collapse spaces -> no spaces; upper-case)
function normalizeCode(code) {
  if (!code) return null;
  const cleaned = String(code).trim().replace(/\s+/g, "");
  return cleaned ? cleaned.toUpperCase() : null;
}

// WRITE: add a program (anonymous insert allowed by RLS)
async function addProgram({ center_id, program_name, program_code = "", status = "Active", description = "", created_by = "" }) {
  if (!center_id || !program_name?.trim()) {
    throw new Error("center_id and program_name are required.");
  }

  const payload = {
    center_id,
    program_name: program_name.trim(),
    program_code: normalizeCode(program_code), // NEW: abbreviation
    status,
    description,
    created_by
  };

  const { data, error } = await supa
    .from("programs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    const msg = (error.message || "").toLowerCase();
    // handle duplicate code per center (unique index) or other unique constraints
    if (msg.includes("uq_program_code_per_center") || msg.includes("uq_program_code") || msg.includes("unique")) {
      throw new Error("This program (name or abbreviation) already exists for this center.");
    }
    throw error;
  }
  return data;
}

// Small utility if you need HTML escaping in other files
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  }[m]));
}

// Expose to global (optional, for older scripts)
window.getCenters = getCenters;
window.getPrograms = getPrograms;
window.addProgram = addProgram;
window.escapeHtml = escapeHtml;
window.signIn = signIn;
window.signOut = signOut;
window.getSession = getSession;
window.onAuthChange = onAuthChange;
