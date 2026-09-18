import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  employeeId: z.string().min(1, "Required"),
  fullName: z.string().min(1, "Required"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", ""]).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface TeacherRecord {
  id: string;
  employeeId: string;
  fullName: string;
  gender: string | null;
  phone: string | null;
  department: string | null;
  designation: string | null;
  qualification: string | null;
  user: { email: string };
}

export function TeacherFormDialog({
  open,
  onClose,
  teacher,
}: {
  open: boolean;
  onClose: () => void;
  teacher: TeacherRecord | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(teacher);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", employeeId: "", fullName: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        teacher
          ? {
              email: teacher.user.email,
              employeeId: teacher.employeeId,
              fullName: teacher.fullName,
              gender: (teacher.gender as FormValues["gender"]) ?? "",
              phone: teacher.phone ?? "",
              department: teacher.department ?? "",
              designation: teacher.designation ?? "",
              qualification: teacher.qualification ?? "",
            }
          : { email: "", employeeId: "", fullName: "" }
      );
    }
  }, [open, teacher, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, gender: values.gender || undefined };
      if (isEdit && teacher) {
        const { email, employeeId, ...editable } = payload;
        void email;
        void employeeId;
        return api.patch(`/teachers/${teacher.id}`, editable);
      }
      return api.post("/teachers", payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Teacher updated" : "Teacher created");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      onClose();
    },
    onError: (err) => {
      const message = err instanceof AxiosError ? (err.response?.data?.message as string) : "Something went wrong";
      toast.error(message || "Failed to save teacher");
    },
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit teacher" : "Add teacher"}
      description={isEdit ? teacher?.fullName : "New teachers are created with password Password@123"}
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
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input id="employeeId" disabled={isEdit} {...register("employeeId")} />
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
            <Label htmlFor="department">Department</Label>
            <Input id="department" {...register("department")} />
          </div>
          <div>
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" {...register("designation")} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="qualification">Qualification</Label>
            <Input id="qualification" {...register("qualification")} />
          </div>
          <div className="col-span-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {isEdit ? "Save changes" : "Create teacher"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
