import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// 为测试目的创建一个新的客户端实例
const supabaseUrl = 'https://xdwifyfzzlplcdrylabn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkd2lmeWZ6emxwbGNkcnlsYWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNDY5MjcsImV4cCI6MjA1ODgyMjkyN30.7CQG-kWz-ogbpk7n9lIh-pKawjTqu81w8k2ZNHQUiA0';

// 定义测试结果的接口
interface TestResult {
  name: string;
  status: string;
  error?: string;
  details?: any;
  result?: string;
  count?: number;
}

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

interface DiagnosticInfo {
  timestamp: string;
  supabase: {
    url: string;
    hasKey: boolean;
    status: string;
  };
  tests: TestResult[];
  users: User[];
  executionTime: number;
}

// 测试Supabase连接的API路由
export async function GET() {
  const startTime = Date.now();
  const diagnostics: DiagnosticInfo = {
    timestamp: new Date().toISOString(),
    supabase: {
      url: supabaseUrl,
      hasKey: !!supabaseAnonKey,
      status: 'checking'
    },
    tests: [
      {name: "API连接检查", status: "开始"}
    ],
    users: [],
    executionTime: 0
  };
  
  try {
    // 1. 测试API是否在线
    diagnostics.tests[0].status = "成功";
    
    // 2. 测试最简单的Supabase连接 - 使用默认选项
    try {
      diagnostics.tests.push({name: "基本Supabase连接", status: "进行中"});
      const testClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data, error } = await testClient.from('_health').select('*').limit(1);
      
      if (error) {
        diagnostics.supabase.status = 'error';
        diagnostics.tests[1].status = "失败";
        diagnostics.tests[1].error = error.message;
        diagnostics.tests[1].details = error;
      } else {
        diagnostics.supabase.status = 'ok';
        diagnostics.tests[1].status = "成功";
        diagnostics.tests[1].result = "基本连接成功";
      }
    } catch (e) {
      diagnostics.supabase.status = 'error';
      diagnostics.tests[1].status = "失败";
      diagnostics.tests[1].error = e instanceof Error ? e.message : String(e);
    }

    // 3. 尝试获取用户数据 
    try {
      diagnostics.tests.push({name: "获取用户列表", status: "进行中"});
      
      // 使用已配置的supabase客户端
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, created_at')
        .limit(10);
      
      if (error) {
        diagnostics.tests[2].status = "失败";
        diagnostics.tests[2].error = error.message;
        diagnostics.tests[2].details = error;
      } else {
        diagnostics.tests[2].status = "成功";
        diagnostics.tests[2].count = data?.length || 0;
        diagnostics.users = data as User[] || [];
      }
    } catch (e) {
      diagnostics.tests[2].status = "失败";
      diagnostics.tests[2].error = e instanceof Error ? e.message : String(e);
    }

    // 计算执行时间
    diagnostics.executionTime = Date.now() - startTime;

    // 响应诊断信息
    return NextResponse.json({
      success: diagnostics.supabase.status === 'ok',
      message: diagnostics.supabase.status === 'ok' 
        ? "Supabase连接测试成功" 
        : "Supabase连接测试失败",
      diagnostics
    });
  } catch (error) {
    // 记录执行时间
    diagnostics.executionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      message: "测试过程中发生未捕获错误",
      error: error instanceof Error ? error.message : String(error),
      diagnostics
    }, { status: 500 });
  }
} 