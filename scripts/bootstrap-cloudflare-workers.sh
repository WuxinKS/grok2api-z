#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CF_DIR="$ROOT_DIR/cloudflare-workers"
cd "$CF_DIR"

WRANGLER_CONFIG="$CF_DIR/wrangler.toml"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm 未安装，先安装 Node.js 20+ 再试。" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  npm install
fi

if ! npx wrangler whoami --config "$WRANGLER_CONFIG" >/dev/null 2>&1; then
  npx wrangler login
fi

echo ">>> 创建 D1 数据库 grok2api-z"
D1_OUT=$(npx wrangler d1 create grok2api-z --config "$WRANGLER_CONFIG" 2>&1 || true)
echo "$D1_OUT"
D1_ID=$(printf '%s' "$D1_OUT" | sed -n 's/.*database_id = "\([^"]*\)".*/\1/p' | head -n1)

if [ -z "$D1_ID" ]; then
  echo ">>> 如果上面提示已存在，请手动执行: npx wrangler d1 list --config $WRANGLER_CONFIG" >&2
fi

echo ">>> 创建 KV namespace grok2api-z-cache"
KV_OUT=$(npx wrangler kv namespace create grok2api-z-cache --config "$WRANGLER_CONFIG" 2>&1 || true)
echo "$KV_OUT"
KV_ID=$(printf '%s' "$KV_OUT" | sed -n 's/.*id = "\([^"]*\)".*/\1/p' | head -n1)

if [ -z "$KV_ID" ]; then
  echo ">>> 如果上面提示已存在，请手动执行: npx wrangler kv namespace list --config $WRANGLER_CONFIG" >&2
fi

if [ -n "$D1_ID" ]; then
  perl -0pi -e 's/database_id = "[^"]*"/database_id = "'"$D1_ID"'"/' "$WRANGLER_CONFIG"
fi

if [ -n "$KV_ID" ]; then
  perl -0pi -e 's/id = "[^"]*"/id = "'"$KV_ID"'"/' "$WRANGLER_CONFIG"
fi

echo ">>> 应用 D1 migrations"
npx wrangler d1 migrations apply DB --remote --config "$WRANGLER_CONFIG"

echo ">>> 完成。现在可以部署："
echo "cd cloudflare-workers && npx wrangler deploy --config wrangler.toml"
