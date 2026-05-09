#!/bin/bash
# Auto-review hook — uruchamiany przez Stop event.
# Pomija review gdy: brak zmian w kodzie, tylko docs/config, <5 linii zmian.

CHANGED=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx|jsx|js|py|svelte|vue|astro)$' | grep -vE '\.(test|spec|config|d)\.' || true)
LINES=$(git diff --stat 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)

if [ -z "$CHANGED" ] || [ "${LINES:-0}" -lt 5 ]; then
  exit 0  # cicho pomiń
fi

echo '{"hookSpecificOutput": {"hookEventName": "Stop", "additionalContext": "AUTO-REVIEW: Zmiany w kodzie wykryte (git diff). Spawn agenta code-reviewer na zmienione pliki. NIE pytaj usera — to automat per Kacpra workflow (rules/auto-review.md)."}}'
