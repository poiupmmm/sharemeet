'use client';

import { useState, useEffect } from 'react';

export default function NetworkTest({ setDebugInfo }: { setDebugInfo: (info: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // 直接在浏览器环境中执行网络测试
  const runBrowserNetworkTest = async () => {
    setIsLoading(true);
    setDebugInfo('正在客户端测试网络连接...');
    
    const results = {
      timestamp: new Date().toISOString(),
      network: { status: 'checking' },
      supabase: { status: 'checking' },
      tests: [] as any[],
      executionTime: 0
    };
    
    const startTime = Date.now();
    
    try {
      // 测试1: 基础网络连接到百度
      results.tests.push({
        name: '基础网络连接',
        status: 'running',
        url: 'https://www.baidu.com'
      });
      
      try {
        // 直接使用浏览器的fetch API发起请求
        const response = await fetch('https://www.baidu.com', {
          method: 'HEAD',
          mode: 'no-cors', // 重要：使用no-cors模式避免跨域问题
          cache: 'no-store'
        });
        
        // 由于使用了no-cors，我们只能知道请求没有抛出异常
        results.network.status = 'ok';
        results.tests[0].status = 'success';
        results.tests[0].type = response.type; // 应该是'opaque'
      } catch (error) {
        results.network.status = 'error';
        results.tests[0].status = 'failed';
        results.tests[0].error = error instanceof Error ? error.message : String(error);
      }
      
      // 测试2: Supabase服务器可达性
      results.tests.push({
        name: 'Supabase服务器可达性',
        status: 'running',
        url: 'https://xdwifyfzzlplcdrylabn.supabase.co'
      });
      
      try {
        const response = await fetch('https://xdwifyfzzlplcdrylabn.supabase.co', {
          method: 'HEAD',
          mode: 'no-cors', // 重要：使用no-cors模式避免跨域问题
          cache: 'no-store'
        });
        
        // 由于使用了no-cors，我们只能知道请求没有抛出异常
        results.supabase.status = 'ok';
        results.tests[1].status = 'success';
        results.tests[1].type = response.type; // 应该是'opaque'
      } catch (error) {
        results.supabase.status = 'error';
        results.tests[1].status = 'failed';
        results.tests[1].error = error instanceof Error ? error.message : String(error);
      }
      
      // 测试3: 尝试ping Supabase的API
      results.tests.push({
        name: 'Supabase API健康检查',
        status: 'running'
      });
      
      try {
        const img = new Image();
        let loaded = false;
        
        const imagePromise = new Promise<boolean>((resolve, reject) => {
          img.onload = () => {
            loaded = true;
            resolve(true);
          };
          
          img.onerror = () => {
            // 错误也表示资源存在，只是不能作为图片加载
            loaded = true;
            resolve(true);
          };
          
          // 设置超时
          setTimeout(() => {
            if (!loaded) {
              reject(new Error('请求超时'));
            }
          }, 5000);
          
          // 使用时间戳避免缓存
          img.src = `https://xdwifyfzzlplcdrylabn.supabase.co/favicon.ico?t=${Date.now()}`;
        });
        
        await imagePromise;
        results.tests[2].status = 'success';
      } catch (error) {
        results.tests[2].status = 'failed';
        results.tests[2].error = error instanceof Error ? error.message : String(error);
      }
      
      // 测试4: 浏览器信息
      results.tests.push({
        name: '浏览器环境信息',
        status: 'success',
        info: {
          userAgent: navigator.userAgent,
          online: navigator.onLine,
          cookiesEnabled: navigator.cookieEnabled,
          language: navigator.language,
          platform: navigator.platform
        }
      });
      
      // 计算执行时间
      results.executionTime = Date.now() - startTime;
      
      setTestResults(results);
      setDebugInfo(JSON.stringify(results, null, 2));
    } catch (error) {
      const errorInfo = {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
      
      setTestResults({
        success: false,
        message: '客户端网络测试失败',
        error: errorInfo
      });
      
      setDebugInfo(JSON.stringify({
        success: false,
        message: '客户端网络测试失败',
        error: errorInfo
      }, null, 2));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <button
        onClick={runBrowserNetworkTest}
        disabled={isLoading}
        style={{
          padding: '5px 10px',
          fontSize: '0.9rem',
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          border: '1px solid #bae6fd',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.7 : 1
        }}
      >
        {isLoading ? '测试中...' : '客户端网络测试'}
      </button>
      
      {testResults && (
        <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
          状态: {testResults.network?.status === 'ok' ? '网络正常' : '网络异常'}
        </div>
      )}
    </div>
  );
} 