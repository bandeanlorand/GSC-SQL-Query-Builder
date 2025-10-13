// // logQuery.js
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// const SUPABASE_URL = 'https://ykzbamhjfigaskkhhxqy.supabase.co';
// const base64Key = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5scmVtSmhiV2hxWm1sbllYTnJhMmhvZUhGNUlpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTlRFek9EVTVOemdzSW1WNGNDSTZNakEyTmprMk1UazNPSDAuTFRvMi15dFN2aFUteTVYSHR0MkNrSlp4NXc2NzdZd3dGRzNuMEdUcXVEaw=="; // your key, base64-encoded
// const SUPABASE_ANON_KEY = atob(base64Key);
// const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// export async function logQuery({ query, source_page }) {
//   if (!query) return;

//   const { error } = await supabase.from('logged_queries').insert([
//     {
//       query,
//       source_page: source_page || window.location.href,
//     },
//   ]);

//   if (error) {
//     console.error('[Supabase] Failed to log query:', error.message);
//   } else {
//     console.info('[Supabase] Query logged');
//   }
// }
// // 
// logQuery.js
// logQuery.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ykzbamhjfigaskkhhxqy.supabase.co';
const base64Key = "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5scmVtSmhiV2hxWm1sbllYTnJhMmhvZUhGNUlpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzTlRFek9EVTVOemdzSW1WNGNDSTZNakEyTmprMk1UazNPSDAuTFRvMi15dFN2aFUteTVYSHR0MkNrSlp4NXc2NzdZd3dGRzNuMEdUcXVEaw==";
const SUPABASE_ANON_KEY = atob(base64Key);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function logQuery({ query, source_page }) {
  if (!query) return;

  const { error } = await supabase.from('logged_queries').insert([
    {
      query,
      source_page: source_page || window.location.href,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error('[Supabase] Failed to log query:', error.message);
  } else {
    console.info('[Supabase] Query logged');
  }
}

