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
import { firstAllowedModulePath } from "@/lib/domain/modules";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { LoadlinkersLogo } from "@/components/icons";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid work email"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-slate-900">
      <header className="flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
          <div className="h-5 w-32 rounded bg-slate-200 animate-pulse" />
        </div>
      </header>
      <div className="relative flex flex-1 flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center border-r border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 lg:w-[440px] xl:w-[480px]">
          <div className="w-full max-w-sm mx-auto space-y-6 animate-pulse">
            <div className="space-y-2">
              <div className="h-7 w-48 rounded-lg bg-slate-300" />
              <div className="h-4 w-64 rounded bg-slate-200" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-300" />
                <div className="h-11 w-full rounded-xl bg-slate-200" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-20 rounded bg-slate-300" />
                <div className="h-11 w-full rounded-xl bg-slate-200" />
              </div>
              <div className="h-11 w-full rounded-xl bg-slate-300" />
            </div>
          </div>
        </div>
        <div className="hidden flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 lg:flex">
          <div className="h-24 w-64 rounded-2xl bg-slate-200 animate-pulse" />
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

const BACKGROUND_IMAGES = [
  "/images/turvo-skyline.jpg",
  "/images/solutions/bg-3pls.jpg",
  "/images/solutions/bg-shippers.jpg",
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Live Clock & Date for Turvo Right Wallpaper Display
  const [timeString, setTimeString] = useState<string>("");
  const [dateString, setDateString] = useState<string>("");
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  useEffect(() => {
    // Select random background image
    const randomImage = BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
    setBackgroundImage(randomImage);

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
    const { data, error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setFormError(error.message);
      return;
    }

    // An explicit redirectTo (bounced here from a protected route) is
    // always honored as-is -- it's a deep link, not the restricted-access
    // fallback. Only the default landing target needs to account for
    // module access, now that 'overview' is itself gated: send a
    // restricted member straight to the first module they actually have
    // instead of '/overview', which would just bounce them again.
    let redirectTo = searchParams.get("redirectTo");
    if (!redirectTo) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, allowed_modules")
        .eq("id", data.user.id)
        .maybeSingle();
      redirectTo = firstAllowedModulePath(profile?.allowed_modules, profile?.role);
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Brand Bar */}
      <header className="relative z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 backdrop-blur-md lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 transition-transform hover:opacity-90"
        >
          <LoadlinkersLogo className="h-6 w-auto max-w-[170px]" />
          <span className="hidden rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-600 ring-1 ring-indigo-200 sm:inline-block">
            Enterprise Portal
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <Link
            href="/signup"
            className="hidden font-medium text-slate-600 transition-colors hover:text-indigo-600 sm:inline-block"
          >
            Start Free Trial
          </Link>
          <a
            href="mailto:support@loadlinker.com"
            className="font-medium text-slate-600 transition-colors hover:text-slate-900"
          >
            Contact Support
          </a>
        </div>
      </header>

      {/* Main Split Layout: Left Form Panel + Right Background */}
      <div className="relative flex flex-1 flex-col lg:flex-row">
        {/* Left Side: Auth Panel */}
        <section className="relative z-20 flex w-full flex-col justify-between border-r border-slate-200 bg-slate-50 px-6 py-8 sm:px-10 sm:py-10 lg:w-[440px] xl:w-[480px]">
          {/* Subtle Ambient Radial Glow on Auth Panel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-100/20 blur-3xl"
          />

          <div className="my-auto w-full max-w-sm mx-auto">
            {/* Form Header */}
            <div className="mb-6">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Sign in to your account
              </h1>
              <p className="mt-1.5 text-xs text-slate-600 sm:text-sm">
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
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700"
                >
                  Work Email
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-white transition-all duration-200",
                    errors.email
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-slate-300 hover:border-slate-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
                  )}
                >
                  <Mail
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.email
                        ? "text-rose-500"
                        : "text-slate-400 group-focus-within:text-indigo-600"
                    )}
                  />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    disabled={isSubmitting}
                    className="h-11 w-full bg-transparent pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700"
                >
                  Password
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-white transition-all duration-200",
                    errors.password
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-slate-300 hover:border-slate-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100"
                  )}
                >
                  <Lock
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.password
                        ? "text-rose-500"
                        : "text-slate-400 group-focus-within:text-indigo-600"
                    )}
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    aria-invalid={!!errors.password}
                    disabled={isSubmitting}
                    className="h-11 w-full bg-transparent pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-600 focus:outline-hidden"
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
                  <p className="text-xs font-medium text-rose-600">
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
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
                    )}
                  >
                    {rememberMe && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="text-xs text-slate-700 transition-colors group-hover:text-slate-900">
                    Remember me
                  </span>
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:from-indigo-700 hover:to-indigo-600 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
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
              <div className="w-full border-t border-slate-300" />
              <span className="absolute bg-slate-50 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Or continue with
              </span>
            </div>

            {/* Google OAuth */}
            <GoogleAuthButton redirectTo={searchParams.get("redirectTo") ?? undefined} />

            {/* Disabled Enterprise SSO Button */}
            <div className="mt-3">
              <button
                type="button"
                disabled
                className="group relative flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm font-medium text-slate-500 opacity-60 cursor-not-allowed transition-all"
                title="Enterprise Single Sign-On (SAML 2.0 / Okta) is available on Enterprise tier"
              >
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>Enterprise SSO (SAML 2.0 / Okta)</span>
                <span className="ml-auto rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Enterprise
                </span>
              </button>
            </div>

            {/* 7-Day Free Trial Link */}
            <div className="mt-6 text-center text-xs text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-indigo-600 transition-colors hover:text-indigo-700 hover:underline"
              >
                Start a 7-day free trial
              </Link>
            </div>
          </div>

          {/* Left Footer: Legal & Support */}
          <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <Link href="/terms" className="transition-colors hover:text-slate-900">
              Terms of Service
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <Link href="/privacy" className="transition-colors hover:text-slate-900">
              Privacy Policy
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <a
              href="mailto:support@loadlinker.com"
              className="transition-colors hover:text-slate-900"
            >
              Support
            </a>
          </footer>
        </section>

        {/* Right Side: Background Image */}
        <section
          className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden lg:flex"
          style={{
            backgroundImage: backgroundImage ? `url('${backgroundImage}')` : "url('/images/turvo-skyline.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label="Portal Background"
        >
          {/* Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-slate-900/30" />
          <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

          {/* Live Clock & Date Display */}
          <div className="relative z-10 flex flex-col items-center text-center select-none px-6 py-8 rounded-3xl backdrop-blur-md bg-slate-900/30 border border-white/20">
            <div
              className="font-heading text-6xl font-light tracking-tight text-white xl:text-8xl"
              suppressHydrationWarning
            >
              {timeString || "12:00 PM"}
            </div>
            <div
              className="mt-3 text-xl font-normal tracking-wide text-slate-200 xl:text-2xl"
              suppressHydrationWarning
            >
              {dateString || "Loading date..."}
            </div>
            <div className="mt-6 flex items-center gap-2 rounded-full border border-white/30 bg-slate-900/50 px-4 py-1.5 backdrop-blur-md text-xs font-medium text-slate-100">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>Loadlinker TMS Global Network Active</span>
            </div>
          </div>

          {/* Bottom Right Attribution */}
          <div className="absolute bottom-6 right-8 z-10 hidden text-right xl:block">
            <p className="text-[11px] font-medium text-slate-200">
              Secure Operations Dispatch Node 01
            </p>
            <p className="text-[10px] text-slate-400">
              99.99% Uptime SLA • Encrypted SAML 2.0
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
