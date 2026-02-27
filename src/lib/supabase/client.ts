import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

/**
 * Creates a Supabase client for use in CLIENT components (browser).
 *
 * ✅ Use this in: any file that starts with "use client"
 * ❌ Don't use in: Server Components, API routes, or Server Actions
 *
 * How it works:
 *   - Reads the public URL and anon key from NEXT_PUBLIC_ env vars
 *   - These are safe to expose to the browser (they're public)
 *   - RLS policies protect the data, not the key
 */
export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
