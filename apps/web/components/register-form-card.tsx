"use client";

import RegisterForm from "@/components/register-form";
import { Card } from "@workspace/ui/components/card";
import { z } from "zod";
import { createUserSchema } from "@workspace/validation/user";

const RegisterFormCard = () => {
  const handleRegistration = async (data: z.infer<typeof createUserSchema>) => {
    console.log(data);
  };
  return (
    <Card className={"p-10 m-10"}>
      <RegisterForm onSubmit={handleRegistration} />
    </Card>
  );
};

export default RegisterFormCard;
