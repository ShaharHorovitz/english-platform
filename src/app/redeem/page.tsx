import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RedeemForm } from "./redeem-form";

export const metadata: Metadata = { title: "Redeem invite · English Platform" };

export default function RedeemPage() {
  return (
    <AuthShell
      title="Redeem your invite"
      subtitle="Enter the code your teacher gave you."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RedeemForm />
    </AuthShell>
  );
}
