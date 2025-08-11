import { z } from "@hono/zod-openapi";

export const createUserSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(8, "パスワードは8文字以上必要です")
      .regex(/[A-Z]/, "大文字を1文字以上含めてください")
      .regex(/[a-z]/, "小文字を1文字以上含めてください")
      .regex(/[0-9]/, "数字を1文字以上含めてください")
      .regex(/[^A-Za-z0-9]/, "特殊文字を1文字以上含めてください"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"], // エラーメッセージをconfirmPasswordフィールドに表示
  });

// 型のエクスポート
export type createUserType = z.infer<typeof createUserSchema>;
