# Bug 修复记录

## 2026-04-12: 注册无反应 + 管理后台登录失败

### 问题描述
用户报告：
1. 首页点击注册无反应
2. 管理后台输入账号密码报错：`Cannot read properties of null (reading 'style')`

### 错误日志
```
app.js?v=10:18 Uncaught TypeError: Cannot read properties of null (reading 'style')
    at showLoginPage (app.js?v=10:18:41)
    
app.js?v=10:291 Uncaught TypeError: Cannot read properties of null (reading 'style')
    at showAdminPage (app.js?v=10:291:41)
    at handleAdminLogin (app.js?v=10:287:5)
```

### 根因分析

**核心问题：浏览器缓存了旧版本 (v10)**

错误日志显示 `app.js?v=10`，但最新代码是 v11。浏览器加载了旧的缓存文件，导致：
1. 旧代码中的 DOM 元素引用与新 HTML 结构不匹配
2. `ui.elements.authPage` 等缓存元素为 null

**次要问题：版本号未更新**
index.html 中的脚本引用版本号未及时更新，导致浏览器继续使用缓存。

### 修复方案

1. **更新版本号**：将 `?v=11` 改为 `?v=12` 强制刷新缓存
2. **添加防缓存机制**：考虑添加 meta 标签禁止缓存（开发阶段）

### 修复代码
```html
<!-- 修复前 -->
<script src="js/app.js?v=11"></script>

<!-- 修复后 -->
<script src="js/app.js?v=12"></script>
```

### 预防措施

1. **每次部署必更新版本号**
2. **添加缓存控制 meta 标签**
3. **测试时强制刷新浏览器 (Ctrl+F5)**

### 状态
❌ **未完全修复** - 发现更深层问题

---

## 2026-04-12: Vercel 部署未更新（重大发现）

### 问题描述
用户仍然看到 `app.js?v=10` 错误，版本号更新无效。

### 根因分析（重大发现）
**GitHub 默认分支是 `main`，我们推送到了 `master`！**

1. GitHub 默认分支: `main`
2. 我们的推送: `master` 分支
3. Vercel 配置: 部署 `main` 分支
4. 结果: Vercel 从未收到更新，一直部署旧代码

### 验证
```bash
# GitHub API 返回
default_branch: "main"


# Vercel 部署的 HTML
<script src="app.js"></script>  # 旧版单文件


# GitHub 上的 HTML
<script src="js/config.js?v=12"> # 新版模块化
```

### 修复方案
1. **合并到 main 分支**: `git push origin main`
2. **添加根目录 app.js**: 作为模块化加载器兼容旧版 HTML

### 修复代码
```javascript
// app.js (根目录) - 加载器
const modules = [
    'js/config.js?v=12',
    'js/utils.js?v=12',
    // ... 其他模块
];

async function load() {
    for (const mod of modules) {
        await loadScript(mod);
    }
}
```

### 教训
1. **推送前检查默认分支**: `git remote show origin`
2. **Vercel 配置检查**: 确认部署分支与推送分支一致
3. **部署后验证**: 检查线上文件是否与 GitHub 一致

### 状态
🟡 修复中 - 已推送 main 分支，添加 app.js 加载器

---

## 历史 Bug 记录

### 2026-04-10: app.js 截断导致函数未定义
**问题**: 文件写入被截断，函数名与 HTML onclick 不匹配
**修复**: 重写完整 app.js，确保所有函数正确定义并暴露到 window
**教训**: 大文件写入需验证完整性

### 2026-04-10: 阿里云百炼 API CORS 错误
**问题**: 浏览器直接调用阿里云 API 被 CORS 拦截
**修复**: 添加离线降级推荐，依赖 CORS Unblock 扩展
**教训**: 第三方 API 需提前测试 CORS 支持

---

## 2026-04-13: 阿里云百炼 API 再次 401 错误

### 问题描述
用户报告：
1. `api.moonshot.cn/v1/chat/completions` 返回 401
2. 点击"获取穿搭建议"显示 "Invalid Authentication"

### 根因分析
**历史问题复发**：阿里云百炼 API 不允许浏览器直接调用（CORS + 认证问题）

之前尝试的修复：
- Vercel 代理方案 → **失败**（401/NOT_FOUND）
- CORS Unblock 扩展 → **不可靠**（用户需要手动安装）

**根本原因**：浏览器环境无法安全地调用需要密钥的 AI API

### 解决方案（GSD 规范决策）
采用 **Cloudflare Workers 代理方案**：
- 免费额度：10万次请求/天
- 全球节点，延迟低
- 隐藏 API Key，安全可靠
- 支持切换后端（Kimi/阿里云/OpenAI）

### 实施计划
1. 创建 Cloudflare Worker 脚本
2. 修改前端 API 调用指向 Worker
3. 部署并验证
4. 更新文档

### 状态
✅ **已完成** - v13 已发布

### 修复内容
1. **创建 Cloudflare Worker 脚本** (`workers/api-proxy.js`)
   - 支持 Kimi / 阿里云百炼 / OpenAI 三后端
   - 添加 CORS 头和错误处理
   - 标准化响应格式

2. **修改前端代码**
   - `js/api.js`: 改为调用 Worker 代理
   - `js/config.js`: 添加 proxy 配置，版本号 v13
   - `index.html`: 更新所有脚本版本引用

3. **部署**
   - Git 提交: `6adc68b`
   - 已推送到 `main` 分支

### 待用户操作
**需要用户自行部署 Cloudflare Worker**：
1. 登录 https://dash.cloudflare.com
2. 创建 Worker，粘贴 `workers/api-proxy.js` 代码
3. 设置环境变量 `KIMI_API_KEY`（或其他 API Key）
4. 获取 Worker 域名，更新 `js/config.js` 中的 `proxy.endpoint`
5. 重新部署前端

### 验证方法
- 点击"获取穿搭建议"应成功返回 AI 回复
- 浏览器控制台无 401 错误

---

## 2026-04-13: 模块化重构后文件损坏（严重错误）

### 问题描述
用户报告应用完全无法使用：
1. 点击任何按钮无响应
2. 控制台报错：
   ```
   Uncaught SyntaxError: Unexpected identifier 'Utils'
   weather.js:370 Uncaught SyntaxError: Unexpected end of input
   app.js?v=13:314 Uncaught ReferenceError: Utils is not defined
   ui.js?v=13:282 Uncaught TypeError: Cannot read properties of undefined (reading 'style')
   ```

### 根因分析（GSD 复盘）
**这是 GSD 模块化重构时引入的严重错误！**

**错误 1: utils.js 重复声明**
```javascript
const Utils = {

const Utils = {  // ❌ 第11行重复声明，语法错误
```

**错误 2: weather.js 文件截断**
- 文件在 362 行被截断，没有正确闭合
- 导致 `Unexpected end of input`

**错误 3: ui.js 元素引用错误**
- `this.elements.adminLoginModal` 未定义
- 初始化时未正确绑定 DOM 元素

**根本原因（GSD 规范违反）**:
1. **文件写入后未验证完整性** - 违反 GSD "验证"阶段
2. **未进行代码审查** - 违反 GSD "质量检查"
3. **生产环境部署前未测试** - 违反 GSD "部署验证"

### 修复方案
1. **修复 utils.js**: 删除重复的 `const Utils = {`
2. **重写 weather.js**: 确保文件完整闭合
3. **修复 ui.js**: 检查元素初始化逻辑
4. **全面审核所有模块文件**
5. **版本号 v13 → v14** 强制刷新

### 教训（写入 MEMORY.md）
1. **模块化重构必须逐文件验证**
2. **文件写入后立即检查语法完整性**
3. **生产部署前必须功能测试**
4. **GSD 流程每个阶段都不可跳过

### 状态
🚨 **紧急修复中** - 需要重写多个损坏文件
