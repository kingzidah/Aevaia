import { createClient } from '@supabase/supabase-js';

// Server-side admin client — bypasses RLS. Import ONLY in API routes / server actions.
// Never imported by client components; SUPABASE_SERVICE_ROLE_KEY is not exposed to the browser.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
