import { Hono } from "hono";
import { userSchema } from "@workspace/validation/user";

// 環境変数の型定義
type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  API_KEY: string;
  ENVIRONMENT?: string;
};

// 型付きHonoアプリケーションの作成
const app = new Hono<{ Bindings: Bindings }>();

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

  // APIキーを使った認証の例
  .post("/api/protected", async (c) => {
    const apiKey = c.req.header("X-API-Key");

    if (!apiKey || apiKey !== c.env.API_KEY) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // 認証されたリクエストの処理
    return c.json({ message: "Authenticated request" });
  });

export default app;

export type AppType = typeof route;
