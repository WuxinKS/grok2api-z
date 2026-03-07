# grok2api-z Workers 版使用说明

这份文档是给**已经部署好纯 Cloudflare Workers 版本**的人看的。

如果你还没部署，请先看：
- `cloudflare-workers/README.local.md`
- `cloudflare-workers/README.md`

---

## 1. 访问地址

你的 Workers 版本部署完成后，会得到一个地址，例如：

```text
https://grok2api-z-workers.<your-subdomain>.workers.dev
```

常用入口：

- 登录页：`/login`
- Token 管理：`/admin/token`
- API Key 管理：`/admin/keys`
- 配置管理：`/admin/config`
- 在线聊天：`/chat`
- 健康检查：`/health`
- 模型列表：`/v1/models`

示例：

```text
https://grok2api-z-workers.<your-subdomain>.workers.dev/login
```

---

## 2. 首次使用流程

### 第一步：登录后台

打开：

```text
/login
```

如果是刚部署完成，默认管理员账号通常是：

- 用户名：`admin`
- 密码：`admin`

**强烈建议登录后第一时间修改。**

---

### 第二步：导入 Token

打开：

```text
/admin/token
```

你需要至少添加一种可用 Token：

- `sso`
- 或 `ssoSuper`

没有 Token，API 实际上没法正常完成上游调用。

建议：
- 至少准备多个 Token，便于轮换
- 给 Token 写备注，方便排查
- 可按用途或账号来源打标签

---

### 第三步：创建 API Key

打开：

```text
/admin/keys
```

创建一个新的 API Key，后续你的客户端就用这个 Key 调接口。

你可以配置：
- 名称
- 是否启用
- 每日额度限制
  - chat
  - heavy
  - image
  - video

创建成功后，记得把 Key 保存好。

---

### 第四步：检查配置

打开：

```text
/admin/config
```

建议优先确认这些项：

- `dynamic_statsig`：建议开启
- `cf_clearance`：如果你的链路需要，可填写
- `image_generation_method`：默认 `legacy`，更稳
- 其他和代理、图片、视频相关的设置按需调整

如果你不确定，先用默认值跑通再细调。

---

## 3. 如何调用 API

这个版本兼容 OpenAI 风格接口。

### 3.1 获取模型列表

```bash
curl https://your-worker.workers.dev/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### 3.2 聊天接口

```bash
curl https://your-worker.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "grok-4",
    "messages": [
      {"role": "user", "content": "你好，请只回复：pong"}
    ],
    "stream": false
  }'
```

正常情况下，你会得到类似：

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "grok-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "pong"
      },
      "finish_reason": "stop"
    }
  ]
}
```

---

### 3.3 流式调用

把 `stream` 改成 `true` 即可：

```bash
curl https://your-worker.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "grok-4",
    "messages": [
      {"role": "user", "content": "写一句简短问候"}
    ],
    "stream": true
  }'
```

---

## 4. 推荐接入方式

你可以把这个地址直接填进支持 OpenAI 兼容接口的客户端中。

常见填写方式：

- Base URL：
  `https://your-worker.workers.dev/v1`
- API Key：
  你在 `/admin/keys` 创建出来的 Key
- Model：
  例如 `grok-4`、`grok-4-thinking`、`grok-4.20-beta`

如果某个客户端要求的是“OpenAI API 地址”，通常填：

```text
https://your-worker.workers.dev/v1
```

---

## 5. 常见问题

### 5.1 登录页能打开，但 API 调用失败

通常检查：

- 是否已经导入 Token
- Token 是否可用
- API Key 是否创建并启用
- 请求头是否正确带了：

```text
Authorization: Bearer YOUR_API_KEY
```

---

### 5.2 返回 401

一般说明：

- API Key 不存在
- API Key 被禁用
- Authorization 头没带对

注意格式必须是：

```text
Authorization: Bearer YOUR_API_KEY
```

不是裸 Key，也不是后台登录 session。

---

### 5.3 模型列表能出，但聊天失败

这通常说明：

- Worker 本身在线
- D1 / KV 正常
- 但上游 Token 不可用，或被限流

去 `/admin/token` 里检查：
- Token 状态
- Token 配额
- 是否需要更换 token 或补充更多 token

---

### 5.4 图片/视频相关不稳定

优先检查：

- Token 能力是否足够
- `cf_clearance` 是否需要补
- 配置里的图片生成模式
- 是否命中了上游风控

建议先把文字聊天跑稳，再折腾图片和视频。

---

## 6. 运营建议

### 建议 1：立刻改默认管理员密码

别让后台长期保持：

- `admin / admin`

---

### 建议 2：至少准备 2~5 个 Token

单 Token 容易：
- 限流
- 失效
- 额度打满

多 Token 才更稳。

---

### 建议 3：给 API Key 设额度

这样更适合：
- 多人使用
- 多客户端接入
- 防止单 Key 滥用

---

### 建议 4：保留固定 Worker 名称和 D1/KV 绑定

不要频繁改：
- Worker 名称
- D1 database id
- KV namespace id

不然容易出现“数据像丢了”的错觉。

---

## 7. 自检清单

你可以用这个清单判断服务是否正常：

- `/health` 返回 healthy
- `/login` 能打开
- `/admin/token` 能登录
- 已导入至少 1 个可用 Token
- 已创建至少 1 个 API Key
- `/v1/models` 能返回模型列表
- `/v1/chat/completions` 能成功回复

如果这些都通过，说明这套服务已经可以正常对外使用。
