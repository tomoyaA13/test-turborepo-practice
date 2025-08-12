import { hc } from "hono/client";
import { AppType } from "@apps/server";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.log("process.env.NEXT_PUBLIC_API_URL が設定されていません");
}

console.log("honoClient が作成されました！");

export const honoClient = hc<AppType>(process.env.NEXT_PUBLIC_API_URL!);
