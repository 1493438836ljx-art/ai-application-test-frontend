<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <el-card class="stat-card" :body-style="{ padding: '20px' }">
    <div class="stat-content">
      <div class="stat-icon" :style="{ backgroundColor: data.color + '20', color: data.color }">
        <el-icon :size="28">
          <component :is="data.icon" />
        </el-icon>
      </div>
      <div class="stat-info">
        <div class="stat-value">{{ data.value }}</div>
        <div class="stat-title">{{ data.title }}</div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.stat-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
</style>
