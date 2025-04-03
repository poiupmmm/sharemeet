'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from './Header';

export default function ClientHeader() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // 用于调试的日志
    console.log('ClientHeader渲染，路径:', pathname);
    console.log('window路径:', window.location.pathname);
  }, [pathname]);
  
  // 防止服务器/客户端不匹配
  if (!mounted) {
    return null;
  }
  
  // 检查是否在auth页面 - 使用多种方法确保可靠检测
  const windowPath = window.location.pathname;
  const isAuthPage = 
    windowPath === '/auth' || 
    windowPath.startsWith('/auth/') || 
    windowPath.includes('/login') || 
    windowPath.includes('/signin') || 
    windowPath.includes('/register') ||
    pathname === '/auth' || 
    pathname?.startsWith('/auth/');
  
  // 如果在auth页面，不显示header
  if (isAuthPage) {
    console.log('检测到auth页面，不显示header');
    return null;
  }
  
  console.log('显示header');
  return <Header />;
} 