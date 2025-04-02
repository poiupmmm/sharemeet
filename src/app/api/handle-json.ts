// 通用的JSON响应处理函数
export function jsonResponse(data: any, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      }
    }
  );
}

// 生成成功响应
export function successResponse(data: any = {}, message = '操作成功') {
  return jsonResponse({
    success: true,
    message,
    ...data,
    timestamp: new Date().toISOString()
  });
}

// 生成错误响应
export function errorResponse(error: string, status = 400, details: any = null) {
  return jsonResponse({
    success: false,
    error,
    details,
    timestamp: new Date().toISOString()
  }, status);
} 