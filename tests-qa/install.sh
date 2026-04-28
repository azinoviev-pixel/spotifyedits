#!/bin/bash
# qa-template one-liner installer
# Usage: curl -fsSL https://raw.githubusercontent.com/azinoviev-pixel/qa-template/main/install.sh | bash
#    or: curl -fsSL https://raw.githubusercontent.com/azinoviev-pixel/qa-template/main/install.sh | bash -s custom-folder-name

set -e

FOLDER=${1:-tests-qa}
REPO="azinoviev-pixel/qa-template"

echo ""
echo "================================================"
echo "  qa-template installer"
echo "  https://github.com/${REPO}"
echo "================================================"
echo ""

# Check dependencies
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found. Install Node.js >= 18 first."
  exit 1
fi

# Check folder doesn't exist
if [ -d "$FOLDER" ]; then
  echo "ERROR: Folder '$FOLDER' already exists. Choose a different name or remove it."
  exit 1
fi

echo "[1/5] Pulling template into ./${FOLDER}..."
npx --yes degit "$REPO" "$FOLDER"

cd "$FOLDER"

echo ""
echo "[2/5] Asking for configuration..."
if [ -t 0 ]; then
  read -p "  What is your production URL? (e.g., https://yoursite.com): " BASE_URL
else
  echo "  (non-interactive; set BASE_URL later as a GitHub repo Variable)"
  BASE_URL=""
fi

if [ -n "$BASE_URL" ]; then
  echo "  BASE_URL=$BASE_URL" > .env.local
  echo "  Saved to .env.local (git-ignored)"
fi

echo ""
echo "[3/5] Installing dependencies (this takes ~1 minute)..."
if command -v pnpm &> /dev/null; then
  pnpm install --no-frozen-lockfile
else
  echo "  pnpm not found, using npm..."
  npm install
fi

echo ""
echo "[4/5] Installing Playwright browsers (~2 minutes, one-time)..."
if command -v pnpm &> /dev/null; then
  pnpm exec playwright install --with-deps
else
  npx playwright install --with-deps
fi

echo ""
echo "[5/5] Done!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit tests/*.spec.ts — add your project's routes to PAGES array"
echo ""
echo "  2. Run a first local check:"
if [ -n "$BASE_URL" ]; then
  echo "       BASE_URL=$BASE_URL pnpm test"
else
  echo "       BASE_URL=https://yoursite.com pnpm test"
fi
echo ""
echo "  3. Wire CI:"
echo "       mkdir -p ../.github/workflows"
echo "       cp .github/workflows/*.yml ../.github/workflows/"
echo ""
echo "  4. In your GitHub repo → Settings → Actions:"
echo "       - Variables: add BASE_URL"
echo "       - Secrets: add BROWSERSTACK_USERNAME + BROWSERSTACK_ACCESS_KEY (if using BrowserStack)"
echo ""
echo "See INSTALL.md for detailed steps. README.md for overview."
echo ""
