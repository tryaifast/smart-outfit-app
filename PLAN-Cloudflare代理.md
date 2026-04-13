# Cloudflare Workers 代理方案 - 实施计划

## 项目信息
- **任务**: 修复阿里云百炼 API 401 错误
- **方案**: Cloudflare Workers 代理
- **创建时间**: 2026-04-13
- **状态**: 规划中

---

## 背景

### 问题
- 阿里云百炼 API 不允许浏览器直接调用（CORS 限制）
- 返回 401 "Invalid Authentication"
- Vercel 代理方案已失败

### 目标
- 实现安全、可靠的 AI API 调用
- 隐藏 API Key
- 支持多后端切换

---

## 实施步骤（GSD 规范）

### Phase 1: 创建 Cloudflare Worker
- [ ] 编写 Worker 脚本（api-proxy.js）
- [ ] 支持 Kimi / 阿里云百炼 / OpenAI 接口
- [ ] 添加 CORS 头
- [ ] 错误处理和日志

### Phase 2: 修改前端代码
- [ ] 更新 js/api.js，指向 Worker 端点
- [ ] 修改请求格式适配 Worker
- [ ] 更新版本号 v12 → v13
- [ ] 添加降级处理

### Phase 3: 部署与验证
- [ ] 部署 Worker 到 Cloudflare
- [ ] 配置 API Key 环境变量
- [ ] 测试端到端调用
- [ ] 验证错误处理

### Phase 4: 文档更新
- [ ] 更新 BUGFIX.md
- [ ] 更新 MEMORY.md
- [ ] 更新 STATE.md
- [ ] 创建部署说明

---

## 技术方案

### Worker 端点设计
```
POST https://smart-outfit-proxy.your-subdomain.workers.dev/chat

Headers:
  Content-Type: application/json
  
Body:
  {
    "provider": "kimi",  // 或 "aliyun", "openai"
    "messages": [...],
    "temperature": 0.7
  }

Response:
  {
    "choices": [{
      "message": {
        "content": "..."
      }
    }]
  }
```

### 前端修改点
1. **js/api.js**: 修改 `getRecommendation` 函数
2. **js/config.js**: 添加 Worker 端点配置
3. **index.html**: 更新版本号

---

## 验收标准

- [ ] 点击"获取穿搭建议"成功返回 AI 回复
- [ ] 浏览器控制台无 401 错误
- [ ] 支持离线降级（网络失败时本地推荐）
- [ ] Worker 响应时间 < 3 秒

---

## 风险与应对

| 风险 | 应对 |
|:---|:---|
| Cloudflare 免费额度用完 | 监控用量，必要时升级 |
| Worker 部署失败 | 准备回退到离线推荐 |
| 用户不会配置 Worker | 提供详细图文教程 |

---

## 相关文件

- `workers/api-proxy.js` - Worker 脚本（新建）
- `js/api.js` - 修改 API 调用
- `js/config.js` - 添加配置
- `index.html` - 更新版本号
