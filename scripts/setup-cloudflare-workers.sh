#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/cloudflare-workers"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm 未安装，先安装 Node.js 20+ 再试。" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo ">>> 安装 Cloudflare Workers 依赖"
  npm install
fi

echo ">>> 检查 Cloudflare 登录状态"
if ! npx wrangler whoami >/dev/null 2>&1; then
  echo ">>> 未登录，开始 Cloudflare OAuth 登录"
  npx wrangler login
fi

echo
echo "下一步通常是："
echo "  1) npx wrangler d1 create grok2api-z"
echo "  2) npx wrangler kv namespace create grok2api-z-cache"
echo "  3) 把返回的 ID 填到 cloudflare-workers/wrangler.toml"
echo "  4) npx wrangler d1 migrations apply DB --remote"
echo "  5) npx wrangler deploy"
