<script setup>
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  QuestionFilled,
  Bell,
  ArrowDown,
} from '@element-plus/icons-vue'
import Web3DBackground from '@/components/home/Web3DBackground.vue'

const router = useRouter()

// 顶部菜单项
const menuItems = [
  { label: '首页', path: '/dashboard', active: true },
  { label: '集成验证', path: '/integration' },
  { label: '方案体验', path: '/experience' },
  { label: '在线实训', path: '/training' },
]

// 功能卡片数据
const featureCards = [
  {
    id: 1,
    title: '了解系统',
    icon: '📖',
    desc: '系统介绍与功能说明',
  },
  {
    id: 2,
    title: '系统使用指南',
    icon: '📋',
    desc: '详细操作指南文档',
  },
  {
    id: 3,
    title: '权限申请指南',
    icon: '📝',
    desc: '权限申请流程说明',
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
          <div class="header-action phone-dropdown">
            <span>17721884685</span>
            <el-icon :size="12"><ArrowDown /></el-icon>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Banner 区域 -->
    <section class="hero-banner">
      <!-- Web3D 背景 -->
      <Web3DBackground />
      <div class="hero-bg-overlay"></div>

      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">GNEEC LIVE</h1>
          <p class="hero-subtitle">让服务解决方案触手可及</p>
          <div class="hero-actions">
            <button class="hero-btn primary" @click="handleStart">
              开始使用
            </button>
            <button class="hero-btn secondary" @click="handleProgress">
              查看申请进度
            </button>
          </div>
          <p class="hero-note">
            <el-icon><QuestionFilled /></el-icon>
            系统使用权限正在审批，如有疑问请联系技术支持
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
          v-for="card in featureCards"
          :key="card.id"
          class="feature-card"
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
  background: #f5f5f5;
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
  padding: 40px 24px;
}

.features-container {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
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
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
  border-color: #e63946;
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
  margin-top: auto;
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

  .features-container {
    grid-template-columns: repeat(2, 1fr);
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
