import { Button } from "@workspace/ui/components/button";
import { hc } from "hono/client";
import type { AppType } from "@apps/server";

export default async function Page() {
  const client = hc<AppType>("http://localhost:8787/");
  const res = await client.hello.$get();

  console.log(res);

  if (res.ok) {
    const textData = await res.text();
    console.log(textData);
    return (
      <div className="flex items-center justify-center min-h-svh">
        <div className="flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold">{textData}</h1>
          <Button size="sm">Button</Button>
        </div>
      </div>
    );
  }
}
