import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceConversationsMessages1712800003000 implements MigrationInterface {
  name = 'EnhanceConversationsMessages1712800003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "organizationId" uuid`);
    await queryRunner.query(`UPDATE "conversations" c SET "organizationId" = a."organizationId" FROM "assistants" a WHERE c."assistantId" = a."id" AND c."organizationId" IS NULL`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_conversations_org" ON "conversations" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_conversations_assistant_createdAt" ON "conversations" ("assistantId", "createdAt")`);
    await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "title" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "tokenCount" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN IF EXISTS "tokenCount"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "title"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_assistant_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_org"`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "organizationId"`);
  }
}
