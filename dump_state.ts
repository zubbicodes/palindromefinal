import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const { data, error } = await supabase.rpc('get_function_def', { fn_name: 'claim_turn_match' });
  if (error) {
    console.error('Error with RPC fallback, using postgrest query if possible', error);
  }
  
  // Actually, Supabase anon key cannot query pg_proc directly.
  // Let me just fetch the latest match state to see if current_turn_user_id is null!
  const { data: matches } = await supabase.from('matches').select('id, mode, status').order('created_at', { ascending: false }).limit(5);
  console.log('Recent matches:', matches);
  
  if (matches && matches.length > 0) {
    const { data: states } = await supabase.from('turn_match_states').select('*').in('match_id', matches.map(m => m.id));
    console.log('Match states (if any exist for these matches):', states);
  }
}
run();
