"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Mail, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormError } from "@/components/ui/form-error";
import { InputWithIcon, PasswordField } from "@/components/auth/fields";
import { validateCodeAction, redeemAction } from "./actions";

const codeSchema = z.object({
  code: z.string().trim().min(1, "Enter your invite code."),
});
type CodeValues = z.infer<typeof codeSchema>;

const detailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});
type DetailsValues = z.infer<typeof detailsSchema>;

export function RedeemForm() {
  const [step, setStep] = React.useState<1 | 2>(1);
  const [code, setCode] = React.useState("");
  const [gradeName, setGradeName] = React.useState("");
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema) });
  const detailsForm = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
  });

  function submitCode(values: CodeValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await validateCodeAction(values);
      if (!res.ok) {
        setServerError(res.error);
        return;
      }
      setCode(values.code.trim());
      setGradeName(res.gradeName);
      if (res.emailHint) detailsForm.setValue("email", res.emailHint);
      setStep(2);
    });
  }

  function submitDetails(values: DetailsValues) {
    setServerError(null);
    startTransition(async () => {
      const res = await redeemAction({ code, ...values });
      if (res?.error) setServerError(res.error);
    });
  }

  if (step === 1) {
    return (
      <form
        onSubmit={codeForm.handleSubmit(submitCode)}
        className="flex flex-col gap-4"
        noValidate
      >
        <FormError message={serverError} />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">Invite code</Label>
          <InputWithIcon
            id="code"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="e.g. SPRING-7K2P"
            icon={<KeyRound />}
            aria-invalid={!!codeForm.formState.errors.code}
            {...codeForm.register("code")}
          />
          {codeForm.formState.errors.code ? (
            <span className="text-xs text-destructive">
              {codeForm.formState.errors.code.message}
            </span>
          ) : null}
        </div>
        <Button type="submit" className="mt-1 w-full" disabled={pending}>
          {pending ? "Checking…" : "Continue"}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={detailsForm.handleSubmit(submitDetails)}
      className="flex flex-col gap-4"
      noValidate
    >
      <div className="flex items-center gap-2 rounded-[var(--radius-input)] bg-accent px-3.5 py-2.5 text-sm font-medium text-accent-foreground">
        <GraduationCap className="size-4 shrink-0" />
        You&rsquo;re joining <span className="font-semibold">{gradeName}</span>
      </div>

      <FormError message={serverError} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Your name</Label>
        <InputWithIcon
          id="fullName"
          autoComplete="name"
          placeholder="Ada Lovelace"
          icon={<User />}
          aria-invalid={!!detailsForm.formState.errors.fullName}
          {...detailsForm.register("fullName")}
        />
        {detailsForm.formState.errors.fullName ? (
          <span className="text-xs text-destructive">
            {detailsForm.formState.errors.fullName.message}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <InputWithIcon
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail />}
          aria-invalid={!!detailsForm.formState.errors.email}
          {...detailsForm.register("email")}
        />
        {detailsForm.formState.errors.email ? (
          <span className="text-xs text-destructive">
            {detailsForm.formState.errors.email.message}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Choose a password</Label>
        <PasswordField
          id="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          aria-invalid={!!detailsForm.formState.errors.password}
          {...detailsForm.register("password")}
        />
        {detailsForm.formState.errors.password ? (
          <span className="text-xs text-destructive">
            {detailsForm.formState.errors.password.message}
          </span>
        ) : null}
      </div>

      <Button type="submit" className="mt-1 w-full" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>
      <button
        type="button"
        onClick={() => {
          setServerError(null);
          setStep(1);
        }}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Use a different code
      </button>
    </form>
  );
}
