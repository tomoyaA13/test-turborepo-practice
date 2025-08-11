import { Button } from "@workspace/ui/components/button";
import { honoClient } from "@/lib/hono-rpc-client";
import Link from "next/link";

export default async function Page() {
  const res = await honoClient.hello.$get();

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
        <Button>
          <Link href={"/register"}>Register</Link>
        </Button>
      </div>
    );
  }
}
