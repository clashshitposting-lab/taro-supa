// User-owned Supabase project (browser client).
// URL + anon key are public by design; safe to inline in the bundle.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://irxolwpybsoqwdfksdoc.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyeG9sd3B5YnNvcXdkZmtzZG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTA1MTAsImV4cCI6MjA5NTAyNjUxMH0.inpOU95jsN9XfNRYSxoA_7UxwpuKjy4kA4SmRd3ilG8';

export const SUPABASE_PROJECT_URL = SUPABASE_URL;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});