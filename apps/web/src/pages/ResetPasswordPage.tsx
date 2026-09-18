import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { GraduationCap, Loader2, ShieldCheck } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[0-9]/, "Needs a number")
      .regex(/[^A-Za-z0-9]/, "Needs a special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const requestId = params.get("requestId");
  const token = params.get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api.post("/password-reset/complete", { requestId, token, newPassword: values.newPassword });
      setDone(true);
    } catch (err) {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      setServerError(message || "This link is invalid or has expired");
    }
  }

  if (!requestId || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-ink-muted">This reset link is missing required information.</p>
          <Link to="/login" className="text-sm text-primary hover:underline mt-3 inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-positive/10 text-positive mx-auto mb-3">
            <ShieldCheck size={20} />
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">Password reset</h1>
          <p className="text-sm text-ink-muted mt-1">You can now sign in with your new password.</p>
          <Button className="mt-5" onClick={() => navigate("/login")}>
            Go to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-3">
            <GraduationCap size={20} />
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">Set a new password</h1>
          <p className="text-sm text-ink-muted mt-1">Your recovery request was approved.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border rounded-lg shadow-soft p-6 space-y-4">
          {serverError && <div className="rounded-md bg-danger/10 text-danger text-sm px-3 py-2">{serverError}</div>}
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
            {errors.newPassword && <p className="text-xs text-danger mt-1">{errors.newPassword.message}</p>}
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
            {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Set new password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
