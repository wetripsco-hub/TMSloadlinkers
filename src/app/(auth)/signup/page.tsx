"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const workspaceTypes = ["freight_brokerage", "truck_dispatch", "hybrid_enterprise"] as const;

const signupSchema = z.object({
  orgName: z.string().min(2, "Organization name is required"),
  workspaceType: z.enum(workspaceTypes, {
    errorMap: () => ({ message: "Select a workspace type" }),
  }),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignupValues = z.infer<typeof signupSchema>;

const workspaceTypeLabels: Record<(typeof workspaceTypes)[number], string> = {
  freight_brokerage: "Freight brokerage",
  truck_dispatch: "Truck dispatch",
  hybrid_enterprise: "Hybrid (brokerage + dispatch)",
};

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    const supabase = createClient();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });

    if (signUpError) {
      setFormError(signUpError.message);
      return;
    }

    if (!signUpData.session || !signUpData.user) {
      setCheckEmail(true);
      return;
    }

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: values.orgName, workspace_type: values.workspaceType })
      .select("id")
      .single();

    if (orgError || !org) {
      setFormError(orgError?.message ?? "Could not create organization");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ org_id: org.id, full_name: values.fullName, role: "owner" })
      .eq("id", signUpData.user.id);

    if (profileError) {
      setFormError(profileError.message);
      return;
    }

    router.push("/loads");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent you a confirmation link. Follow it to finish setting up your account.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Set up your organization to get started.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="orgName">Organization name</Label>
              <Input
                id="orgName"
                autoComplete="organization"
                aria-invalid={!!errors.orgName}
                {...register("orgName")}
              />
              {errors.orgName && (
                <p className="text-sm text-destructive">{errors.orgName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workspaceType">Workspace type</Label>
              <Controller
                name="workspaceType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="workspaceType" className="w-full">
                      <SelectValue placeholder="Select a workspace type" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {workspaceTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.workspaceType && (
                <p className="text-sm text-destructive">{errors.workspaceType.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                autoComplete="name"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
