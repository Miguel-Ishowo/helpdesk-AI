import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceAssistantsModel1712800002000 implements MigrationInterface {
  name = 'EnhanceAssistantsModel1712800002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assistants" ADD COLUMN IF NOT EXISTS "maxTokens" integer`);
    await queryRunner.query(`ALTER TABLE "assistants" ADD COLUMN IF NOT EXISTS "modelSettings" jsonb`);
    await queryRunner.query(`ALTER TABLE "assistants" ADD COLUMN IF NOT EXISTS "widgetSettings" jsonb`);
    await queryRunner.query(`ALTER TABLE "assistants" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_assistants_org_status" ON "assistants" ("organizationId", "status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assistants_org_status"`);
    await queryRunner.query(`ALTER TABLE "assistants" DROP COLUMN IF EXISTS "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "assistants" DROP COLUMN IF EXISTS "widgetSettings"`);
    await queryRunner.query(`ALTER TABLE "assistants" DROP COLUMN IF EXISTS "modelSettings"`);
    await queryRunner.query(`ALTER TABLE "assistants" DROP COLUMN IF EXISTS "maxTokens"`);
  }
}
