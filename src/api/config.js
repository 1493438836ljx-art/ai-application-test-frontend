/**
 * API 配置
 * 统一管理后端服务地址
 */

// 获取 API 基础地址（从环境变量读取）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
