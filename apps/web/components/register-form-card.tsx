"use client";

import RegisterForm from "@/components/register-form";
import { Card } from "@workspace/ui/components/card";
import { z } from "zod";
import { createUserSchema } from "@workspace/validation/user";
import { honoClient } from "@/lib/hono-rpc-client";

const RegisterFormCard = () => {
  const handleRegistration = async (data: z.infer<typeof createUserSchema>) => {
    try {
      const res = await honoClient.api.v1.users.$post({
        json: data,
      });
      
      if (res.ok) {
        const result = await res.json();
        console.log("Registration successful:", result);
        // TODO: リダイレクトや成功メッセージの表示
      } else {
        console.error("Registration failed:", res.status);
        // TODO: エラーメッセージの表示
      }
    } catch (error) {
      console.error("Registration error:", error);
      // TODO: ネットワークエラーの処理
    }
  };
  return (
    <Card className={"p-10 m-10"}>
      <RegisterForm onSubmit={handleRegistration} />
    </Card>
  );
};

export default RegisterFormCard;
