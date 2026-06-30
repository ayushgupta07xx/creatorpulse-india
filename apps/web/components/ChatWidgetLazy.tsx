"use client";

import dynamic from "next/dynamic";

// Lazy-load the assistant: it's heavy (streaming, markdown, tool UI) and never
// needed in the first paint, so keep it out of every route's first-load bundle.
// ssr:false is allowed here because this is a client component.
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), {
  ssr: false,
});

export default function ChatWidgetLazy() {
  return <ChatWidget />;
}
