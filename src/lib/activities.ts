import { supabase } from './supabase';
import { createBrowserSupabaseClient } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { cacheService } from './cache-service';

export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  image_url: string;
  category: string[];
  max_participants?: number;
  participants_count: number;
  created_at?: string;
  organizer_id?: string;
  creator_id?: string;
  city?: string;
  price?: number;
  requirements?: string;
  is_online?: boolean;
  organizer?: string;
  organizerInfo?: any;
  is_joined?: boolean; // 标记用户是否已参与
  // 兼容数据库字段
  date?: string;
  end_date?: string;
  is_creator: boolean; // 添加is_creator属性
}

// 获取所有活动
export async function getActivities(options?: {
  sort?: 'time' | 'distance' | 'popularity';
  search?: string;
}) {
  const cacheKey = `activities_${options?.sort || 'default'}_${options?.search || ''}`;
  const cachedData = cacheService.get<Activity[]>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  // 使用浏览器客户端
  const browserClient = createBrowserSupabaseClient();
  let query = browserClient.from('activities').select('*');

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  if (options?.sort) {
    switch (options.sort) {
      case 'time':
        query = query.order('start_time', { ascending: true });
        break;
      case 'popularity':
        query = query.order('participants_count', { ascending: false });
        break;
      // 距离排序需要用户位置，将在前端实现
    }
  } else {
    // 默认按创建时间排序
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const activities = data as Activity[];
  cacheService.set(cacheKey, activities);
  return activities;
}

// 获取单个活动详情
export async function getActivity(id: string) {
  const cacheKey = `activity_${id}`;
  const cachedData = cacheService.get<Activity>(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  const browserClient = createBrowserSupabaseClient();
  try {
    const { data, error } = await browserClient
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取活动详情失败:', error);
      throw error;
    }

    if (!data) {
      throw new Error('未找到活动');
    }

    // 转换数据库字段到前端期望的格式
    const activity: Activity = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      location: data.location,
      start_time: data.date || data.start_time, // 数据库可能使用date字段
      end_time: data.end_date || data.end_time || data.date || data.start_time, // 确保有结束时间
      image_url: data.image_url,
      category: typeof data.category === 'string' ? [data.category] : data.category, // 确保类别是数组
      max_participants: data.attendees_limit || data.max_participants,
      creator_id: data.user_id || data.creator_id,
      created_at: data.created_at,
      participants_count: data.participants_count || 0,
      is_creator: false, // 这个值将在前端根据当前用户设置
    };

    cacheService.set(cacheKey, activity);
    return activity;
  } catch (error) {
    console.error('获取活动详情时发生错误:', error);
    throw error;
  }
}

// 创建新活动
export async function createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'participants_count'>) {
  const browserClient = createBrowserSupabaseClient();
  try {
    console.log('开始创建活动，用户ID:', activity.creator_id);
    
    if (!activity.creator_id) {
      throw new Error('未提供创建者ID');
    }
    
    // 检查必要字段
    if (!activity.title || !activity.location || !activity.start_time || !activity.category) {
      throw new Error('请填写所有必要的活动信息');
    }
    
    // 获取当前登录用户信息
    try {
      // 尝试恢复用户认证状态
      const { data: sessionData } = await browserClient.auth.getSession();
      if (!sessionData?.session) {
        console.log('尝试手动设置用户会话...');
      }
    } catch (authError) {
      console.error('验证用户身份失败:', authError);
    }
    
    // 处理活动图片: 如果没有提供图片，则使用创建人的头像
    let image_url = activity.image_url || '';
    if (!image_url || image_url.trim() === '') {
      try {
        // 从profiles表获取创建人的头像
        const { data: creatorData, error: creatorError } = await browserClient
          .from('profiles')
          .select('avatar_url')
          .eq('user_id', activity.creator_id)
          .single();
        
        if (!creatorError && creatorData && creatorData.avatar_url) {
          console.log('使用创建人头像作为活动图片:', creatorData.avatar_url);
          image_url = creatorData.avatar_url;
        } else {
          console.log('未找到创建人头像或获取失败，使用默认空图片');
        }
      } catch (avatarError) {
        console.error('获取创建人头像失败:', avatarError);
      }
    }
    
    // 转换数据以精确匹配数据库表结构
    const formattedActivity = {
      title: activity.title,
      description: activity.description || '',
      user_id: activity.creator_id, // 创建者ID
      organizer_name: activity.organizer || '活动组织者', // 必填字段
      date: activity.start_time, // 开始时间
      end_date: activity.end_time, // 结束时间
      location: activity.location,
      city: activity.city, // 添加城市字段
      image_url: image_url,
      category: Array.isArray(activity.category) ? activity.category[0] : activity.category,
      price: activity.price !== undefined && activity.price !== '' ? 
        (activity.price === 0 || activity.price === '0' ? '0' : activity.price.toString()) : 
        '免费', // 修复价格处理逻辑，确保0也能被正确保存
      attendees_limit: activity.max_participants,
      is_public: true
      // 数据库会自动填充created_at和updated_at
    };
    
    console.log('格式化后的活动数据:', formattedActivity);

    // 创建活动
    const { data, error } = await browserClient
      .from('activities')
      .insert([formattedActivity])
      .select();

    if (error) {
      console.error('创建活动失败，详细错误:', error);
      
      // 检查是否是行级安全策略错误
      if (error.message?.includes('policy')) {
        throw new Error(`创建活动失败: 权限不足。请确保您已登录并有创建活动的权限`);
      } else if (error.message?.includes('column')) {
        // 提供更详细的字段错误信息
        const errorMsg = error.message || '';
        const missingField = errorMsg.match(/column "(.*?)" of/)?.[1] || '';
        if (missingField) {
          throw new Error(`创建活动失败: 缺少必要字段"${missingField}"。请检查表单并完整填写所有必要信息`);
        } else {
          throw new Error(`创建活动失败: 数据库字段不匹配。错误详情: ${errorMsg}`);
        }
      } else {
        throw new Error(`创建活动失败: ${error.message || '请检查输入信息是否完整'}`);
      }
    }

    if (!data || data.length === 0) {
      throw new Error('创建活动失败，未返回活动信息');
    }

    console.log('活动创建成功:', data[0]);

    // 转换返回数据以匹配应用期望的结构
    const responseActivity = {
      ...data[0],
      creator_id: data[0].user_id, // 将user_id映射回creator_id
      start_time: data[0].date,
      end_time: data[0].end_date || data[0].date,
      max_participants: data[0].attendees_limit,
      category: [data[0].category], // 字符串转数组
      image_url: data[0].image_url || '',
      participants_count: data[0].participants_count || 1, // 确保创建人计入参与人数
    };

    // 自动将创建者添加为参与者
    try {
      console.log('开始自动将创建者添加为参与者:', { 
        activityId: data[0].id, 
        userId: activity.creator_id 
      });
      
      // 添加创建者为参与者
      const { error: participantError } = await browserClient
        .from('activity_participants')
        .insert([{ 
          activity_id: data[0].id, 
          user_id: activity.creator_id,
          created_at: new Date().toISOString()
        }]);
        
      if (participantError) {
        console.error('自动添加创建者为参与者失败:', participantError);
        // 不阻止整个创建流程，即使添加失败也继续
      } else {
        console.log('成功将创建者添加为参与者');
        
        // 更新活动参与人数
        const { error: updateError } = await browserClient
          .from('activities')
          .update({ participants_count: 1 })
          .eq('id', data[0].id);
          
        if (updateError) {
          console.error('更新参与人数失败:', updateError);
        } else {
          // 更新返回的活动对象，反映准确的参与人数
          responseActivity.participants_count = 1;
        }
      }
    } catch (participantError) {
      console.error('添加创建者为参与者过程中出错:', participantError);
      // 不阻止创建流程，但确保参与人数至少为1（创建人）
      // 尝试更新数据库中的参与人数
      try {
        await browserClient
          .from('activities')
          .update({ participants_count: 1 })
          .eq('id', data[0].id);
      } catch (updateError) {
        console.error('尝试更新参与人数失败:', updateError);
      }
    }

    return responseActivity as Activity;
  } catch (error) {
    console.error('创建活动过程中出错:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('创建活动时发生未知错误，请稍后重试');
    }
  }
}

// 更新活动
export async function updateActivity(
  activityId: string, 
  userId: string,
  updates: Partial<Omit<Activity, 'id' | 'creator_id' | 'created_at' | 'participants_count'>>
) {
  // 参数验证
  if (!activityId) {
    console.error('活动ID为空');
    throw new Error('活动ID不能为空');
  }
  
  if (!userId) {
    console.error('用户ID为空');
    throw new Error('用户ID不能为空');
  }
  
  if (!updates || Object.keys(updates).length === 0) {
    console.error('更新数据为空');
    throw new Error('更新数据不能为空');
  }
  
  try {
    console.log('更新活动准备开始:', { activityId, userId });
    
    // 创建Supabase客户端
    const browserClient = createBrowserSupabaseClient();
    console.log('创建Supabase客户端成功');
    
    // 格式化更新数据以匹配数据库结构
    const formattedUpdates: any = {};
    
    // 映射字段
    if (updates.title !== undefined) formattedUpdates.title = updates.title;
    if (updates.description !== undefined) formattedUpdates.description = updates.description;
    if (updates.location !== undefined) formattedUpdates.location = updates.location;
    if (updates.city !== undefined) formattedUpdates.city = updates.city;
    if (updates.organizer !== undefined) formattedUpdates.organizer_name = updates.organizer;
    if (updates.max_participants !== undefined) formattedUpdates.attendees_limit = updates.max_participants;
    
    // 价格处理逻辑，确保价格正确保存
    if (updates.price !== undefined) {
      // 处理价格字段，确保0也能被正确保存
      if (updates.price === 0 || updates.price === '0') {
        formattedUpdates.price = '0';
      } else if (updates.price === '' || updates.price === null) {
        formattedUpdates.price = '免费';
      } else {
        formattedUpdates.price = String(updates.price);
      }
      console.log(`处理价格字段: ${updates.price} (${typeof updates.price}) -> ${formattedUpdates.price}`);
    }
    
    if (updates.requirements !== undefined) formattedUpdates.requirements = updates.requirements;
    if (updates.image_url !== undefined) formattedUpdates.image_url = updates.image_url;
    
    // 处理类别 - 从数组转为字符串
    if (updates.category !== undefined) {
      formattedUpdates.category = Array.isArray(updates.category) ? updates.category[0] : updates.category;
    }
    
    // 处理日期和时间
    if (updates.start_time !== undefined) formattedUpdates.date = updates.start_time;
    if (updates.end_time !== undefined) formattedUpdates.end_date = updates.end_time;
    
    console.log('格式化后的更新数据:', formattedUpdates);
    
    // 首先尝试更新，不要立即获取更新后的数据
    console.log('第一步：执行更新操作:', formattedUpdates);
    const { error: updateError } = await browserClient
      .from('activities')
      .update(formattedUpdates)
      .eq('id', activityId);
    
    if (updateError) {
      console.error('更新活动失败，错误详情:', updateError);
      
      // 处理各种可能的错误类型
      if (Object.keys(updateError).length === 0) {
        throw new Error('更新活动失败，可能是网络问题或数据库连接错误');
      } else if (updateError.code === '23505') {
        throw new Error('更新失败：数据冲突，可能已存在相同记录');
      } else if (updateError.code === '42501' || updateError.message?.includes('permission denied')) {
        throw new Error('您没有权限更新此活动，只有活动创建者才能编辑');
      } else if (updateError.code === '23502') {
        throw new Error('更新失败：缺少必要字段');
      } else {
        throw new Error(`更新活动失败: ${updateError.message || '未知错误'}`);
      }
    }
    
    console.log('更新操作成功执行，现在获取更新后的活动数据');
    
    // 然后单独查询获取更新后的数据
    const { data, error: selectError } = await browserClient
      .from('activities')
      .select('*')
      .eq('id', activityId)
      .single();
    
    if (selectError) {
      console.error('更新成功但获取活动详情失败:', selectError);
      // 虽然获取详情失败，但更新是成功的，返回部分信息
      return {
        id: activityId,
        title: formattedUpdates.title || '(已更新)',
        description: formattedUpdates.description || '',
        location: formattedUpdates.location || '',
        start_time: formattedUpdates.date || '',
        end_time: formattedUpdates.end_date || '',
        image_url: formattedUpdates.image_url || '',
        category: typeof formattedUpdates.category === 'string' ? [formattedUpdates.category] : formattedUpdates.category || [],
        participants_count: 0,
        city: formattedUpdates.city || '',
      } as Activity;
    }
    
    if (!data) {
      console.error('更新成功但未返回活动数据，返回部分信息');
      return {
        id: activityId,
        title: formattedUpdates.title || '(已更新)',
        description: formattedUpdates.description || '',
        location: formattedUpdates.location || '',
        start_time: formattedUpdates.date || '',
        end_time: formattedUpdates.end_date || '',
        image_url: formattedUpdates.image_url || '',
        category: typeof formattedUpdates.category === 'string' ? [formattedUpdates.category] : formattedUpdates.category || [],
        participants_count: 0,
        city: formattedUpdates.city || '',
      } as Activity;
    }
    
    console.log('成功获取更新后的活动数据:', data);
    
    // 转换返回数据以匹配应用期望的格式
    const responseActivity: Activity = {
      id: data.id,
      title: data.title,
      description: data.description || '',
      location: data.location,
      start_time: data.date,
      end_time: data.end_date || data.date,
      image_url: data.image_url || '',
      category: typeof data.category === 'string' ? [data.category] : data.category,
      max_participants: data.attendees_limit,
      creator_id: data.user_id,
      created_at: data.created_at,
      participants_count: data.participants_count || 0,
      city: data.city,
      price: data.price,
      requirements: data.requirements,
      organizer: data.organizer_name,
      is_creator: data.is_creator
    };
    
    return responseActivity;
  } catch (error) {
    console.error('更新活动整体过程出错:', error);
    
    // 确保返回的是Error对象
    if (error instanceof Error) {
      throw error;
    } else if (typeof error === 'string') {
      throw new Error(error);
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as any;
      if (errorObj.message) {
        throw new Error(errorObj.message);
      } else {
        throw new Error('更新活动时发生未知错误');
      }
    } else {
      throw new Error('更新活动时发生未知错误');
    }
  }
}

// 删除活动
export async function deleteActivity(activityId: string, userId: string) {
  console.log('开始删除活动:', { activityId, userId });
  
  if (!activityId) {
    console.error('活动ID为空');
    throw new Error('活动ID不能为空');
  }
  
  if (!userId) {
    console.error('用户ID为空');
    throw new Error('用户ID不能为空');
  }
  
  try {
    const browserClient = createBrowserSupabaseClient();
    
    // 确保只有创建者可以删除活动
    console.log('验证活动创建者权限...');
    const { data: existingActivity, error: activityError } = await browserClient
      .from('activities')
      .select('user_id')
      .eq('id', activityId)
      .single();

    if (activityError) {
      console.error('查询活动时出错:', activityError);
      throw new Error(`无法获取活动信息: ${activityError.message}`);
    }

    if (!existingActivity) {
      console.error('活动不存在');
      throw new Error('找不到要删除的活动');
    }

    if (existingActivity.user_id !== userId) {
      console.error('权限错误: 用户不是活动创建者', { 
        user_id: existingActivity.user_id,
        userId 
      });
      throw new Error('只有活动创建者可以删除活动');
    }

    // 先删除活动参与者记录
    console.log('删除活动参与者记录...');
    const { error: participantsError } = await browserClient
      .from('activity_participants')
      .delete()
      .eq('activity_id', activityId);

    if (participantsError) {
      console.error('删除活动参与者记录时出错:', participantsError);
      throw new Error(`删除活动参与者记录失败: ${participantsError.message}`);
    }

    // 删除活动收藏记录
    console.log('删除活动收藏记录...');
    const { error: favoritesError } = await browserClient
      .from('activity_favorites')
      .delete()
      .eq('activity_id', activityId);

    if (favoritesError) {
      console.error('删除活动收藏记录时出错:', favoritesError);
      throw new Error(`删除活动收藏记录失败: ${favoritesError.message}`);
    }

    // 删除活动本身
    console.log('删除活动记录...');
    const { error } = await browserClient
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      console.error('删除活动时出错:', error);
      throw new Error(`删除活动失败: ${error.message}`);
    }

    // 更新用户创建的活动数量
    console.log('更新用户创建的活动数量...');
    try {
      const { data: userProfile, error: profileError } = await browserClient
        .from('profiles')
        .select('created_activities_count')
        .eq('user_id', userId)  // 使用user_id而不是id字段
        .single();

      if (profileError) {
        console.error('获取用户资料时出错:', profileError);
        // 记录详细错误但继续执行，不阻止活动删除完成
        console.warn('无法更新用户创建的活动数量，但活动已成功删除');
        return;  // 提前返回，活动已成功删除
      }

      if (!userProfile) {
        console.warn('未找到用户资料，可能是新用户或user_id与profiles表不匹配');
        console.warn('无法更新用户创建的活动数量，但活动已成功删除');
        return;  // 提前返回，活动已成功删除
      }

      const currentCount = userProfile.created_activities_count || 0;
      const { error: updateError } = await browserClient
        .from('profiles')
        .update({
          created_activities_count: Math.max(0, currentCount - 1),
        })
        .eq('user_id', userId);  // 使用user_id而不是id字段
        
      if (updateError) {
        console.error('更新用户活动计数失败:', updateError);
        console.warn('无法更新用户创建的活动数量，但活动已成功删除');
      } else {
        console.log('成功更新用户活动计数');
      }
    } catch (profileError) {
      // 捕获并记录任何资料更新过程中的错误，但不影响活动删除结果
      console.error('处理用户资料更新时出错:', profileError);
      console.warn('无法更新用户创建的活动数量，但活动已成功删除');
    }
      
    console.log('活动删除成功');
  } catch (error) {
    console.error('删除活动过程中发生错误:', error);
    throw error; // 重新抛出错误以便调用者处理
  }
}

/**
 * 用户参加活动
 */
export async function joinActivity(activityId: string): Promise<{ success: boolean; message?: string; error?: any; needLogin?: boolean }> {
  console.log('调用joinActivity', { activityId });
  
  try {
    const supabase = createBrowserSupabaseClient();
    
    // 直接从cookie获取用户ID，简化认证流程
    const cookies = typeof document !== 'undefined' ? document.cookie.split(';') : [];
    const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
    const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
    
    const isLoggedIn = isLoggedInCookie?.includes('true') || false;
    const userId = userIdCookie ? userIdCookie.split('=')[1].trim() : null;
    
    console.log('从Cookie中获取登录状态:', { isLoggedIn, userId });
    
    if (!isLoggedIn || !userId) {
      console.log('Cookie中未找到登录状态或用户ID，需要登录');
      return { 
        success: false, 
        needLogin: true, 
        message: '您需要登录才能参加活动' 
      };
    }

    // 直接使用cookie中的用户ID进行操作，不再依赖Supabase会话状态
    console.log('将使用cookie中的用户ID:', userId);
    
    // 执行实际的加入活动逻辑
    return await processJoinActivity(supabase, activityId, userId);
  } catch (error) {
    console.error('参加活动过程出现异常:', error);
    
    // 一般性错误处理
    return { 
      success: false, 
      message: error instanceof Error ? error.message : '参加活动时出现未知错误', 
      error 
    };
  }
}

// 处理加入活动的核心逻辑
async function processJoinActivity(
  supabase: SupabaseClient, 
  activityId: string, 
  userId: string
): Promise<{ success: boolean; message?: string; error?: any; needLogin?: boolean }> {
  try {
    console.log('处理活动参与请求:', { activityId, userId });
    
    // 检查用户是否已经参加了这个活动
    console.log('检查用户是否已参与活动...');
    
    try {
      const { data: existingParticipation, error: checkError } = await supabase
        .from('activity_participants')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', userId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116是没有找到记录的错误码
        console.error('检查参与状态失败:', checkError);
        
        // 更宽容地处理权限错误，只是记录而不立即返回
        if (checkError.code === '42501' || 
            checkError.message?.includes('permission') || 
            checkError.message?.includes('RLS') ||
            checkError.message?.includes('policy')) {
          console.warn('检测到权限问题，但将继续尝试添加参与者:', checkError.message);
        } else {
          return { 
            success: false, 
            message: '无法检查参与状态: ' + checkError.message, 
            error: checkError 
          };
        }
      }
      
      if (existingParticipation) {
        console.log('用户已经参加了这个活动');
        return { success: true, message: '您已经参加了这个活动' };
      }
    } catch (queryError) {
      console.error('查询参与状态时出错:', queryError);
      // 出错时继续执行，尝试添加参与记录
    }
    
    // 添加用户到活动参与者
    console.log('添加用户到活动参与者列表...');
    try {
      const { data: participantData, error: participantError } = await supabase
        .from('activity_participants')
        .insert([
          { 
            activity_id: activityId, 
            user_id: userId,
            created_at: new Date().toISOString()
          }
        ]);
      
      if (participantError) {
        console.error('添加参与者记录失败:', participantError);
        return { 
          success: false, 
          message: '参加活动失败: ' + participantError.message, 
          error: participantError 
        };
      }
      
      console.log('成功添加参与者记录');
    } catch (insertError) {
      console.error('添加参与者过程中出错:', insertError);
      return { 
        success: false, 
        message: '添加参与记录失败: ' + (insertError instanceof Error ? insertError.message : '未知错误'), 
        error: insertError 
      };
    }
    
    // 更新活动参与人数 (+1)
    try {
      console.log('尝试更新活动参与人数...');
      const { data: updateData, error: updateError } = await supabase.rpc(
        'increment_participants_count',
        { activity_id_param: activityId }
      );
      
      if (updateError) {
        console.error('更新参与人数失败，尝试直接更新数据库:', updateError);
        // 如果RPC调用失败，尝试直接更新数据库
        try {
          // 获取当前活动信息
          const { data: activity, error: activityError } = await supabase
            .from('activities')
            .select('participants_count')
            .eq('id', activityId)
            .single();
          
          if (activityError) {
            console.error('获取活动信息失败:', activityError);
          } else {
            // 直接更新参与人数
            const { error: directUpdateError } = await supabase
              .from('activities')
              .update({ 
                participants_count: (activity.participants_count || 0) + 1 
              })
              .eq('id', activityId);
            
            if (directUpdateError) {
              console.error('直接更新参与人数失败:', directUpdateError);
            } else {
              console.log('成功直接更新参与人数');
            }
          }
        } catch (directUpdateError) {
          console.error('直接更新参与人数过程中出错:', directUpdateError);
        }
        
        // 无论直接更新是否成功，都视为参与成功，因为记录已添加
        return { 
          success: true, 
          message: '成功参加活动，但参与人数统计可能不准确' 
        };
      }
      
      console.log('成功更新参与人数', updateData);
    } catch (rpcError) {
      console.error('调用RPC函数更新参与人数失败，但用户已添加到参与者列表:', rpcError);
      // 尝试直接更新数据库
      try {
        // 获取当前活动信息
        const { data: activity, error: activityError } = await supabase
          .from('activities')
          .select('participants_count')
          .eq('id', activityId)
          .single();
        
        if (activityError) {
          console.error('获取活动信息失败:', activityError);
        } else {
          // 直接更新参与人数
          const { error: directUpdateError } = await supabase
            .from('activities')
            .update({ 
              participants_count: (activity.participants_count || 0) + 1 
            })
            .eq('id', activityId);
          
          if (directUpdateError) {
            console.error('直接更新参与人数失败:', directUpdateError);
          } else {
            console.log('成功直接更新参与人数');
          }
        }
      } catch (directUpdateError) {
        console.error('直接更新参与人数过程中出错:', directUpdateError);
      }
      
      // 无论直接更新是否成功，都视为参与成功，因为记录已添加
      return { success: true, message: '成功参加活动，但参与人数统计可能不准确' };
    }
    
    return { success: true, message: '成功参加活动' };
  } catch (error) {
    console.error('处理参与活动过程中出错:', error);
    return { 
      success: false, 
      message: '参加活动过程中出错: ' + (error instanceof Error ? error.message : '未知错误'), 
      error 
    };
  }
}

// 取消参加活动
export async function leaveActivity(activityId: string, userId: string) {
  const browserClient = createBrowserSupabaseClient();
  // 删除参与记录
  const { error } = await browserClient
    .from('activity_participants')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  // 获取当前活动参与人数
  const { data: activity, error: activityError } = await browserClient
    .from('activities')
    .select('participants_count')
    .eq('id', activityId)
    .single();

  if (activityError) {
    throw activityError;
  }

  // 更新活动参与人数
  await browserClient
    .from('activities')
    .update({
      participants_count: Math.max(0, activity.participants_count - 1),
    })
    .eq('id', activityId);
}

/**
 * 获取用户参与的活动
 */
export async function getUserActivities(userId: string): Promise<Activity[]> {
  console.log('获取用户参与的活动', userId);
  const supabase = createBrowserSupabaseClient();
  
  try {
    // 1. 获取用户创建的活动
    const { data: createdActivities, error: createdError } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId);
    
    if (createdError) {
      console.error('获取用户创建的活动失败:', createdError);
      throw new Error('无法获取您创建的活动');
    }
    
    // 2. 获取用户参与的活动
    const { data: participations, error: participationsError } = await supabase
      .from('activity_participants')
      .select('activity_id')
      .eq('user_id', userId);
    
    if (participationsError) {
      console.error('获取用户参与活动失败:', participationsError);
      throw new Error('无法获取您参与的活动');
    }
    
    // 3. 获取参与活动的详细信息
    let participatedActivities: Activity[] = [];
    if (participations && participations.length > 0) {
      const activityIds = participations.map(p => p.activity_id);
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .in('id', activityIds)
        .neq('user_id', userId);
      
      if (activitiesError) {
        console.error('获取活动详情失败:', activitiesError);
        throw new Error('无法获取活动详情');
      }
      
      participatedActivities = activities || [];
    }
    
    // 4. 合并两种活动并添加标记
    const allActivities = [
      ...(createdActivities || []).map(activity => ({
        ...activity,
        is_joined: true,
        is_creator: true
      })),
      ...participatedActivities.map(activity => ({
        ...activity,
        is_joined: true,
        is_creator: false
      }))
    ];
    
    // 5. 转换为Activity类型并返回
    return allActivities.map(data => ({
      id: data.id,
      title: data.title,
      description: data.description,
      location: data.location,
      start_time: data.date || data.start_time,
      end_time: data.end_date || data.end_time || data.date || data.start_time,
      image_url: data.image_url || '',
      category: Array.isArray(data.category) ? data.category : [data.category],
      max_participants: data.attendees_limit || data.max_participants,
      participants_count: data.participants_count || 0,
      created_at: data.created_at,
      creator_id: data.user_id,
      city: data.city,
      price: data.price,
      requirements: data.requirements,
      is_online: data.is_online,
      organizer: data.organizer_name,
      organizerInfo: data.description,
      is_joined: true,
      is_creator: data.is_creator
    }));
  } catch (error) {
    console.error('获取用户活动出错:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('获取用户活动失败');
    }
  }
}

// 获取用户收藏的活动
export async function getUserFavorites(userId: string) {
  const browserClient = createBrowserSupabaseClient();
  const { data, error } = await browserClient
    .from('activity_favorites')
    .select('activity_id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const activityIds = data.map(item => item.activity_id);
  const { data: activities, error: activitiesError } = await browserClient
    .from('activities')
    .select('*')
    .in('id', activityIds);

  if (activitiesError) {
    throw activitiesError;
  }

  return activities as Activity[];
}

// 获取活动参与者
export async function getActivityParticipants(activityId: string) {
  const browserClient = createBrowserSupabaseClient();
  const { data, error } = await browserClient
    .from('activity_participants')
    .select('user_id')
    .eq('activity_id', activityId);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const userIds = data.map(item => item.user_id);
  console.log("从activity_participants表获取到的用户IDs:", userIds);
  
  // 先尝试从profiles表获取用户信息
  let { data: users, error: usersError } = await browserClient
    .from('profiles')
    .select('id, user_id, username, avatar_url')
    .in('user_id', userIds);

  // 如果profiles查询出错，尝试通过users表获取
  if (usersError || !users || users.length < userIds.length) {
    console.log("从profiles表获取用户信息出错或不完整，尝试从users表获取:", usersError);
    const { data: usersFromUsers, error: usersFromUsersError } = await browserClient
      .from('users')
      .select('id, username')
      .in('id', userIds);
      
    if (usersFromUsersError) {
      console.error("从users表获取用户信息也失败:", usersFromUsersError);
      throw usersFromUsersError;
    }
    
    if (usersFromUsers && usersFromUsers.length > 0) {
      // 合并从users表获取的用户信息
      if (!users) users = [];
      
      // 检查哪些用户在profiles表中缺失
      const existingUserIds = users.map(u => u.user_id);
      const missingUsers = usersFromUsers.filter(u => !existingUserIds.includes(u.id));
      
      // 添加缺失的用户信息
      missingUsers.forEach(user => {
        users.push({
          id: user.id,
          user_id: user.id,
          username: user.username,
          avatar_url: ""
        });
      });
      
      console.log("已合并users表的用户信息，现在共有", users.length, "位参与者");
    }
  }

  if (!users || users.length === 0) {
    console.warn("无法获取任何参与者信息");
    return [];
  }

  console.log("最终获取到的参与者信息:", users);
  return users;
}

// 收藏活动
export async function favoriteActivity(activityId: string, userId: string) {
  const browserClient = createBrowserSupabaseClient();
  // 检查是否已收藏
  const { data: existingFavorite, error: favoriteError } = await browserClient
    .from('activity_favorites')
    .select('*')
    .eq('activity_id', activityId)
    .eq('user_id', userId);

  if (favoriteError) {
    throw favoriteError;
  }

  if (existingFavorite && existingFavorite.length > 0) {
    throw new Error('您已经收藏了此活动');
  }

  // 添加收藏记录
  const { error } = await browserClient
    .from('activity_favorites')
    .insert([
      { activity_id: activityId, user_id: userId }
    ]);

  if (error) {
    throw error;
  }
}

// 取消收藏活动
export async function unfavoriteActivity(activityId: string, userId: string) {
  const browserClient = createBrowserSupabaseClient();
  const { error } = await browserClient
    .from('activity_favorites')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

// 获取用户信息
export async function getUserInfo(userId: string) {
  const browserClient = createBrowserSupabaseClient();
  try {
    const { data, error } = await browserClient
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('未找到用户信息');
    }
    
    return data;
  } catch (error) {
    console.error('获取用户信息出错:', error);
    throw error;
  }
}