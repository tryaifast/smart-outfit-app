# PLAN - 智能穿搭助手 UI 重构

## 项目信息
- **任务**: 根据 DESIGN.md 规范重新设计 UI
- **风格**: 时尚、活力、现代
- **参考设计系统**: Lovable ( playful gradients ), Raycast ( sleek dark ), Spotify ( vibrant accents )
- **当前版本**: v14
- **目标版本**: v15

---

## GSD 流程

### Phase 1: 规划 (Plan)
- [x] 读取 MEMORY.md 检查历史错误
- [x] 分析当前 UI 问题
- [x] 选择设计系统参考
- [x] 创建本规划文档

### Phase 2: 实施 (Do)
- [ ] 创建新的 CSS 设计系统
- [ ] 重构 index.html 结构
- [ ] 更新所有 JS 模块适配新 UI
- [ ] 版本号更新 v14 → v15

### Phase 3: 验证 (Check)
- [ ] 本地验证 HTML/CSS 语法
- [ ] 检查所有文件完整性
- [ ] Git 提交并推送
- [ ] 线上验证部署

### Phase 4: 记录 (Act)
- [ ] 更新 MEMORY.md 记录本次重构
- [ ] 更新 STATE.md 跟踪进度
- [ ] 用户确认后记录成果

---

## 当前 UI 问题分析

### 视觉问题
1. **配色单调**: 单一的紫蓝渐变 (#667eea → #764ba2)，缺乏时尚感
2. **圆角过大**: 20px 圆角显得过于圆润，不够现代
3. **阴影过重**: 0 20px 60px 阴影过于厚重
4. **字体层次弱**: 缺乏明显的视觉层次
5. **按钮样式单一**: 所有按钮使用相同渐变

### 交互问题
1. **动画缺失**: 没有微交互和过渡效果
2. **加载状态简陋**: 只有简单的 spinner
3. **反馈不足**: 缺少悬停、点击等状态反馈

---

## 新设计系统规范

### 色彩系统 (Spotify + Lovable 融合)
```css
/* 主色调 - 活力珊瑚/粉色系 */
--primary-500: #FF6B9D;      /* 活力珊瑚粉 */
--primary-600: #E85A8C;      /* 深珊瑚 */
--primary-gradient: linear-gradient(135deg, #FF6B9D 0%, #C44569 100%);

/* 辅助色 - 青柠/薄荷 */
--accent-500: #00D9C0;       /* 薄荷青 */
--accent-gradient: linear-gradient(135deg, #00D9C0 0%, #00B4A2 100%);

/* 背景色 */
--bg-dark: #0F0F0F;          /* 深黑背景 */
--bg-card: #1A1A1A;          /* 卡片背景 */
--bg-elevated: #242424;      /* 提升层 */

/* 文字色 */
--text-primary: #FFFFFF;
--text-secondary: #A0A0A0;
--text-tertiary: #666666;
```

### 字体系统
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-display: 'Inter', sans-serif;  /* 标题用粗体 */

/* 字号层级 */
--text-xs: 12px;      /* 标签、辅助 */
--text-sm: 14px;      /* 正文小 */
--text-base: 16px;    /* 正文 */
--text-lg: 18px;      /* 小标题 */
--text-xl: 24px;      /* 标题 */
--text-2xl: 32px;     /* 大标题 */
```

### 间距系统
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
```

### 圆角系统
```css
--radius-sm: 6px;     /* 小按钮、标签 */
--radius-md: 10px;    /* 卡片、输入框 */
--radius-lg: 16px;    /* 大卡片、模态框 */
--radius-xl: 24px;    /* 页面容器 */
--radius-full: 9999px; /* 圆形 */
```

### 阴影系统
```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.1);
--shadow-md: 0 4px 12px rgba(0,0,0,0.15);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.2);
--shadow-glow: 0 0 20px rgba(255,107,157,0.3);  /* 主色辉光 */
```

### 动画系统
```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## 组件 redesign 清单

### 1. 整体布局
- [ ] 深色主题背景 (近黑色)
- [ ] 玻璃态卡片效果 (glassmorphism)
- [ ] 更紧凑的圆角 (16px)

### 2. Header
- [ ] 渐变文字效果
- [ ] 动态背景图案
- [ ] 更醒目的品牌标识

### 3. 按钮
- [ ] 主按钮: 珊瑚粉渐变 + 悬停辉光
- [ ] 次按钮: 透明背景 + 边框
- [ ] 添加点击波纹效果
- [ ] 加载状态动画

### 4. 输入框
- [ ] 深色背景输入框
- [ ] 聚焦时边框高亮
- [ ] 图标前缀支持

### 5. 标签/Tag
- [ ] 胶囊形状 (pill)
- [ ] 选中状态动画
- [ ] 悬停微放大

### 6. 天气卡片
- [ ] 玻璃态效果
- [ ] 动态天气图标
- [ ] 温度大字体展示

### 7. 推荐结果
- [ ] 卡片式布局
- [ ] 图片占位区域
- [ ] 评分/标签展示

### 8. 导航
- [ ] 底部导航栏 (移动端)
- [ ] 图标 + 文字
- [ ] 选中状态指示器

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|:---|:---|:---|
| index.html | 重写 | 全新 HTML 结构和 CSS |
| js/config.js | 修改 | 版本号 v15 |
| js/app.js | 修改 | 版本号 v15 |
| js/ui.js | 修改 | 适配新 CSS 类名 |

---

## 验收标准

1. **视觉**: 深色主题、活力渐变、现代圆角
2. **交互**: 所有按钮有悬停/点击反馈
3. **动画**: 页面切换、加载、状态变化有流畅动画
4. **响应式**: 移动端优先，适配各种屏幕
5. **无障碍**: 对比度足够，支持键盘导航

---

## 风险与缓解

| 风险 | 缓解措施 |
|:---|:---|
| 文件写入截断 | 使用 PowerShell 完整写入，验证行数 |
| CSS 兼容性问题 | 使用标准属性，避免实验性功能 |
| 深色主题可读性 | 确保对比度 > 4.5:1 |
| 用户不适应新UI | 保留核心交互逻辑，仅改视觉 |

---

*创建时间: 2026-04-13*  
*GSD Phase: Plan → Do*
