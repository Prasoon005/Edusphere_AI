import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { ClassOption } from "@/types/academic";

const createSchema = z.object({
  email: z.string().email("Enter a valid email"),
  admissionNumber: z.string().min(1, "Required"),
  rollNumber: z.string().min(1, "Required"),
  fullName: z.string().min(1, "Required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", ""]).optional(),
  phone: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
});
type FormValues = z.infer<typeof createSchema>;

interface StudentRecord {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  fullName: string;
  gender: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  classId: string | null;
  sectionId: string | null;
  user: { email: string };
}

export function StudentFormDialog({
  open,
  onClose,
  student,
}: {
  open: boolean;
  onClose: () => void;
  student: StudentRecord | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(student);

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academic/classes")).data.data as ClassOption[],
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: "", admissionNumber: "", rollNumber: "", fullName: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        student
          ? {
              email: student.user.email,
              admissionNumber: student.admissionNumber,
              rollNumber: student.rollNumber,
              fullName: student.fullName,
              gender: (student.gender as FormValues["gender"]) ?? "",
              phone: student.phone ?? "",
              guardianName: student.guardianName ?? "",
              guardianPhone: student.guardianPhone ?? "",
              classId: student.classId ?? "",
              sectionId: student.sectionId ?? "",
            }
          : { email: "", admissionNumber: "", rollNumber: "", fullName: "" }
      );
    }
  }, [open, student, reset]);

  const selectedClassId = watch("classId");
  const availableSections = classes?.find((c) => c.id === selectedClassId)?.sections ?? [];

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        gender: values.gender || undefined,
        classId: values.classId || undefined,
        sectionId: values.sectionId || undefined,
      };
      if (isEdit && student) {
        const { email, admissionNumber, ...editable } = payload;
        void email;
        void admissionNumber;
        return api.patch(`/students/${student.id}`, editable);
      }
      return api.post("/students", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Student updated" : "Student created");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to save student");
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit student" : "Add student"}
      description={isEdit ? student?.fullName : "New students are created with password Password@123"}
    >
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
          </div>
          <div className="col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" disabled={isEdit} {...register("email")} />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label htmlFor="admissionNumber">Admission #</Label>
            <Input id="admissionNumber" disabled={isEdit} {...register("admissionNumber")} />
          </div>
          <div>
            <Label htmlFor="rollNumber">Roll #</Label>
            <Input id="rollNumber" {...register("rollNumber")} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" {...register("gender")}>
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
          <div>
            <Label htmlFor="classId">Class</Label>
            <Select id="classId" {...register("classId")}>
              <option value="">Unassigned</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sectionId">Section</Label>
            <Select id="sectionId" disabled={!selectedClassId} {...register("sectionId")}>
              <option value="">Unassigned</option>
              {availableSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="guardianName">Guardian name</Label>
            <Input id="guardianName" {...register("guardianName")} />
          </div>
          <div>
            <Label htmlFor="guardianPhone">Guardian phone</Label>
            <Input id="guardianPhone" {...register("guardianPhone")} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {isEdit ? "Save changes" : "Create student"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
