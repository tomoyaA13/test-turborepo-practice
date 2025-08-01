import { Hono } from "hono";
import { hc } from "hono/client";

const app = new Hono();

const route = app.get("/hello", (c) => c.text("Hello Cloudflare Workers!"));

export default app;

export type AppType = typeof route;

// Hono クライアントを生成する関数をエクスポート
type ClientType = typeof hc<AppType>;
export const createClient = (
  ...args: Parameters<ClientType>
): ReturnType<ClientType> => {
  return hc<AppType>(...args);
};
