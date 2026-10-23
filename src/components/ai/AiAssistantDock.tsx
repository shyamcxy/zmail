import React, { useState, useRef, useEffect } from "react";
import {
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useMailStore } from "../../stores/mailStore";
import { api } from "../../lib/ipc";
import { BenchoChatInput } from "../bencho/BenchoChatInput";
import { BenchoThinking } from "../bencho/BenchoThinking";
import { BenchoCopyButton } from "../bencho/BenchoCopyButton";
import { Icons } from "../common/Icons";

interface MessageItem {
  id: string;
  sender: "user" | "assistant";
  text: string;
  hasSendAction?: boolean;
}

interface AiAssistantDockProps {
  isFullWidth?: boolean;
}

export const AiAssistantDock: React.FC<AiAssistantDockProps> = ({ isFullWidth = false }) => {
  const {
    isAiCopilotOpen,
    setAiCopilotOpen,
    selectedMessageDetail,
    setComposeOpen,
    setComposeMinimized,
    showToast,
  } = useMailStore();

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chat, setChat] = useState<MessageItem[]>([]);

  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat when updated
  useEffect(() => {
    if (isAiCopilotOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isAiCopilotOpen, chat]);

  if (!isAiCopilotOpen) return null;

  const handleSendPrompt = async (promptText?: string) => {
    const text = (promptText || input).trim();
    if (!text || isTyping) return;

    const userMsg: MessageItem = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };

    setChat((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const history = chat.slice(-6).map((m) => ({
        role: m.sender,
        content: m.text,
      }));

      const reply = await api.copilotChat(
        text,
        selectedMessageDetail?.id || null,
        history
      );

      setChat((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: reply,
          hasSendAction: true,
        },
      ]);
    } catch (err: any) {
      console.error("Copilot chat error:", err);
      setChat((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: `⚠️ **Could not generate response**: ${err?.message || err || "Please make sure Ollama is running with qwen2.5:3b."}`,
          hasSendAction: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTransferToCompose = (_text?: string) => {
    setComposeOpen(true);
    setComposeMinimized(false);
    showToast("Draft transferred to composer.");
  };

  const handleNewChat = () => {
    setChat([]);
    setInput("");
  };

  return (
    <aside
      className={`${
        isFullWidth
          ? "flex-1 h-full"
          : "w-[440px] xl:w-[480px] h-full flex-shrink-0 border-l border-black/[0.06] dark:border-white/[0.06]"
      } flex flex-col bg-[#FFFFFF] dark:bg-[#212121] transition-all duration-150 select-none z-20`}
    >
      {/* Header Bar */}
      <div className="h-11 px-4 border-b border-black/[0.05] dark:border-white/[0.05] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg">
          <Icons.Sparkles size={15} className="text-[#10A37F]" />
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Copilot
          </span>
        </div>

        {/* Top Right Actions: New Chat + Close */}
        <div className="flex items-center gap-1">
          {chat.length > 0 && (
            <button
              onClick={handleNewChat}
              title="New Chat"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <Icons.Edit size={15} />
            </button>
          )}

          <button
            onClick={() => setAiCopilotOpen(false)}
            title="Close sidebar (Cmd+J)"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <Icons.Close size={15} />
          </button>
        </div>
      </div>


      {/* Main Stream Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {chat.length === 0 ? (
          /* ChatGPT Desktop Empty / Welcome State */
          <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center px-2 animate-chatgpt-in">
            {/* Spark Mark */}
            <div className="w-11 h-11 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4 shadow-sm">
              <Icons.Sparkles size={20} />
            </div>

            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
              What can I help with today?
            </h2>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm leading-relaxed">
              {selectedMessageDetail
                ? `Context active: "${selectedMessageDetail.subject}"`
                : "Ask anything about your mailbox, summarize threads, or draft replies."}
            </p>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-2 gap-2.5 w-full text-left">
              {[
                {
                  icon: Icons.Sparkles,
                  title: "Summarize this thread",
                  desc: "Key takeaways & consensus",
                  prompt: "Summarize this thread",
                },
                {
                  icon: Mail,
                  title: "Draft a polite reply",
                  desc: "Ready to transfer & send",
                  prompt: "Draft a polite reply to this email",
                },
                {
                  icon: FileText,
                  title: "Extract action items",
                  desc: "Deliverables & deadlines",
                  prompt: "Extract action items and deadlines",
                },
                {
                  icon: ShieldCheck,
                  title: "Audit sender security",
                  desc: "SPF, DKIM & tracker scan",
                  prompt: "Perform a security audit on this sender",
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.title}
                    onClick={() => handleSendPrompt(card.prompt)}
                    className="p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-150 cursor-pointer active:scale-[0.98] group"
                  >
                    <Icon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors mb-2" />
                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">
                      {card.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Conversation Stream */
          <div className="max-w-2xl mx-auto space-y-6">
            {chat.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {msg.sender === "user" ? (
                  /* User Bubble (ChatGPT macOS pill) */
                  <div className="bg-[#F4F4F4] dark:bg-[#2F2F2F] text-zinc-900 dark:text-zinc-100 rounded-3xl px-4 py-2.5 max-w-[85%] text-[13px] leading-relaxed shadow-2xs select-text">
                    {msg.text}
                  </div>
                ) : (
                  /* Assistant Bubble (Clean ChatGPT markdown style) */
                  <div className="w-full space-y-2 select-text">
                    <div className="text-[13px] text-zinc-900 dark:text-[#ECECEC] leading-relaxed whitespace-pre-wrap font-normal">
                      {msg.text}
                    </div>

                    {/* Action Bar (Copy, Like, Transfer) */}
                    <div className="flex items-center gap-1.5 pt-1 text-zinc-400">
                      <BenchoCopyButton textToCopy={msg.text} />

                      <button
                        onClick={() => {
                          const lastUser = [...chat].reverse().find((m) => m.sender === "user");
                          if (lastUser) handleSendPrompt(lastUser.text);
                        }}
                        title="Regenerate"
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="Good response"
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        title="Bad response"
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>

                      {msg.hasSendAction && (
                        <button
                          onClick={() => handleTransferToCompose(msg.text)}
                          className="ml-2 px-2.5 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-2xs"
                        >
                          Transfer to Composer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <BenchoThinking label="Generating response..." />
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Interactive AI Chat Input */}
      <div className="p-4 pt-1">
        <div className="max-w-2xl mx-auto w-full">
          <BenchoChatInput
            placeholder={
              selectedMessageDetail
                ? `Ask about "${selectedMessageDetail.subject.slice(0, 24)}..."`
                : "Ask anything about your emails…"
            }
            onSend={(text) => handleSendPrompt(text)}
            onAttachContext={() => handleSendPrompt("Analyze current thread context")}
            isProcessing={isTyping}
          />

          {/* Guarantee Note */}
          <div className="text-center pt-2 text-[10px] text-zinc-400 dark:text-zinc-500">
            100% on-device · Zero telemetry
          </div>
        </div>
      </div>

    </aside>
  );
};
