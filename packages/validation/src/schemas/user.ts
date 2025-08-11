import { z } from "@hono/zod-openapi";

// ユーザー関連のスキーマ
export const userSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  age: z.number().positive().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserSchema = createUserSchema.partial();

// 型のエクスポート
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
