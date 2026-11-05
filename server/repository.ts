import type { Knex } from "knex";
import type { DocumentRecord } from "../src/cms/schema";
import { db } from "./db";
export interface DocumentRow {
  id: string;
  kind: "portal" | "article";
  revision: number;
  status: "draft" | "review" | "published";
  draft: string;
  published: string | null;
  slug: string | null;
  published_slug: string | null;
  updated_at: string;
  published_at: string | null;
}
export function documentRecord(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    kind: row.kind,
    revision: row.revision,
    status: row.status,
    draft: JSON.parse(row.draft),
    published: row.published ? JSON.parse(row.published) : null,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}
export const documents = (connection: Knex | Knex.Transaction = db) =>
  connection<DocumentRow>("documents");
// All content and media deletions use the same row lock, including SQLite's write transaction.
export async function lockContent(trx: Knex.Transaction) {
  await documents(trx).where({ id: "portal" }).update({ id: "portal" });
}
export async function verifyMedia(content: unknown, trx: Knex.Transaction) {
  const urls = [
    ...new Set(
      JSON.stringify(content).match(/\/uploads\/[a-f0-9-]+\.webp/g) || [],
    ),
  ];
  if (!urls.length) return;
  const existing = await trx("media").whereIn("url", urls).select("url");
  if (existing.length !== urls.length)
    throw Object.assign(
      new Error("Gambar tidak ditemukan. Pilih kembali dari pustaka media."),
      { status: 400 },
    );
}
