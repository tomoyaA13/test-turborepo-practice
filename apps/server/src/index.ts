import { Hono } from "hono";
import { userSchema } from "@workspace/validation/user";

const app = new Hono();

const route = app.get("/hello", (c) => c.text("Hello Cloudflare Workers!"));

export default app;

export type AppType = typeof route;
