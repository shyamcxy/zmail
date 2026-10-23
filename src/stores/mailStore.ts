import { create } from "zustand";
import { Account, Message, MessageDetail } from "../lib/types";
import { api } from "../lib/ipc";

export type ThemeMode = "dark" | "light" | "system";

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

function applyTheme(theme: ThemeMode) {
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.documentElement.setAttribute("data-theme", "light");
  }
}

interface MailState {
  accounts: Account[];
  selectedAccountId: string | null; // null = Unified All Accounts
  messages: Message[];
  selectedMessageId: string | null;
  selectedMessageDetail: MessageDetail | null;

  // Filters & Views
  selectedView: "inbox" | "focus" | "starred" | "newsletters" | "archive" | "trash";
  selectedCategory: string | null;
  searchQuery: string;
  layoutMode: "split" | "list";
  setLayoutMode: (mode: "split" | "list") => void;

  // Status flags
  isLoadingMessages: boolean;
  isSyncing: boolean;
  isOllamaOnline: boolean;
  isComposeOpen: boolean;
  isComposeMinimized: boolean;
  setComposeMinimized: (min: boolean) => void;
  isCommandPaletteOpen: boolean;
  isAiCopilotOpen: boolean;
  isSidebarExpanded: boolean;
  toggleSidebar: () => void;
  isShortcutsModalOpen: boolean;
  setShortcutsModalOpen: (open: boolean) => void;
  categoryCounts: { all: number; primary: number; company: number; promotion: number; social: number };
  isUnreadOnly: boolean;
  setIsUnreadOnly: (unreadOnly: boolean) => void;

  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Confirmation modal
  confirmDialog: ConfirmDialogState | null;
  showConfirm: (opts: Omit<ConfirmDialogState, "isOpen">) => void;
  closeConfirm: () => void;

  // Actions
  init: () => Promise<void>;
  selectAccount: (id: string | null) => void;
  selectView: (view: MailState["selectedView"]) => void;
  selectCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  selectMessage: (id: string) => Promise<void>;
  clearSelectedMessage: () => void;
  toggleRead: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  archiveMessage: (id: string) => Promise<void>;
  trashMessage: (id: string) => Promise<void>;
  loadLocalMessages: () => Promise<void>;
  triggerSync: () => Promise<void>;
  triggerTriage: (id: string) => Promise<void>;
  connectGmail: () => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
  setComposeOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setAiCopilotOpen: (open: boolean) => void;
}

export const useMailStore = create<MailState>((set, get) => ({
  accounts: [],
  selectedAccountId: null,
  messages: [],
  selectedMessageId: null,
  selectedMessageDetail: null,

  selectedView: "inbox",
  selectedCategory: null,
  searchQuery: "",
  layoutMode: (localStorage.getItem("zmail_layout") as "split" | "list") || "split",
  setLayoutMode: (mode) => {
    localStorage.setItem("zmail_layout", mode);
    set({ layoutMode: mode });
  },

  isLoadingMessages: false,
  isSyncing: false,
  isOllamaOnline: false,
  isComposeOpen: false,
  isComposeMinimized: false,
  setComposeMinimized: (min) => set({ isComposeMinimized: min }),
  isCommandPaletteOpen: false,
  isAiCopilotOpen: false,
  isSidebarExpanded: localStorage.getItem("zmail_sidebar_expanded") === "true",
  toggleSidebar: () => {
    const next = !get().isSidebarExpanded;
    localStorage.setItem("zmail_sidebar_expanded", String(next));
    set({ isSidebarExpanded: next });
  },
  isShortcutsModalOpen: false,
  setShortcutsModalOpen: (open) => set({ isShortcutsModalOpen: open }),
  categoryCounts: { all: 0, primary: 0, company: 0, promotion: 0, social: 0 },
  isUnreadOnly: false,
  setIsUnreadOnly: (unreadOnly) => {
    set({ isUnreadOnly: unreadOnly });
    get().loadLocalMessages();
  },
  toastMessage: null,

  theme: "dark",
  setTheme: (theme: ThemeMode) => {
    localStorage.setItem("zmail_theme", theme);
    set({ theme });
    applyTheme(theme);
  },

  confirmDialog: null,
  showConfirm: (opts) => {
    set({
      confirmDialog: {
        isOpen: true,
        ...opts,
      },
    });
  },
  closeConfirm: () => {
    set({ confirmDialog: null });
  },

  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 6000);
  },
  clearToast: () => set({ toastMessage: null }),

  init: async () => {
    try {
      // Initialize theme from storage
      const savedTheme = (localStorage.getItem("zmail_theme") as ThemeMode) || "dark";
      set({ theme: savedTheme });
      applyTheme(savedTheme);

      const [accounts, ollamaStatus] = await Promise.all([
        api.listAccounts(),
        api.checkOllamaStatus(),
      ]);

      set({ accounts, isOllamaOnline: ollamaStatus });

      // Immediately display local SQLite messages in < 5ms
      await get().loadLocalMessages();

      // Refresh in background if any accounts are registered
      if (accounts.length > 0) {
        get().triggerSync();
      }
    } catch (err) {
      console.error("Initialization error:", err);
    }
  },

  selectAccount: (id) => {
    set({ selectedAccountId: id, selectedMessageId: null, selectedMessageDetail: null });
    get().loadLocalMessages();
  },

  selectView: (view) => {
    set({ selectedView: view, selectedCategory: null, selectedMessageId: null, selectedMessageDetail: null });
    get().loadLocalMessages();
  },

  selectCategory: (category) => {
    set({ selectedCategory: category, selectedMessageId: null, selectedMessageDetail: null });
    get().loadLocalMessages();
  },

  setSearchQuery: async (query) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      await get().loadLocalMessages();
      return;
    }

    try {
      const results = await api.searchMessages(query, 50);
      set({ messages: results });
    } catch (err) {
      console.error("Search failed:", err);
    }
  },

  selectMessage: async (id) => {
    set({ selectedMessageId: id });
    try {
      const detail = await api.getMessageDetail(id);
      set({ selectedMessageDetail: detail });

      // Optimistic instant read status without blocking UI
      if (!detail.isRead) {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, isRead: true } : m
          ),
          selectedMessageDetail:
            state.selectedMessageDetail?.id === id
              ? { ...state.selectedMessageDetail, isRead: true }
              : state.selectedMessageDetail,
        }));
        // Update SQLite in background
        api.setMessageRead(id, true).catch((e) =>
          console.error("Background mark-read error:", e)
        );
      }
    } catch (err) {
      console.error("Failed to fetch message detail:", err);
    }
  },

  clearSelectedMessage: () => {
    set({ selectedMessageId: null, selectedMessageDetail: null });
  },

  toggleRead: async (id) => {
    const msg = get().messages.find((m) => m.id === id);
    if (!msg) return;
    const newStatus = !msg.isRead;

    try {
      await api.setMessageRead(id, newStatus);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isRead: newStatus } : m
        ),
        selectedMessageDetail:
          state.selectedMessageDetail?.id === id
            ? {
                ...state.selectedMessageDetail,
                isRead: newStatus,
              }
            : state.selectedMessageDetail,
      }));
    } catch (err) {
      console.error("Toggle read failed:", err);
    }
  },

  toggleStar: async (id) => {
    const msg = get().messages.find((m) => m.id === id);
    if (!msg) return;
    const newStarred = !msg.isStarred;

    try {
      await api.setMessageStarred(id, newStarred);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, isStarred: newStarred } : m
        ),
        selectedMessageDetail:
          state.selectedMessageDetail?.id === id
            ? {
                ...state.selectedMessageDetail,
                isStarred: newStarred,
              }
            : state.selectedMessageDetail,
      }));
    } catch (err) {
      console.error("Toggle star failed:", err);
    }
  },

  archiveMessage: async (id) => {
    try {
      await api.setMessageArchived(id, true);
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== id),
        selectedMessageId: state.selectedMessageId === id ? null : state.selectedMessageId,
        selectedMessageDetail: state.selectedMessageId === id ? null : state.selectedMessageDetail,
      }));
      get().showToast("Conversation archived.");
    } catch (err) {
      console.error("Archive failed:", err);
    }
  },

  trashMessage: async (id) => {
    const { showConfirm, closeConfirm } = get();
    showConfirm({
      title: "Move to Trash?",
      description: "This conversation will be moved to your Trash folder and can be recovered later.",
      confirmLabel: "Move to Trash",
      isDestructive: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await api.setMessageTrash(id, true);
          set((state) => ({
            messages: state.messages.filter((m) => m.id !== id),
            selectedMessageId: state.selectedMessageId === id ? null : state.selectedMessageId,
            selectedMessageDetail: state.selectedMessageId === id ? null : state.selectedMessageDetail,
          }));
          get().showToast("Conversation moved to Trash.");
        } catch (err) {
          console.error("Trash failed:", err);
        }
      },
    });
  },

  loadLocalMessages: async () => {
    const { selectedAccountId, selectedView, selectedCategory, isUnreadOnly } = get();
    set({ isLoadingMessages: true });

    try {
      const folderParam =
        selectedView === "trash"
          ? "trash"
          : selectedView === "archive"
          ? "archive"
          : selectedView === "starred"
          ? "starred"
          : "inbox";

      const allFetched = await api.listMessages({
        accountId: selectedAccountId || undefined,
        folder: folderParam,
        limit: 250,
      });

      const counts = {
        all: allFetched.length,
        primary: allFetched.filter((m) => m.aiCategory === "primary" || !m.aiCategory).length,
        company: allFetched.filter((m) => m.aiCategory === "company").length,
        promotion: allFetched.filter((m) => m.aiCategory === "promotion").length,
        social: allFetched.filter((m) => m.aiCategory === "social").length,
      };

      let messages = allFetched;
      if (selectedView === "inbox" && selectedCategory) {
        messages = messages.filter((m) =>
          selectedCategory === "primary"
            ? m.aiCategory === "primary" || !m.aiCategory
            : m.aiCategory === selectedCategory
        );
      } else if (selectedView === "focus") {
        messages = messages.filter(
          (m) => m.aiCategory === "company" || m.aiPriority === "critical" || m.aiPriority === "high"
        );
      } else if (selectedView === "newsletters") {
        messages = messages.filter((m) => m.aiCategory === "promotion");
      }

      if (isUnreadOnly) {
        messages = messages.filter((m) => !m.isRead);
      }

      set({ messages, categoryCounts: counts });

      // NEVER auto-select a message by default when changing folder/category or loading!
      // Only keep selection if the user already explicitly selected one and it's still in the list.
      const currentSelected = get().selectedMessageId;
      if (currentSelected) {
        const stillInList = messages.some((m) => m.id === currentSelected);
        if (!stillInList) {
          set({ selectedMessageId: null, selectedMessageDetail: null });
        }
      }
    } catch (err) {
      console.error("Failed to load local messages:", err);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  triggerSync: async () => {
    await get().loadLocalMessages();

    const { accounts, selectedAccountId } = get();
    set({ isSyncing: true });

    try {
      const targetAccounts = selectedAccountId
        ? accounts.filter((a) => a.id === selectedAccountId)
        : accounts;

      for (const acc of targetAccounts) {
        try {
          await api.syncAccount(acc.id);
        } catch (e: any) {
          console.warn(`Sync notice for account ${acc.email}:`, e?.message || e);
        }
      }

      await get().loadLocalMessages();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      set({ isSyncing: false });
    }
  },

  triggerTriage: async (id) => {
    try {
      const triage = await api.triageMessage(id);
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id
            ? {
                ...m,
                aiCategory: triage.category,
                aiPriority: triage.priority,
                aiSummary: triage.summary,
                aiActionItems: triage.action_items,
              }
            : m
        ),
        selectedMessageDetail:
          state.selectedMessageDetail?.id === id
            ? {
                ...state.selectedMessageDetail,
                aiCategory: triage.category,
                aiPriority: triage.priority,
                aiSummary: triage.summary,
                aiActionItems: triage.action_items,
              }
            : state.selectedMessageDetail,
      }));
    } catch (err) {
      console.error("AI Triage failed:", err);
    }
  },

  connectGmail: async () => {
    try {
      set({ isSyncing: true });
      const newAcc = await api.startGmailOAuth();
      set((state) => ({
        accounts: [...state.accounts.filter((a) => a.id !== newAcc.id), newAcc],
        selectedAccountId: newAcc.id,
      }));
      await get().triggerSync();
    } catch (err: any) {
      console.error("Gmail OAuth connection failed:", err);
      const msg = err?.message || String(err);
      get().showToast(msg);
    } finally {
      set({ isSyncing: false });
    }
  },

  disconnectAccount: async (id: string) => {
    const acc = get().accounts.find((a) => a.id === id);
    if (!acc) return;

    get().showConfirm({
      title: `Disconnect ${acc.displayName}?`,
      description: `Are you sure you want to disconnect ${acc.email}? Your local cached emails will be removed.`,
      confirmLabel: "Disconnect",
      isDestructive: true,
      onConfirm: async () => {
        get().closeConfirm();
        try {
          await api.removeAccount(id);
          set((state) => ({
            accounts: state.accounts.filter((a) => a.id !== id),
            selectedAccountId: state.selectedAccountId === id ? null : state.selectedAccountId,
          }));
          await get().loadLocalMessages();
          get().showToast(`Disconnected ${acc.email}`);
        } catch (err) {
          console.error("Failed to disconnect account:", err);
        }
      },
    });
  },

  setComposeOpen: (open) => set({ isComposeOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setAiCopilotOpen: (open) => set({ isAiCopilotOpen: open }),
}));
