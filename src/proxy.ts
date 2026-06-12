import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 renamed the `middleware` convention to `proxy` (runs on the
 * nodejs runtime). This refreshes the Supabase session on every request.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and image files, so auth
     * cookie refresh never blocks CSS/JS/images from loading.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
