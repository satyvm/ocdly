import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddFashionCatalogueFields1758376800000
	implements MigrationInterface
{
	name = "AddFashionCatalogueFields1758376800000";

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsFabric" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsComposition" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsGsm" integer`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsFit" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsCare" text`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsHsncode" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsCountryoforigin" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsSizechart" text`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsModelmeasurements" text`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsCollection" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product" ADD "customFieldsDispatchwindow" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" ADD "customFieldsColourcode" character varying(255)`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" ADD "customFieldsPreorderenabled" boolean DEFAULT false`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" ADD "customFieldsPreorderlimit" integer DEFAULT 0`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" ADD "customFieldsPreorderleadtimedays" integer`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" ADD "customFieldsPreorderdispatchwindow" character varying(255)`
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "product_variant" DROP COLUMN "customFieldsPreorderdispatchwindow"`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" DROP COLUMN "customFieldsPreorderleadtimedays"`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" DROP COLUMN "customFieldsPreorderlimit"`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" DROP COLUMN "customFieldsPreorderenabled"`
		);
		await queryRunner.query(
			`ALTER TABLE "product_variant" DROP COLUMN "customFieldsColourcode"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsDispatchwindow"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsCollection"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsModelmeasurements"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsSizechart"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsCountryoforigin"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsHsncode"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsCare"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsFit"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsGsm"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsComposition"`
		);
		await queryRunner.query(
			`ALTER TABLE "product" DROP COLUMN "customFieldsFabric"`
		);
	}
}
