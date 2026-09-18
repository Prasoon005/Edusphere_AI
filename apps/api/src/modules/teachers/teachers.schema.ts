import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  employeeId: z.string().min(1).max(30),
  fullName: z.string().min(1).max(150),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  phone: z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  qualification: z.string().max(200).optional(),
  joiningDate: z.coerce.date().optional(),
  address: z.string().max(500).optional(),
});

export const updateTeacherSchema = createTeacherSchema
  .omit({ email: true, password: true, employeeId: true })
  .partial();

export const listTeachersQuerySchema = paginationQuerySchema.extend({
  department: z.string().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
