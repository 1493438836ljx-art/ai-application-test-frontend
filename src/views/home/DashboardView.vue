<script setup>
import { List, DataLine, Document, FolderOpened } from '@element-plus/icons-vue'
import { useTaskStore } from '@/stores/task'
import StatCard from '@/components/home/StatCard.vue'
import QuickActions from '@/components/home/QuickActions.vue'
import RecentTasks from '@/components/home/RecentTasks.vue'

const taskStore = useTaskStore()

// 图标映射
const iconComponents = {
  List,
  DataLine,
  Document,
  FolderOpened,
}

const getStatIcon = (iconName) => iconComponents[iconName]
</script>

<template>
  <div class="dashboard">
    <!-- 统计卡片区 -->
    <div class="stat-cards">
      <StatCard
        v-for="stat in taskStore.stats"
        :key="stat.title"
        :data="{ ...stat, icon: getStatIcon(stat.icon) }"
      />
    </div>

    <!-- 快捷操作区 -->
    <QuickActions />

    <!-- 近期任务列表 -->
    <RecentTasks :tasks="taskStore.recentTasks" />
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

@media (max-width: 1200px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: 1fr;
  }
}
</style>
