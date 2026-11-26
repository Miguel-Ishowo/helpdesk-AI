import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCoreSchema1712800000000 implements MigrationInterface {
  name = 'InitCoreSchema1712800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    // pgvector is required for RAG runtime; migration keeps base schema creation possible where extension install is managed separately.
    await queryRunner.query(`DO $$ BEGIN CREATE EXTENSION IF NOT EXISTS vector; EXCEPTION WHEN OTHERS THEN NULL; END $$`);

    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('platform_admin','org_owner','org_admin','org_member')`).catch(() => undefined);
    await queryRunner.query(`CREATE TYPE "public"."membership_status_enum" AS ENUM('invited','active','suspended')`);
    await queryRunner.query(`CREATE TYPE "public"."assistant_status_enum" AS ENUM('draft','active','inactive')`);
    await queryRunner.query(`CREATE TYPE "public"."document_status_enum" AS ENUM('pending','processing','indexed','failed')`);
    await queryRunner.query(`CREATE TYPE "public"."source_type_enum" AS ENUM('pdf','txt','markdown','url')`);
    await queryRunner.query(`CREATE TYPE "public"."conversation_status_enum" AS ENUM('open','resolved','unanswered')`);
    await queryRunner.query(`CREATE TYPE "public"."message_role_enum" AS ENUM('user','assistant','system')`);
    await queryRunner.query(`CREATE TYPE "public"."feedback_value_enum" AS ENUM('positive','negative')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255),
        "firstName" character varying(100),
        "lastName" character varying(100),
        "emailVerified" boolean NOT NULL DEFAULT false,
        "emailVerifiedAt" TIMESTAMPTZ,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMPTZ,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "name" character varying(255) NOT NULL,
        "slug" character varying(100) NOT NULL,
        "ownerId" uuid NOT NULL,
        CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_organizations_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "organizationId" uuid NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'org_member',
        "status" "public"."membership_status_enum" NOT NULL DEFAULT 'active',
        CONSTRAINT "PK_memberships_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_memberships_user_org" UNIQUE ("userId", "organizationId"),
        CONSTRAINT "FK_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_memberships_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "refreshTokenHash" character varying(500) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "revokedAt" TIMESTAMPTZ,
        "userAgent" character varying(255),
        "ipAddress" character varying(64),
        CONSTRAINT "PK_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sessions_userId" ON "sessions" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "email" character varying(255) NOT NULL,
        "organizationId" uuid NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'org_member',
        "tokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "acceptedAt" TIMESTAMPTZ,
        "invitedById" uuid,
        CONSTRAINT "PK_invitations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_invitations_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_invitations_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_invitations_email" ON "invitations" ("email")`);

    await queryRunner.query(`
      CREATE TABLE "assistants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "organizationId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "systemPrompt" text,
        "model" character varying(100) NOT NULL DEFAULT 'gpt-4o-mini',
        "temperature" double precision NOT NULL DEFAULT 0.7,
        "welcomeMessage" text,
        "status" "public"."assistant_status_enum" NOT NULL DEFAULT 'draft',
        "publicId" character varying(64) NOT NULL,
        "allowedDomains" text,
        CONSTRAINT "PK_assistants_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_assistants_publicId" UNIQUE ("publicId"),
        CONSTRAINT "FK_assistants_org" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_assistants_org" ON "assistants" ("organizationId")`);

    await queryRunner.query(`
      CREATE TABLE "knowledge_documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "assistantId" uuid NOT NULL,
        "name" character varying(255) NOT NULL,
        "sourceType" "public"."source_type_enum" NOT NULL,
        "sourceUrl" text,
        "storagePath" character varying(500),
        "status" "public"."document_status_enum" NOT NULL DEFAULT 'pending',
        "errorMessage" text,
        "chunkCount" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        CONSTRAINT "PK_knowledge_documents_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_knowledge_documents_assistant" FOREIGN KEY ("assistantId") REFERENCES "assistants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_documents_assistant" ON "knowledge_documents" ("assistantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_knowledge_documents_status" ON "knowledge_documents" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "document_chunks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "documentId" uuid NOT NULL,
        "assistantId" uuid NOT NULL,
        "chunkIndex" integer NOT NULL,
        "content" text NOT NULL,
        "tokenCount" integer,
        "embedding" jsonb,
        "metadata" jsonb,
        CONSTRAINT "PK_document_chunks_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_document_chunks_document" FOREIGN KEY ("documentId") REFERENCES "knowledge_documents"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_document_chunks_assistant" FOREIGN KEY ("assistantId") REFERENCES "assistants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_document_chunks_document" ON "document_chunks" ("documentId")`);
    await queryRunner.query(`CREATE INDEX "IDX_document_chunks_assistant" ON "document_chunks" ("assistantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_document_chunks_assistant_document" ON "document_chunks" ("assistantId", "documentId")`);

    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "assistantId" uuid NOT NULL,
        "visitorId" character varying(128),
        "status" "public"."conversation_status_enum" NOT NULL DEFAULT 'open',
        "sourceDomain" character varying(255),
        "lastMessageAt" TIMESTAMPTZ,
        "metadata" jsonb,
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_conversations_assistant" FOREIGN KEY ("assistantId") REFERENCES "assistants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_assistant" ON "conversations" ("assistantId")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_visitor" ON "conversations" ("visitorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_status" ON "conversations" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "conversationId" uuid NOT NULL,
        "role" "public"."message_role_enum" NOT NULL,
        "content" text NOT NULL,
        "sources" jsonb,
        "feedback" "public"."feedback_value_enum",
        "metadata" jsonb,
        CONSTRAINT "PK_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_messages_conversation" ON "messages" ("conversationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_messages_conv_created" ON "messages" ("conversationId", "createdAt")`);

    await queryRunner.query(`
      CREATE TABLE "email_verification_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "usedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_email_verification_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_email_verification_tokens_hash" UNIQUE ("tokenHash")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_email_verification_tokens_user" ON "email_verification_tokens" ("userId")`);

    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "usedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_hash" UNIQUE ("tokenHash")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_user" ON "password_reset_tokens" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    await queryRunner.query(`DROP TABLE "messages"`);
    await queryRunner.query(`DROP TABLE "conversations"`);
    await queryRunner.query(`DROP TABLE "document_chunks"`);
    await queryRunner.query(`DROP TABLE "knowledge_documents"`);
    await queryRunner.query(`DROP TABLE "assistants"`);
    await queryRunner.query(`DROP TABLE "invitations"`);
    await queryRunner.query(`DROP TABLE "sessions"`);
    await queryRunner.query(`DROP TABLE "memberships"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."feedback_value_enum"`);
    await queryRunner.query(`DROP TYPE "public"."message_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."conversation_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."source_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."document_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."assistant_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."membership_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
