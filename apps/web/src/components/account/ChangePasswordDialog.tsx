import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[0-9]/, "Needs a number")
      .regex(/[^A-Za-z0-9]/, "Needs a special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type FormValues = z.infer<typeof schema>;

function strengthScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { logout } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const newPassword = watch("newPassword") ?? "";
  const score = strengthScore(newPassword);
  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong", "Very strong"][score];
  const strengthColor = ["bg-danger", "bg-danger", "bg-warning", "bg-warning", "bg-positive", "bg-positive"][score];

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await api.post("/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password changed. Please sign in again.");
      reset();
      onClose();
      await logout();
    } catch (err) {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      setServerError(message || "Could not change password");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        setServerError(null);
        onClose();
      }}
      title="Change password"
      description="You'll be signed out of all sessions after this change."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && <div className="rounded-md bg-danger/10 text-danger text-sm px-3 py-2">{serverError}</div>}

        <div>
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" type="password" autoComplete="current-password" {...register("currentPassword")} />
          {errors.currentPassword && <p className="text-xs text-danger mt-1">{errors.currentPassword.message}</p>}
        </div>

        <div>
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" {...register("newPassword")} />
          {newPassword.length > 0 && (
            <div className="mt-1.5">
              <div className="h-1 w-full rounded-full bg-surface-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${strengthColor}`} style={{ width: `${(score / 5) * 100}%` }} />
              </div>
              <p className="text-[11px] text-ink-muted mt-1">{strengthLabel}</p>
            </div>
          )}
          {errors.newPassword && <p className="text-xs text-danger mt-1">{errors.newPassword.message}</p>}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Change password"}
        </Button>
      </form>
    </Dialog>
  );
}
