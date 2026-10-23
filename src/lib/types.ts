export type ProviderType = 'gmail' | 'imap';

export interface Account {
  id: string;
  email: string;
  displayName: string;
  provider: ProviderType;
  accentColor: string;
  syncState: string; // 'idle' | 'syncing' | 'error'
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

export interface ActionItem {
  task: string;
  deadline?: string;
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

  // AI Attributes
  aiCategory?: string;
  aiPriority?: string;
  aiSummary?: string;
  aiActionItems?: ActionItem[];

  // Unsubscribe
  unsubOneClick: boolean;
  unsubUrl?: string;
}

export interface MessageDetail {
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
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  aiCategory?: string;
  aiPriority?: string;
  aiSummary?: string;
  aiActionItems?: ActionItem[];
  unsubOneClick: boolean;
  unsubUrl?: string;
  smartReplies?: string[];
}

export interface AiTriageResult {
  category: string;
  priority: string;
  summary: string;
  action_items: ActionItem[];
  is_spam: boolean;
}

export interface SendEmailRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  threadId?: string;
}
