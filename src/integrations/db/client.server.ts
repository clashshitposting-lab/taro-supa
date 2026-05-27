// Server-only admin client for the user-owned Supabase project.
// Bypasses RLS. NEVER import from client code.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

function create() {
  const url = process.env.USER_SUPABASE_URL;
  const serviceKey = process.env.USER_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing USER_SUPABASE_URL or USER_SUPABASE_SERVICE_ROLE_KEY env vars',
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let _admin: ReturnType<typeof create> | undefined;
export const supabaseAdmin = new Proxy({} as ReturnType<typeof create>, {
  get(_, p, r) {
    if (!_admin) _admin = create();
    return Reflect.get(_admin, p, r);
  },
});