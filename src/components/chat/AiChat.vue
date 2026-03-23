<script setup>
import { ref, nextTick, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChatDotRound, Close, Position, Delete, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sendMessageStream, getQuickQuestions } from '@/api/chat'
import { marked } from 'marked'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'close'])

const isOpen = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const inputMessage = ref('')
const messagesContainer = ref(null)
const isTyping = ref(false)
const showScrollButton = ref(false)

// 当前对话ID
const currentConversationId = ref(null)

// 拖拽调整高度
const chatHeight = ref(520)
const minHeight = 300
const maxHeight = 700
const isDragging = ref(false)

const startDrag = (e) => {
  isDragging.value = true
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'ns-resize'
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const windowHeight = window.innerHeight
  const newHeight = windowHeight - e.clientY - 24
  if (newHeight >= minHeight && newHeight <= maxHeight) {
    chatHeight.value = newHeight
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
  document.body.style.cursor = ''
}

// 预设快捷问题（默认值，可从后端动态获取）
const quickQuestions = ref([
  { icon: '💡', text: '如何创建测评集？' },
  { icon: '🔧', text: '环境管理怎么配置？' },
  { icon: '📊', text: '如何查看测试报告？' },
  { icon: '🚀', text: '快速入门指南' },
])

// 加载快捷问题
const loadQuickQuestions = async () => {
  try {
    const response = await getQuickQuestions()
    if (response && Array.isArray(response) && response.length > 0) {
      quickQuestions.value = response.map((item) => ({
        id: item.id,
        icon: item.icon || '💡',
        text: item.text,
        category: item.category,
      }))
    }
  } catch (error) {
    // 使用默认快捷问题
    console.log('使用默认快捷问题')
  }
}

// 消息列表
const messages = ref([
  {
    id: 1,
    type: 'ai',
    content: '你好！我是AI助手，有什么可以帮助你的吗？',
    time: new Date(),
  },
])

// 预设的AI回复
const aiReplies = [
  '这是一个很好的问题！让我来帮你分析一下。',
  '我理解你的需求。根据你的描述，我建议...',
  '好的，我已经收到你的消息了。请问还有什么需要补充的吗？',
  '这个问题很有趣！从技术角度来看...',
  '感谢你的提问。我可以为你提供以下建议...',
  '明白了，让我帮你处理这个需求。',
]

// 获取随机AI回复
const getRandomReply = () => {
  const index = Math.floor(Math.random() * aiReplies.length)
  return aiReplies[index]
}

// 格式化时间
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 滚动到底部
const scrollToBottom = async (smooth = true) => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'instant',
    })
  }
}

// 检查是否显示滚动按钮
const checkScrollButton = () => {
  if (messagesContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    showScrollButton.value = scrollHeight - scrollTop - clientHeight > 100
  }
}

// 发送消息
const sendMessage = async (content = null) => {
  const messageContent = content || inputMessage.value.trim()
  if (!messageContent) return

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: messageContent,
    time: new Date(),
  }
  messages.value.push(userMessage)
  inputMessage.value = ''
  await scrollToBottom()

  // 创建AI消息占位符
  const aiMessageId = Date.now() + 1
  const aiMessage = {
    id: aiMessageId,
    type: 'ai',
    content: '',
    time: new Date(),
    isStreaming: true,
  }
  messages.value.push(aiMessage)

  isTyping.value = true

  try {
    // 使用流式API
    await sendMessageStream(
      {
        conversationId: currentConversationId.value,
        message: messageContent,
        context: { source: 'workflow-editor' },
      },
      {
        onChunk: (data) => {
          if (data.type === 'start') {
            currentConversationId.value = data.conversationId
          } else if (data.type === 'chunk') {
            // 找到AI消息并追加内容
            const msg = messages.value.find(m => m.id === aiMessageId)
            if (msg) {
              msg.content += data.content
              scrollToBottom()
            }
          }
        },
        onDone: (data) => {
          isTyping.value = false
          const msg = messages.value.find(m => m.id === aiMessageId)
          if (msg) {
            msg.isStreaming = false
            msg.messageUuid = data.messageUuid
          }
          scrollToBottom()
        },
        onError: (error) => {
          isTyping.value = false
          const msg = messages.value.find(m => m.id === aiMessageId)
          if (msg) {
            msg.content = error || '抱歉，服务暂时不可用'
            msg.isStreaming = false
          }
          scrollToBottom()
        },
      }
    )
  } catch (error) {
    isTyping.value = false
    const msg = messages.value.find(m => m.id === aiMessageId)
    if (msg) {
      msg.content = getRandomReply()
      msg.isStreaming = false
    }
    scrollToBottom()
  }
}

// 渲染Markdown内容
const renderMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch (e) {
    return content
  }
}

// 关闭聊天框
const handleClose = () => {
  emit('close')
  isOpen.value = false
}

// 清空对话
const clearMessages = () => {
  // 重置对话ID，下次发送会创建新对话
  currentConversationId.value = null
  messages.value = [
    {
      id: Date.now(),
      type: 'ai',
      content: '对话已清空，有什么新问题吗？',
      time: new Date(),
    },
  ]
  ElMessage.success('对话已清空')
}

// 处理回车发送
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 处理ESC关闭
const handleEscapeKey = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    handleClose()
  }
}

// 监听滚动和键盘事件
onMounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', checkScrollButton)
  }
  document.addEventListener('keydown', handleEscapeKey)
  // 加载快捷问题
  loadQuickQuestions()
})

onUnmounted(() => {
  if (messagesContainer.value) {
    messagesContainer.value.removeEventListener('scroll', checkScrollButton)
  }
  document.removeEventListener('keydown', handleEscapeKey)
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

// 监听打开状态，自动滚动到底部
watch(isOpen, (val) => {
  if (val) {
    nextTick(() => scrollToBottom(false))
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="chat-slide">
      <div v-if="isOpen" class="ai-chat-container" :style="{ height: `${chatHeight}px` }">
        <!-- 拖拽调整手柄 -->
        <div
          class="resize-handle"
          :class="{ active: isDragging }"
          @mousedown="startDrag"
        >
          <div class="resize-line"></div>
        </div>

        <!-- 头部 -->
        <div class="chat-header">
          <div class="header-left">
            <div class="ai-avatar">
              <div class="avatar-glow"></div>
              <el-icon :size="22"><ChatDotRound /></el-icon>
            </div>
            <div class="header-info">
              <span class="header-title">AI 智能助手</span>
              <div class="header-status">
                <span class="status-dot"></span>
                <span>在线 · 随时为您服务</span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <el-tooltip content="清空对话" placement="top">
              <button class="action-btn" @click="clearMessages">
                <el-icon :size="18"><Delete /></el-icon>
              </button>
            </el-tooltip>
            <el-tooltip content="关闭 (Esc)" placement="top">
              <button class="action-btn close" @click="handleClose">
                <el-icon :size="18"><Close /></el-icon>
              </button>
            </el-tooltip>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div class="quick-questions">
          <div
            v-for="(question, index) in quickQuestions"
            :key="index"
            class="quick-item"
            @click="sendMessage(question.text)"
          >
            <span class="quick-icon">{{ question.icon }}</span>
            <span class="quick-text">{{ question.text }}</span>
          </div>
        </div>

        <!-- 消息区域 -->
        <div ref="messagesContainer" class="chat-messages">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-item"
            :class="message.type"
          >
            <!-- AI消息：头像在左，内容在右 -->
            <div v-if="message.type === 'ai'" class="message-avatar ai">
              <el-icon :size="16"><ChatDotRound /></el-icon>
            </div>

            <!-- 消息内容 -->
            <div class="message-content">
              <!-- 流式消息内容为空时显示思考动画 -->
              <template v-if="message.isStreaming && !message.content">
                <div class="message-bubble typing">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </template>
              <!-- 有内容时显示消息气泡 -->
              <template v-else>
                <div
                  class="message-bubble"
                  :class="{ 'streaming': message.isStreaming }"
                  v-html="message.type === 'ai' ? renderMarkdown(message.content) : message.content"
                ></div>
                <!-- 流式输出时的光标 -->
                <div v-if="message.isStreaming" class="streaming-cursor">
                  <span class="cursor-dot"></span>
                </div>
              </template>
              <div class="message-time">{{ formatTime(message.time) }}</div>
            </div>

            <!-- 用户消息：内容在左，头像在右 -->
            <div v-if="message.type === 'user'" class="message-avatar user">
              <span>我</span>
            </div>
          </div>

          <!-- 正在输入提示（仅在没有流式消息时显示） -->
          <Transition name="typing">
            <div v-if="isTyping && !messages.some(m => m.isStreaming)" class="message-item ai">
              <div class="message-avatar ai">
                <el-icon :size="16"><ChatDotRound /></el-icon>
              </div>
              <div class="message-content">
                <div class="message-bubble typing">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 滚动到底部按钮 -->
        <Transition name="fade">
          <button v-if="showScrollButton" class="scroll-bottom-btn" @click="scrollToBottom()">
            <el-icon :size="16"><ArrowDown /></el-icon>
          </button>
        </Transition>

        <!-- 输入区域 -->
        <div class="chat-input">
          <div class="input-wrapper">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="输入消息，按 Enter 发送..."
              resize="none"
              @keydown="handleKeydown"
            />
          </div>
          <el-button
            type="primary"
            class="send-btn"
            :disabled="!inputMessage.trim()"
            @click="sendMessage()"
          >
            <el-icon :size="18"><Position /></el-icon>
            <span>发送</span>
          </el-button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-chat-container {
  position: fixed;
  left: 220px;
  right: 24px;
  bottom: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}

/* 拖拽调整手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: ns-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover .resize-line,
.resize-handle.active .resize-line {
  background: #6366f1;
  width: 60px;
}

.resize-line {
  width: 40px;
  height: 3px;
  background: #d1d5db;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.resize-handle.active .resize-line {
  background: #6366f1;
}

/* 头部样式 */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  padding-top: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.chat-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.ai-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.avatar-glow {
  position: absolute;
  inset: -2px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  opacity: 0.9;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
}

.header-actions {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.action-btn.close:hover {
  background: rgba(239, 68, 68, 0.8);
}

/* 快捷问题 */
.quick-questions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(248, 250, 252, 0.8);
  border-bottom: 1px solid rgba(229, 231, 235, 0.6);
  overflow-x: auto;
  scrollbar-width: none;
}

.quick-questions::-webkit-scrollbar {
  display: none;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 20px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.quick-item:hover {
  background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  border-color: #c7d2fe;
  color: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.quick-icon {
  font-size: 14px;
}

/* 消息区域 */
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message-item.user {
  justify-content: flex-end;
}

.message-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
}

.message-avatar.ai {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.message-avatar.user {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 60%;
}

.message-item.user {
  justify-content: flex-end;
}

.message-item.user .message-content {
  align-items: flex-end;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-item.ai .message-bubble {
  background: rgba(255, 255, 255, 0.95);
  color: #374151;
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-top-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.message-item.user .message-bubble {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border-top-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 4px;
}

.message-item.user .message-time {
  text-align: right;
}

/* 打字动画 */
.message-bubble.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 18px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a5b4fc;
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
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* 流式输出光标 */
.streaming-cursor {
  display: inline-block;
  margin-left: 2px;
}

.cursor-dot {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #6366f1;
  border-radius: 2px;
  animation: blink 1s infinite;
  vertical-align: middle;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 流式输出时的消息气泡 */
.message-bubble.streaming {
  border-right: 2px solid #6366f1;
}

/* Markdown 内容样式 */
.message-item.ai .message-bubble :deep(p) {
  margin: 0 0 8px 0;
}

.message-item.ai .message-bubble :deep(p:last-child) {
  margin-bottom: 0;
}

.message-item.ai .message-bubble :deep(code) {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.message-item.ai .message-bubble :deep(pre) {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
}

.message-item.ai .message-bubble :deep(pre code) {
  background: transparent;
  padding: 0;
  color: inherit;
}

.message-item.ai .message-bubble :deep(ul),
.message-item.ai .message-bubble :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.message-item.ai .message-bubble :deep(li) {
  margin: 4px 0;
}

.message-item.ai .message-bubble :deep(h1),
.message-item.ai .message-bubble :deep(h2),
.message-item.ai .message-bubble :deep(h3),
.message-item.ai .message-bubble :deep(h4) {
  margin: 12px 0 8px 0;
  font-weight: 600;
}

.message-item.ai .message-bubble :deep(h1) { font-size: 18px; }
.message-item.ai .message-bubble :deep(h2) { font-size: 16px; }
.message-item.ai .message-bubble :deep(h3) { font-size: 15px; }
.message-item.ai .message-bubble :deep(h4) { font-size: 14px; }

.message-item.ai .message-bubble :deep(blockquote) {
  border-left: 3px solid #6366f1;
  margin: 8px 0;
  padding-left: 12px;
  color: #6b7280;
}

.message-item.ai .message-bubble :deep(a) {
  color: #6366f1;
  text-decoration: none;
}

.message-item.ai .message-bubble :deep(a:hover) {
  text-decoration: underline;
}

.message-item.ai .message-bubble :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
  width: 100%;
}

.message-item.ai .message-bubble :deep(th),
.message-item.ai .message-bubble :deep(td) {
  border: 1px solid #e5e7eb;
  padding: 6px 12px;
  text-align: left;
}

.message-item.ai .message-bubble :deep(th) {
  background: #f9fafb;
  font-weight: 600;
}

/* 滚动到底部按钮 */
.scroll-bottom-btn {
  position: absolute;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  transition: all 0.2s ease;
  z-index: 10;
}

.scroll-bottom-btn:hover {
  background: #6366f1;
  color: #fff;
  transform: translateX(-50%) scale(1.1);
}

/* 输入区域 */
.chat-input {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid rgba(229, 231, 235, 0.6);
}

.input-wrapper {
  flex: 1;
  background: #f8fafc;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: #fff;
}

.chat-input :deep(.el-textarea__inner) {
  border: none !important;
  background: transparent !important;
  border-radius: 14px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  box-shadow: none !important;
}

.chat-input :deep(.el-textarea__inner::placeholder) {
  color: #9ca3af;
}

.send-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.send-btn:disabled {
  background: #e5e7eb;
  box-shadow: none;
  cursor: not-allowed;
}

/* 过渡动画 */
.chat-slide-enter-active {
  animation: chat-slide-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chat-slide-leave-active {
  animation: chat-slide-out 0.25s ease-in;
}

@keyframes chat-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes chat-slide-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

/* 打字指示器动画 */
.typing-enter-active,
.typing-leave-active {
  transition: all 0.2s ease;
}

.typing-enter-from,
.typing-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #d1d5db;
}

/* 无障碍：减少动画 */
@media (prefers-reduced-motion: reduce) {
  .chat-slide-enter-active,
  .chat-slide-leave-active {
    animation: none;
  }

  .typing-dot,
  .avatar-glow,
  .status-dot,
  .chat-header::before {
    animation: none;
  }

  .quick-item:hover,
  .action-btn:hover,
  .send-btn:hover:not(:disabled) {
    transform: none;
  }
}

/* 响应式 */
@media (max-width: 768px) {
  .ai-chat-container {
    left: 16px;
    right: 16px;
    bottom: 16px;
    border-radius: 16px;
  }

  .quick-questions {
    padding: 10px 12px;
  }

  .quick-item {
    padding: 6px 12px;
    font-size: 11px;
  }
}
</style>
