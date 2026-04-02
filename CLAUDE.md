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
data:Object
├── property1：String
├── property2：String
└──array1：Array<Object>
    ├── property3：String
    └── property4：String
├── components/      # 通用组件
└── assets/          # 静态资源
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
- 每次提交代码之前，先将 `src/` 目录下所有文件添加到 git 托管
- 每次开发完成功能之后，使用playwright MCP服务验证功能是否符合预期，playwright产生的临时图片存放在./tmp目录下，在使用完playwright之后，清空./tmp目录。
- 在自行执行 `npm run dev` 之前，先检查是否已经有进程在运行、是否 5173 端口已经被占用。如果是，则禁止自行执行 `npm run dev`，要访问服务，先重启当前运行的服务，然后直接访问 http://localhost:5173/
- 当调用后端接口失败时，前端需要在页面提示"系统服务异常！"

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

## 节点参数类型系统

工作流中所有节点的参数类型都在以下范围内定义：

### 基本类型

| 类型 | 说明 |
|------|------|
| String | 字符串类型 |
| Boolean | 布尔类型（true/false） |
| Integer | 整数类型（正整数、负整数、零） |
| Object | 对象类型（JSON 对象） |
| Times | 时间类型 |

### 复合类型

| 类型 | 说明 |
|------|------|
| Array | 数组类型，需进一步定义元素类型 |
| File | 文件类型，需进一步定义文件类型 |

### Array 元素类型

Array 类型的参数需要指定元素类型，可选值：

- `Array<String>` - 字符串数组
- `Array<Boolean>` - 布尔数组
- `Array<Integer>` - 整数数组
- `Array<Object>` - 对象数组
- `Array<Times>` - 时间数组

### File 文件类型

File 类型的参数需要指定文件格式，可选值：

- `File<Zip>` - ZIP 压缩文件
- `File<Doc>` - 文档文件（Word、PDF 等）
- `File<Excel>` - Excel 文件（.xlsx、.xls）
- `File<Txt>` - 文本文件（.txt、.csv 等）

## 开始节点

### 节点作用

开始节点是工作流的起始节点，用于定义工作流的外部输入参数。这些参数是工作流运行时需要用户填写的初始值。

### 参数特点

- 开始节点定义的参数**不需要填写变量值**，因为这些值是在工作流运行时由用户填写的
- 其他节点的参数**需要填写变量值**，配置面板中有对应的输入框

### 参数来源

工作流中的参数值来源：

1. **开始节点的初始变量** - 工作流运行时由用户填写
2. **节点的输出参数** - 前序节点执行后产生的输出
3. **固定配置** - 在节点配置中直接填写的固定值

## 节点输入参数分类

### 1. 固定变量

为特定节点定制的参数，变量名和类型是固定的，用户只需填写变量值。

示例：
- 文本清洗节点的 `input_file`、`cols`、`remove_extra_spaces` 等
- 循环节点的 `times`、`cycle_array`

### 2. 自定义变量

用户可以自定义变量名、类型、变量值的参数。

- 目前主要在**开始节点**中使用
- 用户可以自由添加、删除、修改变量定义

## 变量值取值方式

节点的变量值有以下两种取值方式：

### 1. 输入框输入

直接在配置面板的输入框中填写固定值。

### 2. 引用变量

引用其他变量作为当前参数的值：

- **引用开始节点的初始变量** - 引用工作流运行时用户填写的初始参数
- **引用前序节点的输出** - 引用上游节点执行后产生的输出参数

引用格式：`${节点名.变量名}`，例如：`${开始.input}`、`${文本清洗.output_file}`
