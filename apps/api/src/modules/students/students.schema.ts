import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const createStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(), // if omitted, a default is generated
  admissionNumber: z.string().min(1).max(30),
  rollNumber: z.string().min(1).max(20),
  fullName: z.string().min(1).max(150),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  dateOfBirth: z.coerce.date().optional(),
  phone: z.string().max(20).optional(),
  guardianName: z.string().max(150).optional(),
  guardianPhone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
});

export const updateStudentSchema = createStudentSchema
  .omit({ email: true, password: true, admissionNumber: true })
  .partial();

export const listStudentsQuerySchema = paginationQuerySchema.extend({
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
