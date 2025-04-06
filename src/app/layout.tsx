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
                try {
                  // 不需要登录就能访问的页面路径
                  const publicPaths = ['/auth', '/', '/auth/login', '/auth/register'];
                  
                  // 获取当前路径
                  const pathname = window.location.pathname;
                  
                  // 如果当前是公开页面，不需要检查登录状态
                  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
                    console.log('公开页面，不需要检查登录状态');
                    return;
                  }
                  
                  console.log('检查登录状态...');
                  
                  // 检查cookie中的登录状态
                  const cookies = document.cookie.split(';');
                  const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
                  const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
                  
                  // 验证登录状态和用户ID
                  const isLoggedIn = isLoggedInCookie && isLoggedInCookie.includes('true');
                  const hasUserId = userIdCookie && userIdCookie.split('=')[1].trim().length > 0;
                  
                  // 检查localStorage中是否有用户数据
                  let hasUserData = false;
                  try {
                    const userData = localStorage.getItem('userData');
                    hasUserData = !!userData && userData.length > 10;
                  } catch (storageError) {
                    console.error('访问localStorage失败:', storageError);
                  }
                  
                  // 如果登录状态不完整，重定向到登录页面
                  const isValidLogin = isLoggedIn && hasUserId && hasUserData;
                  
                  if (!isValidLogin) {
                    console.log('登录状态无效，重定向到登录页面');
                    console.log('状态检查:', { isLoggedIn, hasUserId, hasUserData });
                    
                    // 保存当前页面URL，以便登录后重定向回来
                    document.cookie = "redirectAfterLogin=" + encodeURIComponent(pathname) + "; path=/; max-age=3600";
                    
                    // 重定向到登录页面
                    window.location.href = '/auth';
                  } else {
                    console.log('用户已登录，继续访问');
                  }
                } catch (error) {
                  console.error('登录状态检查出错:', error);
                  // 出错时不进行重定向，避免无限重定向循环
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
