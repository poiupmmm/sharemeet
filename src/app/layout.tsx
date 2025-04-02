import './globals.css';
import { createTablesIfNotExist } from '@/lib/createTables';

// 添加动态渲染配置，避免构建时预渲染错误
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export const metadata = {
  title: 'ShareMeet - 发现精彩活动',
  description: 'ShareMeet是一个社交活动平台，帮助用户发现精彩活动，结识志同道合的朋友',
};

// 在服务器端尝试初始化数据库表 
if (typeof window === 'undefined') {
  console.log('服务器端初始化: 尝试创建数据库表...');
  createTablesIfNotExist()
    .then(result => {
      console.log('数据库表初始化结果:', result);
    })
    .catch(error => {
      console.error('数据库表初始化失败:', error);
    });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 全局登录检查逻辑
              (function checkLoginStatus() {
                // 不需要登录就能访问的页面路径
                const publicPaths = ['/auth', '/'];
                
                // 获取当前路径
                const pathname = window.location.pathname;
                
                // 如果当前页面不是公开页面，则检查登录状态
                if (!publicPaths.includes(pathname)) {
                  // 从cookie获取登录状态
                  const cookies = document.cookie.split(';');
                  const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
                  const isUserLoggedIn = isLoggedInCookie && isLoggedInCookie.includes('true');
                  
                  // 如果未登录，重定向到登录页面
                  if (!isUserLoggedIn) {
                    console.log('未检测到登录状态，重定向到登录页面');
                    window.location.href = '/auth';
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
} 
