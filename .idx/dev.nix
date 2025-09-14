{ pkgs, ... }:

{
  # Tools available in the environment
  packages = with pkgs; [
    nodejs_20           # Next.js 15 friendly
    pnpm                # real pnpm binary; no corepack symlinks
    firebase-tools
    git
    jq
    bashInteractive
  ];

  # Environment vars (keep caches off repo; speed up builds)
  env = {
    NPM_CONFIG_CACHE = "$HOME/.npm-cache";
    PNPM_HOME        = "$HOME/.pnpm";
    PNPM_STORE_DIR   = "$HOME/.pnpm-store";

    NEXT_CACHE_DIR   = "/tmp/next-cache";
    ESLINT_CACHE_DIR = "/tmp/eslintcache";
    TURBO_CACHE_DIR  = "/tmp/turbo";

    # Put user bin dirs early in PATH (helps if you add local shims)
    PATH = "$PNPM_HOME:$HOME/.local/bin:$PATH";
  };

  # Optional: light post-start hook to ensure dirs exist and print versions
  scripts.postStart = ''
    mkdir -p "$NPM_CONFIG_CACHE" "$PNPM_HOME" "$PNPM_STORE_DIR" \
             "$HOME/.local/bin" "$NEXT_CACHE_DIR" "$ESLINT_CACHE_DIR" "$TURBO_CACHE_DIR"
    echo "Env ready: node $(node -v) | pnpm $(pnpm -v) | firebase $(firebase --version)"
  '';
}
