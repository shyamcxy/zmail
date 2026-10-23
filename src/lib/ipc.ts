import { invoke, isTauri } from "@tauri-apps/api/core";
import { Account, Message, MessageDetail, AiTriageResult, SendEmailRequest } from "./types";

// Realistic mock data when previewing in standard browser
const MOCK_ACCOUNTS: Account[] = [
  {
    id: "acc-1",
    email: "shyam@work.com",
    displayName: "Work Account",
    provider: "imap",
    accentColor: "#3B82F6",
    syncState: "idle",
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: "acc-2",
    email: "shyam.dev@gmail.com",
    displayName: "Personal Gmail",
    provider: "gmail",
    accentColor: "#8B5CF6",
    syncState: "idle",
    lastSyncedAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: "msg-1",
    accountId: "acc-1",
    providerId: "p1",
    threadId: "t1",
    subject: "Q4 Engineering Roadmap & Architecture Review",
    from: { name: "Sarah Lin", address: "sarah.lin@work.com" },
    to: [{ name: "Shyam", address: "shyam@work.com" }],
    snippet: "Hey Shyam, I've reviewed the Zmail architecture proposal. The local-first SQLite WAL and FTS5 indexing looks fantastic...",
    receivedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    isRead: false,
    isStarred: true,
    isArchived: false,
    hasAttachments: true,
    aiCategory: "work",
    aiPriority: "critical",
    aiSummary: "Sarah approved the Zmail local-first architecture and requested a final sync on Wednesday at 2 PM.",
    aiActionItems: [
      { task: "Prepare slide deck on SQLite FTS5 performance", deadline: "Wednesday 1 PM" },
      { task: "Confirm sync meeting attendance" }
    ],
    unsubOneClick: false,
  },
  {
    id: "msg-2",
    accountId: "acc-1",
    providerId: "p2",
    threadId: "t2",
    subject: "Weekly Stripe Billing Summary & Merchant Report",
    from: { name: "Stripe Notifications", address: "notifications@stripe.com" },
    to: [{ name: "Finance", address: "finance@work.com" }],
    snippet: "Your daily payout of $4,850.00 USD has been initiated and will arrive in your bank account within 1-2 business days...",
    receivedAt: new Date(Date.now() - 120 * 60000).toISOString(),
    isRead: false,
    isStarred: false,
    isArchived: false,
    hasAttachments: false,
    aiCategory: "financial",
    aiPriority: "medium",
    aiSummary: "Daily payout of $4,850.00 USD initiated to business checking account.",
    unsubOneClick: false,
  },
  {
    id: "msg-3",
    accountId: "acc-2",
    providerId: "p3",
    threadId: "t3",
    subject: "Substack Daily: The Future of On-Device AI Models",
    from: { name: "Latent Space", address: "newsletter@latentspace.io" },
    to: [{ address: "shyam.dev@gmail.com" }],
    snippet: "Why small language models (Phi-4, Llama-3.2-3B) are outperforming giant cloud models on structured information extraction...",
    receivedAt: new Date(Date.now() - 360 * 60000).toISOString(),
    isRead: true,
    isStarred: false,
    isArchived: false,
    hasAttachments: false,
    aiCategory: "newsletter",
    aiPriority: "low",
    aiSummary: "Deep dive analyzing why 3B parameter quantized models excel at structured local JSON extraction.",
    unsubOneClick: true,
    unsubUrl: "https://latentspace.io/unsubscribe?token=mock123",
  },
  {
    id: "msg-4",
    accountId: "acc-2",
    providerId: "p4",
    threadId: "t4",
    subject: "GitHub: [zmail/zmail] New PR #3: Add Reciprocal Rank Fusion",
    from: { name: "GitHub Notifications", address: "notifications@github.com" },
    to: [{ address: "shyam.dev@gmail.com" }],
    snippet: "nutlope opened a new pull request: Implements RRF to merge BM25 scores with cosine distance vectors...",
    receivedAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
    isStarred: true,
    isArchived: false,
    hasAttachments: false,
    aiCategory: "notification",
    aiPriority: "high",
    aiSummary: "Pull request submitted implementing Reciprocal Rank Fusion for hybrid search.",
    unsubOneClick: true,
    unsubUrl: "https://github.com/notifications/unsubscribe?token=mock456",
  },
];

export const api = {
  listAccounts: async (): Promise<Account[]> => {
    if (!isTauri()) return MOCK_ACCOUNTS;
    return invoke("list_accounts");
  },

  listMessages: async (params?: {
    accountId?: string;
    category?: string;
    isRead?: boolean;
    folder?: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]> => {
    if (!isTauri()) {
      let filtered = [...MOCK_MESSAGES];
      if (params?.accountId) filtered = filtered.filter((m) => m.accountId === params.accountId);
      if (params?.category) filtered = filtered.filter((m) => m.aiCategory === params.category);
      if (params?.isRead !== undefined) filtered = filtered.filter((m) => m.isRead === params.isRead);
      if (params?.folder === "starred") filtered = filtered.filter((m) => m.isStarred);
      if (params?.folder === "trash") filtered = [];
      return filtered;
    }
    return invoke("list_messages", {
      accountId: params?.accountId,
      category: params?.category,
      isRead: params?.isRead,
      folder: params?.folder,
      limit: params?.limit,
      offset: params?.offset,
    });
  },

  getMessageDetail: async (id: string): Promise<MessageDetail> => {
    if (!isTauri()) {
      const base = MOCK_MESSAGES.find((m) => m.id === id) || MOCK_MESSAGES[0];
      return {
        ...base,
        bodyText: `${base.snippet}\n\nHere is the full text of the email. Everything is formatted cleanly with high contrast typography and zero UI clutter.`,
        attachments: base.hasAttachments
          ? [
              {
                id: `${base.id}-att`,
                filename: `${base.subject ? base.subject.slice(0, 24) : "Document"}.pdf`,
                mimeType: "application/pdf",
                sizeBytes: 591872,
                isInline: false,
              },
            ]
          : [],
        smartReplies: [
          "Looks great, let's proceed with this.",
          "I will review the details and get back to you by EOD.",
          "Thanks for sending this over!",
        ],
      };
    }
    return invoke("get_message_detail", { id });
  },

  setMessageRead: async (id: string, isRead: boolean): Promise<void> => {
    if (!isTauri()) return;
    return invoke("set_message_read", { id, isRead });
  },

  setMessageStarred: async (id: string, isStarred: boolean): Promise<void> => {
    if (!isTauri()) return;
    return invoke("set_message_starred", { id, isStarred });
  },

  setMessageArchived: async (id: string, isArchived: boolean): Promise<void> => {
    if (!isTauri()) return;
    return invoke("set_message_archived", { id, isArchived });
  },

  setMessageTrash: async (id: string, isTrash: boolean): Promise<void> => {
    if (!isTauri()) return;
    return invoke("set_message_trash", { id, isTrash });
  },

  searchMessages: async (query: string, limit?: number): Promise<Message[]> => {
    if (!isTauri()) {
      const q = query.toLowerCase();
      return MOCK_MESSAGES.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q) ||
          m.from.name?.toLowerCase().includes(q) ||
          m.from.address.toLowerCase().includes(q)
      );
    }
    return invoke("search_messages", { query, limit });
  },

  syncAccount: async (accountId: string): Promise<number> => {
    if (!isTauri()) return 4;
    return invoke("sync_account", { accountId });
  },

  triageMessage: async (messageId: string): Promise<AiTriageResult> => {
    if (!isTauri()) {
      return {
        category: "work",
        priority: "high",
        summary: "Mock AI analysis: review action required.",
        action_items: [{ task: "Verify documentation" }],
        is_spam: false,
      };
    }
    return invoke("triage_message", { messageId });
  },

  generateSmartReplies: async (messageId: string): Promise<string[]> => {
    if (!isTauri()) {
      return [
        "Sounds like a great plan.",
        "Could we reschedule for tomorrow?",
        "Got it, thanks!",
      ];
    }
    return invoke("generate_smart_replies", { messageId });
  },

  executeOneClickUnsubscribe: async (url: string): Promise<boolean> => {
    if (!isTauri()) return true;
    return invoke("execute_one_click_unsubscribe", { url });
  },

  sendEmail: async (req: SendEmailRequest): Promise<void> => {
    if (!isTauri()) return;
    return invoke("send_email", { req });
  },

  checkOllamaStatus: async (): Promise<boolean> => {
    if (!isTauri()) return true;
    return invoke("check_ollama_status");
  },

  removeAccount: async (accountId: string): Promise<void> => {
    if (!isTauri()) return;
    return invoke("remove_account", { accountId });
  },

  startGmailOAuth: async (clientId?: string, clientSecret?: string): Promise<Account> => {
    if (!isTauri()) {
      const mockAcc: Account = {
        id: "acc-google",
        email: "user@gmail.com",
        displayName: "User (Gmail)",
        provider: "gmail",
        accentColor: "#EA4335",
        syncState: "idle",
        lastSyncedAt: new Date().toISOString(),
      };
      return mockAcc;
    }
    return invoke("start_gmail_oauth", { clientId, clientSecret });
  },

  openExternalUrl: async (url: string): Promise<void> => {
    if (!isTauri()) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    return invoke("open_external_url", { url });
  },

  copilotChat: async (
    prompt: string,
    contextMessageId?: string | null,
    history: Array<{ role: string; content: string }> = []
  ): Promise<string> => {
    if (!isTauri()) {
      return "Local Copilot running in browser fallback mode.";
    }
    return invoke("copilot_chat", {
      prompt,
      contextMessageId: contextMessageId || null,
      history,
    });
  },
};
