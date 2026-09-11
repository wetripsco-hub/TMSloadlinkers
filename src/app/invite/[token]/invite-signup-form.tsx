"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MailCheck } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const MIN_PASSWORD_LENGTH = 8;

export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Enter your full name");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();

    // options.data lands in auth.users.raw_user_meta_data (user_metadata),
    // available immediately on the auth user regardless of whether email
    // confirmation is required -- acceptInvite (settings/team/actions.ts)
    // reads user_metadata.full_name from there once a session exists,
    // since this form runs before any profiles row can be updated.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/invite/${token}`,
      },
    });

    if (signUpError) {
      const alreadyRegistered = /already registered|already exists/i.test(signUpError.message);
      setError(
        alreadyRegistered
          ? "An account with this email already exists. Log in to accept this invite."
          : signUpError.message
      );
      setIsSubmitting(false);
      return;
    }

    if (!data.session) {
      // Email confirmation is required -- signUp created the auth user (and
      // its user_metadata) but no session yet. emailRedirectTo above brings
      // them back to this same /invite/[token] URL once confirmed, where
      // the server component (page.tsx) will then see an authenticated
      // user and call acceptInvite.
      setCheckEmail(true);
      setIsSubmitting(false);
      return;
    }

    // A session came back immediately -- re-render this route server-side
    // so page.tsx's authenticated branch picks it up and calls acceptInvite.
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs">
        <MailCheck className="mx-auto h-10 w-10 text-blue-600" />
        <h1 className="mt-4 text-base font-semibold text-slate-900">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          We sent a confirmation link to <span className="font-medium text-slate-700">{email}</span>.
          Follow it to finish accepting your invite.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <h1 className="text-base font-semibold text-slate-900">Accept your invite</h1>
      <p className="mt-1 text-sm text-slate-500">Create your account to join this organization.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input id="email" type="email" value={email} readOnly disabled className="bg-slate-50" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">
            Full name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="fullName"
            autoComplete="name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Jane Dispatcher"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">
            Password <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-1">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create account &amp; join
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-500">
        Already have an account?{" "}
        <Link href={`/login?redirectTo=/invite/${token}`} className="font-medium text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
