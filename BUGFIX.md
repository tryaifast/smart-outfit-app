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
✅ 已修复 - 版本号更新为 v12

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
