import { NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';
import https from 'https';

// DNS解析功能
const lookup = promisify(dns.lookup);
const resolve4 = promisify(dns.resolve4);

// 创建https代理，禁用SSL验证
const httpsAgent = new https.Agent({
  rejectUnauthorized: false // 警告：仅在开发环境使用
});

// 定义测试结果的接口
interface TestResult {
  name: string;
  target: string;
  status: string;
  result?: any;
  error?: string;
  statusCode?: number;
  latency?: string;
}

export async function GET() {
  try {
    const results: {
      timestamp: string;
      tests: TestResult[];
    } = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    // 测试1: 检查DNS解析
    try {
      results.tests.push({
        name: "DNS解析测试",
        target: "xdwifyfzzlplcdrylabn.supabase.co",
        status: "进行中"
      });
      
      const lookupResult = await lookup("xdwifyfzzlplcdrylabn.supabase.co");
      results.tests[0].status = "成功";
      results.tests[0].result = lookupResult;
    } catch (error) {
      results.tests[0].status = "失败";
      results.tests[0].error = error instanceof Error ? error.message : String(error);
    }

    // 测试2: 网络连通性测试 - supabase.com
    try {
      results.tests.push({
        name: "基本网络连通性测试",
        target: "https://supabase.com",
        status: "进行中"
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch("https://supabase.com", { 
        method: "HEAD",
        signal: controller.signal,
        // @ts-ignore - agent属性类型问题
        agent: httpsAgent  // 禁用SSL验证
      });
      
      clearTimeout(timeoutId);
      
      results.tests[1].status = response.ok ? "成功" : "失败";
      results.tests[1].statusCode = response.status;
    } catch (error) {
      results.tests[1].status = "失败";
      results.tests[1].error = error instanceof Error ? error.message : String(error);
    }

    // 测试3: Supabase API连通性测试
    try {
      results.tests.push({
        name: "Supabase API连通性测试",
        target: "https://xdwifyfzzlplcdrylabn.supabase.co",
        status: "进行中"
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch("https://xdwifyfzzlplcdrylabn.supabase.co", { 
        method: "HEAD",
        signal: controller.signal,
        // @ts-ignore - agent属性类型问题
        agent: httpsAgent  // 禁用SSL验证
      });
      
      clearTimeout(timeoutId);
      
      results.tests[2].status = response.ok ? "成功" : "失败";
      results.tests[2].statusCode = response.status;
    } catch (error) {
      results.tests[2].status = "失败";
      results.tests[2].error = error instanceof Error ? error.message : String(error);
    }
    
    // 测试4: 延迟测试
    try {
      results.tests.push({
        name: "延迟测试",
        target: "https://xdwifyfzzlplcdrylabn.supabase.co",
        status: "进行中"
      });
      
      const startTime = Date.now();
      await fetch("https://xdwifyfzzlplcdrylabn.supabase.co", { 
        method: "HEAD",
        // @ts-ignore - agent属性类型问题
        agent: httpsAgent  // 禁用SSL验证
      });
      const endTime = Date.now();
      
      results.tests[3].status = "成功";
      results.tests[3].latency = `${endTime - startTime}ms`;
    } catch (error) {
      results.tests[3].status = "失败";
      results.tests[3].error = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json({
      success: results.tests.every((test: TestResult) => test.status === "成功"),
      results
    }, { status: 200 }); // 确保返回200状态码
  } catch (outerError) {
    // 最外层错误处理，确保始终返回JSON
    console.error('网络测试API路由处理中发生严重错误:', outerError);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误',
      error: outerError instanceof Error ? outerError.message : String(outerError)
    }, { status: 200 }); // 即使发生严重错误也返回200以避免HTML错误页面
  }
} 