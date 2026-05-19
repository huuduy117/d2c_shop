import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().min(9).max(15),
  pdpaConsented: z.boolean().refine((value) => value === true, {
    message: "Bạn phải đồng ý PDPA để tiếp tục.",
  }),
  pdpaVersion: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
