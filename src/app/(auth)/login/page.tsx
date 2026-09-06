"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B0F17] text-white">
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#0B0F17]/95 px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
          <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
        </div>
      </header>
      <div className="relative flex flex-1 flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center border-r border-white/10 bg-[#0E131F] px-6 py-8 sm:px-10 lg:w-[440px] xl:w-[480px]">
          <div className="w-full max-w-sm mx-auto space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-7 w-48 rounded-lg bg-white/10" />
              <div className="h-4 w-64 rounded bg-white/5" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-11 w-full rounded-xl bg-white/5" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-11 w-full rounded-xl bg-white/5" />
              </div>
              <div className="h-11 w-full rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-center bg-[#0B0F17] lg:flex">
          <div className="h-24 w-64 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Live Clock & Date for Turvo Right Wallpaper Display
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setFormError(error.message);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/overview";
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#0B0F17] text-white selection:bg-[#49c2f5] selection:text-[#0B0F17]">
      {/* Turvo-style Top Brand Bar */}
      <header className="relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-white/10 bg-[#0B0F17]/95 px-5 backdrop-blur-md lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:opacity-90"
        >
          {/* Circular Turvo Monogram Emblem */}
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
            href="/signup"
            className="hidden font-medium text-slate-300 transition-colors hover:text-[#49c2f5] sm:inline-block"
          >
            Start Free Trial
          </Link>
          <a
            href="mailto:support@freightlinktms.com"
            className="font-medium text-slate-400 transition-colors hover:text-white"
          >
            Contact Support
          </a>
        </div>
      </header>

      {/* Main Split Layout: Left Form Panel + Right Full-screen Night City Skyline */}
      <div className="relative flex flex-1 flex-col lg:flex-row">
        {/* Left Side: Enterprise Auth Panel */}
        <section className="relative z-20 flex w-full flex-col justify-between border-r border-white/10 bg-[#0E131F] px-6 py-8 sm:px-10 sm:py-10 lg:w-[440px] xl:w-[480px]">
          {/* Subtle Ambient Radial Glow on Auth Panel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#49c2f5]/10 blur-3xl"
          />

          <div className="my-auto w-full max-w-sm mx-auto">
            {/* Form Header */}
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Sign in to your account
              </h1>
              <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                Enter your credentials to access your dispatch cockpit
              </p>
            </div>

            {/* Error Alert */}
            {formError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" />
                <div className="flex-1 font-medium leading-relaxed">{formError}</div>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
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
                  <p className="text-xs font-medium text-rose-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
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
                    placeholder="••••••••••••"
                    autoComplete="current-password"
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
                  <p className="text-xs font-medium text-rose-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="group flex cursor-pointer select-none items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border transition-all duration-150",
                      rememberMe
                        ? "border-[#2b7ee2] bg-[#2b7ee2] text-white"
                        : "border-white/20 bg-[#0B0F17] group-hover:border-white/40"
                    )}
                  >
                    {rememberMe && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="text-xs text-slate-300 transition-colors group-hover:text-white">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#49c2f5] transition-colors hover:text-[#7cd4fd] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Turvo Blue/Cyan Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00A3E0] via-[#2488E5] to-[#2B7EE2] px-4 text-sm font-semibold text-white shadow-lg shadow-[#00A3E0]/20 transition-all duration-200 hover:from-[#22B3EB] hover:to-[#368AF0] hover:shadow-[#00A3E0]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Signing in to workspace...</span>
                    </>
                  ) : (
                    <span>Sign In to Workspace</span>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-white/10" />
              <span className="absolute bg-[#0E131F] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Or continue with
              </span>
            </div>

            {/* Disabled Enterprise SSO Button */}
            <div>
              <button
                type="button"
                disabled
                className="group relative flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm font-medium text-slate-400 opacity-60 cursor-not-allowed transition-all"
                title="Enterprise Single Sign-On (SAML 2.0 / Okta) is available on Enterprise tier"
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>Enterprise SSO (SAML 2.0 / Okta)</span>
                <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Enterprise
                </span>
              </button>
            </div>

            {/* 14-Day Free Trial Link */}
            <div className="mt-6 text-center text-xs text-slate-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#49c2f5] transition-colors hover:text-[#7cd4fd] hover:underline"
              >
                Start a 14-day free trial
              </Link>
            </div>
          </div>

          {/* Left Footer: Legal & Support */}
          <footer className="mt-8 pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <Link href="/terms" className="transition-colors hover:text-slate-300">
              Terms of Service
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <Link href="/privacy" className="transition-colors hover:text-slate-300">
              Privacy Policy
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-700" />
            <a
              href="mailto:support@freightlinktms.com"
              className="transition-colors hover:text-slate-300"
            >
              Support
            </a>
          </footer>
        </section>

        {/* Right Side: Full-Bleed Night Skyline with Turvo-Style Live Clock */}
        <section
          className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-[#0B0F17] lg:flex"
          aria-label="Portal Atmosphere"
        >
          {/* Background Wallpaper Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
            style={{
              backgroundImage: `url('/images/turvo-skyline.jpg')`,
            }}
          />

          {/* Deep Cinematic Overlay & Ambient Radial Glows */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17]/80 via-transparent to-[#0B0F17]/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E131F] via-transparent to-transparent" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

          {/* Live Turvo-Style Giant Clock & Date Display */}
          <div className="relative z-10 flex flex-col items-center text-center select-none px-6 py-8 rounded-3xl backdrop-blur-[2px] bg-black/10">
            <div
              className="font-heading text-6xl font-light tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] xl:text-8xl"
              suppressHydrationWarning
            >
              {timeString || "12:00 PM"}
            </div>
            <div
              className="mt-3 text-xl font-normal tracking-wide text-slate-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] xl:text-2xl"
              suppressHydrationWarning
            >
              {dateString || "Loading date..."}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/20 bg-[#0B0F17]/70 px-4 py-1.5 backdrop-blur-md text-xs font-medium text-slate-300 shadow-lg shadow-black/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00d084] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00d084]" />
              </span>
              <span>FreightLink Global Logistics Network Active</span>
            </div>
          </div>

          {/* Bottom Right Attribution / Status Pill */}
          <div className="absolute bottom-6 right-8 z-10 hidden text-right xl:block">
            <p className="text-[11px] font-medium text-white/70 drop-shadow-md">
              Secure Operations Dispatch Node 01
            </p>
            <p className="text-[10px] text-white/50 drop-shadow-sm">
              99.99% Uptime SLA • Encrypted SAML 2.0
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
