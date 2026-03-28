#!/usr/bin/env python3
"""
Script to remove all loop node and loop body related code from WorkflowEditorView.vue
"""

import re

def remove_loop_code():
    input_file = r"C:\Users\Administrator\Desktop\ai-application-test-frontend\src\views\workflow\WorkflowEditorView.vue"
    output_file = input_file  # Modify in place

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_lines = len(content.split('\n'))

    # 1. Remove nested canvas state variables and functions
    # Remove nestedCanvasState and nestedCanvasData
    content = re.sub(
        r'// 嵌套画布状态.*?\nconst nestedCanvasState = ref\(\) // .*?\nconst nestedCanvasData = ref\(\{\}\) // .*?\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # Remove enterLoopBody and exitLoopBody functions
    content = re.sub(
        r'// 进入循环体.*?// 退出循环体.*?ElMessage\.success\(\'已退出循环体\'\)\n\}\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 2. Remove loop body editor state variables
    content = re.sub(
        r'// 循环体编辑器状态.*?\nconst loopBodyEditorVisible = ref\(false\)\nconst editingLoopBodyNode = ref\(null\)\nconst loopBodyInnerNodes = ref\(\[\]\)\nconst loopBodyInnerConnections = ref\(\[\]\)\nconst loopBodySelectedNode = ref\(null\)\nconst loopBodySelectedConnection = ref\(null\)\n\n// 循环体内联菜单状态.*?\nconst showLoopBodyInlineMenu = ref\(null\)\n\n',
        '',
        content
    )

    # 3. Remove toggleLoopBodyAddMenu
    content = re.sub(
        r'// 切换循环体内联添加菜单.*?showLoopBodyInlineMenu\.value = node\.id\s+\}\s+\}\n\n',
        '',
        content
    )

    # 4. Remove addNodeToLoopBodyInline
    content = re.sub(
        r'// 在循环体内部直接添加节点.*?showLoopBodyInlineMenu\.value = null\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 5. Remove openLoopBodyEditor
    content = re.sub(
        r'// 打开循环体编辑器.*?loopBodyEditorVisible\.value = true\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 6. Remove saveLoopBodyEditor
    content = re.sub(
        r'// 保存循环体编辑.*?ElMessage\.success\(\'循环体已保存\'\)\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 7. Remove addNodeToLoopBody
    content = re.sub(
        r'// 在循环体中添加节点.*?loopBodyInnerNodes\.value\.push\(newNode\)\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 8. Remove deleteNodeFromLoopBody
    content = re.sub(
        r'// 删除循环体中的节点.*?loopBodySelectedNode\.value = null\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 9. Remove showLoopBodyAddMenu and loopBodyAddMenuStyle
    content = re.sub(
        r'// 循环体编辑器 - 添加节点菜单.*?\nconst showLoopBodyAddMenu = ref\(false\)\nconst loopBodyAddMenuStyle = ref\(\{\}\)\n\n',
        '',
        content
    )

    # 10. Remove showLoopBodyAddPopover
    content = re.sub(
        r'// 显示添加节点菜单.*?showLoopBodyAddMenu\.value = true\s+\}\n\n',
        '',
        content
    )

    # 11. Remove addNodeToLoopBodyFromPort
    content = re.sub(
        r'// 从左侧端口添加节点.*?\}\s+// 触发响应式更新\s+\}\s+nextTick\(\(\) => \{\s+\}\)\n\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 12. Remove selectLoopBodyNode
    content = re.sub(
        r'// 选中循环体中的节点.*?loopBodySelectedNode\.value = node\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 13. Remove loopBodyDragState and startDragLoopBodyNode
    content = re.sub(
        r'// 循环体内部节点拖拽.*?\}\s+\}\s+document\.addEventListener\(\'mousemove\', handleMove\)\s+document\.addEventListener\(\'mouseup\', handleUp\)\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 14. Remove startLoopBodyConnection and endLoopBodyConnection
    content = re.sub(
        r'// 循环体内部连线.*?document\.removeEventListener\(\'mousemove\', loopBodyNode\.handleConnectionMove\)\s+document\.removeEventListener\(\'mouseup\', loopBodyNode\.handleConnectionUp\)\s+\}\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 15. Remove getLoopBodyConnectionPath
    content = re.sub(
        r'// 获取循环体内部连线路径.*?\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 16. Remove handleLoopBodyCanvasClick
    content = re.sub(
        r'// 点击画布关闭菜单.*?loopBodyNode\.selectedInnerConnection = null\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 17. Remove loopBodyCanvasPortState
    content = re.sub(
        r'// 循环体画布端口状态.*?hasMoved: false,\s+\}\)\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 18. Remove handleLoopBodyCanvasPortMouseUp
    content = re.sub(
        r'// 处理循环体画布左侧输入端口的鼠标释放.*?document\.removeEventListener\(\'mouseup\', stopConnection\)\s+\}\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 19. Remove handleLoopBodyCanvasPortMouseDown
    content = re.sub(
        r'// 处理循环体画布右侧输出端口的点击.*?document\.addEventListener\(\'mousemove\', handleMouseMove\)\s+document\.addEventListener\(\'mouseup\', handleMouseUp\)\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 20. Remove startDragLoopBodyInnerNode
    content = re.sub(
        r'// 循环体内部节点拖拽.*?document\.addEventListener\(\'mousemove\', handleMove\)\s+document\.addEventListener\(\'mouseup\', handleUp\)\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 21. Remove selectLoopBodyInnerNode
    content = re.sub(
        r'// 选择循环体内部节点.*?loopBodyNode\.selectedInnerConnection = null\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 22. Remove getLoopBodyTempConnectionPath
    content = re.sub(
        r'const getLoopBodyTempConnectionPath = .*?\}\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 23. Remove isInNestedCanvas computed
    content = re.sub(
        r'// 检查是否在嵌套画布中.*?nestedCanvasState\.value !== null\s+\}\)\n\n',
        '',
        content
    )

    # 24. Remove getInnerCanvasSize
    content = re.sub(
        r'// 计算循环体节点的动态大小.*?// 计算内部画布的实际需要尺寸\s+const getInnerCanvasSize = .*?offsetY: minY < Infinity \? -minY : 0,\s+\}\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 25. Remove getLoopBodyNodeSize
    content = re.sub(
        r'const getLoopBodyNodeSize = .*?minHeight: finalHeight \+ \'px\',\s+\}\s+\}\n\n',
        '',
        content,
        flags=re.DOTALL
    )

    # 26. Remove loop and loopBody from nodeTypes
    content = re.sub(
        r'\s+\{ type: \'loop\', name: \'循环\', icon: \'Timer\', color: \'#3b82f6\', category: \'logic\' \},\n',
        '',
        content
    )
    content = re.sub(
        r'\s+\{ type: \'loopBody\', name: \'循环体\', icon: \'Grid\', color: \'#06b6d4\', category: \'basic\' \}, // 循环体节点，不在弹窗中显示\n',
        '',
        content
    )

    # Write the modified content back
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

    new_lines = len(content.split('\n'))
    removed_lines = original_lines - new_lines

    print(f"Original lines: {original_lines}")
    print(f"New lines: {new_lines}")
    print(f"Removed lines: {removed_lines}")
    print("Done!")

if __name__ == '__main__':
    remove_loop_code()
