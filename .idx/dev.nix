{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  # Tools available in your dev shell
  packages = with pkgs; [
    nodejs_20          # Stable for Next.js 15.x
    nodePackages.pnpm  # Real pnpm binary; avoids corepack symlinks
    corepack           # Optional; only used if you explicitly call it
    firebase-tools
    git jq bash
  ];

  # Keep caches outside repo; make pnpm/npm/next fast + clean
  shellHook = ''
    export NPM_CONFIG_CACHE="$HOME/.npm-cache"
    export PNPM_HOME="$HOME/.pnpm"
    export PNPM_STORE_DIR="$HOME/.pnpm-store"
    export PATH="$PNPM_HOME:$HOME/.local/bin:$PATH"

    export NEXT_CACHE_DIR="/tmp/next-cache"
    export ESLINT_CACHE_DIR="/tmp/eslintcache"
    export TURBO_CACHE_DIR="/tmp/turbo"

    mkdir -p "$NPM_CONFIG_CACHE" "$PNPM_HOME" "$PNPM_STORE_DIR" "$HOME/.local/bin" \
             "$NEXT_CACHE_DIR" "$ESLINT_CACHE_DIR" "$TURBO_CACHE_DIR"

    # Optional: if you ever want corepack‑managed pnpm in $HOME (not /usr/bin)
    # corepack enable --install-directory "$HOME/.local/bin" >/dev/null 2>&1 || true

    echo "Dev shell ready: $(node -v) | pnpm $(pnpm -v) | firebase $(firebase --version)"
  '';
}
