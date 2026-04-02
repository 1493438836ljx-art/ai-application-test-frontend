import { ref, nextTick } from 'vue'
import { sendMessageStream } from '@/api/chat.js'
import { marked } from 'marked'

/**
 * AI 聊天功能 Composable
 * 管理工作流编辑器中的 AI 助手聊天功能
 *
 * @param {Object} options - 配置选项
 * @param {Object} options.workflow - 工作流信息对象
 * @param {Function} options.onWorkflowUpdate - 工作流更新回调函数
 * @param {Function} options.loadWorkflowData - 重新加载工作流数据的函数
 * @param {Object} options.nodes - 节点列表的 ref
 * @returns {Object} AI 聊天相关的状态和方法
 */
export function useAIChat(options = {}) {
  const {
    workflow = { id: 'new' },
    onWorkflowUpdate = null,
    loadWorkflowData = async () => {},
    nodes = ref([]),
  } = options

  // AI聊天框状态
  const aiChatExpanded = ref(false)
  const aiChatMessages = ref([
    {
      id: 1,
      type: 'ai',
      content: '你好！我是工作流AI助手，有什么可以帮助你的吗？',
      time: new Date(),
    },
  ])
  const aiChatInput = ref('')
  const aiChatIsTyping = ref(false)
  const aiChatMessagesRef = ref(null)
  const aiChatConversationId = ref(null)

  // AI聊天框拖拽调整宽度
  const aiChatWidth = ref(400)
  const aiChatMinWidth = 300
  const aiChatMaxWidth = 600
  const isDraggingAiChat = ref(false)

  // 预设的AI回复（用于错误时的回退）
  const aiReplies = [
    '这是一个很好的问题！让我来帮你分析一下。',
    '我理解你的需求。根据你的描述，我建议...',
    '好的，我已经收到你的消息了。请问还有什么需要补充的吗？',
    '这个问题很有趣！从技术角度来看...',
    '感谢你的提问。我可以为你提供以下建议...',
    '明白了，让我帮你处理这个需求。',
  ]

  // 开始拖拽AI聊天框
  const startDragAiChat = (e) => {
    e.stopPropagation()
    e.preventDefault()
    isDraggingAiChat.value = true
    document.addEventListener('mousemove', onDragAiChat)
    document.addEventListener('mouseup', stopDragAiChat)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
  }

  // 拖拽中
  const onDragAiChat = (e) => {
    if (!isDraggingAiChat.value) return
    e.preventDefault()
    const panel = document.querySelector('.ai-chat-panel')
    if (!panel) return
    const panelRect = panel.getBoundingClientRect()
    const newWidth = panelRect.right - e.clientX
    if (newWidth >= aiChatMinWidth && newWidth <= aiChatMaxWidth) {
      aiChatWidth.value = newWidth
    }
  }

  // 停止拖拽
  const stopDragAiChat = () => {
    isDraggingAiChat.value = false
    document.removeEventListener('mousemove', onDragAiChat)
    document.removeEventListener('mouseup', stopDragAiChat)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  // 切换AI聊天框展开/折叠
  const toggleAiChat = () => {
    aiChatExpanded.value = !aiChatExpanded.value
  }

  // 滚动AI聊天到底部
  const scrollAiChatToBottom = () => {
    if (aiChatMessagesRef.value) {
      aiChatMessagesRef.value.scrollTop = aiChatMessagesRef.value.scrollHeight
    }
  }

  // 处理工作流更新事件（来自 AI 助手）
  const handleWorkflowUpdated = (data) => {
    console.log('收到工作流更新事件:', data)

    if (!data || !data.nodes) {
      console.warn('工作流更新数据格式不正确', data)
      return
    }

    // 遍历更新的节点，应用新配置
    data.nodes.forEach((nodeUpdate) => {
      // 根据 nodeUuid 查找对应的节点
      const nodeIndex = nodes.value.findIndex(n => n.nodeUuid === nodeUpdate.nodeUuid)
      if (nodeIndex !== -1) {
        const node = nodes.value[nodeIndex]
        // 更新节点配置
        if (nodeUpdate.config) {
          node.config = typeof nodeUpdate.config === 'string'
            ? nodeUpdate.config
            : JSON.stringify(nodeUpdate.config)
        }
        console.log('已更新节点配置:', node.name, nodeUpdate.config)
      }
    })

    // 显示系统提示消息
    aiChatMessages.value.push({
      id: Date.now(),
      type: 'system',
      content: '工作流节点配置已更新',
      time: new Date(),
    })
    nextTick(() => scrollAiChatToBottom())

    // 调用外部回调
    if (onWorkflowUpdate) {
      onWorkflowUpdate(data)
    }
  }

  // 发送AI消息（流式）
  const sendAiMessage = async () => {
    const content = aiChatInput.value.trim()
    if (!content) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content,
      time: new Date(),
    }
    aiChatMessages.value.push(userMessage)
    aiChatInput.value = ''

    await nextTick()
    scrollAiChatToBottom()

    // 创建AI消息占位符
    const aiMessageId = Date.now() + 1
    const aiMessage = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      time: new Date(),
      isStreaming: true,
    }
    aiChatMessages.value.push(aiMessage)

    aiChatIsTyping.value = true

    try {
      // 使用流式API
      await sendMessageStream(
        {
          conversationId: aiChatConversationId.value,
          message: content,
          context: {
            source: 'workflow-editor',
            workflowId: workflow.id,
          },
        },
        {
          onChunk: (data) => {
            if (data.type === 'start') {
              aiChatConversationId.value = data.conversationId
            } else if (data.type === 'chunk') {
              // 找到AI消息并追加内容
              const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
              if (msg) {
                msg.content += data.content
                scrollAiChatToBottom()
              }
            }
          },
          onAction: (data) => {
            // 处理工作流更新事件
            if (data.type === 'workflow_update') {
              handleWorkflowUpdated(data)
            }
          },
          onDone: async (data) => {
            aiChatIsTyping.value = false
            const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
            if (msg) {
              msg.isStreaming = false
              msg.messageUuid = data.messageUuid
            }
            nextTick(() => scrollAiChatToBottom())

            // AI 回答完成后，刷新工作流数据
            await loadWorkflowData()
          },
          onError: (error) => {
            aiChatIsTyping.value = false
            const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
            if (msg) {
              msg.content = error || '抱歉，服务暂时不可用'
              msg.isStreaming = false
            }
            nextTick(() => scrollAiChatToBottom())
          },
        }
      )
    } catch {
      aiChatIsTyping.value = false
      const msg = aiChatMessages.value.find(m => m.id === aiMessageId)
      if (msg) {
        msg.content = aiReplies[Math.floor(Math.random() * aiReplies.length)]
        msg.isStreaming = false
      }
      nextTick(() => scrollAiChatToBottom())
    }
  }

  // 清空AI聊天记录
  const clearAiChat = () => {
    aiChatConversationId.value = null
    aiChatMessages.value = [
      {
        id: Date.now(),
        type: 'ai',
        content: '对话已清空，有什么新问题吗?',
        time: new Date(),
      },
    ]
  }

  // 格式化AI聊天时间
  const formatAiChatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 渲染Markdown内容
  const renderMarkdown = (content) => {
    if (!content) return ''
    try {
      return marked(content)
    } catch {
      return content
    }
  }

  // 处理AI聊天输入回车
  const handleAiChatKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendAiMessage()
    }
  }

  return {
    // 状态
    aiChatExpanded,
    aiChatMessages,
    aiChatInput,
    aiChatIsTyping,
    aiChatMessagesRef,
    aiChatConversationId,
    aiChatWidth,
    aiChatMinWidth,
    aiChatMaxWidth,
    isDraggingAiChat,

    // 方法
    startDragAiChat,
    toggleAiChat,
    sendAiMessage,
    clearAiChat,
    scrollAiChatToBottom,
    formatAiChatTime,
    renderMarkdown,
    handleAiChatKeydown,
    handleWorkflowUpdated,
  }
}
