# Play Store packaging (TWA path) - step by step

Status: scaffold only. No developer account exists yet, nothing is uploaded.
Prerequisite: the site must be live on HTTPS at the final domain first
(docs/DEPLOYMENT.md). The TWA is a thin shell over the website; online modes
need the Node server running.

## Why TWA (Trusted Web Activity)

The whole game is a fast PWA already. A TWA wraps it in a real Play app with
no WebView chrome, no duplicated app code. Capacitor is the fallback if we
later need native APIs (push notifications, Play Billing for the unlock).

## Steps

1. Install Bubblewrap: `npm install -g @bubblewrap/cli` (needs JDK 17+ and
   Android SDK; `bubblewrap doctor` checks).
2. Icons are done: `public/icons/icon-512.png` and `icon-maskable-512.png`
   ship with the app, and the site serves `/manifest.webmanifest` (verified
   200 locally along with both icons).
3. Edit `playstore/twa-manifest.json`: replace YOUR-DOMAIN with the real
   domain (host + iconUrl).
4. `bubblewrap init --manifest https://YOUR-DOMAIN/manifest.webmanifest` -
   Bubblewrap reads the SITE web manifest and generates its own
   twa-manifest.json; merge the packageId/signingKey values from
   playstore/twa-manifest.json - then `bubblewrap build`.
5. Create the release keystore when asked (or
   `keytool -genkey -v -keystore android.keystore -alias chaturanga -keyalg RSA -keysize 2048 -validity 10000`).
   Back it up: losing it means never updating the app again.
6. Get the SHA-256 fingerprint:
   `keytool -list -v -keystore android.keystore -alias chaturanga`
   Put it into `public/.well-known/assetlinks.json` (template:
   playstore/assetlinks.json), redeploy, and verify
   `https://YOUR-DOMAIN/.well-known/assetlinks.json` returns it as JSON.
7. Play Console ($25 one-time, identity verification):
   - Create app -> upload the AAB from `bubblewrap build`.
   - New personal accounts (created after 2023-11-13) must run a CLOSED TEST
     with at least 12 testers opted in for 14 continuous days before
     production access. Plan the launch date around this.
   - Complete: Data safety (playstore/data-safety-draft.md), content rating
     questionnaire, privacy policy URL, store listing
     (playstore/store-listing.md), target API level (current requirement:
     Android 15 / API 35 or newer - Bubblewrap templates track this).
8. Review typically takes days. The web version keeps working throughout.

## Play Billing note

If the one-time unlock model is chosen (docs/MONETISATION.md), digital
unlocks inside the Play app must use Play Billing - that needs the Capacitor
path or a Billing-compatible TWA plugin. Do not sell unlocks in the Play app
through any other rail.
