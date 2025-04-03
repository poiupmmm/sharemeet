// 使用旧式pages目录API路由方式，可能更稳定
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  
  res.status(200).json({
    success: true,
    message: 'Pages API测试成功',
    timestamp: new Date().toISOString(),
    server: 'Next.js Pages API'
  });
} 