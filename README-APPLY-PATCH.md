## After applying the patch

1) Install core deps (from repo root):

```bash
npm i firebase@^12
```

2) (Optional) If you plan to build native shells later: add Capacitor packages per SPEC-001H.

3) Ensure TypeScript & ESLint are set up as in your blueprint. If not, install:

```bash
npm i -D typescript@5.9 eslint@^9 @next/eslint-plugin-next prettier@^3
```

4) Add env values in `.env.local` (Firebase web config + `NEXT_PUBLIC_FIREBASE_VAPID_KEY` if using push).

5) Run dev or prod serve:

```bash
npm run dev
# or
# NODE_ENV=production next build && NODE_ENV=production next start -p 9000
```

6) (Later) Build the Rust→WASM engine (`engine/`): until then, the app uses safe stubs.
