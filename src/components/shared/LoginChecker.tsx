'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkUserLoggedIn } from '@/lib/auth';

interface LoginCheckerProps {
  redirectTo?: string;
  showUI?: boolean;
  children?: React.ReactNode;
}

/**
 * 登录状态检查组件
 * 用于检查用户是否已登录，如果未登录则重定向到登录页面
 */
export default function LoginChecker({ 
  redirectTo = '/auth',
  showUI = true,
  children 
}: LoginCheckerProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkLogin = async () => {
      try {
        setIsChecking(true);
        const loggedIn = await checkUserLoggedIn();
        console.log('登录检查结果:', loggedIn);
        
        setIsLoggedIn(loggedIn);
        
        if (!loggedIn) {
          // 记录当前URL，以便登录后重定向回来
          const currentPath = window.location.pathname;
          if (currentPath !== '/' && currentPath !== '/auth') {
            document.cookie = `redirectAfterLogin=${encodeURIComponent(currentPath)}; path=/; max-age=3600`;
          }
          
          // 重定向到登录页面
          console.log('用户未登录，重定向到:', redirectTo);
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('登录检查出错:', error);
        // 出错时默认认为未登录
        setIsLoggedIn(false);
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkLogin();
  }, [router, redirectTo]);
  
  // 如果不需要显示UI，只进行检查，直接返回子组件
  if (!showUI) {
    return <>{children}</>;
  }
  
  // 如果正在检查登录状态，显示加载中
  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">ShareMeet</h1>
          <p className="text-gray-600 mb-4">发现精彩活动，结识志同道合的朋友</p>
          <div className="animate-pulse">
            <p className="text-gray-500">检查登录状态中...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // 如果已登录，显示子组件
  if (isLoggedIn) {
    return <>{children}</>;
  }
  
  // 如果未登录且已经处理完检查，显示重定向中
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">ShareMeet</h1>
        <p className="text-gray-600 mb-4">发现精彩活动，结识志同道合的朋友</p>
        <div className="animate-pulse">
          <p className="text-gray-500">正在重定向到登录页面...</p>
        </div>
      </div>
    </div>
  );
} 