import { NextResponse } from 'next/server';
import { tryAllConnections } from '@/lib/supabase-fallback';

export async function GET() {
  try {
    const results = await tryAllConnections();
    
    // 检查是否有至少一种方法成功
    const anySuccess = results.methods.some((method: any) => method.status === '成功');
    
    return NextResponse.json({
      success: anySuccess,
      message: anySuccess 
        ? '至少有一种连接方式成功' 
        : '所有连接方式均失败',
      results
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '测试过程中发生错误',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 200 });
  }
} 