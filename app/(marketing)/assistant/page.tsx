import AgentChat from "@/components/ai/agent-chat";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/authentication";

export default async function AssistantPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:py-8">
      <AgentChat />
    </main>
  );
}
