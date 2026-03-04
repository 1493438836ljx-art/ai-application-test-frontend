# AI 应用测试平台 - 前端

一个基于 Vue 3 + Vite + Element Plus 的 AI 应用测试管理平台前端项目。

## 功能模块

### 仪表盘
- 数据概览和统计展示
- 快捷入口导航

### 测评集管理
- 测评集的创建、编辑、删除
- 测评数据表格编辑（类似 Excel）
- 支持 Excel/CSV 文件导入导出
- 一键生成测试数据（AI Agent 模拟）
- 列配置支持枚举类型

### Prompt 管理
- Prompt 模板的创建和管理
- 版本控制和历史记录
- 变量占位符支持

### 环境管理
- 测试环境配置
- API 端点和服务管理
- 环境变量设置

### 插件管理
- Python 插件脚本管理
- 代码编辑器支持语法高亮
- Tab 缩进支持
- 全屏编辑模式
- 插件测试运行
- 标签分类管理

### 测试执行
- 测试任务配置和执行
- 执行进度监控
- 批量测试支持

### 测试报告
- 测试结果展示
- 统计分析报告
- 导出报告功能

## 技术栈

- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **JavaScript** - 开发语言
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **highlight.js** - 代码语法高亮
- **xlsx** - Excel 文件处理

## 项目结构

```
src/
├── main.js          # 应用入口
├── App.vue          # 根组件
├── router/index.js  # 路由配置
├── stores/          # Pinia 状态管理
├── views/           # 页面组件
│   ├── home/        # 仪表盘
│   ├── dataset/     # 测评集管理
│   ├── prompt/      # Prompt 管理
│   ├── environment/ # 环境管理
│   ├── plugin/      # 插件管理
│   ├── execution/   # 测试执行
│   └── result/      # 测试报告
├── components/      # 通用组件
├── layouts/         # 布局组件
└── assets/          # 静态资源
```

## 环境要求

- Node.js ^20.19.0 或 >=22.12.0

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

### 代码格式化

```bash
npm run format
```

## IDE 推荐配置

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## 浏览器开发者工具

- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

## 许可证

MIT
