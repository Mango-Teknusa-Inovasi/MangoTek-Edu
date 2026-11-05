import "dotenv/config";
import knex from "knex";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
export const driver = process.env.DB_DRIVER || "sqlite";
if (!["sqlite", "postgres", "mariadb"].includes(driver))
  throw Error("DB_DRIVER tidak valid");
const filename = resolve(process.env.SQLITE_PATH || "data/portal.sqlite");
if (driver === "sqlite") mkdirSync(dirname(filename), { recursive: true });
export const db = knex(
  driver === "sqlite"
    ? {
        client: "better-sqlite3",
        connection: { filename },
        useNullAsDefault: true,
        pool: {
          min: 1,
          max: 1,
          afterCreate: (conn: any, done: any) => {
            conn.pragma("foreign_keys = ON");
            conn.pragma("journal_mode = WAL");
            conn.pragma("busy_timeout = 5000");
            done(null, conn);
          },
        },
      }
    : {
        client: driver === "postgres" ? "pg" : "mysql2",
        connection: process.env.DATABASE_URL || {
          host: process.env.DB_HOST || "127.0.0.1",
          port: Number(
            process.env.DB_PORT || (driver === "postgres" ? 5432 : 3306),
          ),
          user: process.env.DB_USER || "mangotek",
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || "mangotek",
        },
        pool: { min: 0, max: 10 },
      },
);
export const now = () => new Date().toISOString();
