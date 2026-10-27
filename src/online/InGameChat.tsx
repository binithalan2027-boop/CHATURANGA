import { useState, useEffect, useRef } from "react";
import type { ChatMessage } from "./types";
import { api } from "./client";

interface InGameChatProps {
  roomCode: string;
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage?: (text: string) => Promise<void>;
  isCustom?: boolean;
}

const QUICK_REACTIONS = [
  "Good luck! 🍀",
  "Nice move! 🎯",
  "Well played! 👏",
  "Thanks for the game! 🤝",
  "Rematch? 🔄",
  "Thinking... 🤔",
  "Oops! 😅",
];

export default function InGameChat({
  roomCode,
  messages,
  currentUserId,
  onSendMessage,
}: InGameChatProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (onSendMessage) {
        await onSendMessage(text);
      } else {
        await api("chat", { room: roomCode, text });
      }
      if (!textToSend) setInput("");
    } catch {
      // Ignore transient chat errors
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#181818] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 bg-[#202020] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#AFF65B] animate-pulse" />
          <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-white">Live Match Chat</h4>
        </div>
        <span className="text-[11px] text-[#888] font-mono">
          {messages.length} msg{messages.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Messages Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-[160px] max-h-[300px] scrollbar-thin scrollbar-thumb-white/20"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#777]">
            <span className="text-2xl mb-1">💬</span>
            <p className="text-xs m-0">No messages yet.</p>
            <p className="text-[11px] text-[#555] m-0">Say hi to your opponent!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === currentUserId;
            const timeStr = new Date(m.at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-semibold text-[#888]">
                    {isMe ? "You" : m.senderName}
                  </span>
                  <span className="text-[9px] text-[#555] font-mono">{timeStr}</span>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] break-words leading-relaxed ${
                    isMe
                      ? "bg-[#AFF65B] text-black font-medium rounded-tr-none shadow-sm"
                      : "bg-[#282828] text-white border border-white/10 rounded-tl-none shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Reaction Pills */}
      <div className="px-3 py-1.5 bg-[#1C1C1C] border-t border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_REACTIONS.map((r) => (
          <button
            key={r}
            type="button"
            disabled={sending}
            onClick={() => handleSend(r)}
            className="px-2 py-0.5 whitespace-nowrap text-[10px] rounded-full bg-[#262626] text-[#BBB] hover:text-white hover:bg-[#333] transition-colors border border-white/5 cursor-pointer disabled:opacity-50"
          >
            {r}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-[#1F1F1F] border-t border-white/10 flex items-center gap-2"
      >
        <input
          value={input}
          maxLength={150}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Chat with friend..."
          className="flex-1 bg-[#141414] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:border-[#AFF65B] focus:outline-none placeholder:text-[#555]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-3.5 py-2 bg-[#AFF65B] hover:bg-white text-black font-bold text-xs rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-sm active:scale-95"
        >
          Send
        </button>
      </form>
    </div>
  );
}
