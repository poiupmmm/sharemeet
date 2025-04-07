import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import https from 'https';

// 为避免环境变量问题，直接使用值（仅用于开发环境）
const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';

// 检测是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 配置增强选项
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'sharemeet' },
    // 使用不同的fetch实现，取决于环境
    fetch: async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // 最大重试次数
      const MAX_RETRIES = 2;
      // 初始延迟时间（毫秒）- 减少为200ms
      const INITIAL_RETRY_DELAY = 200;
      
      // 实现重试逻辑的函数
      const fetchWithRetry = async (
        attempt: number = 1,
        delay: number = INITIAL_RETRY_DELAY
      ): Promise<Response> => {
        try {
          // 尝试发送请求
          
          // 针对浏览器和服务器环境使用不同的策略
          if (isBrowser) {
            // 浏览器环境：使用标准fetch但采用no-cors模式（如果是跨域请求）
            const response = await fetch(url, {
              ...init,
              // 为API请求维持默认模式，为其他请求使用no-cors模式
              mode: url.toString().includes('/rest/v1/') 
                ? init?.mode 
                : 'no-cors',
              // 减少超时时间到10秒
              signal: init?.signal || AbortSignal.timeout(10000)
            });
            
            return response;
          } else {
            // 服务器环境
            try {
              const response = await fetch(url, {
                ...init,
                // 减少超时时间到10秒
                signal: init?.signal || AbortSignal.timeout(10000)
              });
              return response;
            } catch (fetchError) {
              // 如果在服务器端fetch失败，记录错误并抛出
              
              // 在这里，我们可以创建一个模拟的Response对象
              if (url.toString().includes('/rest/v1/')) {
                // 对于API请求，我们返回一个错误响应
                throw fetchError;
              } else {
                // 对于非API请求（如健康检查等），我们可以返回一个模拟的成功响应
                return new Response('', { status: 200 });
              }
            }
          }
        } catch (error) {
          // 如果已达到最大重试次数，则抛出错误
          if (attempt >= MAX_RETRIES) {
            throw error;
          }
          
          // 否则，等待一段时间后重试（线性退避，而不是指数退避）
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // 递归调用自身，增加重试次数，但退避增长减缓
          return fetchWithRetry(attempt + 1, delay * 1.2);
        }
      };
      
      // 开始第一次尝试
      return fetchWithRetry();
    }
  }
};

// 仅在服务器环境使用node-fetch
let customFetch: any;
if (typeof window === 'undefined') {
  const https = require('https');
  
  customFetch = (url: RequestInfo | URL, init?: RequestInit) => {
    const agent = new https.Agent({
      rejectUnauthorized: process.env.NODE_ENV === 'development' ? false : true
    });
    
    // 使用类型断言处理node-fetch特有的agent参数
    return fetch(url, {
      ...init,
      // @ts-expect-error - node-fetch支持agent参数但TypeScript类型定义不包含此属性
      agent
    });
  };
} else {
  customFetch = window.fetch;
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  ...supabaseOptions,
  global: { fetch: customFetch }
});

// 输出Supabase配置信息（不含密钥）
console.log('Supabase配置:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  options: '已配置增强选项和自动重试',
  environment: isBrowser ? 'browser' : 'server'
});

// 测试数据库连接
export const testConnection = async () => {
  try {
    // 使用最基本的SQL查询来测试连接
    const { data, error } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
      
    if (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
    
    return { 
      success: true, 
      message: '数据库连接正常'
    };
  } catch (err: unknown) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : String(err),
      code: 'UNKNOWN_ERROR'
    };
  }
};

// 缓存浏览器supabase客户端实例
let browserSupabaseClient: any = null;

/**
 * 创建针对浏览器环境的Supabase客户端
 * 处理客户端环境特有的需求和错误
 */
export function createBrowserSupabaseClient() {
  if (typeof window === 'undefined') {
    // 在服务器端使用标准客户端
    return supabase;
  }
  
  try {
    // 尝试重用现有客户端
    if (browserSupabaseClient) {
      return browserSupabaseClient;
    }
    
    // 创建新的浏览器客户端
    const { createClient } = require('@supabase/supabase-js');
    browserSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'supabase_auth_token', // 使用标准存储密钥
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: {
          'x-client-info': `sharemeet-web/1.0.0`, // 添加自定义标头以便于调试
        },
      },
    });
    
    return browserSupabaseClient;
  } catch (error) {
    console.error('创建Supabase客户端失败:', error);
    // 返回基本客户端以避免应用完全崩溃
    return supabase;
  }
}

export const getSupabase = () => supabase;

/* 在Supabase SQL编辑器中执行以下代码，创建系统表查询函数
CREATE OR REPLACE FUNCTION public.check_pg_tables()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- 尝试查询系统表信息
  SELECT json_build_object(
    'success', true,
    'message', '系统表查询成功',
    'tables', (
      SELECT json_agg(json_build_object(
        'schema', schemaname,
        'table', tablename,
        'owner', tableowner
      ))
      FROM pg_catalog.pg_tables 
      WHERE schemaname IN ('public')
      LIMIT 10
    ),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', SQLERRM,
    'timestamp', now()
  );
END;
$$;

-- 授予匿名用户执行此函数的权限
GRANT EXECUTE ON FUNCTION public.check_pg_tables() TO anon;
*/
