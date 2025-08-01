import { Hono } from "hono";
import { hc } from "hono/client";

const app = new Hono();

const route = app.get("/hello", (c) => c.text("Hello Cloudflare Workers!"));

export default app;

export type AppType = typeof route;
