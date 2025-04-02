'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // 检查登录状态
    const checkLoginStatus = () => {
      const cookies = document.cookie.split(';');
      const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
      const loginStatus = isLoggedInCookie?.includes('true') || false;
      
      // 如果已登录，直接跳转到活动列表页面
      if (loginStatus) {
        router.push('/activities');
      } else {
        // 如果未登录，跳转到登录页面
        router.push('/auth');
      }
    };
    
    checkLoginStatus();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      加载中...
    </div>
  );
} 