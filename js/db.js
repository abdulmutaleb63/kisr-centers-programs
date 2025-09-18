// === Supabase client: fill these ===
const SUPABASE_URL = "https://qwhxmjwrfgbavakwzikp.supabase.co";   // <-- paste yours
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aHhtandyZmdiYXZha3d6aWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODk2NTAsImV4cCI6MjA3MzY2NTY1MH0.hXu-sseyjo1_FYEaGIObCdWyb8_OkOmCauQM1LjyK74";              // <-- paste yours

// init
// js/db.js
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'kisr_srid_auth' }
});


// ===== Auth helpers =====
async function signIn(email, password) {
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}
async function signOut() {
  await supa.auth.signOut();
}
async function getSession() {
  const { data } = await supa.auth.getSession();
  return data.session;
}
function onAuthChange(cb) {
  supa.auth.onAuthStateChange((_event, session) => cb(session));
}

// ===== Data access =====
// Centers
// ---- READ: use REST (anon key) ----
async function getCenters() {
  const url = `${SUPABASE_URL}/rest/v1/centers?select=center_id,code,name_en,name_ar,status&order=name_en.asc`;
  const r = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!r.ok) throw new Error(`centers fetch failed: ${r.status}`);
  return r.json();
}

async function getPrograms(centerId) {
  const url = `${SUPABASE_URL}/rest/v1/programs?select=program_id,center_id,code,name_en,name_ar,status,created_at,created_by&center_id=eq.${encodeURIComponent(centerId)}&status=eq.active&order=name_en.asc`;
  const r = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!r.ok) throw new Error(`programs fetch failed: ${r.status}`);
  return r.json();
}

// ---- WRITE: use REST with the user's access token ----
async function addProgram({ center_id, code, name_en, name_ar }) {
  // must be logged in; get a fresh access token
  const { data } = await supa.auth.getSession();
  const access_token = data?.session?.access_token;
  if (!access_token) throw new Error('Not logged in');

  const url = `${SUPABASE_URL}/rest/v1/programs`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${access_token}`,   // <- use user token for RLS
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify([{ center_id, code, name_en, name_ar }])
  });

  if (!r.ok) {
    const err = await r.text();
    throw new Error(`insert failed: ${r.status} ${err}`);
  }
  const [row] = await r.json();
  return row;
}

