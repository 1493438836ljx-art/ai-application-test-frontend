<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  QuestionFilled,
  Bell,
  ArrowDown,
  UserFilled,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import Integration3DBackground from '@/components/integration/Integration3DBackground.vue'

const router = useRouter()

// 电流动画相关
const activeCardIndex = ref(-1)
let animationTimer = null

onMounted(() => {
  startCurrentAnimation()
})

onUnmounted(() => {
  if (animationTimer) {
    clearInterval(animationTimer)
  }
})

// 电流动画 - 每4秒循环一次
const startCurrentAnimation = () => {
  const cycleDuration = 4000 // 4秒一个周期
  const card1Time = 1500 // 第一个卡片触发时间
  const card2Time = 2800 // 第二个卡片触发时间

  const animate = () => {
    // 重置
    activeCardIndex.value = -1

    // 第一个卡片跳动
    setTimeout(() => {
      activeCardIndex.value = 0
      setTimeout(() => {
        activeCardIndex.value = -1
      }, 500)
    }, card1Time)

    // 第二个卡片跳动
    setTimeout(() => {
      activeCardIndex.value = 1
      setTimeout(() => {
        activeCardIndex.value = -1
      }, 500)
    }, card2Time)
  }

  animate()
  animationTimer = setInterval(animate, cycleDuration)
}

// 顶部菜单项
const menuItems = [
  { label: '首页', path: '/' },
  { label: '集成验证', path: '/integration', active: true },
  { label: '方案体验', path: '/experience' },
  { label: '在线实训', path: '/training' },
]

// 功能卡片数据
const featureCards = [
  {
    id: 1,
    title: '自助验证',
    icon: '🔧',
    desc: '自助完成集成验证测试',
  },
  {
    id: 2,
    title: '认证测试',
    icon: '✅',
    desc: '官方认证测试服务',
  },
]

// 菜单点击
const handleMenuClick = (item) => {
  if (item.path) {
    router.push(item.path)
  }
}

// 按钮点击
const handleStart = () => {
  router.push('/app/workflow')
}

const handleProgress = () => {
  router.push('/app/task')
}

// 下拉菜单点击
const handleDropdownCommand = (command) => {
  if (command === 'verify') {
    router.push('/integration/create-project')
  } else if (command === 'certify') {
    router.push('/integration/create-project')
  }
}

// 用户下拉菜单命令
const handleUserCommand = (command) => {
  if (command === 'logout') {
    ElMessage.info('退出登录')
  } else {
    ElMessage.info(`跳转到${command}`)
  }
}

// 卡片点击
const handleCardClick = (card) => {
  if (card.id === 1) {
    // 自助验证 - 跳转到创建项目页面
    router.push('/integration/create-project')
  } else if (card.id === 2) {
    // 认证测试 - 跳转到认证页面
    router.push('/integration/create-project')
  }
}
</script>

<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <div class="header-content">
        <!-- 左侧 Logo 和菜单 -->
        <div class="header-left">
          <div class="logo-section">
            <img src="@/assets/logo.png" alt="Logo" class="logo-image" />
          </div>
          <!-- 菜单项 -->
          <nav class="header-menu">
            <div
              v-for="item in menuItems"
              :key="item.label"
              class="menu-item"
              :class="{ active: item.active }"
              @click="handleMenuClick(item)"
            >
              {{ item.label }}
            </div>
          </nav>
        </div>

        <!-- 右侧功能区 -->
        <div class="header-right">
          <div class="header-action">
            <span class="lang-switch">EN</span>
          </div>
          <div class="header-action">
            <el-icon :size="18"><Bell /></el-icon>
          </div>
          <div class="header-action">
            <span>帮助</span>
          </div>
          <el-dropdown trigger="hover" @command="handleUserCommand">
            <div class="header-action user-dropdown">
              <el-icon :size="18"><UserFilled /></el-icon>
              <span>17721884685</span>
              <el-icon :size="12"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="training">我的实训</el-dropdown-item>
                <el-dropdown-item command="projects">我的项目</el-dropdown-item>
                <el-dropdown-item command="tickets">我的工单</el-dropdown-item>
                <el-dropdown-item command="todos">我的代办</el-dropdown-item>
                <el-dropdown-item command="account">我的账号</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- Hero Banner 区域 -->
    <section class="hero-banner">
      <!-- Web3D 背景 -->
      <Integration3DBackground />
      <div class="hero-bg-overlay"></div>

      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">集成验证</h1>
          <p class="hero-subtitle">专业的集成验证解决方案</p>
          <div class="hero-actions">
            <el-dropdown trigger="hover" @command="handleDropdownCommand">
              <button class="hero-btn primary dropdown-btn">
                创建项目
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="verify">验证项目</el-dropdown-item>
                  <el-dropdown-item command="certify">认证项目</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button class="hero-btn secondary" @click="handleProgress">
              查看验证进度
            </button>
          </div>
          <p class="hero-note">
            <el-icon><QuestionFilled /></el-icon>
            如有疑问请联系技术支持
          </p>
        </div>

        <!-- 中央装饰元素 -->
        <div class="hero-center-decor">
          <div class="decor-ring decor-ring-1"></div>
          <div class="decor-ring decor-ring-2"></div>
          <div class="decor-ring decor-ring-3"></div>
        </div>
      </div>
    </section>

    <!-- 功能卡片区 -->
    <section class="features-section">
      <div class="features-container">
        <div
          v-for="(card, index) in featureCards"
          :key="card.id"
          class="feature-card"
          :class="{ 'pulse-active': activeCardIndex === index }"
          @click="handleCardClick(card)"
        >
          <div class="card-icon">{{ card.icon }}</div>
          <div class="card-content">
            <h3 class="card-title">{{ card.title }}</h3>
            <div class="card-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </div>
      <!-- 电流流动效果 -->
      <div class="current-flow-container">
        <div class="current-flow">
          <div class="current-pulse"></div>
        </div>
        <div class="current-flow-glow"></div>
      </div>
    </section>

    <!-- 底部版权 -->
    <footer class="page-footer">
      <div class="footer-content">
        <p>Copyright © Huawei Technologies Co., Ltd. 2011-2026 Support.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 重置页面样式 */
.home-page {
  min-height: 100vh;
  height: auto;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 顶部导航栏 */
.top-header {
  background: #fff;
  height: 56px;
  border-bottom: 1px solid #e8e8e8;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 32px;
  object-fit: contain;
}

/* 菜单样式 */
.header-menu {
  display: flex;
  align-items: center;
  gap: 32px;
}

.menu-item {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  padding: 8px 0;
  position: relative;
  transition: color 0.3s ease;
}

.menu-item:hover {
  color: #e63946;
}

.menu-item.active {
  color: #e63946;
  font-weight: 500;
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #e63946;
}

/* 右侧功能区 */
.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-action {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s ease;
}

.header-action:hover {
  color: #e63946;
}

.phone-dropdown {
  gap: 4px;
}

/* Hero Banner */
.hero-banner {
  position: relative;
  min-height: 500px;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%);
  overflow: hidden;
}

.hero-bg-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(230, 57, 70, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(244, 162, 97, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1400px;
  margin: 0 auto;
  padding: 80px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 500px;
}

.hero-text {
  max-width: 500px;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 16px 0;
  letter-spacing: 2px;
}

.hero-subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 32px 0;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.hero-btn {
  padding: 12px 28px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
}

.hero-btn.primary {
  background: #fff;
  color: #1a1a1a;
}

.hero-btn.primary:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hero-btn.secondary {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.3);
}

.hero-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.hero-note {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

/* 中央装饰元素 */
.hero-center-decor {
  position: absolute;
  right: 10%;
  top: 50%;
  transform: translateY(-50%);
  width: 200px;
  height: 200px;
}

.decor-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: ring-rotate 20s linear infinite;
}

.decor-ring-1 {
  inset: 0;
}

.decor-ring-2 {
  inset: 20px;
  animation-direction: reverse;
  animation-duration: 15s;
}

.decor-ring-3 {
  inset: 40px;
  animation-duration: 10s;
}

@keyframes ring-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 功能卡片区 */
.features-section {
  background: #fff;
  padding: 40px 24px 80px;
  position: relative;
  flex: 1;
}

.features-container {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  position: relative;
  z-index: 2;
}

.feature-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.feature-card:hover {
  box-shadow: 0 8px 24px rgba(230, 57, 70, 0.15);
  border-color: #e63946;
  animation: card-bounce 0.5s ease forwards;
}

.feature-card.pulse-active {
  animation: card-pulse-bounce 0.5s ease forwards;
  box-shadow: 0 8px 24px rgba(230, 57, 70, 0.2);
  border-color: #e63946;
}

@keyframes card-bounce {
  0% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-12px);
  }
  50% {
    transform: translateY(-8px);
  }
  70% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(-8px);
  }
}

@keyframes card-pulse-bounce {
  0% {
    transform: translateY(0);
  }
  25% {
    transform: translateY(-15px);
  }
  50% {
    transform: translateY(-8px);
  }
  75% {
    transform: translateY(-12px);
  }
  100% {
    transform: translateY(-6px);
  }
}

/* 电流流动效果 */
.current-flow-container {
  position: relative;
  max-width: 800px;
  margin: 40px auto 0;
  height: 4px;
}

.current-flow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(230, 57, 70, 0.2), transparent);
  overflow: hidden;
}

.current-pulse {
  position: absolute;
  top: 0;
  left: -100px;
  width: 100px;
  height: 100%;
  background: linear-gradient(90deg,
    transparent,
    rgba(230, 57, 70, 0.4),
    rgba(230, 57, 70, 1),
    rgba(244, 162, 97, 0.8),
    transparent
  );
  animation: current-move 4s linear infinite;
  box-shadow: 0 0 20px rgba(230, 57, 70, 0.5);
}

@keyframes current-move {
  0% {
    left: -100px;
  }
  100% {
    left: 100%;
  }
}

.current-flow-glow {
  position: absolute;
  top: -8px;
  left: 0;
  right: 0;
  height: 18px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(230, 57, 70, 0.1) 20%,
    rgba(230, 57, 70, 0.15) 50%,
    rgba(230, 57, 70, 0.1) 80%,
    transparent 100%
  );
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.card-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0;
}

.card-arrow {
  color: #999;
  transition: all 0.3s ease;
}

.feature-card:hover .card-arrow {
  color: #e63946;
  transform: translateX(4px);
}

/* 底部版权 */
.page-footer {
  background: #f8f9fa;
  padding: 24px;
  flex-shrink: 0;
  margin-top: 0;
  border-top: 1px solid #e8e8e8;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  text-align: center;
}

.footer-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

/* 响应式 */
@media (max-width: 1024px) {
  .hero-center-decor {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-menu {
    display: none;
  }

  .header-right {
    gap: 16px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .hero-actions {
    flex-direction: column;
  }

  .features-container {
    grid-template-columns: 1fr;
  }
}
</style>
