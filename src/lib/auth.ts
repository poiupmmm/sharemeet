import { supabase } from './supabase';
import { createHash } from 'crypto';

// 用户接口定义
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: Date;
  last_login?: Date;
  role?: string;
  bio?: string;
  hobbies?: string[];
  created_activities_count?: number;
  avatar_url?: string;
  avatar_url_small?: string;
  background_image_url?: string;
  location?: string;
  birthday?: string;
  full_name?: string;
}

// 简单的密码加密函数
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

// 注册
export async function signUp(email: string, password: string, username: string) {
  try {
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

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '注册失败，请稍后重试');
    }
    
    return data.user;
  } catch (error: any) {
    console.error('注册过程发生错误:', error);
    throw error;
  }
}

// 登录
export async function signIn(email: string, password: string) {
  try {
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

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '登录失败，请稍后重试');
    }
    
    return data.user;
  } catch (error: any) {
    console.error('登录过程发生错误:', error);
    throw error;
  }
}

// 根据cookie检查用户是否已登录
export async function checkUserLoggedIn() {
  try {
    // 从cookie获取登录状态
    const cookies = document.cookie.split(';');
    const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
    return isLoggedInCookie?.includes('true') || false;
  } catch (error) {
    console.error('检查登录状态错误:', error);
    return false;
  }
}

// 注销
export async function signOut() {
  try {
    // 清除登录状态cookie
    document.cookie = "isLoggedIn=false; path=/; max-age=0";
    return true;
  } catch (error) {
    console.error('注销错误:', error);
    return false;
  }
}

// 获取当前登录用户信息
export async function getCurrentUser() {
  try {
    const isLoggedIn = await checkUserLoggedIn();
    if (!isLoggedIn) {
      return null;
    }
    
    // 从本地存储中获取用户信息
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      return null;
    }
    
    return JSON.parse(userDataStr);
  } catch (error) {
    console.error('获取当前用户信息错误:', error);
    return null;
  }
}

// 更新用户资料
export async function updateUserProfile(userId: string, profileData: any) {
  try {
    console.log(`开始调用API更新用户资料 - 用户ID: ${userId}`);
    console.log('发送数据:', JSON.stringify(profileData, null, 2));
    
    // 验证用户名不为空
    if (!profileData.username) {
      console.error('更新用户资料失败: 用户名为空');
      throw new Error('用户名不能为空');
    }
    
    // 确保数据符合数据库结构
    const preparedData = {
      username: profileData.username, // 用户名是主要识别字段
      full_name: profileData.full_name || profileData.fullName || null,
      bio: profileData.bio || null,
      location: profileData.location || null,
      birthday: profileData.birthday || null,
      hobbies: profileData.hobbies || [],
      avatar_url: profileData.avatar_url || null
    };
    
    console.log('发送最终处理的数据:', JSON.stringify(preparedData, null, 2));
    
    const response = await fetch(`/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preparedData),
    });

    console.log(`API响应状态: ${response.status} ${response.statusText}`);
    const data = await response.json();
    console.log('API响应数据:', data);
    
    if (!response.ok) {
      console.error('API返回错误状态码:', response.status, data);
      if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('更新资料失败，请稍后重试');
      }
    }
    
    // 允许在警告情况下继续处理，只要有profile字段
    if (data.warning) {
      console.warn('API响应警告:', data.warning);
    }
    
    if (!data.profile) {
      console.error('API响应缺少profile字段:', data);
      
      // 使用发送的数据作为备用方案
      console.log('使用发送的数据作为备用方案');
      return {
        ...preparedData,
        id: userId,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    return data.profile;
  } catch (error: any) {
    console.error('更新用户资料过程发生错误:', error);
    console.error('错误详情:', error.stack || '无堆栈信息');
    throw error;
  }
}