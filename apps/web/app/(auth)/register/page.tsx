import { Card } from "@workspace/ui/components/card";
import RegisterForm from "@/components/register-form";
import { z } from "zod";
import { createUserSchema } from "@workspace/validation/user";

const RegisterPage = () => {
  const handleRegistration = async (data: z.infer<typeof createUserSchema>) => {
    console.log(data);
  };

  return (
    <Card>
      <RegisterForm onSubmit={handleRegistration} />
    </Card>
  );
};

export default RegisterPage;
