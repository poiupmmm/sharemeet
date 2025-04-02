"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Share2, 
  Edit, 
  ArrowLeft,
  HeartOff,
  Copy,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user-store";
import { useActivityStore } from "@/store/activity-store";
import React from "react";
import { 
  joinActivity, 
  leaveActivity, 
  favoriteActivity, 
  unfavoriteActivity,
  getActivityParticipants,
  deleteActivity
} from "@/lib/activities";
import { formatDateTime } from "@/lib/utils";
import { Activity as LibActivity } from '@/lib/activities';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';

// 图标组件
const BackIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
  </svg>
);

const ShareIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  </svg>
);

const LocationIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
  </svg>
);

const PriceIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
);

const HomeIcon = () => (
  <span className="material-icons">home</span>
);

const ExploreIcon = () => (
  <span className="material-icons">explore</span>
);

const ChatIcon = () => (
  <span className="material-icons">chat</span>
);

const PersonIcon = () => (
  <span className="material-icons">person</span>
);

// 活动数据类型定义扩展自lib中的Activity定义
interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  imageUrl: string; // 前端使用imageUrl而不是image_url
  date: string;
  category: string | string[];
  max_participants?: number;
  participants_count: number;
  created_at?: string;
  organizer_id?: string;
  creator_id?: string;
  city?: string;
  price: string; // 在前端页面中price是字符串类型
  requirements: string;
  is_online?: boolean;
  organizer: string;
  organizerInfo: string;
  is_joined?: boolean;
  attendees?: string[];
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const params = useParams() || {};
  
  // 获取活动ID (根据路由参数类型做了转换)
  const activityId = typeof params.id === 'string' ? params.id : 
                    Array.isArray(params.id) ? params.id[0] : null;
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);
  const [leaving, setLeaving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogAction, setDialogAction] = useState<() => void>(() => {});
  const [isCreator, setIsCreator] = useState(false);  // 添加状态：是否是创建者
  const [creatorInfo, setCreatorInfo] = useState<any>(null);  // 添加状态：创建者信息
  
  // 添加分享相关状态
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // 添加收藏相关状态
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  
  // 从store获取活动数据和方法
  const currentActivity = useActivityStore((state) => state.currentActivity);
  const fetchActivity = useActivityStore((state) => state.fetchActivity);
  const userActivities = useActivityStore((state) => state.userActivities);
  const fetchUserActivities = useActivityStore((state) => state.fetchUserActivities);
  const userFavorites = useActivityStore((state) => state.userFavorites);
  const fetchUserFavorites = useActivityStore((state) => state.fetchUserFavorites);

  // 初始化Supabase客户端
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const supabaseClient = createBrowserSupabaseClient();
        setSupabase(supabaseClient);
      } catch (error) {
        console.error('初始化Supabase客户端失败:', error);
      }
    };
    
    initSupabase();
  }, []);

  // 检查登录状态
  useEffect(() => {
    // 检查Supabase会话和cookie
    const checkLoginStatus = async () => {
      try {
        // 先从cookie获取基本信息
        const cookies = document.cookie.split(';');
        const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
        const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
        
        const cookieLoggedIn = isLoggedInCookie?.includes('true') || false;
        const userIdValue = userIdCookie ? userIdCookie.split('=')[1].trim() : null;
        
        // 如果初始化了Supabase客户端，直接检查会话
        if (supabase) {
          try {
            // 获取当前会话
            const { data: { session }, error } = await supabase.auth.getSession();
            
            // 如果有有效会话，更新登录状态和用户ID
            if (session && session.user) {
              setIsLoggedIn(true);
              setUserId(session.user.id);
              
              // 同步更新cookie（保持前后端一致）
              if (!cookieLoggedIn) {
                document.cookie = `isLoggedIn=true; path=/; max-age=${60*60*24*7}`;
              }
              if (session.user.id !== userIdValue) {
                document.cookie = `userId=${session.user.id}; path=/; max-age=${60*60*24*7}`;
              }
              
              console.log('Supabase会话验证通过，用户已登录:', { userId: session.user.id });
              
              // 预加载用户的活动参与信息
              if (activityId) {
                fetchUserActivities(session.user.id);
                // 加载用户收藏信息
                fetchUserFavorites(session.user.id);
              }
              return;
            } else if (error) {
              console.warn('Supabase会话验证出错:', error);
            }
          } catch (supabaseError) {
            console.error('检查Supabase会话状态出错:', supabaseError);
          }
        }
        
        // 如果Supabase会话检查失败或无效，则回退到cookie验证
        if (cookieLoggedIn && userIdValue) {
          console.log('使用cookie验证用户登录状态:', { userId: userIdValue });
          setIsLoggedIn(cookieLoggedIn);
          setUserId(userIdValue);
          
          // 预加载用户的活动参与信息
          if (activityId) {
            fetchUserActivities(userIdValue);
            // 加载用户收藏信息
            fetchUserFavorites(userIdValue);
          }
        } else {
          // 都验证失败，设置为未登录状态
          setIsLoggedIn(false);
          setUserId(null);
          console.log('用户未登录');
        }
      } catch (error) {
        console.error('检查登录状态出错:', error);
        setIsLoggedIn(false);
        setUserId(null);
      }
    };
    
    checkLoginStatus();
  }, [supabase, activityId, fetchUserActivities, fetchUserFavorites]);

  // 检查用户是否已参与活动
  useEffect(() => {
    if (userId && userActivities && userActivities.length > 0 && activityId) {
      const joined = userActivities.some(activity => activity.id === activityId);
      setHasJoined(joined);
    }
  }, [userId, userActivities, activityId]);

  // 检查用户是否是活动创建者
  useEffect(() => {
    if (userId && activity) {
      // 检查活动创建者ID是否与当前用户ID相同
      // 注意：活动可能使用creator_id或user_id字段作为创建者ID
      const creatorId = activity.creator_id || (activity as any).user_id;
      const isActivityCreator = userId === creatorId;
      setIsCreator(isActivityCreator);
      
      // 如果用户是创建者，自动标记为已参与
      if (isActivityCreator && !hasJoined) {
        setHasJoined(true);
      }
      
      console.log('用户是否是活动创建者:', isActivityCreator, { userId, creatorId });
    }
  }, [userId, activity, hasJoined]);

  // 检查用户是否已收藏活动
  useEffect(() => {
    if (userId && userFavorites && userFavorites.length > 0 && activityId) {
      const favorited = userFavorites.some(favorite => favorite.id === activityId);
      setIsFavorited(favorited);
      console.log('用户是否已收藏活动:', favorited);
    }
  }, [userId, userFavorites, activityId]);

  // 加载活动详情
  useEffect(() => {
    // 无论登录状态如何，都加载活动详情
    if (activityId) {
      setLoading(true);
      setErrorMessage(null);
      
      const fetchActivityDetails = async () => {
        try {
          // 导入并调用getActivity函数
          const { getActivity, getActivityParticipants } = await import('@/lib/activities');
          
          // 获取活动详情
          const activityData = await getActivity(activityId);
          
          if (activityData) {
            // 处理日期格式 - 将原始数据格式化为人类可读格式
            const startDate = new Date(activityData.start_time);
            const endDate = activityData.end_time ? new Date(activityData.end_time) : null;
            
            // 格式化开始日期和结束日期
            const formattedStartDate = `${startDate.getMonth() + 1}月${startDate.getDate()}日 ${startDate.getHours()}:${String(startDate.getMinutes()).padStart(2, '0')}`;
            const formattedEndDate = endDate ? 
              `${endDate.getMonth() + 1}月${endDate.getDate()}日 ${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, '0')}` : 
              formattedStartDate;
            
            // 显示时间范围
            const formattedDate = startDate.toDateString() === (endDate?.toDateString() || '') ?
              `${formattedStartDate} - ${endDate?.getHours()}:${String(endDate?.getMinutes()).padStart(2, '0')}` :
              `${formattedStartDate} - ${formattedEndDate}`;
            
            // 使用类型断言处理额外的字段
            const extendedData = activityData as any;
            
            // 调试信息 - 检查城市字段和其他关键字段
            console.log('活动数据字段:', {
              city: activityData.city,
              location: activityData.location,
              price: activityData.price,
              priceType: typeof activityData.price,
              requirements: activityData.requirements,
              rawData: extendedData
            });
            
            setActivity({
              ...activityData,
              // 映射字段名
              imageUrl: activityData.image_url && activityData.image_url.trim() !== '' 
                ? activityData.image_url 
                : null,
              date: formattedDate,
              // 价格处理：确保正确显示
              price: activityData.price ? String(activityData.price) : '免费',
              category: Array.isArray(activityData.category) ? activityData.category[0] : activityData.category,
              organizer: extendedData.organizer_name || '活动组织者', // 使用活动中的组织者名称
              organizerInfo: activityData.description || '', 
              requirements: activityData.requirements || '参与要求信息', // 使用实际的参与要求数据
              attendees: []
            } as Activity);
            
            // 获取创建者ID
            const creatorId = activityData.creator_id || (activityData as any).user_id;
            if (creatorId) {
              try {
                // 导入并调用getUserInfo函数获取创建者信息
                const { getUserInfo } = await import('@/lib/activities');
                const creator = await getUserInfo(creatorId);
                console.log('获取到创建者信息:', creator);
                
                // 确保创建者信息中包含必要字段
                setCreatorInfo({
                  ...creator,
                  // 如果没有avatar_url则使用默认值
                  avatar_url: creator.avatar_url || '',
                  // username必定存在，但以防万一设置默认值
                  username: creator.username || '活动创建人'
                });
              } catch (creatorError) {
                console.error('获取创建者信息失败:', creatorError);
                // 失败时设置默认值
                setCreatorInfo({
                  username: '活动创建人',
                  avatar_url: ''
                });
              }
            } else {
              // 如果没有创建者ID，设置默认值
              setCreatorInfo({
                username: '活动创建人',
                avatar_url: ''
              });
            }
            
            // 获取活动参与者
            try {
              const participantsData = await getActivityParticipants(activityId);
              setParticipants(participantsData || []);
            } catch (participantsError) {
              console.error('获取参与者列表失败:', participantsError);
              // 不会因为参与者获取失败而影响整个页面显示
              setParticipants([]);
            }
          } else {
            setErrorMessage('未找到活动详情');
          }
        } catch (error) {
          console.error('获取活动详情失败:', error);
          setErrorMessage('加载活动详情时出错');
        } finally {
          setLoading(false);
        }
      };
      
      fetchActivityDetails();
    }
  }, [activityId]);

  // 处理退出活动
  const handleLeave = async () => {
    if (!isLoggedIn || !activityId) {
      return;
    }
    
    // 显示确认对话框
    setDialogMessage('确定要退出这个活动吗？');
    setDialogAction(() => async () => {
      try {
        setLeaving(true);
        setErrorMessage(null);
        
        console.log('开始退出活动:', { activityId, userId });
        
        // 调用退出活动函数
        await leaveActivity(activityId, userId!);
        
        console.log('成功退出活动');
        alert('已成功退出活动');
        setHasJoined(false);
        
        // 刷新活动详情
        try {
          const { getActivity } = await import('@/lib/activities');
          const updatedActivity = await getActivity(activityId);
          if (updatedActivity) {
            const convertedActivity = {
              ...updatedActivity,
              imageUrl: updatedActivity.image_url,
              date: formatDateTime(updatedActivity.start_time),
              price: updatedActivity.price?.toString() || '免费',
              category: Array.isArray(updatedActivity.category) ? updatedActivity.category[0] : updatedActivity.category,
              organizer: updatedActivity.organizer || '活动组织者',
              organizerInfo: updatedActivity.description || '',
              requirements: updatedActivity.requirements || '参与要求信息',
            } as Activity;
            setActivity(convertedActivity);
          }
        } catch (error) {
          console.error('刷新活动详情失败:', error);
        }
        
        // 刷新参与者列表
        try {
          const { getActivityParticipants } = await import('@/lib/activities');
          const updatedParticipants = await getActivityParticipants(activityId);
          setParticipants(updatedParticipants || []);
        } catch (error) {
          console.error('刷新参与者列表失败:', error);
        }
        
        // 刷新用户活动列表
        if (userId) {
          fetchUserActivities(userId);
        }
      } catch (error) {
        console.error('退出活动失败:', error);
        setErrorMessage(error instanceof Error ? error.message : '退出活动失败，请重试');
      } finally {
        setLeaving(false);
        setShowDialog(false);
      }
    });
    
    setShowDialog(true);
  };

  const handleJoin = async () => {
    // 检查用户是否已参与
    if (hasJoined) {
      return handleLeave(); // 如果已参加，则调用退出逻辑
    }
    
    // 直接使用组件状态中的登录状态，减少重复检查
    // 中间件已经确保了只有登录用户能访问此页面
    if (!isLoggedIn || !userId) {
      console.log('用户未登录或缺少用户ID，这种情况不应该出现，因为中间件应该已经拦截');
      return;
    }
    
    setJoining(true);
    setErrorMessage(null);
    
    try {
      console.log('开始报名活动:', { 
        activityId, 
        userId,
        activityTitle: activity?.title 
      });
      
      // 导入函数
      const { joinActivity, getActivity, getActivityParticipants } = await import('@/lib/activities');
      
      console.log('开始调用joinActivity函数...');
      const result = await joinActivity(activityId || ''); // 确保传入字符串，不是null
      console.log('报名结果:', result);
      
      if (result.needLogin) {
        // 只显示错误信息，不再重定向到登录页 (因为中间件已经确保了用户已登录)
        console.error('权限验证错误:', result.message);
        setErrorMessage(`登录状态验证失败: ${result.message || '请尝试刷新页面'}`);
        // 可以添加自动刷新逻辑，让用户无需手动刷新
        setTimeout(() => {
          window.location.reload();
        }, 5000); // 5秒后自动刷新
        return;
      }
      
      if (result.success) {
        alert('报名成功！');
        console.log('报名成功，正在刷新数据');
        setHasJoined(true);
        
        // 报名成功后刷新活动详情和参与者列表
        try {
          const updatedActivity = await getActivity(activityId || ''); // 确保传入字符串，不是null
          if (updatedActivity) {
            // 将updatedActivity转换为符合Activity接口的数据
            const convertedActivity = {
              ...updatedActivity,
              imageUrl: updatedActivity.image_url,
              date: formatDateTime(updatedActivity.start_time),
              price: updatedActivity.price?.toString() || '免费',
              category: Array.isArray(updatedActivity.category) ? updatedActivity.category[0] : updatedActivity.category,
              organizer: updatedActivity.organizer || '活动组织者',
              organizerInfo: updatedActivity.description || '',
              requirements: updatedActivity.requirements || '参与要求信息',
            } as Activity;
            setActivity(convertedActivity);
          }
        } catch (error) {
          console.error('刷新活动详情失败:', error);
        }
        
        try {
          const updatedParticipants = await getActivityParticipants(activityId || ''); // 确保传入字符串，不是null
          console.log('已获取更新后的参与者列表:', updatedParticipants);
          setParticipants(updatedParticipants || []);
        } catch (error) {
          console.error('刷新参与者列表失败:', error);
        }
        
        // 刷新用户活动列表
        if (userId) {
          fetchUserActivities(userId);
        }
      } else {
        setErrorMessage(result.message || '报名失败，请重试');
        console.error('报名失败:', result.message || '未知错误');
      }
    } catch (err: any) {
      console.error('报名过程出错:', err);
      setErrorMessage(err.message || '报名过程中出错，请重试');
    } finally {
      setJoining(false);
    }
  };

  // 添加分享处理函数
  const handleShare = () => {
    if (!activity) return;
    
    // 获取当前页面URL
    const url = typeof window !== 'undefined' ? window.location.href : '';
    setShareUrl(url);
    setShowShareDialog(true);
  };
  
  // 复制链接处理函数
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      
      // 3秒后重置复制成功状态
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch (err) {
      console.error('复制链接失败:', err);
    }
  };
  
  // 关闭分享弹窗
  const closeShareDialog = () => {
    setShowShareDialog(false);
    setCopySuccess(false);
  };
  
  // 分享到微信
  const shareToWeChat = () => {
    // 在微信环境中可以调用微信JS-SDK的分享接口
    // 这里简化处理，仅显示提示
    alert('请长按链接后选择"复制链接"，然后在微信中粘贴发送');
  };
  
  // 分享到微博
  const shareToWeibo = () => {
    if (!activity) return;
    
    const weiboUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`我发现了一个有趣的活动: ${activity.title}`)}&pic=${encodeURIComponent(activity.imageUrl || '')}`;
    window.open(weiboUrl, '_blank');
    closeShareDialog();
  };
  
  // 分享到QQ
  const shareToQQ = () => {
    if (!activity) return;
    
    const qqUrl = `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(activity.title)}&summary=${encodeURIComponent(activity.description)}&pics=${encodeURIComponent(activity.imageUrl || '')}`;
    window.open(qqUrl, '_blank');
    closeShareDialog();
  };

  // 分享弹窗组件
  const ShareDialog = () => {
    if (!showShareDialog) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}>
        <motion.div 
          initial={{ y: 300 }}
          animate={{ y: 0 }}
          exit={{ y: 300 }}
          style={{
            backgroundColor: 'white',
            width: '100%',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '20px',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{fontWeight: 'bold', fontSize: '18px'}}>分享活动</h3>
            <button onClick={closeShareDialog} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{marginBottom: '24px'}}>
            <p style={{marginBottom: '8px', fontWeight: 'bold'}}>活动链接</p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '8px',
            }}>
              <div style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                fontSize: '14px',
              }}>
                {shareUrl}
              </div>
              <button 
                onClick={handleCopyLink} 
                style={{
                  background: copySuccess ? '#4caf50' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px',
                  transition: 'background 0.3s',
                }}
              >
                {copySuccess ? '已复制' : (
                  <>
                    <Copy size={14} />
                    <span>复制</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div style={{marginBottom: '24px'}}>
            <p style={{marginBottom: '16px', fontWeight: 'bold'}}>分享到</p>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              gap: '16px',
            }}>
              <div onClick={shareToWeChat} style={{textAlign: 'center', cursor: 'pointer'}}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#2aae67',
                  borderRadius: '50%',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>
                  <span style={{fontWeight: 'bold'}}>微信</span>
                </div>
                <span style={{fontSize: '14px'}}>微信</span>
              </div>
              
              <div onClick={shareToWeibo} style={{textAlign: 'center', cursor: 'pointer'}}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#e6162d',
                  borderRadius: '50%',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>
                  <span style={{fontWeight: 'bold'}}>微博</span>
                </div>
                <span style={{fontSize: '14px'}}>微博</span>
              </div>
              
              <div onClick={shareToQQ} style={{textAlign: 'center', cursor: 'pointer'}}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  backgroundColor: '#12b7f5',
                  borderRadius: '50%',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>
                  <span style={{fontWeight: 'bold'}}>QQ</span>
                </div>
                <span style={{fontSize: '14px'}}>QQ</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={closeShareDialog}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#f5f5f5',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              marginTop: '8px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
        </motion.div>
      </div>
    );
  };

  // 自定义CSS样式
  const styles = {
    container: {
      maxWidth: '480px',
      margin: '0 auto',
      background: 'white',
      minHeight: '100vh',
      paddingBottom: '80px',
    },
    header: {
      position: 'relative' as const,
      height: '250px',
    },
    headerImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    backButton: {
      position: 'absolute' as const,
      top: '16px',
      left: '16px',
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 10,
    },
    shareButton: {
      position: 'absolute' as const,
      top: '16px',
      right: '16px',
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 10,
    },
    favoriteButton: {
      position: 'absolute' as const,
      top: '70px',
      right: '16px',
      background: 'rgba(0,0,0,0.5)',
      color: 'white',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 10,
    },
    content: {
      padding: '20px',
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      marginBottom: '16px',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px',
    },
    infoText: {
      marginLeft: '8px',
      fontSize: '14px',
    },
    infoIcon: {
      marginRight: '12px',
      color: '#2563eb',
    },
    section: {
      marginTop: '24px',
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      marginBottom: '12px',
      color: '#333',
    },
    description: {
      lineHeight: '1.6',
      color: '#444',
      whiteSpace: 'pre-line',
    },
    organizerAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover' as const,
      marginRight: '16px',
    },
    organizerInfo: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      background: '#f8f9fa',
      borderRadius: '12px',
      marginBottom: '24px',
    },
    organizerName: {
      fontWeight: '600',
    },
    badge: {
      background: '#E8F0FE',
      color: '#2563eb',
      padding: '4px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'inline-block',
      marginBottom: '16px',
    },
    participants: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      marginTop: '12px',
    },
    participant: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    participantAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover' as const,
      marginBottom: '4px',
    },
    participantName: {
      fontSize: '12px',
      color: '#666',
    },
    joinButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '300px',
      display: 'block',
      margin: '0 auto',
    },
    joinedButton: {
      backgroundColor: '#10b981',
      cursor: 'default',
    },
    loadingButton: {
      opacity: 0.7,
      cursor: 'wait',
    },
    bottomNav: {
      position: 'fixed' as const,
      bottom: '0',
      width: '100%',
      maxWidth: '480px',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0',
      background: 'white',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      zIndex: 10,
    },
    navItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      color: '#666',
    },
    navItemActive: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      color: '#2563eb',
    },
    actionContainer: {
      marginTop: '24px',
      marginBottom: '24px',
    },
    errorMessage: {
      color: '#EF4444',
      marginTop: '12px',
      padding: '12px',
      borderRadius: '8px',
      background: '#FEE2E2',
    },
  };

  // 渲染参与者
  const renderParticipants = () => {
    if (!participants || participants.length === 0) {
      // 当没有参与者数据时，至少显示创建者
      return (
        <div style={styles.participants}>
          <div style={styles.participant}>
            <img 
              src={creatorInfo?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333333'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"} 
              alt={creatorInfo?.username || "活动创建人"} 
              style={styles.participantAvatar}
            />
            <span style={styles.participantName}>
              {creatorInfo?.username || "活动创建人"}
              <span style={{marginLeft: '4px', color: '#2563eb', fontSize: '12px'}}>
                (创建者)
              </span>
            </span>
          </div>
        </div>
      );
    }
    
    console.log('渲染参与者列表:', participants);
    
    return (
      <div style={styles.participants}>
        {participants.map((participant, index) => {
          // 使用SVG作为默认头像
          const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333333'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
          
          // 确保avatar_url不为空字符串
          const avatarUrl = participant.avatar_url && participant.avatar_url.trim() !== '' 
            ? participant.avatar_url 
            : defaultAvatar;
            
          // 使用索引或id作为key，确保不会有重复
          const participantKey = participant.id || `participant-${index}`;
          const displayName = participant.username || `用户${index+1}`;
          
          // 用于确定是否为创建者的ID，兼容两种可能的字段名
          const participantUserId = participant.user_id || participant.id;
          const isCreator = activity && 
                           (participantUserId === activity.creator_id || 
                            participantUserId === (activity as any).user_id);
          
          return (
            <div key={participantKey} style={styles.participant}>
              <img 
                src={avatarUrl} 
                alt={displayName} 
                style={styles.participantAvatar}
              />
              <span style={styles.participantName}>
                {displayName}
                {isCreator && (
                  <span style={{marginLeft: '4px', color: '#2563eb', fontSize: '12px'}}>
                    (创建者)
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // 简单的对话框组件
  const Dialog = () => {
    if (!showDialog) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            width: '80%',
            maxWidth: '300px',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <p style={{ 
            margin: '0 0 20px 0', 
            textAlign: 'center',
            fontSize: '16px'
          }}>{dialogMessage}</p>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <button 
              onClick={() => setShowDialog(false)}
              style={{
                flex: 1,
                marginRight: '8px',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#f1f1f1',
                color: '#333',
                cursor: 'pointer'
              }}
            >
              取消
            </button>
            <button 
              onClick={dialogAction}
              style={{
                flex: 1,
                marginLeft: '8px',
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              确定
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  // 在"参与活动"按钮附近添加处理逻辑
  const renderActionButtons = () => {
    // 无论登录状态如何，都显示参与活动按钮，登录验证由中间件统一处理
    if (!isLoggedIn) {
      return (
        <Button className="w-full" onClick={() => {
          // 如果未登录，点击后会被中间件重定向到登录页，这里可以添加额外的用户提示
          alert('请先登录后再参与活动');
        }}>
          参与活动
        </Button>
      );
    }
    
    if (isCreator) {
      // 如果是创建者，显示管理活动的按钮
      return (
        <div style={{display: 'flex', gap: '10px', width: '100%'}}>
          <button 
            style={{
              flex: 1,
              padding: '12px 0',
              border: '1px solid #3b82f6',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#3b82f6',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onClick={() => router.push(`/activities/create?edit=true&id=${activityId}`)}
          >
            <Edit size={16} className="mr-2" /> 编辑活动
          </button>
          <button 
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: 'white',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
            onClick={handleDissolveActivity}
          >
            解散活动
          </button>
        </div>
      );
    }
    
    // 根据是否已参与显示不同按钮
    return hasJoined ? (
      <button
        style={{
          width: '100%',
          padding: '12px 0',
          border: '1px solid #3b82f6',
          borderRadius: '8px',
          backgroundColor: 'white',
          color: '#3b82f6',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
        }}
        disabled={leaving}
        onClick={handleLeave}
      >
        {leaving ? '退出中...' : '退出活动'}
      </button>
    ) : (
      <Button className="w-full" disabled={joining} onClick={handleJoin}>
        {joining ? '报名中...' : '参与活动'}
      </Button>
    );
  };

  // 添加解散活动的函数
  const handleDissolveActivity = () => {
    if (!activityId || !isCreator) return;
    
    // 显示确认对话框
    setDialogMessage('确定要解散这个活动吗？此操作不可撤销。');
    setDialogAction(() => async () => {
      try {
        setErrorMessage(null);
        console.log('准备解散活动:', activityId);

        if (!userId) {
          console.error('用户ID为空，无法解散活动');
          setErrorMessage('用户ID为空，请重新登录后再尝试');
          setShowDialog(false);
          return;
        }
        
        const { deleteActivity } = await import('@/lib/activities');
        await deleteActivity(activityId, userId);
        alert('活动已成功解散');
        router.push('/activities');
      } catch (error) {
        console.error('解散活动失败:', error);
        // 提取更具体的错误信息
        let errorMsg = '未知错误';
        
        if (error instanceof Error) {
          errorMsg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          // 尝试从Supabase错误对象中提取信息
          const errorObj = error as any;
          if (errorObj.message) {
            errorMsg = errorObj.message;
          } else if (errorObj.error) {
            errorMsg = errorObj.error;
          } else if (errorObj.details) {
            errorMsg = errorObj.details;
          }
        }
        
        setErrorMessage(`解散活动失败: ${errorMsg}`);
        alert(`解散活动失败: ${errorMsg}`);
      } finally {
        setShowDialog(false);
      }
    });
    
    setShowDialog(true);
  };

  // 处理收藏/取消收藏活动
  const handleFavorite = async () => {
    if (!isLoggedIn || !activityId) {
      // 未登录，显示提示对话框
      setDialogMessage('收藏活动需要先登录，是否前往登录页面？');
      setDialogAction(() => () => {
        try {
          console.log('用户确认登录，执行跳转...');
          // 设置登录后重定向回当前页面
          document.cookie = `redirectAfterLogin=/activities/${activityId}; path=/; max-age=3600`;
          // 跳转到登录页面
          router.push('/auth');
        } catch (routerError) {
          console.error('路由跳转失败:', routerError);
          // 备选方案
          window.location.href = '/auth';
        }
        setShowDialog(false);
      });
      
      setShowDialog(true);
      return;
    }
    
    setFavoriting(true);
    
    try {
      if (isFavorited) {
        // 取消收藏
        console.log('开始取消收藏:', { activityId, userId });
        await unfavoriteActivity(activityId, userId!);
        setIsFavorited(false);
        console.log('成功取消收藏');
        // 显示成功消息
        setErrorMessage(null);
        alert('已取消收藏');
      } else {
        // 添加收藏
        console.log('开始收藏:', { activityId, userId });
        await favoriteActivity(activityId, userId!);
        setIsFavorited(true);
        console.log('成功收藏');
        // 显示成功消息
        setErrorMessage(null);
        alert('已添加到收藏');
      }
      
      // 刷新用户收藏列表
      if (userId) {
        fetchUserFavorites(userId);
      }
    } catch (error) {
      console.error('收藏操作失败:', error);
      setErrorMessage(error instanceof Error ? error.message : '收藏操作失败，请重试');
    } finally {
      setFavoriting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 对话框组件 */}
      <Dialog />
      
      {/* 分享对话框组件 */}
      <ShareDialog />
      
      {/* 如果正在加载，显示加载中状态 */}
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <p>加载中...</p>
        </div>
      ) : !activity ? (
        <div style={{padding: '20px', textAlign: 'center'}}>
          <h2 style={{marginBottom: '16px'}}>未找到活动</h2>
          <p style={{marginBottom: '24px'}}>该活动不存在或已被删除</p>
          <button 
            onClick={() => router.push('/activities')}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            返回活动列表
          </button>
        </div>
      ) : (
        <>
          <div style={styles.header}>
            {activity.imageUrl ? (
              <img 
                src={activity.imageUrl} 
                alt={activity.title} 
                style={styles.headerImage}
              />
            ) : (
              <div style={{
                ...styles.headerImage,
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                暂无图片
              </div>
            )}
            <div 
              style={styles.backButton}
                  onClick={() => router.back()}
                >
              <BackIcon />
              </div>
            <div style={styles.shareButton} onClick={handleShare}>
              <ShareIcon />
            </div>
            {/* 添加收藏按钮 */}
            <div 
              style={{
                ...styles.favoriteButton,
                backgroundColor: isFavorited ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 0, 0, 0.5)',
              }} 
              onClick={handleFavorite}
            >
              {isFavorited ? (
                <Heart size={20} fill="#ffffff" color="#ffffff" />
              ) : (
                <Heart size={20} />
              )}
            </div>
          </div>
          
          <div style={styles.content}>
            <span style={styles.badge}>{activity.category}</span>
            <h1 style={styles.title}>{activity.title}</h1>
            
            <div style={{...styles.infoItem, marginBottom: '15px'}}>
              <span style={{...styles.infoIcon, fontSize: '18px'}}><CalendarIcon /></span>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontWeight: 'bold', color: '#333', marginBottom: '3px'}}>时间</span>
                <span>{activity.date}</span>
              </div>
            </div>
            
            <div style={{...styles.infoItem, marginBottom: '15px'}}>
              <span style={{...styles.infoIcon, fontSize: '18px'}}><LocationIcon /></span>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontWeight: 'bold', color: '#333', marginBottom: '3px'}}>地点</span>
                <span>{activity.city ? `${activity.city} ${activity.location}` : activity.location}</span>
              </div>
            </div>
              
            <div style={{...styles.infoItem, marginBottom: '15px'}}>
              <span style={{...styles.infoIcon, fontSize: '18px'}}><PriceIcon /></span>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontWeight: 'bold', color: '#333', marginBottom: '3px'}}>费用</span>
                <span>{activity.price}</span>
              </div>
            </div>
            
            <div style={{...styles.infoItem, marginBottom: '15px'}}>
              <span style={{...styles.infoIcon, fontSize: '18px'}}><UserIcon /></span>
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <span style={{fontWeight: 'bold', color: '#333', marginBottom: '3px'}}>参与人数</span>
                <span>
                  {(activity?.participants_count && activity.participants_count > 0) 
                    ? `${activity.participants_count}人` 
                    : (participants && participants.length > 0) 
                      ? `${participants.length}人` 
                      : "1人"  // 默认至少有创建者参与
                  }
                  {activity.max_participants ? 
                    <span style={{
                      background: '#ffedcc',
                      color: '#f59e0b',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      marginLeft: '6px',
                      fontWeight: 'bold',
                    }}>
                      上限{activity.max_participants}人
                    </span> : 
                    ''
                  }
                </span>
              </div>
            </div>
            
            {/* 隐藏活动创建人信息区块 */}
            <div style={{...styles.organizerInfo, display: 'none'}}>
              <img 
                src={creatorInfo?.avatar_url || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333333'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                alt={creatorInfo?.username || "活动创建人"} 
                style={styles.organizerAvatar}
              />
              <div>
                <div style={styles.organizerName}>{creatorInfo?.username || "活动创建人"}</div>
                <div style={{fontSize: '12px', color: '#666'}}>活动创建人</div>
              </div>
            </div>
            
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>活动详情</h2>
              <p style={styles.description}>{activity.description}</p>
            </div>
            
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>已报名 ({participants.length > 0 ? participants.length : 1})</h2>
              {renderParticipants()}
            </div>
            </div>
            
          <div style={styles.actionContainer}>
            {renderActionButtons()}
            
            {errorMessage && <div style={styles.errorMessage}>{errorMessage}</div>}
          </div>
          
          {/* 底部导航 */}
          <div style={styles.bottomNav}>
            <Link href="/activities" style={styles.navItem}>
              <ExploreIcon />
              <span style={{fontSize: '12px'}}>发现</span>
            </Link>
            <Link href={isLoggedIn ? "/profile" : "/auth"} style={styles.navItem}>
              <PersonIcon />
              <span style={{fontSize: '12px'}}>我的</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 