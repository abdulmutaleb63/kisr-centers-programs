// === Supabase client: fill these ===
const SUPABASE_URL = "https://qwhxmjwrfgbavakwzikp.supabase.co";   // <-- paste yours
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3aHhtandyZmdiYXZha3d6aWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODk2NTAsImV4cCI6MjA3MzY2NTY1MH0.hXu-sseyjo1_FYEaGIObCdWyb8_OkOmCauQM1LjyK74";              // <-- paste yours

// init
const supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
async function getCenters() {
  const { data, error } = await supa.from('centers')
    .select('center_id, code, name_en, name_ar, status')
    .order('name_en', { ascending: true });
  if (error) throw error;
  return data;
}

// Programs by center
async function getPrograms(centerId) {
  const { data, error } = await supa.from('programs')
    .select('program_id, center_id, code, name_en, name_ar, status, created_at, created_by')
    .eq('center_id', centerId)
    .eq('status', 'active')
    .order('name_en', { ascending: true });
  if (error) throw error;
  return data;
}

// Insert program (requires authenticated SRID user per RLS)
async function addProgram({ center_id, code, name_en, name_ar }) {
  const { data, error } = await supa.from('programs').insert([{ center_id, code, name_en, name_ar }]).select();
  if (error) throw error;
  return data[0];
}

