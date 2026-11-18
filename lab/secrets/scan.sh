#!/usr/bin/env bash
# Secret exposure: gitleaks over the twin's full Git history, plus a scan of the public JS bundles.
# Usage: REPO_DIR=../twin-a TARGET_URL=https://... ./lab/secrets/scan.sh <twin-label>
set -euo pipefail
: "${REPO_DIR:?Set REPO_DIR}" "${TARGET_URL:?Set TARGET_URL}"
LABEL="${1:?Pass a twin label}"
OUT="$(pwd)/lab/results/raw"
mkdir -p "$OUT"
gitleaks detect --source "$REPO_DIR" --report-format json --report-path "$OUT/gitleaks-$LABEL.json" || true
# Bundle scan: fetch the home page, collect script URLs, grep for secret-looking strings.
curl -sL "$TARGET_URL" | grep -oE 'src="[^"]+\.js"' | sed 's/src="//;s/"$//' | while read -r src; do
  case "$src" in http*) url="$src";; *) url="${TARGET_URL%/}/${src#/}";; esac
  curl -sL "$url"
done | grep -oE '(sk_live_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9_-]{20,}|service_role[^"]{0,80}|AKIA[0-9A-Z]{16})' | sort -u > "$OUT/bundle-secrets-$LABEL.txt" || true
echo "gitleaks: $OUT/gitleaks-$LABEL.json; bundle matches: $(wc -l < "$OUT/bundle-secrets-$LABEL.txt")"
