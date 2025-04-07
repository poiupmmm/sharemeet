export async function GET() {
  // 最基本的JSON响应方式
  return new Response(
    JSON.stringify({
      success: true,
      message: "简单JSON测试成功",
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json;charset=utf-8"
      }
    }
  );
} 