import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in · English Platform" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep practicing."
      footer={
        <>
          Have an invite code?{" "}
          <Link
            href="/redeem"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Redeem it
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
