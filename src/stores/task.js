import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTaskStore = defineStore('task', () => {
  // 模拟任务数据
  const tasks = ref([
    {
      id: '1',
      name: 'GPT-4 对话能力测试',
      status: 'running',
      progress: 60,
      createdAt: '2024-02-25 10:00',
      updatedAt: '2024-02-25 10:30',
      description: '测试 GPT-4 在多轮对话中的表现',
    },
    {
      id: '2',
      name: 'Claude 代码生成评测',
      status: 'completed',
      progress: 100,
      createdAt: '2024-02-24 14:30',
      updatedAt: '2024-02-24 16:00',
      description: '评估 Claude 代码生成能力',
    },
    {
      id: '3',
      name: '文心一言知识问答测试',
      status: 'failed',
      progress: 45,
      createdAt: '2024-02-24 09:15',
      updatedAt: '2024-02-24 09:45',
      description: '测试文心一言知识问答准确率',
    },
    {
      id: '4',
      name: '通义千问多模态测试',
      status: 'pending',
      progress: 0,
      createdAt: '2024-02-25 08:00',
      updatedAt: '2024-02-25 08:00',
      description: '测试通义千问多模态能力',
    },
    {
      id: '5',
      name: 'LLaMA 推理能力评测',
      status: 'completed',
      progress: 100,
      createdAt: '2024-02-23 11:00',
      updatedAt: '2024-02-23 14:00',
      description: '评估 LLaMA 逻辑推理能力',
    },
  ])

  // 统计数据
  const stats = computed(() => [
    {
      title: '测试任务',
      value: 12,
      icon: 'List',
      color: '#409eff',
    },
    {
      title: '测试结果',
      value: 48,
      icon: 'DataLine',
      color: '#67c23a',
    },
    {
      title: 'Prompt',
      value: 36,
      icon: 'Document',
      color: '#e6a23c',
    },
    {
      title: '测评集',
      value: 15,
      icon: 'FolderOpened',
      color: '#f56c6c',
    },
  ])

  // 获取近期任务
  const recentTasks = computed(() => {
    return tasks.value.slice(0, 5)
  })

  // 根据ID获取任务
  const getTaskById = (id) => {
    return tasks.value.find((task) => task.id === id)
  }

  // 添加任务
  const addTask = (task) => {
    const newTask = {
      ...task,
      id: String(Date.now()),
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      updatedAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    tasks.value.unshift(newTask)
    return newTask
  }

  // 更新任务状态
  const updateTaskStatus = (id, status, progress) => {
    const task = tasks.value.find((t) => t.id === id)
    if (task) {
      task.status = status
      if (progress !== undefined) {
        task.progress = progress
      }
      task.updatedAt = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return {
    tasks,
    stats,
    recentTasks,
    getTaskById,
    addTask,
    updateTaskStatus,
  }
})
