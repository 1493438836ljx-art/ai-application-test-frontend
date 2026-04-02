<template>
  <div
    class="ai-chat-panel"
    :class="{ expanded: expanded, dragging: isDragging }"
    :style="expanded ? { width: width + 'px' } : {}"
    @mousedown.stop
  >
    <!-- 折叠状态下的折叠指示器 - AI助手风格设计 -->
    <div
      v-if="!expanded"
      class="ai-chat-collapse-indicator"
      @click="toggleExpand"
    >
      <!-- AI火花装饰 -->
      <div class="ai-sparkle ai-sparkle-1"></div>
      <div class="ai-sparkle ai-sparkle-2"></div>
      <div class="ai-sparkle ai-sparkle-3"></div>

      <!-- AI图标区域 -->
      <div class="ai-icon-container">
        <div class="ai-icon-glow"></div>
        <el-icon class="ai-icon" :size="22">
          <ChatDotRound />
        </el-icon>
      </div>

      <!-- 文字区域 -->
      <div class="ai-text-container">
        <span class="ai-label">AI</span>
        <span class="ai-title">智能助手</span>
      </div>

      <!-- 展开提示 -->
      <div class="ai-expand-hint">
        <span class="hint-dot"></span>
        <span class="hint-text">点击展开</span>
      </div>
    </div>

    <!-- 拖拽调整手柄 -->
    <div
      v-if="expanded"
      class="ai-chat-resize-handle"
      @mousedown="startDrag"
    >
      <div class="resize-indicator"></div>
    </div>

    <!-- 展开状态的头部 -->
    <div v-if="expanded" class="ai-chat-header" @click="toggleExpand">
      <div class="ai-chat-title">
        <div class="title-icon">
          <div class="icon-glow"></div>
          <el-icon :size="18"><ChatDotRound /></el-icon>
        </div>
        <div class="title-content">
          <span class="title-label">AI</span>
          <span class="title-text">智能助手</span>
        </div>
        <Transition name="fade">
          <span v-if="isTyping" class="processing-badge">
            <span class="badge-dot"></span>
            <span class="badge-text">思考中</span>
          </span>
        </Transition>
      </div>
      <div class="ai-chat-header-right">
        <Transition name="fade">
          <span v-if="isTyping" class="header-processing-indicator">
            <span class="spinner-mini"></span>
          </span>
        </Transition>
        <div class="collapse-btn" @click.stop="toggleExpand" title="收起面板">
          <el-icon :size="16">
            <ArrowRight />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div v-show="expanded" class="ai-chat-content">
      <div ref="messagesRef" class="ai-chat-messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="ai-message-item"
          :class="message.type"
        >
          <div v-if="message.type === 'ai'" class="ai-message-avatar">
            <el-icon :size="14"><ChatDotRound /></el-icon>
          </div>
          <!-- 流式消息内容为空时显示思考动画 -->
          <template v-if="message.isStreaming && !message.content">
            <div class="ai-message-bubble typing">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
          </template>
          <!-- 有内容时显示消息气泡 -->
          <template v-else>
            <div
              class="ai-message-bubble"
              :class="{ 'streaming': message.isStreaming }"
              v-html="message.type === 'ai' ? renderMarkdown(message.content) : message.content"
            ></div>
            <!-- 流式输出光标 -->
            <span v-if="message.isStreaming" class="streaming-cursor">|</span>
          </template>
          <div v-if="message.type === 'user'" class="ai-message-avatar user">
            <span>我</span>
          </div>
        </div>
        <!-- 额外的思考动画（用于非流式场景） -->
        <div v-if="isTyping && !messages.some(m => m.isStreaming)" class="ai-message-item ai">
          <div class="ai-message-avatar">
            <el-icon :size="14"><ChatDotRound /></el-icon>
          </div>
          <div class="ai-message-bubble typing">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
      <div class="ai-chat-input-area" :class="{ 'is-disabled': isTyping }">
        <el-input
          v-model="input"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 4 }"
          placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
          size="small"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <el-button type="primary" size="small" :icon="Position" @click="sendMessage" :disabled="!input.trim() || isTyping">发送</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { ChatDotRound, ArrowRight, Position } from '@element-plus/icons-vue'
import { marked } from 'marked'

const props = defineProps({
  // 工作流ID
  workflowId: {
    type: [String, Number],
    default: 'new',
  },
  // 工作流名称
  workflowName: {
    type: String,
    default: '',
  },
  // 是否展开
  modelValue: {
    type: Boolean,
    default: false,
  },
  // 聊天消息列表
  messages: {
    type: Array,
    default: () => [],
  },
  // 是否正在输入
  isTyping: {
    type: Boolean,
    default: false,
  },
  // 面板宽度
  panelWidth: {
    type: Number,
    default: 400,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'update:messages',
  'send-message',
  'clear-chat',
  'workflow-updated',
])

// 本地状态
const expanded = ref(props.modelValue)
const input = ref('')
const messagesRef = ref(null)
const width = ref(props.panelWidth)
const minWidth = 300
const maxWidth = 600
const isDragging = ref(false)

// 同步展开状态
watch(() => props.modelValue, (val) => {
  expanded.value = val
})

watch(expanded, (val) => {
  emit('update:modelValue', val)
})

// 同步宽度
watch(() => props.panelWidth, (val) => {
  width.value = val
})

// 切换展开/折叠
const toggleExpand = () => {
  expanded.value = !expanded.value
}

// 开始拖拽
const startDrag = (e) => {
  e.stopPropagation()
  e.preventDefault()
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ew-resize'
}

// 拖拽中
const onDrag = (e) => {
  if (!isDragging.value) return
  e.preventDefault()
  const panel = document.querySelector('.ai-chat-panel')
  if (!panel) return
  const panelRect = panel.getBoundingClientRect()
  const newWidth = panelRect.right - e.clientX
  if (newWidth >= minWidth && newWidth <= maxWidth) {
    width.value = newWidth
  }
}

// 停止拖拽
const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

// 发送消息
const sendMessage = () => {
  const content = input.value.trim()
  if (!content || props.isTyping) return

  emit('send-message', content)
  input.value = ''

  nextTick(() => {
    scrollToBottom()
  })
}

// 渲染Markdown
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch (e) {
    return content
  }
}

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
})
</script>

<style scoped>
.ai-chat-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-left: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, background 0.3s ease;
  z-index: 100;
  overflow: hidden;
}

.ai-chat-panel.expanded {
  width: 400px;
  background: #fff;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.1);
}

.ai-chat-panel.dragging {
  transition: none;
}

/* 折叠状态指示器 */
.ai-chat-collapse-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  padding: 16px 8px;
  position: relative;
  transition: background 0.2s;
}

.ai-chat-collapse-indicator:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* AI火花装饰 */
.ai-sparkle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: sparkle 2s ease-in-out infinite;
}

.ai-sparkle-1 {
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  animation-delay: 0s;
}

.ai-sparkle-2 {
  top: 35%;
  right: 8px;
  animation-delay: 0.5s;
}

.ai-sparkle-3 {
  top: 50%;
  left: 8px;
  animation-delay: 1s;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* AI图标容器 */
.ai-icon-container {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.ai-icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.ai-icon {
  color: #fff;
  position: relative;
  z-index: 1;
}

/* 文字区域 */
.ai-text-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ai-label {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 1px;
}

.ai-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

/* 展开提示 */
.ai-expand-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 16px;
}

.hint-dot {
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

.hint-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  writing-mode: vertical-rl;
}

/* 拖拽手柄 */
.ai-chat-resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.2s;
  z-index: 10;
}

.ai-chat-resize-handle:hover {
  background: rgba(102, 126, 234, 0.3);
}

.ai-chat-resize-handle .resize-indicator {
  position: absolute;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 40px;
  background: #dcdfe6;
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.2s;
}

.ai-chat-resize-handle:hover .resize-indicator {
  opacity: 1;
}

/* 头部 */
.ai-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.ai-chat-header:hover {
  opacity: 0.95;
}

.ai-chat-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-icon {
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.title-content {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.title-label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

.title-text {
  font-size: 13px;
  opacity: 0.9;
}

/* 处理中徽章 */
.processing-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 12px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  background: #fff;
  border-radius: 50%;
  animation: dotPulse 1s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.badge-text {
  color: #fff;
}

.ai-chat-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-processing-indicator {
  display: flex;
  align-items: center;
}

.spinner-mini {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.collapse-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 聊天内容 */
.ai-chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ai-message-item.ai {
  flex-direction: row;
}

.ai-message-item.user {
  flex-direction: row-reverse;
}

.ai-message-item.system {
  justify-content: center;
}

.ai-message-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-message-avatar.user {
  background: #409eff;
  font-size: 12px;
}

.ai-message-bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.ai-message-item.ai .ai-message-bubble {
  background: #f5f7fa;
  color: #303133;
  border-bottom-left-radius: 4px;
}

.ai-message-item.user .ai-message-bubble {
  background: #409eff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-message-bubble.streaming {
  background: #f5f7fa;
}

/* 思考动画 */
.ai-message-bubble.typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #909399;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* 流式输出光标 */
.streaming-cursor {
  color: #667eea;
  font-weight: bold;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 输入区域 */
.ai-chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.ai-chat-input-area.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.ai-chat-input-area :deep(.el-textarea__inner) {
  resize: none;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
