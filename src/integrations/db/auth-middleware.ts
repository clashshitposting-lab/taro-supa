import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const url = process.env.USER_SUPABASE_URL;
    const anon = process.env.USER_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      throw new Error('Missing USER_SUPABASE_URL or USER_SUPABASE_ANON_KEY');
    }

    const request = getRequest();
    const authHeader = request?.headers?.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: missing bearer token');
    }
    const token = authHeader.slice('Bearer '.length);

    const supabase = createClient<Database>(url, anon, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new Error('Unauthorized: invalid token');

    return next({
      context: { supabase, userId: data.user.id, user: data.user },
    });
  },
);