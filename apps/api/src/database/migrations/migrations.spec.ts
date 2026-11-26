import { InitCoreSchema1712800000000 } from './1712800000000-InitCoreSchema';
import { AddPgvectorToDocumentChunks1712800001000 } from './1712800001000-AddPgvectorToDocumentChunks';
import type { QueryRunner } from 'typeorm';

describe('Migrations', () => {
  it('init migration exposes up/down', () => {
    const m = new InitCoreSchema1712800000000();
    expect(typeof m.up).toBe('function');
    expect(typeof m.down).toBe('function');
    expect(m.name).toBe('InitCoreSchema1712800000000');
  });

  it('pgvector migration exposes up/down', () => {
    const m = new AddPgvectorToDocumentChunks1712800001000();
    expect(typeof m.up).toBe('function');
    expect(typeof m.down).toBe('function');
    expect(m.name).toBe('AddPgvectorToDocumentChunks1712800001000');
  });

  it('init migration SQL includes core tables and indexes', async () => {
    const queries: string[] = [];
    const qr = { query: async (sql: string) => { queries.push(sql); return undefined; } } as unknown as QueryRunner;
    await new InitCoreSchema1712800000000().up(qr);
    const joined = queries.join('\n');
    expect(joined).toContain('CREATE TABLE "users"');
    expect(joined).toContain('CREATE TABLE "organizations"');
    expect(joined).toContain('CREATE TABLE "memberships"');
    expect(joined).toContain('CREATE TABLE "document_chunks"');
    expect(joined).toContain('UQ_memberships_user_org');
    expect(joined).toContain('IDX_messages_conv_created');
  });

  it('pgvector migration adds vector column/index', async () => {
    const queries: string[] = [];
    const qr = { query: async (sql: string) => { queries.push(sql); return undefined; } } as unknown as QueryRunner;
    await new AddPgvectorToDocumentChunks1712800001000().up(qr);
    const joined = queries.join('\n');
    expect(joined).toContain('CREATE EXTENSION IF NOT EXISTS vector');
    expect(joined).toContain('embedding_vector" vector(1536)');
    expect(joined).toContain('USING ivfflat');
  });
});
