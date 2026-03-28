const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/views/workflow/WorkflowEditorView.vue');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 标记要删除的行
const linesToRemove = new Set();

// 要删除的行范围（1-based）
const rangesToRemove = [
  [75, 92],    // openLoopBodyEditor 函数
  [151, 172],  // showLoopBodyInlineMenu, loopBodyCanvasPortState
  [265, 279],  // 循环节点创建代码
  [599, 621],  // getSpecialPortPosition 中的 loopBody 处理
  [633, 711],  // getConnectionMidpoint 中的 isLoopToLoopBody 逻辑
  [718, 736],  // getConnectionMidpoint 中的另一处 loopBody 处理
  [754, 771],  // getConnectionMidpoint 中的另一处 loopBody 处理
  [856, 871],  // getConnectionPathPart 中的 isLoopToLoopBody 逻辑
  [1035, 1037],  // isAssociationConnection
  [1654, 1712],  // getNodePorts 中的 loopBody 处理
  [2548, 2692],  // addConnectedNode 中的 loopBody 创建逻辑
  [3215, 3215],  // v-if="node.type !== 'loopBody'"
  [3343, 3378],  // 模板中的 loop-body-full-canvas 相关代码
  [3391, 3412],  // 模板中的循环体连线渲染
  [3414, 3427],  // 模板中的循环体连线渲染
  [3469, 3522],  // 模板中的循环体连线渲染
  [3524, 3538],  // 模板中的循环体连线渲染
];

rangesToRemove.forEach(([start, end]) => {
  for (let i = start; i <= end; i++) {
    linesToRemove.add(i);
  }
});

// 删除 import 中的 Timer, Grid
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (lineNum <= 50) { // 在 import 区域
    if (line.trim() === 'Timer,' || line.trim() === 'Grid,') {
      linesToRemove.add(lineNum);
    }
  }
});

// 删除 nodeTypes 中的 loop 和 loopBody
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if (line.includes("type: 'loop'") && line.includes("name: '循环'")) {
    // 找到 loop 节点配置，删除整个块
    linesToRemove.add(lineNum);
    let i = idx + 1;
    // 删除直到找到 }
    while (i < lines.length && !lines[i].includes('},')) {
      linesToRemove.add(i + 1);
      i++;
    }
    linesToRemove.add(i + 1); // 删除 }
  }
  if (line.includes("type: 'loopBody'")) {
    linesToRemove.add(lineNum);
  }
});

// 删除 nodes 和 connections 中的 loop 相关数据
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if ((line.includes("'loop-1'") || line.includes("'loopBody-1'")) && !line.includes('//')) {
    linesToRemove.add(lineNum);
  }
});

// 删除 connections 中的 loop 相关连线
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  if ((line.includes("'loop-1'") || line.includes("'loopBody-1'")) && line.includes('conn-')) {
    linesToRemove.add(lineNum);
  }
});

// 收集要保留的行
const result = [];
for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1; // 1-based
  if (!linesToRemove.has(lineNum)) {
    result.push(lines[i]);
  }
}

// 写回文件
fs.writeFileSync(filePath, result.join('\n'), 'utf-8');
console.log(`Cleaned WorkflowEditorView.vue: removed ${linesToRemove.size} lines`);
console.log(`Original: ${lines.length} lines, New: ${result.length} lines`);
