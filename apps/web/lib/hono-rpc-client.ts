import { hc } from "hono/client";
import { AppType } from "@apps/server";

console.log("honoClient が作成されました！");

export const honoClient = hc<AppType>("http://localhost:8787/");
