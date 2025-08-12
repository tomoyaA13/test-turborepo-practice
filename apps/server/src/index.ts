import { Hono } from "hono";
import {
  getSupabase,
  supabaseMiddleware,
} from "./adapter/in/web/middleware/supabase-middleware";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema } from "@workspace/validation/user";

// 環境変数の型定義
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  API_KEY: string;
  ENVIRONMENT?: string;
};

// 型付きHonoアプリケーションの作成
const app = new Hono<{ Bindings: Bindings }>();

app.use("*", supabaseMiddleware());

// 基本的なルート
const route = app
  .get("/hello", (c) => c.text("Hello Cloudflare Workers!"))

  // 環境変数の使用例
  .get("/api/status", (c) => {
    const environment = c.env.ENVIRONMENT || "production";
    return c.json({
      status: "ok",
      environment,
      hasDatabase: !!c.env.DATABASE_URL,
      hasAuth: !!c.env.JWT_SECRET,
    });
  })
  .get("/api/users", async (c) => {
    const supabase = getSupabase(c);
    const { data, error } = await supabase.auth.getUser();

    if (error) console.log("error", error);

    if (!data?.user) {
      return c.json({
        message: "You are not logged in.",
      });
    }
    return c.json({
      message: "You are logged in!",
      userId: data.user,
    });
  })
  .post("/api/v1/users", zValidator("json", createUserSchema), async (c) => {
    const validated = c.req.valid("json");
    const { password, email, name } = validated;

    const supabase = getSupabase(c);

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      message: "User registered successfully",
      userId: data.user?.id,
    }, 201);
  });

export default app;

export type AppType = typeof route;
