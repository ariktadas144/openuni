import type { Metadata } from "next";

import { ChatWorkspace } from "@/components/chat-workspace";

export const metadata: Metadata = {
  title: "Ask",
  description:
    "Ask a question about your university and get an answer grounded in official documents, with citations.",
};

export default function HomePage() {
  return <ChatWorkspace />;
}
