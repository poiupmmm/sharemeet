import { NextResponse } from 'next/server';
import { supabase, testConnection } from '@/lib/supabase';
import https from 'https';

// 彻底禁用SSL验证
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 测试数据库连接的API端点
export async function GET() {
  try {
    // 1. 环境信息
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
      runtime: typeof window === 'undefined' ? 'server' : 'client',
      tlsRejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED
    };

    console.log('API环境信息:', environmentInfo);
    
    // 2. 首先进行基本HTTPS连接测试
    let httpsConnectSuccess = false;
    try {
      httpsConnectSuccess = await new Promise<boolean>((resolve) => {
        console.log('测试基本HTTPS连接...');
        const req = https.request(
          {
            host: 'xdwifyfzzlplcdrylabn.supabase.co',
            port: 443,
            path: '/',
            method: 'HEAD',
            timeout: 10000,
            headers: {
              'User-Agent': 'Node.js/TestClient'
            },
            rejectUnauthorized: false
          },
          (res) => {
            console.log('HTTPS连接测试状态码:', res.statusCode);
            resolve(true);
          }
        );

        req.on('error', (err) => {
          console.error('HTTPS连接测试错误:', err.message);
          resolve(false);
        });

        req.on('timeout', () => {
          console.error('HTTPS连接测试超时');
          req.destroy();
          resolve(false);
        });

        req.end();
      });
    } catch (err) {
      console.error('HTTPS测试异常:', err);
      httpsConnectSuccess = false;
    }

    if (!httpsConnectSuccess) {
      return NextResponse.json({
        success: false,
        message: '无法连接到Supabase服务器',
        environment: environmentInfo,
        httpTest: {
          success: false,
          error: '直接HTTPS连接测试失败'
        }
      }, { status: 200 }); // 确保返回200状态码和JSON响应
    }
    
    // 3. 测试数据库连接
    try {
      const result = await testConnection();
      
      // 特殊情况：如果数据库连接正常但数据库为空，我们也视为成功
      const isEmptyDbSuccess = 
        !result.success && 
        (result.code === 'TABLES_NOT_FOUND' || 
         (typeof result.error === 'string' && 
          (result.error.includes('does not exist') || 
           result.error.includes('未找到'))));
      
      const actualSuccess = result.success || isEmptyDbSuccess;
      
      return NextResponse.json({
        success: actualSuccess,
        message: actualSuccess 
          ? (result.success ? '数据库连接成功' : '数据库连接成功，但数据库尚未包含所需表') 
          : `数据库连接失败: ${result.error}`,
        environment: environmentInfo,
        httpTest: {
          success: true
        },
        connection: {
          ...result,
          // 如果是空数据库但我们视为成功，标记这一情况
          emptyDbTreatedAsSuccess: isEmptyDbSuccess && !result.success
        }
      }, { status: 200 }); // 确保返回200状态码
    } catch (err) {
      // 即使测试失败也返回JSON格式
      return NextResponse.json({
        success: false,
        message: '数据库连接测试过程出错',
        error: err instanceof Error ? err.message : String(err),
        environment: environmentInfo,
        httpTest: {
          success: httpsConnectSuccess
        }
      }, { status: 200 }); // 确保返回200状态码
    }
  } catch (outerError) {
    // 最外层错误处理，确保始终返回JSON
    console.error('API路由处理过程中发生严重错误:', outerError);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误',
      error: outerError instanceof Error ? outerError.message : String(outerError)
    }, { status: 200 }); // 即使发生严重错误也返回200以避免HTML错误页面
  }
} 