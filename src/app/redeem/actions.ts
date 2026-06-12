"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { inviteCodes, profiles, grades } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// --- Step 1: validate the invite code -------------------------------------
const codeSchema = z.object({ code: z.string().trim().min(1) });

export type ValidateResult =
  | { ok: true; gradeName: string; emailHint: string | null }
  | { ok: false; error: string };

export async function validateCodeAction(values: {
  code: string;
}): Promise<ValidateResult> {
  const parsed = codeSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: "Enter your invite code." };

  const [row] = await db
    .select({
      usedAt: inviteCodes.usedAt,
      emailHint: inviteCodes.emailHint,
      gradeName: grades.name,
    })
    .from(inviteCodes)
    .innerJoin(grades, eq(inviteCodes.gradeId, grades.id))
    .where(eq(inviteCodes.code, parsed.data.code))
    .limit(1);

  if (!row) return { ok: false, error: "That invite code isn't valid." };
  if (row.usedAt)
    return { ok: false, error: "That invite code has already been used." };
  return { ok: true, gradeName: row.gradeName, emailHint: row.emailHint };
}

// --- Step 2: redeem (create the account) ----------------------------------
const redeemSchema = z.object({
  code: z.string().trim().min(1),
  fullName: z.string().trim().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export type RedeemResult = { error: string };

export async function redeemAction(values: {
  code: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<RedeemResult | void> {
  const parsed = redeemSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const { code, fullName, email, password } = parsed.data;

  // Re-read the code and confirm it's still unused.
  const [row] = await db
    .select({
      id: inviteCodes.id,
      gradeId: inviteCodes.gradeId,
      usedAt: inviteCodes.usedAt,
    })
    .from(inviteCodes)
    .where(eq(inviteCodes.code, code))
    .limit(1);
  if (!row) return { error: "That invite code isn't valid." };
  if (row.usedAt)
    return { error: "That invite code has already been used." };

  // Provision the auth user with the service role. Role lives in app_metadata
  // so the proxy can gate /admin without a DB call.
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role: "student" },
  });
  if (created.error || !created.data.user) {
    const msg = created.error?.message ?? "";
    if (/already|exists|registered/i.test(msg)) {
      return { error: "An account with that email already exists. Try signing in." };
    }
    return { error: "Could not create your account. Please try again." };
  }
  const userId = created.data.user.id;

  // Insert the profile and atomically claim the code. Roll back the auth user
  // if anything fails (the profiles->auth.users cascade also cleans up).
  try {
    await db.insert(profiles).values({
      id: userId,
      fullName,
      role: "student",
      gradeId: row.gradeId,
    });
    const claimed = await db
      .update(inviteCodes)
      .set({ usedAt: new Date() })
      .where(and(eq(inviteCodes.id, row.id), isNull(inviteCodes.usedAt)))
      .returning({ id: inviteCodes.id });
    if (claimed.length === 0) throw new Error("code already claimed");
  } catch {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return {
      error:
        "That invite code was just used. Please ask your teacher for a new one.",
    };
  }

  // Sign the new student in, then send them to the dashboard.
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) redirect("/login");
  redirect("/dashboard");
}
