import { useState, useCallback, useEffect } from "react";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function usePRChat(prUrl: string, review: unknown, reviewId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [input, setInput]           = useState("");

  useEffect(() => {
    if (!reviewId) return;
    setMessages([]);
    fetch(`/api/reviews/${reviewId}/messages`)
      .then(r => r.json())
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [reviewId]);

  const saveMessage = useCallback(async (msg: ChatMessage) => {
    if (!reviewId) return;
    await fetch(`/api/reviews/${reviewId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    }).catch(() => {});
  }, [reviewId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !prUrl) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsLoading(true);
    saveMessage(userMsg);

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    let assistantText = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, prUrl, review }),
      });

      if (!res.body) return;

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value);
        for (const line of raw.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text: t } = JSON.parse(payload);
            assistantText += t;
            setMessages(prev => [
              ...prev.slice(0, -1),
              { role: "assistant", content: assistantText },
            ]);
          } catch {}
        }
      }
    } catch {
      assistantText = "Sorry, something went wrong. Please try again.";
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: assistantText },
      ]);
    } finally {
      setIsLoading(false);
      if (assistantText) saveMessage({ role: "assistant", content: assistantText });
    }
  }, [messages, prUrl, review, isLoading, saveMessage]);

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, input, setInput, sendMessage, isLoading, clearMessages };
}
