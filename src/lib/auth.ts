import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";

/** Current authenticated Supabase user, or null. */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Require a session; redirect to /login if absent. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** The profile row for a given user id (role, grade, name). */
export async function getProfile(userId: string): Promise<Profile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile ?? null;
}

/** Require a teacher session; redirect students/anon away. */
export async function requireTeacher(): Promise<{ user: User; profile: Profile }> {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "teacher") redirect("/dashboard");
  return { user, profile };
}
