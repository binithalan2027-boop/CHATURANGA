/**
 * Online backup of the live SQLite database (safe while the server runs).
 * Usage: npm run backup -- /backups/chaturanga
 * Keeps one timestamped copy per run; prune with find(1), see docs/DEPLOYMENT.md.
 */
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { Store } from "../server/store";

const dir = resolve(process.argv[2] ?? "backups");
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const target = join(dir, `chaturanga-${stamp}.sqlite`);
const store = new Store(process.env.DB_PATH ?? "data/chaturanga.sqlite");
store.backup(target);
store.close();
console.log(`Backup written: ${target}`);
