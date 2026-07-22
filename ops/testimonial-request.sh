#!/usr/bin/env bash
# Private helper (ceo-plan E2) - operationalizes the office-hours P0 assignment:
# email 3 past clients for a 2-line testimonial. NOT a public site feature.
#
# Usage:  ops/testimonial-request.sh "Client Name" client@example.com "the RO real-estate portal"
# Opens a prefilled mail draft (macOS `open`), or prints the mailto URL elsewhere.
set -euo pipefail

NAME="${1:?usage: testimonial-request.sh <name> <email> <project>}"
EMAIL="${2:?missing client email}"
PROJECT="${3:?missing project description}"

SUBJECT="Quick favor - two lines for my site?"
BODY="Hi ${NAME},

I'm refreshing my portfolio at https://adityadev.in and would love to include your project. Could you write two sentences on what I built for you (${PROJECT}) and how it went? A rough draft is completely fine - I'll tidy it and send it back for your OK before anything goes live.

No rush, and thank you.

Aditya"

# URL-encode via jq (present in this repo's tooling); falls back to python3.
encode() {
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "$1" | jq -sRr @uri
  else
    python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.stdin.read()))'
  fi
}

URL="mailto:${EMAIL}?subject=$(encode "$SUBJECT")&body=$(encode "$BODY")"

if command -v open >/dev/null 2>&1; then
  open "$URL"
else
  echo "$URL"
fi
