'use client';

import { useState } from 'react';

interface SavedUser {
  id: string;
  email: string;
  username: string;
}

export default function LoginHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedUsers, setSavedUsers] = useState<SavedUser[]>([]);
  
  const checkLocalStorage = () => {
    try {
      // 获取已存储的用户数据
      const storedData = localStorage.getItem('userData');
      if (storedData) {
        const userData = JSON.parse(storedData);
        if (userData) {
          setSavedUsers([userData]);
        }
      }
      
      // 检查是否有其他相关数据
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      
      console.log('本地存储的键:', keys);
    } catch (error) {
      console.error('读取本地存储失败:', error);
    }
  };
  
  // 清理所有验证相关的数据
  const cleanupAuth = () => {
    try {
      // 清除本地存储中的用户数据
      localStorage.removeItem('userData');
      
      // 清除与认证相关的cookie
      document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      
      // 清除与Supabase相关的存储
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth'))) {
          localStorage.removeItem(key);
        }
      }
      
      // 刷新页面
      alert('已清除认证数据，页面将刷新');
      window.location.reload();
    } catch (error) {
      console.error('清理认证数据失败:', error);
      alert(`清理认证数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div style={{ marginTop: '15px' }}>
      <div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              checkLocalStorage();
            }
          }}
          style={{
            padding: '5px 10px',
            fontSize: '0.8rem',
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            border: '1px solid #e5e7eb',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isOpen ? '隐藏' : '登录帮助'}
        </button>
      </div>
      
      {isOpen && (
        <div style={{ 
          marginTop: '8px', 
          padding: '10px',
          backgroundColor: '#f8fafc',
          borderRadius: '4px',
          border: '1px solid #e2e8f0',
          fontSize: '0.85rem'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>登录常见问题解决：</strong>
          </div>
          
          <ul style={{ paddingLeft: '20px', marginBottom: '10px' }}>
            <li>确保输入的邮箱地址与注册时完全一致（区分大小写）</li>
            <li>确保输入的密码正确</li>
            <li>检查网络连接是否稳定</li>
            <li>尝试清除浏览器缓存后重试</li>
          </ul>
          
          {savedUsers.length > 0 && (
            <div>
              <div style={{ marginTop: '8px', marginBottom: '5px' }}>
                <strong>已保存的登录信息：</strong>
              </div>
              
              {savedUsers.map((user, index) => (
                <div key={index} style={{ 
                  padding: '5px', 
                  backgroundColor: '#eff6ff',
                  borderRadius: '4px',
                  marginBottom: '5px' 
                }}>
                  <div>用户名: {user.username}</div>
                  <div>邮箱: {user.email}</div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={cleanupAuth}
              style={{
                padding: '5px 10px',
                fontSize: '0.8rem',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              清除登录数据
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 