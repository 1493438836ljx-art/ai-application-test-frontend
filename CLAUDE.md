# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Vue 3 + Vite + JavaScript 的前端项目，使用 Element Plus 作为 UI 组件库。

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 代码检查（oxlint + eslint）
npm run lint

# 代码格式化
npm run format

# 预览生产构建
npm run preview
```

## 技术栈

- **Vue 3** - 前端框架
- **Vite** - 构建工具
- **JavaScript** - 开发语言
- **Element Plus** - UI 组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

## 项目结构

```
src/
├── main.js          # 应用入口，注册 Element Plus 和图标
├── App.vue          # 根组件
├── router/index.js  # 路由配置
├── stores/          # Pinia 状态管理
├── views/           # 页面组件
├── components/      # 通用组件
└── assets/          # 静态资源
```

## 代码规范

- 使用 Prettier 进行代码格式化（无分号、单引号、行宽 100）
- 使用 oxlint + ESLint 进行代码检查
- 路径别名：`@` 映射到 `./src`

## 开发规范
- 每次开发完成功能之后，使用playwright MCP服务验证功能是否符合预期，playwright产生的临时图片存放在./tmp目录下，在使用完playwright之后，清空./tmp目录。
- 在自行执行 `npm run dev` 之前，先检查是否已经有进程在运行、是否 5173 端口已经被占用。如果是，则禁止自行执行 `npm run dev`，要访问服务，先重启当前运行的服务，然后直接访问 http://localhost:5173/

## 人员信息展示规范
本项目中，需要展示账号的地方，均以以下格式呈现：
姓名拼音 工号
例如：wangxiaoer 00123456

## 分页组件规范

### 全局中文配置

在 `main.js` 中已配置 Element Plus 中文语言包，确保所有组件（包括分页）显示中文：

```javascript
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

app.use(ElementPlus, { locale: zhCn })
```

### 分页组件配置

所有列表页的分页组件统一使用以下配置：

```vue
<!-- 模板部分 -->
<div class="pagination-wrapper" v-if="total > 0">
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="[10, 20, 50, 100]"
    :total="total"
    layout="total, sizes, prev, pager, next, jumper"
    @size-change="handleSizeChange"
    @current-change="handlePageChange"
  />
</div>

<!-- 样式部分 -->
<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
}
</style>
```

### 配置说明

- **默认每页条数**：10
- **可选每页条数**：[10, 20, 50, 100]
- **布局元素**：
  - `total` - 显示"共 X 条"
  - `sizes` - 每页条数选择器（显示"X 条/页"）
  - `prev` - 上一页按钮
  - `pager` - 页码
  - `next` - 下一页按钮
  - `jumper` - 跳转输入框（显示"前往 X 页"）
- **布局位置**：右对齐（使用 flex + justify-content: flex-end）
- **中文显示**：通过全局中文配置自动显示中文文案

## Node 版本要求

Node.js ^20.19.0 或 >=22.12.0
