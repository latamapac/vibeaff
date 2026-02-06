"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTIONS = [
  "Show me a summary of platform health",
  "Which affiliates have the highest conversion rates?",
  "Help me write a SQL query for monthly revenue by program",
  "What security improvements should we prioritize?",
  "Draft a new affiliate onboarding campaign strategy",
  "Analyze our payout queue and suggest optimizations",
];

export default function AIAssistantPage() {
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;

    setError(null);
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);

    const token = localStorage.getItem("vibeaff_token");

    // Build conversation history (last 20 messages)
    const history = [...messages, userMsg]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${apiUrl}/v1/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;

          try {
            const { text } = JSON.parse(payload);
            if (text) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id
                    ? { ...m, content: m.content + text }
                    : m
                )
              );
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
      // Remove empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id));
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="section-header text-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#D7FF3B]/20 to-[#6B2B8C]/20 border border-white/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#D7FF3B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            AI Assistant
          </h1>
          <p className="text-xs text-[#8B8B9E] mt-1">Powered by Claude &mdash; ask anything about your platform</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-secondary text-xs">
            Clear chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="glass-card flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D7FF3B]/10 to-[#6B2B8C]/10 border border-white/[0.06] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#D7FF3B]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h2 className="text-[#F6F6F7] font-medium mb-1">How can I help?</h2>
            <p className="text-xs text-[#8B8B9E] mb-6 max-w-md">
              I have full context of your VibeAff platform — ask me about affiliate performance, payout management, integrations, security, or anything else.
            </p>
            <div className="grid gap-2 sm:grid-cols-2 max-w-lg w-full">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left text-xs text-[#8B8B9E] hover:text-[#F6F6F7] p-3 rounded-[10px] border border-white/[0.06] hover:border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[#D7FF3B]/10 border border-[#D7FF3B]/20 text-[#F6F6F7]"
                  : "bg-white/[0.04] border border-white/[0.06] text-[#F6F6F7]/90"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none [&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-white/10 [&_pre]:rounded-lg [&_code]:text-[#D7FF3B] [&_a]:text-[#D7FF3B] [&_strong]:text-[#F6F6F7] whitespace-pre-wrap">
                  {msg.content || (
                    <span className="inline-flex items-center gap-1 text-[#8B8B9E]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF3B] animate-pulse" />
                      Thinking...
                    </span>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 p-3 rounded-[10px] bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
          {error.includes("ANTHROPIC_API_KEY") && (
            <span className="block mt-1 text-[#8B8B9E]">
              Add your key to <code className="text-[#D7FF3B]">apps/api/.env</code>: ANTHROPIC_API_KEY=sk-ant-...
            </span>
          )}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your platform..."
            rows={1}
            className="input text-sm w-full resize-none pr-10 min-h-[42px] max-h-[120px]"
            disabled={streaming}
          />
          <div className="absolute right-2 bottom-2 text-[10px] text-[#8B8B9E]">
            {streaming ? "Streaming..." : "Enter to send"}
          </div>
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          className="btn-primary px-4 self-end disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
