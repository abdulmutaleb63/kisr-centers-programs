// js/db.js  — simplified (no auth), wired to your Supabase

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
// Data access (matches the new schema)
// centers(id, code, name)
// programs(id, center_id, program_name, status, description, created_by, created_at)
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

// READ: programs for a center
async function getPrograms(centerId) {
  const { data, error } = await supa
    .from("programs")
    .select("id, center_id, program_name, status, description, created_by, created_at")
    .eq("center_id", centerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

// WRITE: add a program (anonymous insert allowed by RLS)
async function addProgram({ center_id, program_name, status = "Active", description = "", created_by = "" }) {
  if (!center_id || !program_name?.trim()) {
    throw new Error("center_id and program_name are required.");
  }

  const payload = { center_id, program_name: program_name.trim(), status, description, created_by };

  const { error, data } = await supa
    .from("programs")
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Unique-constraint friendly message (for uq_program_unique)
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("uq_program_unique") || msg.includes("unique")) {
      throw new Error("This program already exists for this center.");
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
