{ pkgs, ... }:
{
  packages = with pkgs; [
    nodejs_20
    pnpm
    firebase-tools
    git
    jq
  ];
}
