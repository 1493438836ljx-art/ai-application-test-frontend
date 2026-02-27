<script setup>
import { Setting } from '@element-plus/icons-vue'
</script>

<template>
  <div class="page-container">
    <el-empty :image-size="200">
      <template #image>
        <el-icon :size="100" color="#909399">
          <Setting />
        </el-icon>
      </template>
      <template #description>
        <h2>环境管理</h2>
        <p class="description">配置测试环境，管理 API 密钥和环境变量</p>
      </template>
      <el-button type="primary">配置环境</el-button>
    </el-empty>
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 200px);
}

.description {
  color: #909399;
  margin-top: 8px;
}
</style>
