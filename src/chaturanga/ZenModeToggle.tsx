import { usePreferences } from "./preferences";
export default function ZenModeToggle() {
  const { prefs, update } = usePreferences();
  return (
    <label>
      <input
        type="checkbox"
        checked={prefs.hideRatings}
        onChange={(e) => update({ hideRatings: e.target.checked })}
      />
      Hide rating and difficulty numbers
    </label>
  );
}
