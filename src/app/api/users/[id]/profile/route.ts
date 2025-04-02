import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 获取和更新用户资料的API
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: '无效的用户ID格式' },
        { status: 400 }
      );
    }

    // 获取并验证请求数据
    const profileData = await request.json();

    if (!profileData.username) {
      return NextResponse.json(
        { error: '用户名不能为空' },
        { status: 400 }
      );
    }

    // 构建更新对象 - 确保字段与数据库一致
    const updatePayload = {
      username: profileData.username,
      full_name: profileData.full_name || null,
      bio: profileData.bio || null,
      location: profileData.location || null,
      birthday: profileData.birthday || null,
      hobbies: profileData.hobbies || [],
      avatar_url: profileData.avatar_url || null,
      updated_at: new Date().toISOString()
    };

    // 直接尝试更新，如果不存在会返回空数组
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('username', profileData.username)
      .select('*');

    // 如果更新没有返回数据，检查记录是否不存在
    if ((!updateResult || updateResult.length === 0) && !updateError) {
      // 尝试创建新记录
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: profileData.username,
          full_name: profileData.full_name || null,
          bio: profileData.bio || null,
          location: profileData.location || null,
          birthday: profileData.birthday || null,
          hobbies: profileData.hobbies || [],
          avatar_url: profileData.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*');
      
      if (insertError) {
        return NextResponse.json(
          { error: '创建资料记录失败', details: insertError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ profile: insertData[0] });
    }

    if (updateError) {
      return NextResponse.json(
        { error: '更新用户资料失败', details: updateError.message },
        { status: 500 }
      );
    }

    // 更新成功但没有返回数据（可能是由于RLS政策）
    if (!updateResult || updateResult.length === 0) {
      // 直接获取最新数据
      const { data: latestProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', profileData.username)
        .single();
        
      if (fetchError) {
        return NextResponse.json({ 
          warning: '更新可能成功但获取最新数据失败',
          profile: updatePayload
        });
      }
      
      return NextResponse.json({ profile: latestProfile });
    }

    return NextResponse.json({ profile: updateResult[0] });
  } catch (error: any) {
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    );
  }
}

// 获取用户资料的API
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }
    
    // 获取用户信息以得到username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json({ 
        error: '获取用户信息失败', 
        details: userError?.message,
        profile: null
      }, { status: 404 });
    }
    
    const username = userData.username;
    
    // 使用username查询用户资料
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) {
      return NextResponse.json({ 
        error: '获取资料失败', 
        details: error.message,
        profile: null
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      profile: data
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: '服务器错误', 
      details: error.message,
      profile: null
    }, { status: 500 });
  }
} 