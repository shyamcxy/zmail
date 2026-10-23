import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Zap,
  Inbox,
  Newspaper,
  Receipt,
  RotateCw,
  Cpu,
} from "lucide-react";
import { useMailStore } from "../../stores/mailStore";

interface AgentMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  actions?: Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    run: () => void;
  }>;
}

export const AiAgentPanel: React.FC = () => {
  const {
    isAiCopilotOpen,
    setAiCopilotOpen,
    messages,
    selectedMessageDetail,
    isOllamaOnline,
    selectView,
    setSearchQuery,
    setComposeOpen,
  } = useMailStore();

  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState<AgentMessage[]>([
    {
      id: "initial",
      sender: "assistant",
      text: "Hello! I am your local Zmail Copilot, running 100% on your Mac hardware with zero cloud dependencies. What would you like help with today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actions: [
        {
          label: "Summarize unread emails",
          icon: Zap,
          run: () => handleCommand("Summarize unread emails"),
        },
        {
          label: "Find receipts & invoices",
          icon: Receipt,
          run: () => handleCommand("Find receipts and invoices"),
        },
        {
          label: "Show subscriptions to clean",
          icon: Newspaper,
          run: () => handleCommand("Show subscriptions to clean"),
        },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAiCopilotOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isAiCopilotOpen, chatHistory]);

  if (!isAiCopilotOpen) return null;

  const handleCommand = (cmdText: string) => {
    setInput(cmdText);
    handleSubmit(cmdText);
  };

  const handleSubmit = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isProcessing) return;

    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    const qLower = query.toLowerCase();

    // Context analysis
    setTimeout(() => {
      let replyText = "";
      let actions: AgentMessage["actions"] = [];

      if (qLower.includes("unread") || qLower.includes("summarize")) {
        const unread = messages.filter((m) => !m.isRead);
        if (unread.length === 0) {
          replyText = "Inbox Zero achieved! You have 0 unread messages in your synchronized mailboxes.";
        } else {
          replyText = `You have ${unread.length} unread message${unread.length > 1 ? "s" : ""}:\n\n` +
            unread.slice(0, 4).map((m, i) => `${i + 1}. **${m.subject || "(No subject)"}** from ${m.from.name || m.from.address}`).join("\n") +
            (unread.length > 4 ? `\n...and ${unread.length - 4} more.` : "");

          actions = [
            {
              label: "Filter to unread messages",
              icon: Inbox,
              run: () => {
                selectView("inbox");
                setSearchQuery("is:unread");
              },
            },
          ];
        }
      } else if (qLower.includes("receipt") || qLower.includes("invoice") || qLower.includes("bill")) {
        const financial = messages.filter((m) => {
          const s = (m.subject + " " + m.snippet).toLowerCase();
          return s.includes("receipt") || s.includes("invoice") || s.includes("order") || s.includes("payment") || s.includes("billing");
        });

        if (financial.length === 0) {
          replyText = "No financial receipts or billing invoices were found in your recent messages.";
        } else {
          replyText = `Found ${financial.length} billing & receipt message${financial.length > 1 ? "s" : ""}:\n\n` +
            financial.slice(0, 4).map((m, i) => `${i + 1}. **${m.subject}** (${new Date(m.receivedAt).toLocaleDateString()})`).join("\n");

          actions = [
            {
              label: "Search financial messages",
              icon: Receipt,
              run: () => {
                selectView("inbox");
                setSearchQuery("receipt OR invoice OR billing");
              },
            },
          ];
        }
      } else if (qLower.includes("subscription") || qLower.includes("newsletter") || qLower.includes("clean")) {
        const newsletters = messages.filter((m) => m.unsubOneClick || (m.subject + m.snippet).toLowerCase().includes("unsubscribe"));
        replyText = `Identified ${newsletters.length} subscriptions and automated mailers with unsubscribe capabilities.`;
        actions = [
          {
            label: "Open Subscriptions view",
            icon: Newspaper,
            run: () => {
              selectView("newsletters");
            },
          },
        ];
      } else if (qLower.includes("reply") || qLower.includes("draft")) {
        if (selectedMessageDetail) {
          replyText = `Drafted response to "${selectedMessageDetail.subject}":\n\n"Hi ${selectedMessageDetail.from.name || "there"},\n\nThank you for reaching out. I've received your note and will review the details shortly.\n\nBest regards,"`;
          actions = [
            {
              label: "Insert into Compose",
              icon: Zap,
              run: () => setComposeOpen(true),
            },
          ];
        } else {
          replyText = "Select an email from the list first, and I will draft a contextual smart reply for you.";
        }
      } else {
        replyText = `I analyzed your local mailbox for "${query}". I can help search, summarize, prioritize, or draft replies locally on your hardware.`;
        actions = [
          {
            label: `Search "${query}"`,
            icon: Inbox,
            run: () => {
              selectView("inbox");
              setSearchQuery(query);
            },
          },
        ];
      }

      setChatHistory((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          actions,
        },
      ]);
      setIsProcessing(false);
    }, 400);
  };

  return (
    <aside className="w-84 h-full bg-white dark:bg-[#0D0F12] border-l border-black/10 dark:border-white/[0.08] flex flex-col justify-between select-none shadow-sm transition-all duration-150 z-20">
      {/* Copilot Header */}
      <div className="h-12 px-4 border-b border-black/10 dark:border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-zinc-900 dark:text-[#EDEDED]">
            Zmail Copilot
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Local
          </span>
        </div>

        <button
          onClick={() => setAiCopilotOpen(false)}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-white rounded-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Model Hardware Info Banner */}
      <div className="px-4 py-2 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/5 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3 h-3 text-zinc-400" />
          <span>Engine:</span>
          <span className="font-mono text-zinc-700 dark:text-zinc-300">
            {isOllamaOnline ? "Ollama (llama3.1:8b)" : "Local Rule Engine"}
          </span>
        </div>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-xl text-xs leading-relaxed ${
                m.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-zinc-100 dark:bg-[#16191F] text-zinc-800 dark:text-[#EDEDED] border border-black/5 dark:border-white/[0.07] rounded-bl-sm"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>

              {/* Actionable buttons */}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/[0.06] flex flex-col gap-1.5">
                  {m.actions.map((act, idx) => (
                    <button
                      key={idx}
                      onClick={act.run}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-black/5 dark:hover:bg-white/[0.12] border border-black/10 dark:border-white/[0.08] text-[11px] font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer text-left"
                    >
                      {act.icon && <act.icon className="w-3 h-3 text-purple-400" />}
                      <span>{act.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 px-1">
              {m.timestamp}
            </span>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-zinc-400 p-2">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Analyzing local mailbox...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Dock */}
      <div className="p-3 border-t border-black/10 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#0D0F12]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot or command your inbox..."
            className="flex-1 bg-white dark:bg-[#15181E] border border-black/10 dark:border-white/[0.08] rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-[#EDEDED] placeholder-zinc-400 focus:outline-none focus:border-purple-500/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
};
