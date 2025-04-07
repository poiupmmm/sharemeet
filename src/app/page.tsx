'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkUserLoggedIn } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // 检查登录状态
    const checkLoginStatus = async () => {
      try {
        setIsChecking(true);
        console.log('检查用户登录状态...');
        
        const isLoggedIn = await checkUserLoggedIn();
        console.log('登录状态检查结果:', isLoggedIn);
        
        // 如果已登录，直接跳转到活动列表页面
        if (isLoggedIn) {
          console.log('用户已登录，跳转到活动列表页面');
          router.push('/activities');
        } else {
          // 如果未登录，跳转到登录页面
          console.log('用户未登录，跳转到登录页面');
          router.push('/auth');
        }
      } catch (error) {
        console.error('检查登录状态错误:', error);
        // 出错时默认跳转到登录页
        router.push('/auth');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkLoginStatus();
  }, [router]);

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