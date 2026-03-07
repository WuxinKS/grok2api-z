# Cloudflare 部署说明

这个目录配套仓库根目录下的 `wrangler.jsonc` 与 `cloudflare/worker.mjs`，目标是让现有 FastAPI 服务以 **Cloudflare Containers** 方式部署，而不是强行重写成纯 Workers。

## 为什么选 Containers

这个项目依赖：
- Python/FastAPI 运行时
- 本地临时文件目录 (`DATA_DIR` / `tmp`)
- WebSocket 链路
- 后台调度任务（token 刷新、cf_refresh）
- 可选的 Redis / MySQL / PostgreSQL 外部存储

这些特性更适合跑在 Cloudflare Containers 里，Worker 只负责边缘入口和转发。

## 一键部署

在仓库根目录执行：

```bash
bash scripts/deploy-cloudflare.sh
```

这个脚本会：
1. 检查 Docker
2. 安装 `wrangler` 和 `@cloudflare/containers`
3. 检查 Cloudflare 登录状态
4. 执行 `wrangler deploy`

## 重要说明

### 1. 当前默认是最小可用配置

默认配置适合先把服务跑起来：
- `DATA_DIR=/tmp/data`
- `SERVER_STORAGE_TYPE=local`
- `LOG_FILE_ENABLED=false`

这意味着**容器重启后本地数据可能丢失**。生产建议尽快切到：
- `SERVER_STORAGE_TYPE=redis`
- 或 `mysql` / `pgsql`

### 2. 多实例前先切外部存储

当前 `max_instances=3` 只是部署层上限。
如果你真要多实例稳定跑，建议先把 token / config 状态迁移到 Redis 或数据库，否则实例间状态不一致。

### 3. Cloudflare Tunnel / 自定义域名

部署完后先用 `workers.dev` 地址验证。
后续如果你要挂自定义域名，再在 Cloudflare Dashboard 里加 route 即可。

## 后续推荐优化

- 增加 `staging` / `production` 双环境
- 把运行参数拆成 Cloudflare vars / secrets
- 为 Redis / PostgreSQL 做生产模板
- 增加 GitHub Actions 自动部署
