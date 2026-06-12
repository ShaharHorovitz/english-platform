import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Refreshes the Supabase auth session and returns the current user alongside a
 * response that carries any refreshed auth cookies. Called from src/proxy.ts.
 *
 * Note: unlike the Next 13–15 Supabase boilerplate, we do NOT recreate the
 * response inside `setAll` via `NextResponse.next({ request })` — under the
 * Next 16 nodejs proxy that produces a response the framework rejects on the
 * refresh path. Setting refreshed cookies directly on a single response is
 * correct (they reach the browser via Set-Cookie) and avoids that bug.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{ user: User | null; supabaseResponse: NextResponse }> {
  const supabaseResponse = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Do not run any code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabaseResponse };
}
