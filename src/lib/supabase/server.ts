// This import ensures a build-time error if this module is ever
// accidentally imported from a client component ("use client" file).
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

// ─── Env var validation (fail fast at startup, not at request time) ───

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name} environment variable`);
    }
    return value;
}

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Creates a Supabase client for use in SERVER components, API routes, and Server Actions.
 *
 * ✅ Use this in: page.tsx, layout.tsx, route.ts, actions.ts, cache.ts
 * ❌ Don't use in: client components ("use client" files)
 *
 * How it works:
 *   - Uses the server-only cookie store to maintain auth sessions
 *   - The `cookies()` function only works on the server side
 *   - Each request gets its own fresh client (no shared state between users)
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method is called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    );
}

/**
 * Creates a cookie-free Supabase client for server-side read paths that run
 * inside `unstable_cache`. This avoids Next.js runtime errors from using
 * dynamic sources (like `cookies()`) in cached scopes.
 */
export function createCacheSafeClient() {
    return createSupabaseClient<Database>(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}

/**
 * Creates a Supabase ADMIN client that bypasses RLS.
 * Only use for server-side operations that need full access (seeding, migrations, etc.)
 *
 * ⚠️ NEVER expose the service_role key to the browser!
 */
export function createAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error(
            "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
            "The admin client requires the service_role key."
        );
    }

    return createSupabaseClient(
        SUPABASE_URL,
        serviceRoleKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
}
