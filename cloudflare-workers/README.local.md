# grok2api-z Cloudflare Workers 版本

这个目录提供 **纯 Cloudflare 可运行版**，来源于你给的可运行参考实现，并已经放进当前仓库中，作为独立子项目维护。

> 部署完成后的实际使用方式，请看：`cloudflare-workers/USAGE.zh-CN.md`

## 目录说明

- `cloudflare-workers/src`：Worker 主逻辑（TypeScript / Hono）
- `cloudflare-workers/migrations`：D1 migrations
- `cloudflare-workers/app/static`：管理后台静态资源
- `cloudflare-workers/wrangler.toml`：Workers 配置

## 适用场景

如果你要的是：
- 不跑 Docker
- 不跑 Python 运行时
- 纯 Cloudflare Workers / D1 / KV
- 可直接挂到 workers.dev / 自定义域名

那就用这个版本。

## 快速开始

### 方式 A：半自动初始化

```bash
bash scripts/setup-cloudflare-workers.sh
```

### 方式 B：自动创建 D1 / KV 并写回 wrangler.toml

```bash
bash scripts/bootstrap-cloudflare-workers.sh
```

然后部署：

```bash
cd cloudflare-workers
npx wrangler deploy
```

## 手动流程

```bash
cd cloudflare-workers
npm install
npx wrangler login
npx wrangler d1 create grok2api-z
npx wrangler kv namespace create grok2api-z-cache
# 把返回 ID 填到 wrangler.toml
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
```

## 注意

这是一套 **独立实现**，不是直接复用当前 FastAPI 服务。
它更适合“纯 Cloudflare”目标；而根目录那套 `cloudflare/ + wrangler.jsonc` 是 **Cloudflare Containers 生产部署版**。

你现在仓库里已经同时具备：
- `cloudflare-workers/`：纯 Cloudflare 版
- 根目录 `cloudflare/` + `wrangler.jsonc`：Containers 生产版
