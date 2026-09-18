import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Dialog } from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";

interface SectionOption { id: string; name: string; class: { name: string } }
interface Subject { id: string; name: string }
interface TeacherOption { id: string; fullName: string }
interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subject: { name: string };
  teacher: { fullName: string };
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const schema = z.object({
  subjectId: z.string().min(1, "Required"),
  teacherId: z.string().min(1, "Required"),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().min(1, "Required"),
  endTime: z.string().min(1, "Required"),
  room: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function AddSlotDialog({ open, onClose, sectionId }: { open: boolean; onClose: () => void; sectionId: string }) {
  const queryClient = useQueryClient();
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academic/subjects")).data.data as Subject[],
    enabled: open,
  });
  const { data: teachers } = useQuery({
    queryKey: ["teachers", "all-for-select"],
    queryFn: async () => (await api.get("/teachers", { params: { limit: 100 } })).data.data as TeacherOption[],
    enabled: open,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { subjectId: "", teacherId: "", dayOfWeek: 1, startTime: "09:00", endTime: "09:50", room: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post("/academic/timetable", { ...values, sectionId }),
    onSuccess: () => {
      toast.success("Slot added");
      queryClient.invalidateQueries({ queryKey: ["timetable", sectionId] });
      reset();
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to add slot — check for scheduling conflicts");
    },
  });

  return (
    <Dialog open={open} onClose={onClose} title="Add timetable slot">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="subjectId">Subject</Label>
            <Select id="subjectId" {...register("subjectId")}>
              <option value="">Select</option>
              {subjects?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            {errors.subjectId && <p className="text-xs text-danger mt-1">{errors.subjectId.message}</p>}
          </div>
          <div>
            <Label htmlFor="teacherId">Teacher</Label>
            <Select id="teacherId" {...register("teacherId")}>
              <option value="">Select</option>
              {teachers?.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
            {errors.teacherId && <p className="text-xs text-danger mt-1">{errors.teacherId.message}</p>}
          </div>
          <div className="col-span-2">
            <Label htmlFor="dayOfWeek">Day</Label>
            <Select id="dayOfWeek" {...register("dayOfWeek")}>
              {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="startTime">Start time</Label>
            <Input id="startTime" type="time" {...register("startTime")} />
          </div>
          <div>
            <Label htmlFor="endTime">End time</Label>
            <Input id="endTime" type="time" {...register("endTime")} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="room">Room (optional)</Label>
            <Input id="room" {...register("room")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>Add slot</Button>
        </div>
      </form>
    </Dialog>
  );
}

export function TimetablePage() {
  const queryClient = useQueryClient();
  const [sectionId, setSectionId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: sections } = useQuery({
    queryKey: ["sections", "all"],
    queryFn: async () => (await api.get("/academic/sections")).data.data as SectionOption[],
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ["timetable", sectionId],
    queryFn: async () => (await api.get(`/academic/timetable/section/${sectionId}`)).data.data as TimetableSlot[],
    enabled: Boolean(sectionId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academic/timetable/${id}`),
    onSuccess: () => {
      toast.success("Slot removed");
      queryClient.invalidateQueries({ queryKey: ["timetable", sectionId] });
    },
    onError: () => toast.error("Failed to remove slot"),
  });

  const slotsByDay = DAYS.map((_, dayIndex) =>
    (slots ?? []).filter((s) => s.dayOfWeek === dayIndex).sort((a, b) => (a.startTime > b.startTime ? 1 : -1))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Timetable</h1>
          <p className="text-sm text-ink-muted mt-0.5">Weekly schedule per section</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="w-56" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Select a section</option>
            {sections?.map((s) => (
              <option key={s.id} value={s.id}>{s.class.name} — {s.name}</option>
            ))}
          </Select>
          <Button disabled={!sectionId} onClick={() => setDialogOpen(true)}>
            <Plus size={15} /> Add slot
          </Button>
        </div>
      </div>

      {!sectionId ? (
        <Card className="py-16 text-center">
          <CalendarClock className="mx-auto text-ink-muted mb-3" size={24} />
          <p className="text-sm text-ink-muted">Select a section to view its timetable.</p>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day, dayIndex) => (
            <Card key={day}>
              <CardContent className="pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-3">{day}</p>
                {slotsByDay[dayIndex].length === 0 ? (
                  <p className="text-sm text-ink-muted">No classes</p>
                ) : (
                  <div className="space-y-2">
                    {slotsByDay[dayIndex].map((slot) => (
                      <div key={slot.id} className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{slot.subject.name}</p>
                          <p className="text-xs text-ink-muted truncate">{slot.teacher.fullName}</p>
                          <p className="figure text-xs text-ink-muted">
                            {slot.startTime}–{slot.endTime}{slot.room ? ` · ${slot.room}` : ""}
                          </p>
                        </div>
                        <button onClick={() => deleteMutation.mutate(slot.id)} className="text-ink-muted hover:text-danger transition-colors shrink-0">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {sectionId && <AddSlotDialog open={dialogOpen} onClose={() => setDialogOpen(false)} sectionId={sectionId} />}
    </div>
  );
}
