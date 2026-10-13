import { usePreferences } from "./preferences";
export default function RematchSettings() {
  const { prefs, update } = usePreferences();
  return (
    <label>
      <input
        type="checkbox"
        checked={prefs.autoDeclineRematch}
        onChange={(e) => update({ autoDeclineRematch: e.target.checked })}
      />
      Auto-decline rematch offers
      <small>
        Preference saved. Online rematch offers are not implemented in this
        build.
      </small>
    </label>
  );
}
