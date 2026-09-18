import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Send, MessageSquare, Star } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface FeedbackItem {
  id: string;
  subject: string;
  message: string;
  rating: number | null;
  createdAt: string;
  sender?: { email: string; role: string };
  receiver?: { email: string; role: string };
}
interface RecipientOption {
  id: string;
  fullName: string;
  user: { id: string };
}

const schema = z.object({
  recipientQuery: z.string().min(1, "Select a recipient"),
  receiverId: z.string().min(1, "Select a recipient"),
  subject: z.string().min(1, "Required").max(200),
  message: z.string().min(1, "Required").max(3000),
  rating: z.coerce.number().int().min(0).max(5).optional(),
});
type FormValues = z.infer<typeof schema>;

function SendFeedbackForm() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const recipientEndpoint = user?.role === "TEACHER" ? "/students" : "/teachers";

  const { data: recipients } = useQuery({
    queryKey: ["feedback", "recipients", recipientEndpoint, debouncedSearch],
    queryFn: async () =>
      (await api.get(recipientEndpoint, { params: { search: debouncedSearch || undefined, limit: 10 } })).data
        .data as RecipientOption[],
    enabled: debouncedSearch.length > 0,
  });

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { recipientQuery: "", receiverId: "", subject: "", message: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      api.post("/feedback", { receiverId: values.receiverId, subject: values.subject, message: values.message, rating: values.rating || undefined }),
    onSuccess: () => {
      toast.success("Feedback sent");
      queryClient.invalidateQueries({ queryKey: ["feedback", "sent"] });
      reset();
      setSearch("");
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to send feedback");
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <div>
        <Label htmlFor="recipientQuery">{user?.role === "TEACHER" ? "Student" : "Teacher"}</Label>
        <Input
          id="recipientQuery"
          placeholder="Type a name to search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setValue("recipientQuery", e.target.value);
            setValue("receiverId", "");
          }}
        />
        {errors.receiverId && <p className="text-xs text-danger mt-1">{errors.receiverId.message}</p>}
        {recipients && recipients.length > 0 && (
          <div className="mt-1 border border-border rounded-md overflow-hidden max-h-40 overflow-y-auto">
            {recipients.map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => {
                  setValue("receiverId", r.user.id);
                  setSearch(r.fullName);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors"
              >
                {r.fullName}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" {...register("subject")} />
        {errors.subject && <p className="text-xs text-danger mt-1">{errors.subject.message}</p>}
      </div>
      <div>
        <Label htmlFor="rating">Rating (optional)</Label>
        <Select id="rating" {...register("rating")}>
          <option value="">No rating</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
        </Select>
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={4} {...register("message")} />
        {errors.message && <p className="text-xs text-danger mt-1">{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        <Send size={15} /> Send feedback
      </Button>
    </form>
  );
}

function FeedbackList({ scope }: { scope: "received" | "sent" }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ["feedback", scope],
    queryFn: async () => (await api.get(`/feedback/${scope}`, { params: { page: 1, limit: 20 } })).data.data as FeedbackItem[],
  });

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!items || items.length === 0) {
    return (
      <Card className="py-16 text-center">
        <MessageSquare className="mx-auto text-ink-muted mb-3" size={24} />
        <p className="text-sm text-ink-muted">No feedback {scope} yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((f) => (
        <Card key={f.id}>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">{f.subject}</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  {scope === "received" ? f.sender?.email : f.receiver?.email} · {new Date(f.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!!f.rating && (
                <div className="flex items-center gap-0.5 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < f.rating! ? "fill-accent text-accent" : "text-border"} />
                  ))}
                </div>
              )}
            </div>
            <p className="text-sm text-ink-muted mt-2">{f.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FeedbackPage() {
  const [tab, setTab] = useState<"received" | "sent" | "send">("received");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Feedback</h1>
        <p className="text-sm text-ink-muted mt-0.5">Exchange feedback between teachers and students</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["received", "sent", "send"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t === "received" ? "Received" : t === "sent" ? "Sent" : "Send new"}
          </button>
        ))}
      </div>

      {tab === "received" && <FeedbackList scope="received" />}
      {tab === "sent" && <FeedbackList scope="sent" />}
      {tab === "send" && (
        <Card>
          <CardContent className="pt-5">
            <SendFeedbackForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
