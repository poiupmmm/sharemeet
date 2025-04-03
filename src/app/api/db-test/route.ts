import { successResponse } from "../handle-json";

// 使用通用JSON响应处理
export async function GET() {
  return successResponse({
    server: 'Next.js API端点',
    version: '1.0.0'
  }, 'API测试成功');
} 