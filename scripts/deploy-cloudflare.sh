#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm 未安装，先安装 Node.js 20+ 再试。" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker 未安装或不可用。Cloudflare Containers 部署需要本地 Docker。" >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker daemon 不可用，请先启动 Docker。" >&2
  exit 1
fi

if [ ! -d node_modules ]; then
  echo ">>> 安装 Wrangler 和 Cloudflare Containers 依赖"
  npm install
fi

echo ">>> 检查 Cloudflare 登录状态"
if ! npx wrangler whoami >/dev/null 2>&1; then
  echo ">>> 未登录，开始 Cloudflare OAuth 登录"
  npx wrangler login
fi

echo ">>> 部署 Worker + Container"
npx wrangler deploy "$@"

echo
echo "部署完成后可用以下命令查看状态："
echo "  npx wrangler containers list"
echo "  npx wrangler containers images list"
