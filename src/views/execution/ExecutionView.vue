<script setup>
import { VideoPlay } from '@element-plus/icons-vue'
</script>

<template>
  <div class="page-container">
    <el-empty :image-size="200">
      <template #image>
        <el-icon :size="100" color="#909399">
          <VideoPlay />
        </el-icon>
      </template>
      <template #description>
        <h2>测试执行</h2>
        <p class="description">创建和运行测试任务，监控执行进度</p>
      </template>
      <el-button type="primary">新建测试任务</el-button>
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
