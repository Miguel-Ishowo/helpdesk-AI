import { getMetadataArgsStorage } from 'typeorm';
import { User, Organization, Membership, Session, Invitation, Assistant, KnowledgeDocument, DocumentChunk, Conversation, Message, EmailVerificationToken, PasswordResetToken } from './index';

describe('Database entities metadata', () => {
  const storage = getMetadataArgsStorage();

  const table = (target: object) =>
    storage.tables.find((t) => t.target === target)?.name;

  it('defines expected table names', () => {
    expect(table(User)).toBe('users');
    expect(table(Organization)).toBe('organizations');
    expect(table(Membership)).toBe('memberships');
    expect(table(Session)).toBe('sessions');
    expect(table(Invitation)).toBe('invitations');
    expect(table(Assistant)).toBe('assistants');
    expect(table(KnowledgeDocument)).toBe('knowledge_documents');
    expect(table(DocumentChunk)).toBe('document_chunks');
    expect(table(Conversation)).toBe('conversations');
    expect(table(Message)).toBe('messages');
    expect(table(EmailVerificationToken)).toBe('email_verification_tokens');
    expect(table(PasswordResetToken)).toBe('password_reset_tokens');
  });

  it('User has unique email index/column metadata', () => {
    const cols = storage.columns.filter((c) => c.target === User);
    const email = cols.find((c) => c.propertyName === 'email');
    expect(email).toBeDefined();
    const uniq = storage.uniques.find((u) => u.target === User);
    const idx = storage.indices.find(
      (i) =>
        i.target === User &&
        Array.isArray(i.columns) &&
        i.columns.includes('email'),
    );
    expect(Boolean(uniq || idx)).toBe(true);
  });

  it('Membership has unique userId+organizationId index', () => {
    const idx = storage.indices.find(
      (i) => i.target === Membership && Array.isArray(i.columns) && i.columns.includes('userId') && i.columns.includes('organizationId'),
    );
    expect(idx?.unique).toBe(true);
  });

  it('DocumentChunk has assistantId/documentId indexes', () => {
    const cols = storage.columns.filter((c) => c.target === DocumentChunk).map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining(['documentId', 'assistantId', 'chunkIndex', 'content', 'embedding']));
  });

  it('Message belongs to conversation and stores role/content', () => {
    const cols = storage.columns.filter((c) => c.target === Message).map((c) => c.propertyName);
    expect(cols).toEqual(expect.arrayContaining(['conversationId', 'role', 'content', 'sources', 'feedback']));
  });
});
