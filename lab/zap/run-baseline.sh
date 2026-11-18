#!/usr/bin/env bash
# Passive OWASP ZAP baseline scan. Usage: TARGET_URL=https://... ./lab/zap/run-baseline.sh <twin-label>
set -euo pipefail
: "${TARGET_URL:?Set TARGET_URL}"
LABEL="${1:?Pass a twin label, e.g. a or b}"
OUT="$(pwd)/lab/results/raw"
mkdir -p "$OUT"
docker run --rm -v "$OUT:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET_URL" -J "zap-$LABEL.json" -r "zap-$LABEL.html" || true
echo "Report: $OUT/zap-$LABEL.json (count alerts with riskcode >= 3 as high severity)"
