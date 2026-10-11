import Link from "next/link";
import { Music2 } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/authentication";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/assistant");

  return (
    <main className="flex min-h-[calc(100svh-4.5rem)] flex-1">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-8 sm:px-10">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="neon-mark flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Music2 className="size-4" />
            </span>
            prod.ai
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}
