export enum UserRole {
  PLATFORM_ADMIN = 'platform_admin',
  ORG_OWNER = 'org_owner',
  ORG_ADMIN = 'org_admin',
  ORG_MEMBER = 'org_member',
}

export enum MembershipStatus {
  INVITED = 'invited',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export enum AssistantStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum DocumentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  INDEXED = 'indexed',
  FAILED = 'failed',
}

export enum SourceType {
  PDF = 'pdf',
  TXT = 'txt',
  MARKDOWN = 'markdown',
  URL = 'url',
}

export enum ConversationStatus {
  OPEN = 'open',
  RESOLVED = 'resolved',
  UNANSWERED = 'unanswered',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum FeedbackValue {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}
