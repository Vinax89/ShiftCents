#!/usr/bin/env bash
set -euo pipefail
echo "== before =="; df -h .; du -sh .git node_modules .next 2>/dev/null || true

echo "== prune node caches =="; npm cache clean --force 2>/dev/null || true

echo "== delete build artifacts =="; rm -rf .next .turbo .eslintcache .cache .vercel functions/lib 2>/dev/null || true

echo "== emulator blobs =="; rm -rf ~/.config/firebase/emulators/* 2>/dev/null || true

echo "== git maintenance ==";
git reflog expire --expire-unreachable=now --all || true
git remote prune origin || true
git gc --prune=now --aggressive || true

echo "== after =="; df -h .; du -sh .git node_modules .next 2>/dev/null || true
