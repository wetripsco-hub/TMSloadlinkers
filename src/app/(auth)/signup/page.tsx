"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Briefcase,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  MailCheck,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const workspaceTypes = ["freight_brokerage", "truck_dispatch", "hybrid_enterprise"] as const;

const signupSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  workspaceType: z.enum(workspaceTypes, {
    errorMap: () => ({ message: "Select a workspace type" }),
  }),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid work email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

const workspaceTypeLabels: Record<(typeof workspaceTypes)[number], string> = {
  freight_brokerage: "Freight brokerage",
  truck_dispatch: "Truck dispatch",
  hybrid_enterprise: "Hybrid (brokerage + dispatch)",
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0B0F17]">
          <Loader2 className="h-8 w-8 animate-spin text-[#49c2f5]" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  // Live Clock & Date matching Turvo Wallpaper display
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
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { workspaceType: "freight_brokerage" },
  });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    setSubmittedEmail(values.email);
    const supabase = createClient();

    // A retried submission (double-click, or resuming after a prior attempt
    // got the auth account created but was interrupted before the company
    // was linked) already has a live session. Calling auth.signUp() again
    // in that case just fails with "already registered" and dead-ends the
    // form, so skip straight to linking the company for an existing session
    // instead of re-registering.
    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    const isSameUserRetry =
      existingSession?.user.email?.toLowerCase() === values.email.toLowerCase();

    if (existingSession && !isSameUserRetry) {
      await supabase.auth.signOut();
    }

    let userId = isSameUserRetry ? existingSession?.user.id : undefined;

    if (!userId) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });

      if (signUpError) {
        const alreadyRegistered = /already registered|already exists/i.test(
          signUpError.message
        );
        setFormError(
          alreadyRegistered
            ? "An account with this email already exists. Log in to finish setting up your company."
            : signUpError.message
        );
        return;
      }

      if (!signUpData.session || !signUpData.user) {
        setCheckEmail(true);
        return;
      }

      userId = signUpData.user.id;
    }

    // Atomic + idempotent: creates the organization and links this profile
    // to it in one server-side transaction. If a prior attempt already
    // linked an org for this user, it returns that org_id instead of
    // erroring or creating a duplicate.
    const { error: onboardingError } = await supabase.rpc("complete_onboarding", {
      p_org_name: values.orgName,
      p_workspace_type: values.workspaceType,
      p_full_name: values.fullName,
    });

    if (onboardingError) {
      setFormError(onboardingError.message);
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/overview";
    router.push(redirectTo);
    router.refresh();
  }

  // Check Email State Screen
  if (checkEmail) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-[#0B0F17] text-white selection:bg-[#49c2f5] selection:text-[#0B0F17]">
        {/* Header Bar */}
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
              We sent a confirmation link to{" "}
              <span className="font-semibold text-white">{submittedEmail || "your inbox"}</span>.
              Follow it to verify your account and activate your dispatch cockpit.
            </p>

            <div className="mt-6 rounded-xl border border-white/10 bg-[#0B0F17]/80 p-4 text-left text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                <CheckCircle2 className="h-4 w-4 text-[#00d084]" />
                <span>Next steps</span>
              </div>
              <p>1. Open the verification email from FreightLink TMS.</p>
              <p>2. Click the secure confirmation link.</p>
              <p>3. Return here or proceed to complete your organization setup.</p>
            </div>

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
      {/* Top Brand Bar */}
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
          <span className="hidden sm:inline-block">Already have an account?</span>
          <Link
            href="/login"
            className="font-semibold text-[#49c2f5] transition-colors hover:text-[#7cd4fd] hover:underline"
          >
            Sign In
          </Link>
          <span className="hidden h-3 w-px bg-white/15 sm:inline-block" />
          <a
            href="mailto:support@freightlinktms.com"
            className="hidden font-medium text-slate-400 transition-colors hover:text-white sm:inline-block"
          >
            Contact Support
          </a>
        </div>
      </header>

      {/* Main Split Layout: Left Form Panel + Right Full-screen Night City Skyline */}
      <div className="relative flex flex-1 flex-col lg:flex-row">
        {/* Left Side: Enterprise Auth Panel */}
        <section className="relative z-20 flex w-full flex-col justify-between border-r border-white/10 bg-[#0E131F] px-6 py-8 sm:px-10 sm:py-9 lg:w-[480px] xl:w-[520px] lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto">
          {/* Subtle Ambient Radial Glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#49c2f5]/10 blur-3xl"
          />

          <div className="w-full max-w-md mx-auto my-auto">
            {/* Form Header */}
            <div className="mb-5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Create your account
              </h1>
              <p className="mt-1.5 text-xs text-slate-400 sm:text-sm">
                Start your 14-day free trial. No credit card required.
              </p>
            </div>

            {/* Error Alert */}
            {formError && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <div className="flex-1 font-normal leading-relaxed">{formError}</div>
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
              {/* Organization / Company Name */}
              <div className="space-y-1">
                <label
                  htmlFor="orgName"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  Company / Organization Name
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-[#0B0F17] transition-all duration-200",
                    errors.orgName
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-white/15 hover:border-white/25 focus-within:border-[#49c2f5] focus-within:ring-2 focus-within:ring-[#49c2f5]/20"
                  )}
                >
                  <Building2
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.orgName
                        ? "text-rose-400"
                        : "text-slate-400 group-focus-within:text-[#49c2f5]"
                    )}
                  />
                  <input
                    id="orgName"
                    type="text"
                    placeholder="e.g. Apex Logistics Inc."
                    autoComplete="organization"
                    aria-invalid={!!errors.orgName}
                    disabled={isSubmitting}
                    className="h-10 w-full bg-transparent pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("orgName")}
                  />
                </div>
                {errors.orgName && (
                  <p className="text-xs font-medium text-rose-400">
                    {errors.orgName.message}
                  </p>
                )}
              </div>

              {/* Workspace Type */}
              <div className="space-y-1">
                <label
                  htmlFor="workspaceType"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  Workspace Type
                </label>
                <div className="relative flex items-center">
                  <Briefcase className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400 z-10" />
                  <Controller
                    name="workspaceType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="workspaceType"
                          className={cn(
                            "h-10 w-full rounded-xl border bg-[#0B0F17] pl-10 pr-3.5 text-sm text-white transition-all duration-200",
                            errors.workspaceType
                              ? "border-rose-500/60 ring-2 ring-rose-500/20"
                              : "border-white/15 hover:border-white/25 focus-visible:border-[#49c2f5] focus-visible:ring-2 focus-visible:ring-[#49c2f5]/20"
                          )}
                        >
                          <SelectValue placeholder="Select a workspace type" />
                        </SelectTrigger>
                        <SelectContent className="border-white/10 bg-[#141824] text-white shadow-xl">
                          {workspaceTypes.map((type) => (
                            <SelectItem
                              key={type}
                              value={type}
                              className="cursor-pointer text-slate-200 hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white"
                            >
                              {workspaceTypeLabels[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                {errors.workspaceType && (
                  <p className="text-xs font-medium text-rose-400">
                    {errors.workspaceType.message}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label
                  htmlFor="fullName"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300"
                >
                  Full Name
                </label>
                <div
                  className={cn(
                    "group relative flex items-center rounded-xl border bg-[#0B0F17] transition-all duration-200",
                    errors.fullName
                      ? "border-rose-500/60 ring-2 ring-rose-500/20"
                      : "border-white/15 hover:border-white/25 focus-within:border-[#49c2f5] focus-within:ring-2 focus-within:ring-[#49c2f5]/20"
                  )}
                >
                  <User
                    className={cn(
                      "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors",
                      errors.fullName
                        ? "text-rose-400"
                        : "text-slate-400 group-focus-within:text-[#49c2f5]"
                    )}
                  />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="e.g. Sarah Jenkins"
                    autoComplete="name"
                    aria-invalid={!!errors.fullName}
                    disabled={isSubmitting}
                    className="h-10 w-full bg-transparent pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs font-medium text-rose-400">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Work Email */}
              <div className="space-y-1">
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
                    className="h-10 w-full bg-transparent pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs font-medium text-rose-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
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
                    placeholder="•••••••••••• (min. 8 characters)"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    disabled={isSubmitting}
                    className="h-10 w-full bg-transparent pl-10 pr-11 text-sm text-white placeholder:text-slate-500 focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
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

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00A3E0] via-[#2488E5] to-[#2B7EE2] px-4 text-sm font-semibold text-white shadow-lg shadow-[#00A3E0]/20 transition-all duration-200 hover:from-[#22B3EB] hover:to-[#368AF0] hover:shadow-[#00A3E0]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Setting up your organization...</span>
                    </>
                  ) : (
                    <span>Start 14-Day Free Trial</span>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Link to Sign In */}
            <div className="mt-5 text-center text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#49c2f5] transition-colors hover:text-[#7cd4fd] hover:underline"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Left Footer: Legal & Support */}
          <footer className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-500">
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
              Secure Operations Onboarding Node
            </p>
            <p className="text-[10px] text-white/50 drop-shadow-sm">
              Instant 14-Day Sandbox Access • No Card Required
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
