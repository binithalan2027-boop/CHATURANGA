/**
 * Operator tool: grant/revoke/list unlocks while payments are off.
 * Usage: npx tsx scripts/entitlement.ts grant <userId> | revoke <userId> | list
 */
import { Store } from "../server/store";
import { Entitlements } from "../server/entitlements";

const [action, userId] = process.argv.slice(2);
const store = new Store(process.env.DB_PATH ?? "data/chaturanga.sqlite");
const ent = new Entitlements(store, "trial");
if (action === "grant" && userId) {
  ent.grant(userId);
  console.log(`Unlocked: ${userId}`);
} else if (action === "revoke" && userId) {
  ent.revoke(userId);
  console.log(`Revoked: ${userId}`);
} else if (action === "list") {
  for (const e of store.all<{ unlocked: boolean; at: number }>("entitlement"))
    console.log(JSON.stringify(e));
} else {
  console.error("Usage: entitlement.ts grant <userId> | revoke <userId> | list");
  process.exit(1);
}
store.close();
