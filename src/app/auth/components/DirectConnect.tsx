'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export default function DirectConnect({ setDebugInfo }: { setDebugInfo: (info: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // 直接在浏览器中使用Supabase客户端
  const testDirectConnection = async () => {
    setIsLoading(true);
    setDebugInfo('正在浏览器中直接连接Supabase...');
    
    try {
      // 创建浏览器专用客户端
      const browserClient = createBrowserSupabaseClient();
      
      // 尝试最简单的查询 - 版本信息
      const { data: versionData, error: versionError } = await browserClient.rpc('version');
      
      if (versionError) {
        // 如果版本查询失败，尝试其他查询
        console.warn('版本查询失败:', versionError);
        
        // 尝试查询用户表
        const { data: userData, error: userError } = await browserClient
          .from('users')
          .select('count')
          .limit(1);
          
        if (userError) {
          if (userError.message?.includes('does not exist')) {
            // 表不存在但连接正常
            setStatus('连接成功(表不存在)');
            setDebugInfo(JSON.stringify({
              success: true,
              message: '浏览器直连Supabase成功，但表不存在',
              error: userError
            }, null, 2));
          } else {
            throw userError;
          }
        } else {
          // 用户表查询成功
          let userCount = '未知';
          if (userData && userData.length > 0) {
            userCount = String(userData[0]?.count || '未知');
          }
          
          setStatus(`连接成功(用户数: ${userCount})`);
          setDebugInfo(JSON.stringify({
            success: true,
            message: '浏览器直连Supabase成功',
            data: userData
          }, null, 2));
        }
      } else {
        // 版本查询成功
        setStatus(`连接成功(版本: ${versionData})`);
        setDebugInfo(JSON.stringify({
          success: true,
          message: '浏览器直连Supabase成功',
          version: versionData
        }, null, 2));
      }
    } catch (error) {
      console.error('直连Supabase失败:', error);
      setStatus('连接失败');
      setDebugInfo(JSON.stringify({
        success: false,
        message: '浏览器直连Supabase失败',
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        onClick={testDirectConnection}
        disabled={isLoading}
        style={{
          padding: '5px 10px',
          fontSize: '0.9rem',
          backgroundColor: '#ecfdf5',
          color: '#047857',
          border: '1px solid #a7f3d0',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? '连接中...' : '浏览器直连测试'}
      </button>
      
      {status && (
        <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          状态: {status}
        </div>
      )}
    </div>
  );
} 