## After applying Patch 2

### 1) Install (and optionally skip native deps if web-only for now)
`bash
# Required web deps already present; add Capacitor deps only if building native shells now
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android \
  @capacitor/camera @capacitor/haptics @capacitor/share @capacitor/device \
  @capacitor/push-notifications @capacitor/preferences
`

### 2) App Check (web) env
Add to `.env.local` (use your reCAPTCHA v3 site key):
`
NEXT_PUBLIC_RECAPTCHA_KEY=
`

### 3) Optional: include initializers in your root layout
`tsx
// src/app/layout.tsx
import AppCheckInit from './app-check-init'
import PushInit from './push-init'
// ...inside <body> (near the top)
<AppCheckInit />
<PushInit />
`

### 4) CI
Push to a branch with GitHub Actions enabled to run build, OSV scan, and Lighthouse budgets.
