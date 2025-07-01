// logQuery.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://lktloyqtzbrkifexzqpo.supabase.co';  // Supabase URL
const SUPABASE_ANON_KEY = ''; // anon key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function logQuery({ query, source_page }) {
  if (!query) return;

  const { error } = await supabase.from('logged_queries').insert([
    {
      query,
      source_page: source_page || window.location.href,
    },
  ]);

  if (error) {
    console.error('[Supabase] Failed to log query:', error.message);
  } else {
    console.info('[Supabase] Query logged');
  }
}
