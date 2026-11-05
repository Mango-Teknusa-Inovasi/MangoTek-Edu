import type { Knex } from "knex";
import { defaultPortal } from "../src/cms/schema";
export const migrationSource = {
  async getMigrations() {
    return ["001_cms"];
  },
  getMigrationName: (name: string) => name,
  async getMigration() {
    return {
      async up(db: Knex) {
        await db.schema.createTable("users", (t) => {
          t.string("id", 36).primary();
          t.string("email", 180).unique().notNullable();
          t.string("name", 180).notNullable();
          t.string("role", 16).notNullable();
          t.text("password").notNullable();
          t.boolean("active").notNullable().defaultTo(true);
          t.integer("revision").notNullable().defaultTo(1);
        });
        await db.schema.createTable("sessions", (t) => {
          t.string("id", 64).primary();
          t.string("user_id", 36)
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
          t.string("csrf", 64).notNullable();
          t.string("expires_at", 30).notNullable();
        });
        await db.schema.createTable("documents", (t) => {
          t.string("id", 36).primary();
          t.string("kind", 16).notNullable();
          t.integer("revision").notNullable();
          t.string("status", 16).notNullable();
          t.text("draft", "longtext").notNullable();
          t.text("published", "longtext");
          t.string("slug", 180).unique();
          t.string("published_slug", 180).unique();
          t.string("updated_at", 30).notNullable();
          t.string("published_at", 30);
        });
        await db.schema.createTable("versions", (t) => {
          t.string("id", 36).primary();
          t.string("document_id", 36)
            .notNullable()
            .references("id")
            .inTable("documents")
            .onDelete("CASCADE");
          t.integer("revision").notNullable();
          t.text("content", "longtext").notNullable();
          t.string("actor_id", 36).notNullable();
          t.string("created_at", 30).notNullable();
        });
        await db.schema.createTable("media", (t) => {
          t.string("id", 36).primary();
          t.string("url", 180).notNullable();
          t.string("name", 180).notNullable();
          t.integer("size").notNullable();
          t.string("created_at", 30).notNullable();
        });
        await db.schema.createTable("inquiries", (t) => {
          t.string("id", 36).primary();
          t.string("request_id", 36).unique().notNullable();
          t.string("name", 180).notNullable();
          t.string("organization", 180).notNullable();
          t.string("email", 254).notNullable();
          t.string("phone", 30).notNullable();
          t.text("services").notNullable();
          t.text("message").notNullable();
          t.string("status", 16).notNullable();
          t.text("notes").notNullable();
          t.integer("revision").notNullable().defaultTo(1);
          t.string("created_at", 30).notNullable().index();
        });
        await db.schema.createTable("audit", (t) => {
          t.string("id", 36).primary();
          t.string("actor_id", 36).notNullable();
          t.string("action", 80).notNullable();
          t.string("target_id", 36).notNullable();
          t.string("created_at", 30).notNullable();
        });
        await db.schema.createTable("rate_limits", (t) => {
          t.string("id", 64).primary();
          t.integer("count").notNullable();
          t.bigInteger("reset_at").notNullable();
        });
        await db("documents").insert({
          id: "portal",
          kind: "portal",
          revision: 1,
          status: "published",
          draft: JSON.stringify(defaultPortal),
          published: JSON.stringify(defaultPortal),
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString(),
        });
      },
      async down() {
        throw Error(
          "Pemulihan skema dilakukan dari cadangan; rollback destruktif dinonaktifkan.",
        );
      },
    };
  },
};
