# 智能穿搭助手

一个基于 AI 的智能穿搭推荐 H5 应用，根据天气、场合、用户画像和衣橱给出专业穿搭建议。

## 功能特性

### 核心功能
- 🤖 **AI 智能推荐** - 基于 Kimi/阿里云百炼大模型的专业穿搭建议
- 🌤️ **实时天气** - 自动获取当前位置天气，含 7 天预报和穿衣指数
- 👔 **衣橱管理** - 添加、分类、管理个人衣物
- 👤 **用户画像** - 性别、年龄、职业、风格偏好设置
- 📍 **精确定位** - GPS 自动定位或手动选择省市区街道

### 技术特性
- ⚡ **高性能** - 内存缓存、请求去重、分批渲染
- 🔒 **安全可靠** - 密码强度检查、登录锁定、数据加密
- 📱 **响应式设计** - 适配手机、平板、桌面
- 🌐 **离线可用** - 网络失败时提供离线推荐

## 快速开始

### 1. 访问应用
```
https://smart-outfit-7heg7w76w-tryaifasts-projects.vercel.app
```

### 2. 注册账号
- 使用手机号 + 密码注册
- 密码需包含：8位以上、数字、大小写字母

### 3. 配置 API Key
- 进入「管理后台」(admin/admin123)
- 选择 API 提供商（Kimi 或阿里云百炼）
- 输入你的 API Key

### 4. 开始使用
- 设置你的位置和天气
- 添加衣物到衣橱
- 选择场合获取 AI 穿搭推荐

## 项目结构

```
smart-outfit-app/
├── index.html          # 主页面
├── js/
│   ├── app.js          # 应用入口
│   ├── config.js       # 全局配置
│   ├── utils.js        # 工具函数
│   ├── storage.js      # 数据存储（含加密）
│   ├── api.js          # API 封装（含缓存）
│   ├── user.js         # 用户管理（含安全）
│   ├── weather.js      # 天气服务（含预报）
│   ├── wardrobe.js     # 衣橱管理
│   ├── recommend.js    # 推荐引擎
│   └── ui.js           # UI 渲染（含优化）
├── vercel.json         # Vercel 配置
└── package.json        # 项目配置
```

## 技术栈

- **前端**: 纯 HTML5 + CSS3 + JavaScript (ES6+)
- **UI 框架**: 无，原生实现
- **API**: Open-Meteo (天气)、Kimi/阿里云百炼 (AI)
- **部署**: Vercel
- **存储**: LocalStorage (本地)

## 浏览器支持

- Chrome 80+
- Safari 13+
- Firefox 75+
- Edge 80+

**注意**: 使用阿里云百炼 API 需要安装 CORS Unblock 浏览器扩展

## 开发指南

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/tryaifast/smart-outfit-app.git
cd smart-outfit-app

# 启动本地服务器
python -m http.server 8080
# 或
npx serve .

# 访问 http://localhost:8080
```

### 模块说明

#### config.js
全局配置，包括 API 端点、天气代码映射、城市坐标等。

#### storage.js
数据存储模块，特性：
- 内存缓存 + LocalStorage 持久化
- 批量写入优化
- 敏感数据 XOR 加密
- 自动过期清理

#### api.js
API 封装模块，特性：
- 请求缓存（可配置过期时间）
- 自动重试（指数退避）
- 请求去重（防止重复请求）
- 超时控制

#### user.js
用户管理模块，特性：
- 登录失败锁定（5次/15分钟）
- 会话超时（24小时）
- 密码强度检查
- 设备注册限制（5次）

#### weather.js
天气服务模块，特性：
- 当前天气 + 7天预报
- 穿衣指数计算
- 天气预警检测
- GPS 定位

#### ui.js
UI 渲染模块，特性：
- requestAnimationFrame 优化
- 分批渲染（大数据量）
- HTML 缓存
- Toast 提示

## 配置说明

### API 配置
在管理后台配置以下参数：

**Kimi**
- 端点: `https://api.moonshot.cn/v1/chat/completions`
- Key 格式: `sk-...`

**阿里云百炼**
- 端点: `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
- Key 格式: `sk-sp-...`

### 天气配置
使用 Open-Meteo 免费 API，无需配置 Key。

## 安全说明

1. **数据加密**: 敏感数据使用 XOR 加密存储
2. **登录保护**: 5次失败锁定15分钟
3. **会话管理**: 24小时无操作自动登出
4. **设备限制**: 单设备最多注册5个账号
5. **密码要求**: 8位以上，含数字、大小写字母

## 性能优化

1. **内存缓存**: 减少 LocalStorage 读取
2. **批量写入**: 100ms 延迟合并写入
3. **请求缓存**: 天气 30分钟、预报 1小时
4. **请求去重**: 相同请求复用 Promise
5. **渲染优化**: requestAnimationFrame + 分批渲染

## 离线支持

当 API 调用失败时，自动降级为离线推荐：
- 基于温度和场合的预设规则
- 无需网络即可使用
- 推荐质量略低于 AI，但可用

## 更新日志

### v10 (2026-04-12)
- 代码架构重构，拆分为 9 个模块
- 添加性能优化（缓存、防抖、分批渲染）
- 添加安全加固（锁定、加密、强度检查）
- 完善天气功能（预报、穿衣指数、预警）
- 优化错误处理和用户体验

### v9 (2026-04-10)
- 修复 JavaScript 语法错误
- 添加全局函数暴露
- 添加离线推荐降级

### v8 (2026-04-10)
- 重构用户系统（手机号+密码）
- 添加精确定位（GPS/手动）
- 添加管理后台

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request。

## 联系方式

如有问题，请通过以下方式联系：
- GitHub Issues: https://github.com/tryaifast/smart-outfit-app/issues
