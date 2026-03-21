#!/usr/bin/env bash
set -euo pipefail

# Prefer Python versions with prebuilt wheels for pinned backend dependencies.
for candidate in python3.13 python3.12 python3.11; do
  if command -v "${candidate}" >/dev/null 2>&1; then
    echo "${candidate}"
    exit 0
  fi
done

echo "Fehler: Kein kompatibles Python gefunden (benoetigt 3.11-3.13)." >&2
echo "Installiere z. B. python3.13 und versuche es erneut." >&2
exit 1
