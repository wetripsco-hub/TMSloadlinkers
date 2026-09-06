"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, AlertCircle, Loader2, ArrowLeft, MailCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0F17]">
          <Loader2 className="h-8 w-8 animate-spin text-[#49c2f5]" />
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}

function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setFormError(null);
    const supabase = createClient();

    // Always show the same neutral success state regardless of whether the
    // request errors or the account exists, so this can't be used to enumerate
    // registered emails.
    await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#0B0F17] text-white selection:bg-[#49c2f5] selection:text-[#0B0F17]">
        <header className="relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#0B0F17]/95 px-5 backdrop-blur-md lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:opacity-90"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0b7cc1] via-[#2b7ee2] to-[#49c2f5] p-[1.5px] shadow-sm shadow-[#49c2f5]/30">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0B0F17]">
                <svg
                  className="h-4 w-4 text-[#49c2f5]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path d="m8 15 4-7 4 7" />
                  <path d="M9 13h6" />
                </svg>
              </div>
            </div>
            <span className="font-heading text-base font-bold tracking-tight text-white">
              FreightLink <span className="text-[#49c2f5]">TMS</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-xs font-medium text-slate-300 hover:text-[#49c2f5]"
          >
            Sign In
          </Link>
        </header>

        <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#49c2f5]/15 via-[#2b7ee2]/10 to-transparent blur-3xl"
          />

          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#141824]/90 p-8 text-center shadow-2xl shadow-black/70 backdrop-blur-xl ring-1 ring-white/5">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0b7cc1] via-[#2b7ee2] to-[#49c2f5] p-[1.5px] shadow-lg shadow-[#49c2f5]/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0E131F]">
                <MailCheck className="h-7 w-7 text-[#49c2f5]" />
              </div>
            </div>

            <h1 className="font-heading text-2xl font-bold tracking-tight text-white">
              Check your email
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              If an account exists for that email address, we&apos;ve sent a link to reset your
              password.
            </p>

            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00A3E0] via-[#2488E5] to-[#2B7EE2] px-4 text-sm font-semibold text-white shadow-lg shadow-[#00A3E0]/20 transition-all hover:from-[#22B3EB] hover:to-[#368AF0]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B0F17] text-white selection:bg-[#49c2f5] selection:text-[#0B0F17]">
      <header className="relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#0B0F17]/95 px-5 backdrop-blur-md lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:opacity-90"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#0b7cc1] via-[#2b7ee2] to-[#49c2f5] p-[1.5px] shadow-sm shadow-[#49c2f5]/30">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0B0F17]">
              <svg
                className="h-4 w-4 text-[#49c2f5]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
                <path d="m8 15 4-7 4 7" />
                <path d="M9 13h6" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading text-base font-bold tracking-tight text-white">
              FreightLink <span className="text-[#49c2f5]">TMS</span>
            </span>
            <span className="hidden rounded bg-[#49c2f5]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#49c2f5] ring-1 ring-[#49c2f5]/30 sm:inline-block">
              Enterprise Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <Link
            href="/login"
            className="font-medium text-slate-300 transition-colors hover:text-[#49c2f5]"
          >
            Sign In
          </Link>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#49c2f5]/15 via-[#2b7ee2]/10 to-transparent blur-3xl"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Reset your password
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
              Enter your work email and we&apos;ll send you a link to reset your password
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141824]/90 p-6 shadow-2xl shadow-black/70 backdrop-blur-xl ring-1 ring-white/5 sm:p-8">
            {formError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <div className="flex-1 font-normal leading-relaxed">{formError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  Work Email
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-[#0B0F17] transition-all duration-200",
                    errors.email
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-white/15 hover:border-white/25 focus-within:border-[#49c2f5] focus-within:ring-2 focus-within:ring-[#49c2f5]/20"
                  )}
                >
                  <Mail
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.email
                        ? "text-rose-400"
                        : "text-slate-400 group-focus-within:text-[#49c2f5]"
                    )}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={isSubmitting}
                    className="h-11 w-full bg-transparent pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-rose-400">{errors.email.message}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00A3E0] via-[#2488E5] to-[#2B7EE2] px-4 text-sm font-semibold text-white shadow-lg shadow-[#00A3E0]/20 transition-all duration-200 hover:from-[#22B3EB] hover:to-[#368AF0] hover:shadow-[#00A3E0]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-slate-400">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 font-medium text-[#49c2f5] transition-colors hover:text-[#7cd4fd] hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
