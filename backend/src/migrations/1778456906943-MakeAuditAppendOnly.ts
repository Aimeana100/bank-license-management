import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeAuditAppendOnly1778456906943 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION prevent_audit_modification()
      RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs is append-only';
      END;
      $$ LANGUAGE plpgsql;
    `)

    await queryRunner.query(`
      CREATE TRIGGER prevent_audit_update
      BEFORE UPDATE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_modification();
    `)

    await queryRunner.query(`
      CREATE TRIGGER prevent_audit_delete
      BEFORE DELETE ON audit_logs
      FOR EACH ROW
      EXECUTE FUNCTION prevent_audit_modification();
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS prevent_audit_update ON audit_logs;
    `)

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS prevent_audit_delete ON audit_logs;
    `)

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS prevent_audit_modification;
    `)
  }
}
