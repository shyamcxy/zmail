/**
 * Canonical Zmail Data Contracts
 * Shared between React Frontend and Tauri Rust Backend (via Serde)
 */

export type ProviderType = 'gmail' | 'imap';

export interface Account {
  id: string;
  email: string;
  displayName: string;
  provider: ProviderType;
  accentColor: string;
  syncState: 'idle' | 'syncing' | 'error';
  lastSyncedAt?: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  contentId?: string;
  isInline: boolean;
}

export interface Message {
  id: string;
  accountId: string;
  providerId: string;
  threadId: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  snippet: string;
  receivedAt: string; // ISO 8601
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];

  // AI-Derived Attributes
  aiCategory?: 'work' | 'personal' | 'newsletter' | 'financial' | 'social' | 'notification' | 'spam';
  aiPriority?: 'critical' | 'high' | 'medium' | 'low';
  aiSummary?: string;
  aiActionItems?: Array<{ task: string; deadline?: string }>;
  
  // Unsubscribe Details
  unsubOneClick: boolean;
  unsubUrl?: string;
}

export interface MessageDetail extends Message {
  bodyText?: string;
  bodyHtml?: string;
  smartReplies?: string[];
}

export interface Label {
  id: string;
  accountId: string;
  name: string;
  color?: string;
  isSystem: boolean;
  isAi: boolean;
  unreadCount: number;
}
