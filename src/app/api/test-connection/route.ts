import { NextResponse } from 'next/server';

// 定义测试结果类型
interface TestResult {
  name: string;
  status: string;
  url?: string;
  hosts?: string[];
  statusCode?: number;
  error?: string;
  responseType?: string;
  results?: any[];
}

interface TestResults {
  timestamp: string;
  network: {
    status: string;
  };
  supabase: {
    status: string;
  };
  tests: TestResult[];
  executionTime: number;
}

// 简单的网络连接测试API
export async function GET() {
  const startTime = Date.now();
  const results: TestResults = {
    timestamp: new Date().toISOString(),
    network: {
      status: 'checking'
    },
    supabase: {
      status: 'checking'
    },
    tests: [],
    executionTime: 0
  };

  try {
    // 测试1: 普通网络连接测试
    results.tests.push({ 
      name: '基础网络连接', 
      status: 'running', 
      url: 'https://www.baidu.com' 
    });
    
    try {
      const response = await fetch('https://www.baidu.com', { 
        method: 'HEAD',
        cache: 'no-store' 
      });
      
      if (response.ok) {
        results.network.status = 'ok';
        results.tests[0].status = 'success';
        results.tests[0].statusCode = response.status;
      } else {
        results.network.status = 'error';
        results.tests[0].status = 'failed';
        results.tests[0].statusCode = response.status;
        results.tests[0].error = `HTTP错误: ${response.status} ${response.statusText}`;
      }
    } catch (error) {
      results.network.status = 'error';
      results.tests[0].status = 'failed';
      results.tests[0].error = error instanceof Error ? error.message : String(error);
    }
    
    // 测试2: Supabase服务器可达性测试
    results.tests.push({ 
      name: 'Supabase服务器可达性', 
      status: 'running',
      url: 'https://xdwifyfzzlplcdrylabn.supabase.co'
    });
    
    try {
      const response = await fetch('https://xdwifyfzzlplcdrylabn.supabase.co', { 
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors' // 使用no-cors模式以避免跨域问题
      });
      
      // 由于使用了no-cors，我们无法读取响应的状态码，只能判断是否有响应对象
      if (response) {
        results.supabase.status = 'ok';
        results.tests[1].status = 'success';
        results.tests[1].responseType = response.type; // 应该是'opaque'
      } else {
        results.supabase.status = 'error';
        results.tests[1].status = 'failed';
        results.tests[1].error = '无法连接到Supabase服务器';
      }
    } catch (error) {
      results.supabase.status = 'error';
      results.tests[1].status = 'failed';
      results.tests[1].error = error instanceof Error ? error.message : String(error);
    }
    
    // 测试3: DNS解析测试 (使用简单的fetch请求)
    results.tests.push({ 
      name: 'DNS解析测试', 
      status: 'running',
      hosts: ['supabase.co', 'xdwifyfzzlplcdrylabn.supabase.co']
    });
    
    const dnsTestResults = [];
    
    // 检查supabase.co
    try {
      const response = await fetch('https://supabase.co/ping', { 
        method: 'HEAD',
        cache: 'no-store'
      });
      
      dnsTestResults.push({
        host: 'supabase.co',
        status: response.ok ? 'success' : 'failed',
        statusCode: response.status
      });
    } catch (error) {
      dnsTestResults.push({
        host: 'supabase.co',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // 更新测试状态
    if (dnsTestResults.every(r => r.status === 'success')) {
      results.tests[2].status = 'success';
    } else if (dnsTestResults.every(r => r.status === 'failed')) {
      results.tests[2].status = 'failed';
    } else {
      results.tests[2].status = 'partial';
    }
    
    results.tests[2].results = dnsTestResults;
    
    // 计算执行时间
    results.executionTime = Date.now() - startTime;
    
    // 返回测试结果
    return NextResponse.json({
      success: results.network.status === 'ok',
      message: results.network.status === 'ok' 
        ? '网络连接测试成功' 
        : '网络连接测试失败',
      results
    });
  } catch (error) {
    // 记录执行时间
    results.executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      message: '网络连接测试过程中发生错误',
      error: error instanceof Error ? error.message : String(error),
      results
    }, { status: 500 });
  }
} 