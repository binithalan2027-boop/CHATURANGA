---
area: toolchain
date: 2026-10-13
---

# After npm audit fix, rollup native binary goes missing

`npm audit fix` on this repo updates the lockfile piecemeal and drops
`@rollup/rollup-linux-x64-gnu` (npm optional-dependencies bug). Symptom:
`npm test` / `vite build` crash in `rollup/dist/native.js`.

Fix that sticks for fresh clones: delete `node_modules` AND
`package-lock.json`, then `npm install` to regenerate the lock with the
optional native entries. A `--no-save` install of the native package only
repairs the current machine and breaks the next `npm ci`.
