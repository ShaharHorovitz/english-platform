"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignInResult = { error: string };

export async function signInAction(values: {
  email: string;
  password: string;
}): Promise<SignInResult | void> {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { error: "Please enter a valid email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Don't disclose which field was wrong.
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}
