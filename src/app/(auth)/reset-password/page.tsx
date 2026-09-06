"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0F17]">
          <Loader2 className="h-8 w-8 animate-spin text-[#49c2f5]" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push("/login?message=password_reset_success");
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F17]">
        <Loader2 className="h-8 w-8 animate-spin text-[#49c2f5]" />
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
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#49c2f5]/15 via-[#2b7ee2]/10 to-transparent blur-3xl"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Set a new password
            </h1>
            <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
              Choose a new password for your account
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
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  New Password
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-[#0B0F17] transition-all duration-200",
                    errors.password
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-white/15 hover:border-white/25 focus-within:border-[#49c2f5] focus-within:ring-2 focus-within:ring-[#49c2f5]/20"
                  )}
                >
                  <Lock
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.password
                        ? "text-rose-400"
                        : "text-slate-400 group-focus-within:text-[#49c2f5]"
                    )}
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="•••••••••••• (min. 8 characters)"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    disabled={isSubmitting}
                    className="h-11 w-full bg-transparent pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-white focus:outline-hidden"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-rose-400">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  Confirm New Password
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-[#0B0F17] transition-all duration-200",
                    errors.confirmPassword
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-white/15 hover:border-white/25 focus-within:border-[#49c2f5] focus-within:ring-2 focus-within:ring-[#49c2f5]/20"
                  )}
                >
                  <Lock
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.confirmPassword
                        ? "text-rose-400"
                        : "text-slate-400 group-focus-within:text-[#49c2f5]"
                    )}
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    disabled={isSubmitting}
                    className="h-11 w-full bg-transparent pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-rose-400">
                    {errors.confirmPassword.message}
                  </p>
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
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
