import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPgvectorToDocumentChunks1712800001000 implements MigrationInterface {
  name = 'AddPgvectorToDocumentChunks1712800001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // pgvector required for RAG features. This migration is safe to run only on DBs with pgvector available.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await queryRunner.query(`ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "embedding_vector" vector(1536)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_document_chunks_embedding_vector" ON "document_chunks" USING ivfflat ("embedding_vector" vector_cosine_ops) WITH (lists = 100)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_document_chunks_embedding_vector"`);
    await queryRunner.query(`ALTER TABLE "document_chunks" DROP COLUMN IF EXISTS "embedding_vector"`);
  }
}
