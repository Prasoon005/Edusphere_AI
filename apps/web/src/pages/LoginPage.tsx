import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Loader2 } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/Select";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  reason: z.string().max(500).optional(),
});
type ForgotValues = z.infer<typeof forgotSchema>;

function ForgotPasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(values: ForgotValues) {
    try {
      const res = await api.post("/password-reset/request", values);
      toast.success(res.data.message ?? "Request submitted");
      reset();
      onClose();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Request account recovery"
      description="An administrator will verify your identity before you can set a new password."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="forgot-email">Email</Label>
          <Input id="forgot-email" type="email" placeholder="you@edusphere.ai" {...register("email")} />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <Label htmlFor="forgot-reason">Reason (optional)</Label>
          <Textarea id="forgot-reason" rows={3} placeholder="e.g. lost access to my old device" {...register("reason")} />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Submit request"}
        </Button>
      </form>
    </Dialog>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const user = await login(values.email, values.password);
      const dest = user.role === "SUPER_ADMIN" ? "/admin" : user.role === "TEACHER" ? "/teacher" : "/student";
      navigate(dest, { replace: true });
    } catch (err) {
      if (err instanceof AxiosError && err.response) {
        // The server responded — this is a real, specific error (wrong password, etc).
        setServerError((err.response.data?.message as string) || "Invalid email or password");
      } else {
        // No response at all: the request never reached the API. Don't call this
        // "invalid credentials" — that hides the real problem.
        setServerError(
          "Could not reach the server. Check that the API is running and VITE_API_URL / the dev proxy is configured correctly."
        );
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-3">
            <GraduationCap size={20} />
          </div>
          <h1 className="font-display text-lg font-semibold text-ink">EduSphere AI</h1>
          <p className="text-sm text-ink-muted mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-surface border border-border rounded-lg shadow-soft p-6 space-y-4">
          {serverError && (
            <div className="rounded-md bg-danger/10 text-danger text-sm px-3 py-2">{serverError}</div>
          )}

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="username" placeholder="you@edusphere.ai" {...register("email")} />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Sign in"}
          </Button>

          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="block w-full text-center text-xs text-primary hover:underline"
          >
            Forgot password?
          </button>
        </form>

        <p className="text-xs text-ink-muted text-center mt-6">
          Seeded accounts use the password <span className="figure text-ink">Password@123</span>
        </p>
        <p className="text-xs text-ink-muted text-center mt-2">
          <Link to="/" className="hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
}
