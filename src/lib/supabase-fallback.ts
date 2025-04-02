import { createClient } from '@supabase/supabase-js';
import https from 'https';

// Supabase配置
const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';

// 创建https代理，禁用SSL验证
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // 警告：仅在开发环境使用
});

// 添加安全选项 - 禁用SSL验证的fetch
const noSslFetch = (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return fetch(url, {
    ...init,
    // @ts-ignore - agent属性类型问题
    agent: httpsAgent
  });
};

// 备选方案1: 使用最简单的配置 - 尽量减少自定义选项
export const supabaseSimple = createClient(supabaseUrl, supabaseAnonKey);

// 备选方案2: 禁用SSL验证
const noSslOptions = {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x-no-ssl'
    },
    fetch: noSslFetch
  }
};

export const supabaseNoSsl = createClient(supabaseUrl, supabaseAnonKey, noSslOptions);

// 备选方案3: 使用较长的超时时间和禁用SSL
const longTimeoutOptions = {
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x-long-timeout'
    },
    fetch: (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      return new Promise<Response>((resolve, reject) => {
        // 设置较长的超时时间
        const timeout = setTimeout(() => {
          reject(new Error('请求超时（30秒）'));
        }, 30000); // 30秒
        
        // 使用禁用SSL的选项
        fetch(url, {
          ...init,
          // @ts-ignore - agent属性类型问题
          agent: httpsAgent
        })
          .then(response => {
            clearTimeout(timeout);
            resolve(response);
          })
          .catch(error => {
            clearTimeout(timeout);
            reject(error);
          });
      });
    }
  }
};

export const supabaseLongTimeout = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  longTimeoutOptions
);

// 备选方案4: 尝试使用REST API直接访问
export async function testRestApi() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      // @ts-ignore - agent属性类型问题
      agent: httpsAgent  // 禁用SSL验证
    });
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        statusText: response.statusText
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// 创建一个尝试多种方法的函数
export async function tryAllConnections() {
  const results: any = {
    timestamp: new Date().toISOString(),
    methods: []
  };
  
  // 方法1: 标准客户端
  try {
    results.methods.push({
      name: '标准客户端',
      status: '进行中'
    });
    
    const { data, error } = await supabaseSimple.from('_health').select('*').limit(1);
    
    if (error) {
      results.methods[0].status = '失败';
      results.methods[0].error = error.message;
    } else {
      results.methods[0].status = '成功';
    }
  } catch (err) {
    results.methods[0].status = '失败';
    results.methods[0].error = err instanceof Error ? err.message : String(err);
  }
  
  // 方法2: 禁用SSL
  try {
    results.methods.push({
      name: '禁用SSL客户端',
      status: '进行中'
    });
    
    const { data, error } = await supabaseNoSsl.from('_health').select('*').limit(1);
    
    if (error) {
      results.methods[results.methods.length - 1].status = '失败';
      results.methods[results.methods.length - 1].error = error.message;
    } else {
      results.methods[results.methods.length - 1].status = '成功';
    }
  } catch (err) {
    results.methods[results.methods.length - 1].status = '失败';
    results.methods[results.methods.length - 1].error = err instanceof Error ? err.message : String(err);
  }
  
  // 方法3: 长超时
  try {
    results.methods.push({
      name: '长超时客户端',
      status: '进行中'
    });
    
    const { data, error } = await supabaseLongTimeout.from('_health').select('*').limit(1);
    
    if (error) {
      results.methods[results.methods.length - 1].status = '失败';
      results.methods[results.methods.length - 1].error = error.message;
    } else {
      results.methods[results.methods.length - 1].status = '成功';
    }
  } catch (err) {
    results.methods[results.methods.length - 1].status = '失败';
    results.methods[results.methods.length - 1].error = err instanceof Error ? err.message : String(err);
  }
  
  // 方法4: REST API
  try {
    results.methods.push({
      name: 'REST API',
      status: '进行中'
    });
    
    const restResult = await testRestApi();
    
    if (restResult.success) {
      results.methods[results.methods.length - 1].status = '成功';
      results.methods[results.methods.length - 1].data = restResult.data;
    } else {
      results.methods[results.methods.length - 1].status = '失败';
      results.methods[results.methods.length - 1].error = restResult.error || `HTTP ${restResult.status}: ${restResult.statusText}`;
    }
  } catch (err) {
    results.methods[results.methods.length - 1].status = '失败';
    results.methods[results.methods.length - 1].error = err instanceof Error ? err.message : String(err);
  }
  
  return results;
} 