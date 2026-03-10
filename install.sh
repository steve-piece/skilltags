#!/usr/bin/env bash
# install.sh
# One-line installer for skilltags.
#
# Usage (curl):
#   curl -fsSL https://raw.githubusercontent.com/steve-piece/skilltags/main/install.sh | bash
#
# Usage (local):
#   bash install.sh

set -euo pipefail

WRAPPER_MARKER="# -- skilltags auto-sync "

info()    { printf "  %s\n" "$*"; }
success() { printf "  ✓ %s\n" "$*"; }
die()     { printf "\n  Error: %s\n\n" "$*" >&2; exit 1; }

# ─── Check for Node.js ───────────────────────────────────────────────────────

if ! command -v node &>/dev/null; then
  die "Node.js is required but not found. Install it from https://nodejs.org"
fi

if ! command -v npm &>/dev/null; then
  die "npm is required but not found. Install Node.js from https://nodejs.org"
fi

# ─── Install via npm ─────────────────────────────────────────────────────────

printf "\n  Installing skilltags...\n\n"

npm install -g skilltags --ignore-scripts

if [ -t 0 ] && [ -t 1 ]; then
  printf "\n  Starting setup...\n\n"
  if ! skilltags update; then
    printf "\n  Setup did not complete.\n"
    printf "  Run skilltags update to finish configuring categories.\n\n"
  fi
else
  printf "\n  Setup:\n"
  printf "    skilltags update     Select skill categories\n"
  printf "    skilltags sync       Generate category files\n"
  printf "    skilltags --help     Show all commands\n\n"
fi
