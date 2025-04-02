import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';

// 简单的密码加密函数
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

// 注册API
export async function POST(request: NextRequest) {
  try {
    const { email, password, username, action } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }
    
    // 登录逻辑
    if (action === 'login') {
      console.log(`尝试登录邮箱: ${email}`);
      
      try {
        // 检查用户是否存在 - 使用ilike代替eq确保不区分大小写
        const { data: userExists, error: userExistsError } = await supabase
          .from('users')
          .select('email, id')
          .ilike('email', email)
          .maybeSingle();
        
        console.log('用户查询结果:', { userExists, hasError: !!userExistsError });
        
        if (userExistsError) {
          // 增强错误处理，判断具体的错误类型
          console.error('检查用户存在错误:', userExistsError);
          
          // 特殊处理网络错误
          if (userExistsError.message?.includes('fetch failed') || 
              userExistsError.message?.includes('Failed to fetch') ||
              userExistsError.message?.includes('NetworkError')) {
            console.error('检测到网络连接错误，尝试进行测试...');
            
            // 尝试连接常用网站测试网络
            try {
              const testResponse = await fetch('https://www.baidu.com', { 
                method: 'HEAD', 
                cache: 'no-store' 
              });
              
              if (testResponse.ok) {
                return NextResponse.json({ 
                  error: 'Supabase连接失败，但网络正常', 
                  details: userExistsError.message,
                  suggestion: '请检查Supabase服务器状态或配置'
                }, { status: 503 });
              } else {
                return NextResponse.json({ 
                  error: '网络连接异常', 
                  details: userExistsError.message,
                  suggestion: '请检查您的网络连接'
                }, { status: 503 });
              }
            } catch (netError) {
              return NextResponse.json({ 
                error: '网络连接失败', 
                details: userExistsError.message,
                netError: netError instanceof Error ? netError.message : String(netError),
                suggestion: '请检查您的网络连接'
              }, { status: 503 });
            }
          }
          
          return NextResponse.json({ 
            error: '数据库查询错误', 
            details: userExistsError.message 
          }, { status: 500 });
        }
        
        if (!userExists) {
          // 尝试进行一次全表扫描以确认数据库连接正常
          console.log('未找到用户，尝试列出所有用户邮箱进行检查...');
          const { data: allUsers, error: listError } = await supabase
            .from('users')
            .select('email')
            .limit(10);
            
          if (listError) {
            console.error('列出用户失败:', listError);
          } else {
            console.log(`数据库中存在 ${allUsers?.length || 0} 个用户:`, 
              allUsers?.map(u => u.email).join(', '));
          }
          
          return NextResponse.json({ 
            error: '邮箱不存在，请先注册', 
            emailUsed: email,
            suggestion: '请确认您使用了注册时完全相同的邮箱地址'
          }, { status: 404 });
        }
        
        // 验证密码
        const hashedPassword = hashPassword(password);
        console.log(`正在验证用户密码(ID: ${userExists.id})...`);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userExists.id)
          .eq('password', hashedPassword)
          .maybeSingle();
        
        if (error) {
          console.error('登录错误:', error);
          return NextResponse.json({ 
            error: '数据库查询错误', 
            details: error.message 
          }, { status: 500 });
        }
        
        if (!data) {
          console.log('密码验证失败:', { email: userExists.email });
          return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
        }
        
        console.log(`用户登录成功: ${data.email} (ID: ${data.id})`);
        
        // 更新最后登录时间
        const updateResult = await supabase
          .from('users')
          .update({ last_login: new Date() })
          .eq('id', data.id);
          
        if (updateResult.error) {
          console.warn('更新最后登录时间失败:', updateResult.error);
          // 继续流程，这不是关键错误
        }
        
        // 返回成功信息和用户数据（不包含敏感信息）
        const { password: _, ...userWithoutPassword } = data;
        return NextResponse.json({ 
          success: true, 
          message: '登录成功',
          user: userWithoutPassword
        });
      } catch (loginError) {
        // 捕获登录过程中的所有错误
        console.error('登录过程中未捕获的错误:', loginError);
        
        let errorMessage = '登录失败';
        let errorDetails = String(loginError);
        let suggestion = '请稍后重试';
        
        // 处理网络错误
        if (loginError instanceof Error) {
          errorMessage = loginError.message;
          if (
            errorMessage.includes('fetch failed') || 
            errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('network') ||
            errorMessage.includes('Network Error')
          ) {
            suggestion = '请检查您的网络连接和Supabase服务器状态';
          }
        }
        
        return NextResponse.json({ 
          error: errorMessage, 
          details: errorDetails,
          suggestion
        }, { status: 500 });
      }
    }
    
    // 注册逻辑
    if (action === 'register') {
      if (!username) {
        return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
      }
      
      try {
        // 检查邮箱是否已注册 - 使用带重试逻辑的查询
        let emailCheckAttempts = 0;
        let existingEmail = null;
        let emailError = null;
        
        while (emailCheckAttempts < 3) {
          emailCheckAttempts++;
          console.log(`检查邮箱尝试 ${emailCheckAttempts}/3...`);
          
          const result = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .maybeSingle();
            
          if (!result.error) {
            existingEmail = result.data;
            break;
          } else {
            emailError = result.error;
            console.error(`检查邮箱错误(尝试 ${emailCheckAttempts}/3):`, emailError);
            
            // 如果不是表不存在错误，直接中断重试
            if (!emailError.message?.includes('does not exist')) {
              break;
            }
            
            // 延迟后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // 邮箱检查重试失败后才返回错误
        if (emailError && emailCheckAttempts >= 3) {
          console.error('检查邮箱错误详情(已重试3次):', emailError);
          
          // 检查是否表不存在错误
          if (emailError.message?.includes('does not exist')) {
            console.log('未找到users表，尝试创建新用户...');
            // 继续到创建用户步骤，而不是返回错误
          } else {
            return NextResponse.json({ 
              error: '数据库查询错误', 
              details: emailError.message,
              code: 'EMAIL_CHECK_ERROR',
              retryAttempts: emailCheckAttempts
            }, { status: 500 });
          }
        }
        
        if (existingEmail) {
          return NextResponse.json({ error: '邮箱已被注册' }, { status: 409 });
        }
        
        // 用户名检查类似的重试逻辑
        let usernameCheckAttempts = 0;
        let existingUsername = null;
        let usernameError = null;
        
        while (usernameCheckAttempts < 3) {
          usernameCheckAttempts++;
          console.log(`检查用户名尝试 ${usernameCheckAttempts}/3...`);
          
          const result = await supabase
            .from('users')
            .select('username')
            .eq('username', username)
            .maybeSingle();
            
          if (!result.error) {
            existingUsername = result.data;
            break;
          } else {
            usernameError = result.error;
            console.error(`检查用户名错误(尝试 ${usernameCheckAttempts}/3):`, usernameError);
            
            // 如果不是表不存在错误，直接中断重试
            if (!usernameError.message?.includes('does not exist')) {
              break;
            }
            
            // 延迟后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // 用户名检查重试失败后才返回错误
        if (usernameError && usernameCheckAttempts >= 3) {
          console.error('检查用户名错误详情(已重试3次):', usernameError);
          
          // 检查是否表不存在错误
          if (usernameError.message?.includes('does not exist')) {
            console.log('未找到users表，尝试创建新用户...');
            // 继续到创建用户步骤，而不是返回错误
          } else {
            return NextResponse.json({ 
              error: '数据库查询错误', 
              details: usernameError.message,
              code: 'USERNAME_CHECK_ERROR',
              retryAttempts: usernameCheckAttempts
            }, { status: 500 });
          }
        }
        
        if (existingUsername) {
          return NextResponse.json({ error: '用户名已被使用' }, { status: 409 });
        }
        
        // 直接尝试创建用户，跳过表检查
        console.log('尝试创建用户...');
        const hashedPassword = hashPassword(password);
        
        // 创建用户尝试逻辑
        let createUserAttempts = 0;
        let userData = null;
        let userError = null;
        
        while (createUserAttempts < 3) {
          createUserAttempts++;
          console.log(`创建用户尝试 ${createUserAttempts}/3...`);
          
          const result = await supabase
            .from('users')
            .insert([
              { 
                email, 
                username, 
                password: hashedPassword,
                created_at: new Date(),
                updated_at: new Date()
              }
            ])
            .select();
            
          if (!result.error) {
            userData = result.data;
            break;
          } else {
            userError = result.error;
            console.error(`创建用户错误(尝试 ${createUserAttempts}/3):`, userError);
            
            // 延迟后重试
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // 创建用户失败处理
        if (userError) {
          console.error('创建用户失败(已重试3次):', userError);
          return NextResponse.json({ 
            error: '注册失败，数据库错误', 
            details: userError.message,
            code: 'USER_CREATE_ERROR',
            retryAttempts: createUserAttempts
          }, { status: 500 });
        }
        
        // 确保数据存在且格式正确
        if (!userData || !Array.isArray(userData) || userData.length === 0) {
          console.error('用户插入成功但未返回数据');
          return NextResponse.json({ 
            error: '注册过程异常，未返回用户数据', 
            code: 'USER_INSERT_NO_DATA'
          }, { status: 500 });
        }
        
        // 成功创建用户
        console.log('用户创建成功:', {
          id: userData[0].id,
          email: userData[0].email,
          username: userData[0].username
        });
        
        // 返回成功信息和用户数据（不包含敏感信息）
        const { password: _, ...userWithoutPassword } = userData[0];
        return NextResponse.json({ 
          success: true, 
          message: '注册成功',
          user: userWithoutPassword
        });
      } catch (error: any) {
        console.error('注册逻辑中的未捕获错误:', error);
        return NextResponse.json({ 
          error: '服务器内部错误', 
          details: error.message,
          code: 'UNCAUGHT_ERROR'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error: any) {
    console.error('API错误:', error);
    return NextResponse.json({ 
      error: '服务器错误', 
      details: error.message 
    }, { status: 500 });
  }
}

// 添加HEAD请求的处理
export async function HEAD() {
  // 返回空内容但状态为200的成功响应
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 