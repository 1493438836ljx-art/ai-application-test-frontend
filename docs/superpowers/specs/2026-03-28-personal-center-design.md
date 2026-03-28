# 个人中心页面设计

## 概述

创建一个独立的个人中心页面，用户从 IntegrationView 页面右上角下拉菜单点击后进入，采用双栏卡片布局。

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│  顶部导航栏 (复用 IntegrationView 风格)                    │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   左侧菜单    │              右侧内容区                   │
│   (220px)    │                                          │
│              │        (根据选中菜单显示对应内容)            │
│  ○ 我的实训   │                                          │
│  ○ 我的项目   │                                          │
│  ○ 我的工单   │                                          │
│  ○ 我的代办   │                                          │
│  ○ 我的账号   │                                          │
│  ○ 基础能力库 │                                          │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

## 路由设计

| 路由 | 组件 | 说明 |
|------|------|------|
| `/personal` | PersonalCenterView | 个人中心主页面，默认重定向到实训 |
| `/personal/training` | PersonalCenterView | 我的实训 |
| `/personal/projects` | PersonalCenterView | 我的项目 |
| `/personal/tickets` | PersonalCenterView | 我的工单 |
| `/personal/todos` | PersonalCenterView | 我的代办 |
| `/personal/account` | PersonalCenterView | 我的账号 |
| `/personal/skills` | PersonalCenterView | 基础能力库 |

## 文件结构

```
src/
├── views/
│   └── personal/
│       └── PersonalCenterView.vue    # 个人中心主页面
└── router/
    └── index.js                       # 添加路由配置
```

## 组件设计

### PersonalCenterView.vue

**布局结构：**
- 顶部导航栏：复用 IntegrationView 的顶部导航风格
- 左侧菜单：垂直菜单列表，宽度 220px，点击高亮选中
- 右侧内容区：根据选中菜单显示占位内容

**左侧菜单项：**
1. 我的实训 (training)
2. 我的项目 (projects)
3. 我的工单 (tickets)
4. 我的代办 (todos)
5. 我的账号 (account)
6. 基础能力库 (skills)

**状态管理：**
- 使用 Vue Router 的路由参数来确定当前选中的菜单
- 菜单点击通过 router.push 更新路由

## 交互逻辑

1. 用户在 IntegrationView 点击右上角下拉菜单中的项目
2. 跳转到 `/personal/{对应路由}`
3. 左侧菜单自动高亮当前路由对应的菜单项
4. 右侧内容区显示占位内容（待后续填充）
5. 点击左侧菜单项切换不同内容

## 样式规范

- 左侧菜单背景：浅灰色 (#f5f7fa)
- 菜单项高度：48px
- 菜单项内边距：0 20px
- 选中状态：红色文字 (#e63946)，左侧 3px 红色边框
- 悬停状态：背景色 #eef1f6
- 右侧内容区背景：白色 (#fff)
- 响应式：小屏幕下左侧菜单可折叠（可选，暂不实现）

## IntegrationView 修改

修改 `handleUserCommand` 函数，添加路由跳转：

```javascript
const handleUserCommand = (command) => {
  const routeMap = {
    training: '/personal/training',
    projects: '/personal/projects',
    tickets: '/personal/tickets',
    todos: '/personal/todos',
    account: '/personal/account',
    logout: null, // 退出登录逻辑
  }

  if (command === 'logout') {
    ElMessage.info('退出登录')
  } else if (routeMap[command]) {
    router.push(routeMap[command])
  }
}
```

## 后续扩展

- 各菜单页面的具体内容由后续需求确定
- 可考虑添加面包屑导航
- 可考虑添加返回按钮返回 IntegrationView
