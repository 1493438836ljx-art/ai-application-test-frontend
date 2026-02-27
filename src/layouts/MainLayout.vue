<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <el-container class="main-layout">
    <el-aside width="220px" class="layout-aside">
      <AppSidebar />
    </el-aside>
    <el-container>
      <el-header height="60px" class="layout-header">
        <AppHeader />
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100vw;
}

.layout-aside {
  background: transparent;
  overflow: hidden;
}

.layout-header {
  padding: 0;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
