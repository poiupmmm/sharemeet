'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn, signUp, checkUserLoggedIn, setLoginState } from '@/lib/auth';
import styles from './auth.module.css'; // 引入CSS模块
import { createClient } from '@supabase/supabase-js'; // 直接在前端使用Supabase
import NetworkTest from './components/NetworkTest'; // 导入新的网络测试组件
import DirectConnect from './components/DirectConnect'; // 导入直连测试组件
import LoginHelper from './components/LoginHelper'; // 导入登录帮助组件
import { createBrowserSupabaseClient } from '@/lib/supabase'; // 引入浏览器专用的Supabase客户端
import { motion, AnimatePresence } from 'framer-motion'; // 引入动画库

// 微信图标
const WechatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.69,11.71a.96.96,0,1,1,.96-.96A.96.96,0,0,1,8.69,11.71Zm3.78-2.05a1.06,1.06,0,0,1,1.06,1.06,1.06,1.06,0,0,1-1.06,1.06,1.06,1.06,0,0,1-1.06-1.06A1.06,1.06,0,0,1,12.47,9.67ZM8.79,5.06a8.42,8.42,0,0,0-8.24,9.72,6.73,6.73,0,0,0,2.82,3.92l-.71,2.1,2.42-1.21a8.19,8.19,0,0,0,3.72,.85,7,7,0,0,0,1.08-.08,6.36,6.36,0,0,1-.38-1.94A6.77,6.77,0,0,1,15.42,12,7.68,7.68,0,0,0,8.79,5.06Zm7.15,9.62a5.54,5.54,0,0,1-5.41,5.41,5.29,5.29,0,0,1-3.1-.94l-.24-.16-2.53,1.33.72-2.12-.18-.28a5.43,5.43,0,0,1-1.1-3.22,5.54,5.54,0,0,1,5.41-5.41,5.54,5.54,0,0,1,6.42,5.39Zm2.48-3.93a1.06,1.06,0,0,1,1.06,1.06,1.06,1.06,0,0,1-1.06,1.06,1.06,1.06,0,0,1-1.06-1.06A1.06,1.06,0,0,1,18.42,10.75Zm3.73,0a1.06,1.06,0,0,1,1.06,1.06,1.06,1.06,0,0,1-1.06,1.06,1.06,1.06,0,0,1-1.06-1.06A1.06,1.06,0,0,1,22.15,10.75Zm1.29-5.1A6.81,6.81,0,0,0,15.42,12a6.12,6.12,0,0,0,.21,1.57,8.64,8.64,0,0,1-1.47.12,9.5,9.5,0,0,1-5.06-1.43l-.31-.19-3.15,1.57.9-2.58-.2-.3A9.3,9.3,0,0,1,4.45,5.83a9.15,9.15,0,0,1,9.49-8.3A9.19,9.19,0,0,1,23.44,5.65Z" />
  </svg>
);

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.setAttribute('data-auth-page', 'true');
    
    return () => {
      document.documentElement.removeAttribute('data-auth-page');
    };
  }, []);

  // 检查是否已经登录，如果已登录则重定向到活动列表页面
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
    const isUserLoggedIn = isLoggedInCookie?.includes('true') || false;
    
    if (isUserLoggedIn) {
      router.push('/activities');
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [useDirectLogin, setUseDirectLogin] = useState(true); // 默认使用直接登录
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 新增状态跟踪登录成功
  const [redirectTarget, setRedirectTarget] = useState(''); // 重定向目标
  
  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    try {
      console.log('开始登录流程...');
      
      // 直接使用fetch调用API进行调试，而不是通过auth库
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: 'login'
        }),
      });
      
      // 获取响应内容的调试信息
      const responseText = await response.text();
      let data;
      try {
        // 尝试解析JSON
        data = JSON.parse(responseText);
        console.log('登录API响应(JSON):', data);
      } catch (parseError) {
        // 如果解析失败，记录原始文本和错误
        console.error('解析API响应失败:', parseError);
        console.log('原始API响应内容:', responseText);
        setDebugInfo(`解析响应失败。原始响应：\n${responseText.substring(0, 500)}${responseText.length > 500 ? '...(截断)' : ''}`);
        throw new Error(`API返回了非JSON响应: ${responseText.substring(0, 100)}...`);
      }
      
      // 记录调试信息
      setDebugInfo(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries([...response.headers.entries()]),
        data
      }, null, 2));
      
      if (!response.ok) {
        throw new Error(data.error || '登录失败，请稍后重试');
      }
      
      // 4. 处理用户数据并保存
      const { password: _, ...userWithoutPassword } = data.user;
      
      // 保存用户数据到本地存储
      localStorage.setItem('userData', JSON.stringify(userWithoutPassword));
      
      // 设置登录状态cookie
      document.cookie = "isLoggedIn=true; path=/; max-age=86400";
      
      // 设置用户ID cookie，用于后续API调用
      document.cookie = `userId=${userWithoutPassword.id}; path=/; max-age=86400`;
      
      // 检查是否有重定向cookie
      const cookies = document.cookie.split(';');
      const redirectCookie = cookies.find(cookie => cookie.trim().startsWith('redirectAfterLogin='));
      let redirectPath = '/activities';
      
      if (redirectCookie) {
        const redirectValue = redirectCookie.split('=')[1];
        if (redirectValue) {
          try {
            // 解码可能被编码的URL
            redirectPath = decodeURIComponent(redirectValue);
            console.log('找到重定向路径:', redirectPath);
          } catch (decodeError) {
            console.error('解码重定向路径失败:', decodeError);
            redirectPath = redirectValue; // 回退到原始值
          }
          
          // 清除重定向cookie
          document.cookie = "redirectAfterLogin=; path=/; max-age=0";
        }
      }
      
      // 设置重定向目标显示文本
      if (redirectPath.includes('/activities/')) {
        setRedirectTarget('活动详情页');
      } else {
        setRedirectTarget('活动列表页');
      }
      
      // 标记登录成功，显示成功动画
      setIsLoggedIn(true);
      
      // 登录成功后延迟跳转，给动画时间
      console.log('登录成功，即将重定向到:', redirectPath);
      setTimeout(() => {
        router.push(redirectPath);
      }, 1500); // 延迟1.5秒再跳转
    } catch (err: any) {
      console.error('登录错误:', err);
      setError(err.message || '登录失败，请稍后重试');
      setShowDebug(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRegisterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('开始注册流程...');
      
      // 直接使用fetch调用API进行调试，而不是通过auth库
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          username,
          action: 'register'
        }),
      });
      
      // 获取响应内容的调试信息
      const responseText = await response.text();
      let data;
      try {
        // 尝试解析JSON
        data = JSON.parse(responseText);
        console.log('注册API响应(JSON):', data);
      } catch (parseError) {
        // 如果解析失败，记录原始文本和错误
        console.error('解析API响应失败:', parseError);
        console.log('原始API响应内容:', responseText);
        setDebugInfo(`解析响应失败。原始响应：\n${responseText.substring(0, 500)}${responseText.length > 500 ? '...(截断)' : ''}`);
        throw new Error(`API返回了非JSON响应: ${responseText.substring(0, 100)}...`);
      }
      
      // 记录调试信息
      setDebugInfo(JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        headers: Object.fromEntries([...response.headers.entries()]),
        data
      }, null, 2));
      
      if (!response.ok) {
        throw new Error(data.error || '注册失败，请稍后重试');
      }
      
      // 保存用户数据到本地存储
      if (data.user) {
        // 注册成功后，清空表单并切换到登录选项卡
        setEmail(''); // 保留邮箱方便用户登录
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        
        // 显示成功消息，可以根据需要调整或移除
        alert('注册成功！请使用您的账号登录系统。');
        
        // 切换到登录选项卡
        switchTab('login');
      } else {
        throw new Error('注册成功但未返回用户数据');
      }
    } catch (err: any) {
      console.error('注册错误:', err);
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setError('');
  };

  // 客户端直接登录处理函数
  const handleDirectLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    try {
      console.log('开始客户端直接登录流程...');
      
      // 创建浏览器Supabase客户端
      const browserClient = createBrowserSupabaseClient();
      
      // 1. 检查用户是否存在 - 使用ilike确保不区分大小写
      const { data: userExists, error: userExistsError } = await browserClient
        .from('users')
        .select('email, id')
        .ilike('email', email)
        .maybeSingle();
      
      console.log('用户查询结果:', { userExists, hasError: !!userExistsError });
      
      if (userExistsError) {
        console.error('检查用户存在错误:', userExistsError);
        throw new Error(userExistsError.message || '数据库查询错误');
      }
      
      if (!userExists) {
        return setError('邮箱不存在，请先注册');
      }
      
      // 2. 验证密码 - 在客户端进行加密
      const hashedPassword = await hashPasswordInBrowser(password);
      
      console.log(`正在验证用户密码(ID: ${userExists.id})...`);
      
      const { data: userData, error: loginError } = await browserClient
        .from('users')
        .select('*')
        .eq('id', userExists.id)
        .eq('password', hashedPassword)
        .maybeSingle();
      
      if (loginError) {
        console.error('登录错误:', loginError);
        throw new Error(loginError.message || '登录验证失败');
      }
      
      if (!userData) {
        console.log('密码验证失败:', { email: userExists.email });
        return setError('邮箱或密码错误');
      }
      
      console.log(`用户登录成功: ${userData.email} (ID: ${userData.id})`);
      
      // 3. 更新最后登录时间
      const updateResult = await browserClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);
        
      if (updateResult.error) {
        console.warn('更新最后登录时间失败:', updateResult.error);
        // 继续流程，这不是关键错误
      }
      
      // 4. 使用新的setLoginState函数设置登录状态
      const loginResult = await setLoginState(userData, 1); // 设置登录状态保持1天
      
      if (!loginResult) {
        console.error('设置登录状态失败');
        throw new Error('设置登录状态失败，请重试');
      }
      
      console.log('登录状态已成功设置');
      
      // 检查是否有重定向cookie
      const cookies = document.cookie.split(';');
      const redirectCookie = cookies.find(cookie => cookie.trim().startsWith('redirectAfterLogin='));
      let redirectPath = '/activities';
      
      if (redirectCookie) {
        const redirectValue = redirectCookie.split('=')[1];
        if (redirectValue) {
          try {
            // 解码可能被编码的URL
            redirectPath = decodeURIComponent(redirectValue);
            console.log('找到重定向路径:', redirectPath);
          } catch (decodeError) {
            console.error('解码重定向路径失败:', decodeError);
            redirectPath = redirectValue; // 回退到原始值
          }
          
          // 清除重定向cookie
          document.cookie = "redirectAfterLogin=; path=/; max-age=0";
        }
      }
      
      // 设置重定向目标显示文本
      if (redirectPath.includes('/activities/')) {
        setRedirectTarget('活动详情页');
      } else {
        setRedirectTarget('活动列表页');
      }
      
      // 标记登录成功，显示成功动画
      setIsLoggedIn(true);
      
      // 登录成功后延迟跳转，给动画时间
      console.log('登录成功，即将重定向到:', redirectPath);
      setTimeout(() => {
        router.push(redirectPath);
      }, 1500); // 延迟1.5秒再跳转
    } catch (err: any) {
      console.error('客户端直接登录错误:', err);
      setError(err.message || '登录失败，请稍后重试');
      setShowDebug(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 客户端注册处理函数
  const handleDirectRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('开始客户端直接注册流程...');
      
      // 创建浏览器Supabase客户端
      const browserClient = createBrowserSupabaseClient();
      
      // 1. 检查邮箱是否已存在
      const { data: existingUser, error: emailCheckError } = await browserClient
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (emailCheckError) {
        console.error('检查邮箱错误:', emailCheckError);
        // 如果是表不存在错误，我们可以继续注册
        if (!emailCheckError.message?.includes('does not exist')) {
          throw new Error(emailCheckError.message || '数据库查询错误');
        }
      }
      
      if (existingUser) {
        return setError('邮箱已被注册');
      }
      
      // 2. 检查用户名是否已存在
      const { data: existingUsername, error: usernameCheckError } = await browserClient
        .from('users')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (usernameCheckError) {
        console.error('检查用户名错误:', usernameCheckError);
        // 如果是表不存在错误，我们可以继续注册
        if (!usernameCheckError.message?.includes('does not exist')) {
          throw new Error(usernameCheckError.message || '数据库查询错误');
        }
      }
      
      if (existingUsername) {
        return setError('用户名已被使用');
      }
      
      // 3. 生成密码哈希
      const hashedPassword = await hashPasswordInBrowser(password);
      
      // 4. 创建新用户
      const { data: newUser, error: createError } = await browserClient
        .from('users')
        .insert([
          {
            email,
            username,
            password: hashedPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('创建用户错误:', createError);
        throw new Error(createError.message || '创建用户失败');
      }
      
      if (!newUser) {
        throw new Error('未能获取新用户数据');
      }
      
      console.log('用户注册成功:', { email: newUser.email, username: newUser.username });
      
      // 5. 使用新的setLoginState函数设置登录状态
      const loginResult = await setLoginState(newUser, 1); // 设置登录状态保持1天
      
      if (!loginResult) {
        console.error('设置登录状态失败');
        throw new Error('注册成功但设置登录状态失败，请尝试登录');
      }
      
      console.log('登录状态已成功设置');
      
      // 6. 创建用户资料
      const { error: profileError } = await browserClient
        .from('profiles')
        .insert([
          {
            user_id: newUser.id,
            username: newUser.username,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      
      if (profileError) {
        console.warn('创建用户资料错误:', profileError);
        // 不阻止注册流程继续，这是非关键错误
      }
      
      // 7. 标记注册成功，准备跳转
      setIsLoggedIn(true);
      setRedirectTarget('个人中心');
      
      // 注册成功后延迟跳转到主页
      setTimeout(() => {
        router.push('/activities');
      }, 1500);
      
    } catch (err: any) {
      console.error('注册错误:', err);
      setError(err.message || '注册失败，请稍后重试');
      setShowDebug(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 浏览器环境中的密码哈希函数
  const hashPasswordInBrowser = async (password: string): Promise<string> => {
    // 使用Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // 样式定义
  const containerStyle = {
    display: 'flex',
    minHeight: '100vh'
  };
  
  const leftPanelStyle = {
    flex: '1',
    background: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1169&q=80")',
    backgroundSize: 'cover',
    color: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end'
  };
  
  const brandContentStyle = {
    maxWidth: '500px',
    marginBottom: '2rem'
  };
  
  const rightPanelStyle = {
    width: '450px',
    backgroundColor: 'white',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    boxShadow: '-5px 0 25px rgba(0, 0, 0, 0.05)'
  };
  
  const formHeaderStyle = {
    textAlign: 'center' as const,
    marginBottom: '2rem'
  };
  
  const tabsStyle = {
    display: 'flex',
    marginBottom: '1.5rem',
    borderBottom: '1px solid #eee'
  };
  
  const tabStyle = (isActive: boolean) => ({
    flex: '1',
    padding: '0.75rem',
    textAlign: 'center' as const,
    fontWeight: '500',
    color: isActive ? '#2563eb' : '#777',
    borderBottom: isActive ? '2px solid #2563eb' : 'none',
    cursor: 'pointer'
  });
  
  const formGroupStyle = {
    marginBottom: '1.25rem'
  };
  
  const labelStyle = {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    color: '#555'
  };
  
  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '1rem'
  };
  
  const buttonStyle = {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.75rem',
    fontSize: '1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: '500'
  };
  
  const loadingButtonStyle = {
    ...buttonStyle,
    opacity: 0.7,
    cursor: 'not-allowed'
  };
  
  const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '1.5rem 0',
    color: '#666'
  };
  
  const socialLoginStyle = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1.5rem'
  };
  
  const socialBtnStyle = {
    width: '48%',
    padding: '0.75rem',
    border: '1px solid #eee',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem'
  };
  
  const termsStyle = {
    textAlign: 'center' as const,
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '1.5rem'
  };
  
  // 媒体查询
  const mediaQueryStyle = `
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }
      .left-panel {
        display: none;
      }
      .right-panel {
        width: 100%;
        min-height: 100vh;
      }
    }
  `;

  // 登录成功动画组件
  const SuccessAnimation = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}
      >
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </motion.div>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '16px'
          }}
        >
          登录成功
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            fontSize: '14px',
            color: '#666'
          }}
        >
          正在跳转到{redirectTarget || '活动页面'}...
        </motion.p>
      </motion.div>
    );
  };

  // 检查数据库连接函数 - 直接在前端测试
  const directCheckDatabase = async () => {
    setIsCheckingDb(true);
    setDebugInfo(null);
    
    try {
      console.log('开始直接测试Supabase连接...');
      
      // 收集基本环境信息
      const envInfo: any = {
        timestamp: new Date().toISOString(),
        browser: typeof window !== 'undefined' ? navigator.userAgent : 'non-browser',
        online: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        connectionAttempts: 0
      };
      
      // 创建一个临时的Supabase客户端，用于测试
      const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';
      
      // 最简单的客户端配置
      const testClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: (...args) => {
            envInfo.connectionAttempts++;
            return fetch(...args);
          }
        }
      });
      
      // 先尝试获取数据库版本
      try {
        console.log('尝试查询数据库版本...');
        envInfo.versionAttempt = true;
        
        const versionResult = await testClient.rpc('version', {});
        if (versionResult.error) {
          envInfo.versionError = versionResult.error;
        } else {
          envInfo.version = versionResult.data;
          envInfo.versionSuccess = true;
        }
      } catch (versionError) {
        envInfo.versionError = String(versionError);
      }
      
      try {
        // 尝试一个简单的查询，只验证连接
        console.log('尝试查询不存在的表来验证连接...');
        envInfo.queryAttempt = true;
        
        const { data, error } = await testClient.from('_dummy_nonexistent_table')
          .select('*')
          .limit(1);
            
        if (error) {
          // 如果是表不存在错误，这表示连接成功但表不存在
          if (error.message?.includes('does not exist') || error.code === '42P01') {
            console.log('数据库连接成功，表不存在，这是正常的');
            envInfo.queryResult = 'table_not_exists';
            
            setDbStatus({ 
              success: true, 
              error: null,
              message: '数据库连接成功（表不存在）',
              directTest: true
            });
              
            setDebugInfo(JSON.stringify({
              message: '数据库连接测试成功',
              details: '表不存在错误表明Supabase连接正常，只是没有这个表',
              error,
              environmentInfo: envInfo
            }, null, 2));
          } else {
            console.error('数据库连接错误:', error);
            envInfo.queryError = error;
            
            setDbStatus({ 
              success: false, 
              error: error.message,
              directTest: true
            });
              
            setDebugInfo(JSON.stringify({
              error: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              environmentInfo: envInfo,
              directTest: true
            }, null, 2));
          }
        } else {
          console.log('数据库连接成功，查询结果:', data);
          envInfo.queryResult = data;
          
          setDbStatus({
            success: true,
            message: '数据库连接成功',
            directTest: true
          });
            
          setDebugInfo(JSON.stringify({
            message: '数据库连接测试成功',
            data,
            environmentInfo: envInfo,
            directTest: true
          }, null, 2));
        }
      } catch (queryError) {
        // 特殊处理查询错误
        const errorMessage = String(queryError);
        envInfo.queryErrorCaught = errorMessage;
        
        if (errorMessage.includes('does not exist')) {
          // 如果是表不存在错误，这实际上意味着连接成功了
          console.log('通过错误信息检测到：数据库连接成功，表不存在');
          envInfo.queryResult = 'exception_table_not_exists';
          
          setDbStatus({ 
            success: true, 
            error: null,
            message: '数据库连接成功（表不存在）',
            directTest: true
          });
            
          setDebugInfo(JSON.stringify({
            message: '数据库连接测试成功',
            details: '通过错误信息判断连接正常，只是表不存在',
            errorMessage,
            environmentInfo: envInfo
          }, null, 2));
        } else {
          envInfo.otherQueryError = true;
          throw queryError; // 重新抛出以便被外层catch捕获
        }
      }
        
      setShowDebug(true);
    } catch (error) {
      console.error('直接数据库连接测试错误:', error);
      
      // 收集错误详情
      const errorDetails = {
        type: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      };
      
      // 处理网络错误
      let networkError = false;
      if (
        errorDetails.message.includes('Failed to fetch') || 
        errorDetails.message.includes('Network Error') ||
        errorDetails.message.includes('AbortError')
      ) {
        networkError = true;
      }
      
      setDbStatus({ 
        success: false, 
        error: errorDetails.message,
        networkError,
        directTest: true
      });
        
      setDebugInfo(JSON.stringify({ 
        ...errorDetails,
        networkError,
        directTest: true
      }, null, 2));
        
      setShowDebug(true);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 添加一个检查API路径函数
  const checkApiPath = async () => {
    setIsLoading(true);
    setError('');
    setDebugInfo(null);
    
    try {
      // 检查API是否可访问 - 使用HEAD请求
      const checkResponse = await fetch('/api/auth', { method: 'HEAD' })
        .catch(err => {
          throw new Error(`无法连接到API: ${err.message}`);
        });
      
      // 准备调试信息
      const debugData = {
        apiPath: '/api/auth',
        status: checkResponse.status,
        statusText: checkResponse.statusText,
        headers: Object.fromEntries([...checkResponse.headers.entries()]),
        ok: checkResponse.ok
      };
      
      console.log('API路径检查结果:', debugData);
      setDebugInfo(JSON.stringify(debugData, null, 2));
      
      if (!checkResponse.ok) {
        setError(`API路径检查失败: ${checkResponse.status} ${checkResponse.statusText}`);
      } else {
        setError('API路径检查成功');
      }
    } catch (err) {
      console.error('API路径检查错误:', err);
      setError(`API路径检查错误: ${err instanceof Error ? err.message : String(err)}`);
      setDebugInfo(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // 在return之前添加调试控制
  const toggleDebug = () => setShowDebug(prev => !prev);

  // 在return之前添加更多样式定义
  const debugInfoStyle = {
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '0.9rem'
  };
  
  const debugButtonStyle = {
    marginLeft: '8px',
    padding: '2px 8px',
    fontSize: '0.8rem',
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '3px',
    cursor: 'pointer'
  };

  // 检查数据库状态显示格式
  const getDbStatusMessage = (status: any) => {
    if (!status) return '未知';
    
    if (status.success) {
      if (status.connection?.tablesExist === false || 
          status.connection?.emptyDbTreatedAsSuccess) {
        return '连接正常（数据库为空）';
      }
      return '连接正常';
    }
    
    // 获取更详细的错误信息
    let errorDetails = '';
    if (status.error) {
      errorDetails = `(${status.error})`;
    } else if (status.connection?.error) {
      errorDetails = `(${status.connection.error})`;
    } else if (status.message) {
      errorDetails = `(${status.message})`;
    }
    
    return `连接异常 ${errorDetails}`;
  };

  // 添加一个最简单的网络连接测试函数
  const testBasicConnection = async () => {
    setIsCheckingDb(true);
    setDebugInfo(null);
    
    try {
      // 测试与Supabase服务器的基本网络连接
      console.log('测试基本网络连接...');
      
      const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
      
      // 简单的网络请求，不使用Supabase客户端
      const response = await fetch(supabaseUrl, { 
        method: 'HEAD',
        cache: 'no-store',
        // 忽略SSL错误
        // @ts-ignore
        mode: 'no-cors'
      });
      
      console.log('网络连接测试结果:', {
        status: response.status, 
        statusText: response.statusText,
        type: response.type,
        url: response.url
      });
      
      const isSuccess = response.type === 'opaque' || response.ok;
      
      setDbStatus({
        success: isSuccess,
        message: isSuccess ? '基本网络连接正常' : '网络连接失败',
        networkTest: true
      });
      
      setDebugInfo(JSON.stringify({
        message: isSuccess ? '基本网络连接测试成功' : '基本网络连接测试失败',
        response: {
          status: response.status,
          statusText: response.statusText,
          type: response.type, // opaque为no-cors模式的正常响应
          url: response.url
        }
      }, null, 2));
      
      setShowDebug(true);
    } catch (error) {
      console.error('网络连接测试错误:', error);
      
      setDbStatus({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        networkTest: true
      });
      
      setDebugInfo(JSON.stringify({ 
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        networkTest: true
      }, null, 2));
      
      setShowDebug(true);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 添加系统表测试函数
  const testSystemTable = async () => {
    setIsCheckingDb(true);
    setDebugInfo(null);
    
    try {
      console.log('开始测试系统表...');
      
      // 创建一个临时的Supabase客户端
      const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';
      
      // 创建客户端
      const testClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: (...args) => {
            return fetch(...args);
          }
        }
      });
      
      // 尝试查询pg_catalog.pg_tables系统表
      // 注意：这需要足够的权限，普通匿名用户可能无法访问
      // 这里只是作为一个测试示例
      const { data, error } = await testClient.rpc('check_pg_tables');
      
      if (error) {
        console.error('系统表查询错误:', error);
        
        if (error.message?.includes('permission denied') || 
            error.message?.includes('insufficient privilege')) {
          // 权限错误也表明数据库连接是正常的
          setDbStatus({ 
            success: true, 
            error: null,
            message: '数据库连接成功（权限受限）',
            systemTest: true
          });
          
          setDebugInfo(JSON.stringify({
            message: '数据库连接测试成功，但无权查询系统表',
            error
          }, null, 2));
        } else {
          setDbStatus({ 
            success: false, 
            error: error.message,
            systemTest: true
          });
          
          setDebugInfo(JSON.stringify({
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            systemTest: true
          }, null, 2));
        }
      } else {
        console.log('系统表查询成功:', data);
        setDbStatus({
          success: true,
          message: '数据库连接成功（可查询系统表）',
          systemTest: true
        });
        
        setDebugInfo(JSON.stringify({
          message: '系统表查询测试成功',
          data,
          systemTest: true
        }, null, 2));
      }
      
      setShowDebug(true);
    } catch (error) {
      console.error('系统表测试错误:', error);
      
      setDbStatus({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        systemTest: true
      });
      
      setDebugInfo(JSON.stringify({ 
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        systemTest: true
      }, null, 2));
      
      setShowDebug(true);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 简单健康检查函数
  const simpleHealthCheck = async () => {
    setIsCheckingDb(true);
    setDebugInfo(null);
    
    try {
      console.log('执行简单健康检查...');
      
      // 创建一个临时的Supabase客户端
      const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';
      
      // 先获取基本的连接信息
      const connectionInfo: any = {
        timestamp: new Date().toISOString(),
        supabaseUrl,
        environment: process.env.NODE_ENV || 'unknown',
        runtime: typeof window !== 'undefined' ? 'browser' : 'node',
        connectionAttempts: 0
      };
      
      // 添加到调试信息
      setDebugInfo(JSON.stringify({
        message: '开始健康检查',
        connectionInfo
      }, null, 2));
      
      // 创建客户端
      const testClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          fetch: (...args) => {
            connectionInfo.connectionAttempts++;
            return fetch(...args);
          }
        }
      });
      
      // 先尝试最简单的健康检查 - 版本查询
      try {
        connectionInfo.connectionAttempts++;
        const versionResult = await testClient.rpc('version', {}).maybeSingle();
        
        if (versionResult.error) {
          connectionInfo.versionError = versionResult.error;
        } else {
          connectionInfo.version = versionResult.data;
        }
      } catch (versionError) {
        connectionInfo.versionQueryError = String(versionError);
      }
      
      // 1. 尝试查询用户表的数量
      const { count, error: countError } = await testClient
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        // 如果错误是因为表不存在，我们需要确认是否可以连接到其他表
        if (countError.message?.includes('does not exist') || countError.code === '42P01') {
          // 尝试查询另一个肯定存在的表：profiles
          const { count: profileCount, error: profileError } = await testClient
            .from('profiles')
            .select('*', { count: 'exact', head: true });
            
          if (profileError) {
            if (profileError.message?.includes('does not exist')) {
              // 尝试查询另一个表：activities
              const { count: activityCount, error: activityError } = await testClient
                .from('activities')
                .select('*', { count: 'exact', head: true });
                
              if (activityError) {
                if (activityError.message?.includes('does not exist')) {
                  // 所有表都不存在，可能是新数据库
                  setDbStatus({ 
                    success: true, 
                    error: null,
                    message: '数据库连接成功（数据库为空）',
                    healthCheck: true,
                    tables: { users: false, profiles: false, activities: false }
                  });
                  
                  setDebugInfo(JSON.stringify({
                    message: '数据库连接测试成功，但数据库似乎是空的',
                    connectionInfo,
                    errors: { users: countError, profiles: profileError, activities: activityError }
                  }, null, 2));
                } else {
                  // 其他错误
                  throw activityError;
                }
              } else {
                // activities表存在
                setDbStatus({ 
                  success: true, 
                  error: null,
                  message: '数据库连接成功（只有activities表）',
                  healthCheck: true,
                  tables: { users: false, profiles: false, activities: true, activityCount }
                });
                
                setDebugInfo(JSON.stringify({
                  message: '数据库连接测试成功，只发现activities表',
                  connectionInfo,
                  activities: { count: activityCount },
                  errors: { users: countError, profiles: profileError }
                }, null, 2));
              }
            } else {
              // 其他错误
              throw profileError;
            }
          } else {
            // profiles表存在
            setDbStatus({ 
              success: true, 
              error: null,
              message: '数据库连接成功（只有profiles表）',
              healthCheck: true,
              tables: { users: false, profiles: true, profileCount }
            });
            
            setDebugInfo(JSON.stringify({
              message: '数据库连接测试成功，只发现profiles表',
              connectionInfo,
              profiles: { count: profileCount },
              errors: { users: countError }
            }, null, 2));
          }
        } else {
          // 其他错误类型
          throw countError;
        }
      } else {
        // users表存在
        setDbStatus({ 
          success: true, 
          error: null,
          message: `数据库连接成功（用户: ${count || 0}）`,
          healthCheck: true,
          tables: { users: true, count }
        });
        
        setDebugInfo(JSON.stringify({
          message: '数据库连接测试成功',
          connectionInfo,
          users: { count }
        }, null, 2));
      }
      
      setShowDebug(true);
    } catch (error) {
      console.error('健康检查错误:', error);
      
      // 获取网络信息
      let networkInfo = {};
      try {
        networkInfo = {
          online: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
          connectionType: typeof navigator !== 'undefined' && 'connection' in navigator 
            ? (navigator as any).connection?.type 
            : 'unknown'
        };
      } catch (e) {
        // 忽略获取网络信息的错误
      }
      
      setDbStatus({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        healthCheck: true
      });
      
      setDebugInfo(JSON.stringify({ 
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        networkInfo,
        healthCheck: true
      }, null, 2));
      
      setShowDebug(true);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 添加直接执行SQL查询函数
  const execDirectSQL = async () => {
    setIsCheckingDb(true);
    setDebugInfo(null);
    
    try {
      console.log('开始执行直接SQL查询...');
      
      // 创建一个临时的Supabase客户端
      const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';
      
      // 最简单的客户端配置
      const testClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      console.log('尝试直接查询表...');
      
      // 方法1: 尝试直接SQL查询，绕过RPC
      try {
        const { data: rawData, error: rawError } = await testClient
          .from('_health')
          .select('*')
          .limit(1);
        
        if (rawError) {
          console.error('_health表查询错误:', rawError);
          
          // 即使表不存在，也可能表示连接成功了
          if (rawError.message?.includes('does not exist') || rawError.code === '42P01') {
            console.log('_health表不存在，但数据库连接可能正常');
            
            // 尝试查询users表
            try {
              const { data: usersData, error: usersError } = await testClient
                .from('users')
                .select('count()')
                .limit(1);
              
              if (usersError) {
                if (usersError.message?.includes('does not exist') || usersError.code === '42P01') {
                  console.log('users表不存在，但数据库连接可能正常');
                  
                  // 尝试查询auth.users表
                  const { data: authUsersData, error: authUsersError } = await testClient
                    .from('auth.users')
                    .select('count()')
                    .limit(1);
                  
                  if (authUsersError) {
                    if (authUsersError.message?.includes('permission denied') || 
                        authUsersError.code === '42501') {
                      console.log('无权限访问auth.users表，但数据库连接正常');
                      
                      setDbStatus({ 
                        success: true, 
                        error: null,
                        message: '数据库连接成功（无表权限）',
                        directSql: true
                      });
                      
                      setDebugInfo(JSON.stringify({
                        message: '数据库连接测试成功',
                        details: '无访问权限错误表明数据库连接正常，只是权限受限',
                        usersError,
                        authUsersError,
                        directSql: true
                      }, null, 2));
                    } else {
                      throw authUsersError;
                    }
                  } else {
                    setDbStatus({ 
                      success: true, 
                      error: null,
                      message: '数据库连接成功（验证auth.users表）',
                      directSql: true
                    });
                    
                    setDebugInfo(JSON.stringify({
                      message: '数据库表查询成功',
                      table: 'auth.users',
                      data: authUsersData,
                      directSql: true
                    }, null, 2));
                  }
                } else {
                  throw usersError;
                }
              } else {
                setDbStatus({ 
                  success: true, 
                  error: null,
                  message: '数据库连接成功（验证users表）',
                  directSql: true
                });
                
                setDebugInfo(JSON.stringify({
                  message: '数据库表查询成功',
                  table: 'users',
                  data: usersData,
                  directSql: true
                }, null, 2));
              }
            } catch (tableError) {
              console.error('表查询错误:', tableError);
              throw tableError;
            }
          } else {
            throw rawError;
          }
        } else {
          setDbStatus({ 
            success: true, 
            error: null,
            message: '数据库连接成功（验证_health表）',
            directSql: true
          });
          
          setDebugInfo(JSON.stringify({
            message: '数据库表查询成功',
            table: '_health',
            data: rawData,
            directSql: true
          }, null, 2));
        }
      } catch (sqlError) {
        console.error('SQL查询错误:', sqlError);
        
        // 尝试方法2: 使用Supabase内部函数检查连接
        console.log('尝试使用其他方法检查数据库连接...');
        
        // 尝试获取用户数据而不是调用函数
        try {
          const { data: authData, error: authError } = await testClient.auth.getSession();
          
          if (authError) {
            throw authError;
          } else {
            console.log('通过auth API获取会话成功，数据库应该在线');
            
            setDbStatus({ 
              success: true, 
              error: null,
              message: '数据库连接成功（验证auth API）',
              directSql: true
            });
            
            setDebugInfo(JSON.stringify({
              message: '通过auth API检测到数据库连接',
              session: authData,
              originalError: sqlError,
              directSql: true
            }, null, 2));
          }
        } catch (finalError) {
          throw {
            message: '所有数据库连接测试方法都失败',
            originalError: sqlError,
            authError: finalError
          };
        }
      }
      
      setShowDebug(true);
    } catch (error) {
      console.error('直接SQL查询错误:', error);
      
      // 改进错误处理：确保错误对象被正确解析
      let errorMessage = '未知错误';
      let errorDetails: Record<string, any> = {};
      
      if (error === null || error === undefined) {
        errorMessage = '空错误对象';
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object') {
        // 尝试提取常见的错误属性
        const errorObj = error as Record<string, any>;
        if ('message' in errorObj && errorObj.message) {
          errorMessage = String(errorObj.message);
        } else if ('error' in errorObj && errorObj.error) {
          errorMessage = typeof errorObj.error === 'string' ? errorObj.error : JSON.stringify(errorObj.error);
        } else {
          errorMessage = JSON.stringify(error);
        }
        
        // 保存完整的错误对象以便调试
        errorDetails = { ...errorObj };
      }
      
      setDbStatus({ 
        success: false, 
        error: errorMessage,
        directSql: true
      });
      
      setDebugInfo(JSON.stringify({ 
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        message: errorMessage,
        details: errorDetails,
        directSql: true
      }, null, 2));
      
      setShowDebug(true);
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 添加重置所有测试状态的函数
  const resetAllTests = () => {
    // 重置状态
    setDbStatus(null);
    setDebugInfo(null);
    setShowDebug(false);
    setIsCheckingDb(false);
    
    console.log('已重置所有测试状态');
  };

  return (
    <>
      <style>{mediaQueryStyle}</style>
      <div className="container" style={containerStyle}>
        {/* 登录成功动画 */}
        <AnimatePresence>
          {isLoggedIn && <SuccessAnimation />}
        </AnimatePresence>
        
        {/* 左侧品牌展示区 */}
        <div className="left-panel" style={leftPanelStyle}>
          <div style={brandContentStyle}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>ShareMeet</h1>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              发现身边的精彩活动，认识志同道合的朋友。无论是户外运动、文化沙龙还是专业交流，在这里找到属于你的社交圈。
            </p>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>"通过ShareMeet，我参加了城市徒步活动，认识了一群热爱户外的朋友！"</p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>李明 - 上海</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右侧表单区域 */}
        <div className="right-panel" style={rightPanelStyle}>
          <div style={formHeaderStyle}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>欢迎来到ShareMeet</h2>
            <p>加入我们，探索更多精彩活动</p>
          </div>
          
          <div style={tabsStyle}>
            <div 
              style={tabStyle(activeTab === 'login')} 
              onClick={() => switchTab('login')}
            >
              登录
            </div>
            <div 
              style={tabStyle(activeTab === 'register')} 
              onClick={() => switchTab('register')}
            >
              注册
            </div>
          </div>
          
          {error && (
            <div style={{ 
              color: '#b91c1c', 
              backgroundColor: '#fee2e2', 
              padding: '0.75rem', 
              borderRadius: '4px', 
              marginBottom: '1rem', 
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          
          {/* 登录表单 */}
          {activeTab === 'login' && (
            <form onSubmit={useDirectLogin ? handleDirectLogin : handleLoginSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ 
                  fontSize: '0.8rem', 
                  backgroundColor: '#f0f9ff', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input 
                    type="checkbox" 
                    checked={useDirectLogin} 
                    onChange={() => setUseDirectLogin(!useDirectLogin)} 
                    style={{ marginRight: '5px' }}
                  />
                  使用客户端直接登录 (推荐)
                </label>
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>邮箱</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>密码</label>
                <input
                  type="password"
                  style={inputStyle}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                style={isLoading ? loadingButtonStyle : buttonStyle}
                disabled={isLoading}
              >
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>
          )}
          
          {/* 注册表单 */}
          {activeTab === 'register' && (
            <form onSubmit={useDirectLogin ? handleDirectRegister : handleRegisterSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ 
                  fontSize: '0.8rem', 
                  backgroundColor: '#f0f9ff', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input 
                    type="checkbox" 
                    checked={useDirectLogin} 
                    onChange={() => setUseDirectLogin(!useDirectLogin)} 
                    style={{ marginRight: '5px' }}
                  />
                  使用客户端直接注册 (推荐)
                </label>
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>邮箱</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>用户名</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>设置密码</label>
                <input
                  type="password"
                  style={inputStyle}
                  placeholder="请设置密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <div style={formGroupStyle}>
                <label style={labelStyle}>确认密码</label>
                <input
                  type="password"
                  style={inputStyle}
                  placeholder="请确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              
              <button 
                type="submit" 
                style={isLoading ? loadingButtonStyle : buttonStyle}
                disabled={isLoading}
              >
                {isLoading ? '注册中...' : '注册'}
              </button>
              
              <div style={termsStyle}>
                注册即表示同意 <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>服务条款</a> 和 <a href="#" style={{ color: '#2563eb', textDecoration: 'none' }}>隐私政策</a>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
} 