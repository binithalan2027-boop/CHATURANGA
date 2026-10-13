import { createRequire } from "node:module";
const { DatabaseSync } = createRequire(import.meta.url)(
  "node:sqlite",
) as typeof import("node:sqlite");
export class Store {
  db: import("node:sqlite").DatabaseSync;
  /** Deserialized write-through cache per kind, valid only when the kind has
   * been fully loaded. Single-process, single-store design: one writer, so a
   * loaded kind's map is authoritative. Rollback drops the whole cache. */
  private kinds = new Map<string, Map<string, unknown>>();
  private loaded = new Set<string>();
  /** Cold kinds that operator CLIs also write (moderation decisions,
   * entitlement grants). Never cached: a second process must be able to
   * update them without restarting the server. Volume is low, so the
   * read-through cost is irrelevant. */
  private static readonly PASSTHROUGH = new Set(["report", "entitlement"]);
  constructor(path = ":memory:") {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(kind,id));`);
  }
  get<T>(kind: string, id: string): T | undefined {
    if (!Store.PASSTHROUGH.has(kind) && this.loaded.has(kind))
      return this.kinds.get(kind)?.get(id) as T | undefined;
    const row = this.db
      .prepare("SELECT data FROM records WHERE kind=? AND id=?")
      .get(kind, id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : undefined;
  }
  all<T>(kind: string): T[] {
    if (Store.PASSTHROUGH.has(kind))
      return (
        this.db
          .prepare("SELECT data FROM records WHERE kind=?")
          .all(kind) as { data: string }[]
      ).map((r) => JSON.parse(r.data)) as T[];
    if (!this.loaded.has(kind)) {
      const m = new Map<string, unknown>();
      for (const r of this.db
        .prepare("SELECT id, data FROM records WHERE kind=?")
        .all(kind) as { id: string; data: string }[])
        m.set(r.id, JSON.parse(r.data));
      this.kinds.set(kind, m);
      this.loaded.add(kind);
    }
    return [...this.kinds.get(kind)!.values()] as T[];
  }
  put(kind: string, id: string, data: unknown) {
    this.db
      .prepare(
        "INSERT INTO records VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET data=excluded.data",
      )
      .run(kind, id, JSON.stringify(data));
    // structuredClone so later caller mutation cannot diverge cache from DB.
    if (!Store.PASSTHROUGH.has(kind))
      this.kinds.get(kind)?.set(id, structuredClone(data));
  }
  delete(kind: string, id: string) {
    this.db.prepare("DELETE FROM records WHERE kind=? AND id=?").run(kind, id);
    this.kinds.get(kind)?.delete(id);
  }
  private dropCache() {
    this.kinds.clear();
    this.loaded.clear();
  }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      this.dropCache();
      throw e;
    }
  }
  /** Consistent online backup of the database (safe in WAL mode). */
  backup(path: string) {
    this.db.exec(`VACUUM INTO '${path.replace(/'/g, "''")}'`);
  }
  close() {
    this.db.close();
  }
}
