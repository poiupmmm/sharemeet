"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user-store";
import { useActivityStore } from "@/store/activity-store";
import { birthdayToZodiac, formatDate } from "@/lib/utils";
import { getCurrentUser, checkUserLoggedIn, signOut, updateUserProfile } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { User } from "@/lib/auth";
import LoginChecker from '@/components/shared/LoginChecker';

// 图标组件
const ExploreIcon = () => (
  <span className="material-icons">explore</span>
);

const PersonIcon = () => (
  <span className="material-icons">person</span>
);

const EditIcon = () => (
  <span className="material-icons">edit</span>
);

const CakeIcon = () => (
  <span className="material-icons">cake</span>
);

const LocationIcon = () => (
  <span className="material-icons">location_on</span>
);

const DescriptionIcon = () => (
  <span className="material-icons">description</span>
);

// 添加新的图标组件
const FavoriteIcon = () => (
  <span className="material-icons">favorite</span>
);

const EventIcon = () => (
  <span className="material-icons">event</span>
);

const CameraIcon = () => (
  <span className="material-icons">camera_alt</span>
);

const PhotoIcon = () => (
  <span className="material-icons">add_a_photo</span>
);

const StarIcon = () => (
  <span className="material-icons">star</span>
);

export default function ProfilePage() {
  const router = useRouter();
  const fetchUser = useUserStore((state) => state.fetchUser);
  const setUserState = useUserStore((state) => state.setUser);
  const storeUser = useUserStore((state) => state.user);
  const userActivities = useActivityStore((state) => state.userActivities);
  const fetchUserActivities = useActivityStore((state) => state.fetchUserActivities);
  const userFavorites = useActivityStore((state) => state.userFavorites);
  const fetchUserFavorites = useActivityStore((state) => state.fetchUserFavorites);
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dataSource, setDataSource] = useState<'local' | 'remote'>('local');
  const [lastSync, setLastSync] = useState<string | null>(null);
  // 添加选项卡状态
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTab, setActiveSubTab] = useState('created'); // 添加子标签页状态
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bgImagePreview, setBgImagePreview] = useState<string | null>(null);
  const [bgImageFile, setBgImageFile] = useState<File | null>(null);
  const [isBgUploading, setIsBgUploading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 首先从localStorage获取数据
        const localData = localStorage.getItem('userData');
        let userData = localData ? JSON.parse(localData) : null;
        
        if (userData) {
          console.log('从localStorage获取到用户数据:', userData);
          console.log('背景图片URL:', userData.background_image_url); // 添加调试日志
          setUser(userData);
          setDataSource('local');
          
          // 尝试从远程获取最新数据
          try {
            console.log('尝试从远程获取最新数据');
            const browserClient = createBrowserSupabaseClient();
            
            const { data, error } = await browserClient
              .from('profiles')
              .select('*')
              .eq('username', userData.username)
              .single();
            
            if (error) {
              console.error('获取远程数据失败:', {
                code: error.code,
                message: error.message,
                details: error.details
              });
              
              if (error.code === 'PGRST116') {
                console.log('用户资料不存在，建议创建新记录');
                return null;
              }
              
              if (error.code === '22P02') {
                throw new Error('无法连接数据库，请检查网络');
              }
              
              return null;
            }
            
            if (!data) {
              console.warn('获取到空数据，用户ID:', userData.id);
              return null;
            }
            
            if (!data.user_id || !data.username) {
              console.error('无效的用户资料数据:', data);
              throw new Error('服务器返回了无效的用户资料格式');
            }
            
            // 将获取的数据合并到当前用户数据
            const mergedData = {
              ...userData,
              ...data,
              // 保留一些可能在本地更新但API返回中没有的字段
              email: userData.email
            };
            
            console.log('从服务器获取的合并数据:', mergedData);
            console.log('服务器上的背景图片URL:', data.background_image_url); // 添加调试日志
            
            setUser(mergedData);
            localStorage.setItem('userData', JSON.stringify(mergedData));
            setDataSource('remote');
            setLastSync(new Date().toLocaleString());
            console.log('成功同步远程数据');
          } catch (remoteError) {
            console.error('同步远程数据时出错:', remoteError);
          }
        } else {
          // 尝试获取当前用户数据
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setDataSource('local');
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // 获取用户登录后的数据
    const loadUserData = () => {
      setIsLoggedIn(true);
      fetchUserData();
      
      // 获取当前用户ID
      const cookies = document.cookie.split(';');
      const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
      const userId = userIdCookie ? userIdCookie.split('=')[1].trim() : null;
      
      if (userId) {
        // 获取用户参与的活动
        fetchUserActivities(userId);
        // 获取用户收藏的活动
        fetchUserFavorites(userId);
      }
    };

    // 立即加载数据
    loadUserData();
  }, [fetchUserActivities, fetchUserFavorites]);

  // 手动刷新数据
  const refreshUserData = async () => {
    if (!user || !user.username) return;
    
    try {
      setIsLoading(true);
      console.log('正在手动刷新用户数据...');
      console.log('用户名:', user.username);
      
      const browserClient = createBrowserSupabaseClient();
      
      // 首先尝试列出表中前几条记录，检查表结构
      try {
        const { data: sampleData, error: sampleError } = await browserClient
          .from('profiles')
          .select('*')
          .limit(5);
          
        console.log('数据库profiles表样本:', sampleData?.length || 0, '条记录');
        if (sampleData && sampleData.length > 0) {
          console.log('示例记录结构:', sampleData[0]);
          
          // 检查是否有任何记录匹配当前用户名
          const matchingRecord = sampleData.find((p: any) => p.username === user.username);
          if (matchingRecord) {
            console.log('找到匹配的记录:', matchingRecord);
          } else {
            console.log('在样本中未找到匹配的记录');
          }
        }
        
        if (sampleError) {
          console.error('获取数据库样本失败:', sampleError);
        }
      } catch (e) {
        console.error('尝试获取数据库样本时出错:', e);
      }
      
      // 检查profiles表中是否存在记录
      console.log('正在查询用户资料, username =', user.username);
      const { data, error } = await browserClient
        .from('profiles')
        .select('*')
        .eq('username', user.username)
        .maybeSingle();
      
      console.log('查询结果:', { found: !!data, error });
      
      if (error) {
        console.error('刷新用户数据失败:', error);
        alert(`无法从服务器获取最新数据: ${error.message}`);
        return;
      }
      
      if (data) {
        console.log('获取到最新用户数据:', data);
        
        // 合并数据并更新
        const mergedData = {
          ...user,
          ...data,
          email: user.email, // 确保保留email字段
          // 确保字段名一致
          full_name: data.full_name || user.full_name || '',
          bio: data.bio || '',
          location: data.location || '',
          birthday: data.birthday || '',
          hobbies: data.hobbies || [],
          avatar_url: data.avatar_url || ''
        };
        
        setUser(mergedData);
        localStorage.setItem('userData', JSON.stringify(mergedData));
        setDataSource('remote');
        setLastSync(new Date().toLocaleString());
        alert('数据已成功同步');
      } else {
        // 用户资料不存在
        console.log('服务器上不存在用户资料，可能需要编辑并保存');
        alert('服务器上未找到您的资料，请编辑并保存您的个人资料');
      }
    } catch (error: any) {
      console.error('刷新数据时出错:', error);
      alert(`刷新数据时出错: ${error.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加退出登录处理函数
  const handleLogout = async () => {
    try {
      // 清除登录状态
      await signOut();
      // 清除本地存储的用户数据
      localStorage.removeItem('userData');
      // 重定向到登录页面
      router.push('/auth');
    } catch (error) {
      console.error('退出登录失败:', error);
      alert('退出登录失败，请重试');
    }
  };

  // 添加处理头像上传的函数
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 压缩图片函数
  const compressImage = (dataUrl: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        // 计算缩放比例
        if (width > maxWidth) {
          height = Math.floor(height * (maxWidth / width));
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.floor(width * (maxHeight / height));
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('获取canvas上下文失败'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // 使用较低的质量来减小文件大小
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('图片加载失败'));
    });
  };

  // 添加保存头像的函数
  const saveAvatar = async () => {
    if (!user || !imagePreview) return;
    
    try {
      setIsUploading(true);
      
      // 压缩图片
      const compressedImageUrl = await compressImage(imagePreview);
      
      // 构建更新数据
      const updatedProfile = {
        ...user,
        username: user.username,
        avatar_url: compressedImageUrl,
      };
      
      // 为localStorage创建一个不包含大型图片数据的对象
      const localStorageUser = {
        ...user,
        username: user.username,
        // 仅存储小型缩略图或仅存储引用
        avatar_url_small: compressedImageUrl.length > 50000 
          ? await compressImage(compressedImageUrl, 50, 50) // 更小的缩略图
          : compressedImageUrl
      };
      
      // 乐观更新本地状态，但不包含完整图片
      setUser(updatedProfile);
      try {
        // 尝试存储精简版用户数据
        localStorage.setItem('userData', JSON.stringify(localStorageUser));
      } catch (storageError) {
        console.warn('无法将完整用户数据保存到localStorage，将尝试移除图片数据', storageError);
        // 移除图片数据后再次尝试
        const minimalUser = {
          ...localStorageUser,
          avatar_url: null, // 不存储完整图片
          avatar_url_small: null // 也不存储缩略图
        };
        localStorage.setItem('userData', JSON.stringify(minimalUser));
      }
      
      // 发送更新请求
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // 如果更新失败，恢复原始数据
        setUser(user);
        try {
          localStorage.setItem('userData', JSON.stringify(user));
        } catch (e) {
          console.warn('恢复用户数据失败，localStorage可能已满');
          // 尝试存储无图像版本
          const userWithoutImage = {...user, avatar_url: null};
          localStorage.setItem('userData', JSON.stringify(userWithoutImage));
        }
        throw new Error(result.error || '更新失败');
      }
      
      // 成功后清除临时数据
      setImageFile(null);
      
      // 更新成功
      alert('头像更新成功!');
    } catch (error: any) {
      console.error('更新头像失败:', error);
      alert(`更新头像失败: ${error.message || '未知错误'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 取消上传
  const cancelUpload = () => {
    setImagePreview(user?.avatar_url || null);
    setImageFile(null);
  };

  // 添加处理背景图片上传的函数
  const handleBgImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 首先读取文件为DataURL并设置预览
    setBgImageFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBgImagePreview(e.target.result as string);
        // 直接调用保存函数，无需用户确认
        saveBgImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // 添加保存背景图片的函数 - 参照saveAvatar函数的逻辑
  const saveBgImage = async (imageDataUrl: string) => {
    if (!user) return;
    
    try {
      setIsBgUploading(true);
      console.log('开始保存背景图片...');
      
      // 压缩图片
      const compressedImageUrl = await compressImage(imageDataUrl);
      console.log('图片压缩完成，大小:', compressedImageUrl.length);
      
      // 构建更新数据
      const updatedProfile = {
        ...user,
        username: user.username,
        background_image_url: compressedImageUrl,
      };
      
      // 打印请求体（去除图像数据以便查看）
      const debugPayload = {
        ...updatedProfile,
        background_image_url: compressedImageUrl ? '(图片数据已省略)' : null
      };
      console.log('请求体内容:', debugPayload);
      console.log('请求体中是否包含background_image_url字段:', 'background_image_url' in updatedProfile);
      
      // 为localStorage创建一个不包含大型图片数据的对象
      const localStorageUser = {
        ...user,
        username: user.username,
        background_image_url: compressedImageUrl
      };
      
      // 先更新本地状态
      setUser(updatedProfile);
      try {
        // 尝试存储到localStorage
        localStorage.setItem('userData', JSON.stringify(localStorageUser));
        console.log('已保存背景图片到localStorage:', 'background_image_url' in localStorageUser);
      } catch (storageError) {
        console.warn('无法将完整用户数据保存到localStorage，将尝试移除图片数据', storageError);
        // 移除图片数据后再次尝试
        const minimalUser = {
          ...localStorageUser,
          background_image_url: null
        };
        localStorage.setItem('userData', JSON.stringify(minimalUser));
      }
      
      // 发送更新请求到服务器
      console.log('发送背景图片更新请求，用户ID:', user.id);
      
      if (!user.id) {
        throw new Error('用户ID不存在，无法更新背景图片');
      }
      
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });
      
      const result = await response.json();
      console.log('背景图片更新响应:', result);
      
      if (!response.ok) {
        // 如果更新失败，恢复原始数据
        setUser(user);
        try {
          localStorage.setItem('userData', JSON.stringify(user));
        } catch (e) {
          console.warn('恢复用户数据失败，localStorage可能已满');
          // 尝试存储无图像版本
          const userWithoutImage = {...user, background_image_url: null};
          localStorage.setItem('userData', JSON.stringify(userWithoutImage));
        }
        throw new Error(result.error || '更新失败');
      }
      
      // 验证响应中是否包含background_image_url
      if (result.profile) {
        console.log('服务器返回的profile对象包含background_image_url字段:', 'background_image_url' in result.profile);
        console.log('服务器返回的background_image_url值长度:', 
          result.profile.background_image_url ? result.profile.background_image_url.substring(0, 30) + '...' : 'null');
      }
      
      // 成功后清除临时数据
      setBgImageFile(null);
      
      // 再次更新本地存储，确保完整同步服务器数据
      if (result.profile) {
        const updatedLocalData = {
          ...user,
          ...result.profile,
          background_image_url: compressedImageUrl // 确保使用我们的图片URL
        };
        localStorage.setItem('userData', JSON.stringify(updatedLocalData));
        setUser(updatedLocalData);
        console.log('更新本地数据完成，包含background_image_url:', 'background_image_url' in updatedLocalData);
      }
      
      // 更新成功
      console.log('背景图片更新成功!');
    } catch (error: any) {
      console.error('更新背景图片失败:', error);
      alert(`更新背景图片失败: ${error.message || '未知错误'}`);
    } finally {
      setIsBgUploading(false);
    }
  };

  // 样式定义
  const styles: Record<string, React.CSSProperties> = {
    container: {
      maxWidth: '480px',
      margin: '0 auto',
      background: 'white',
      minHeight: '100vh',
      paddingBottom: '60px', // 为底部导航预留空间
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      background: '#2563eb',
      color: 'white',
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: '600',
    },
    profileHeader: {
      position: 'relative' as const,
      height: '240px',
      background: 'linear-gradient(135deg, #4080ff, #2563eb)',
      padding: '24px',
      color: 'white',
    },
    avatarWrapper: {
      position: 'absolute' as const,
      bottom: '-40px',
      left: '24px',
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '4px solid white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      objectFit: 'cover' as const,
    },
    profileContent: {
      padding: '72px 24px 24px',
    },
    profileMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    userName: {
      fontSize: '24px',
      fontWeight: '600',
    },
    editBtn: {
      background: '#2563eb',
      color: 'white',
      padding: '8px 20px',
      borderRadius: '20px',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
    },
    infoCard: {
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px 0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 0',
      borderBottom: '1px solid #eee',
    },
    iconBox: {
      width: '40px',
      height: '40px',
      borderRadius: '12px',
      background: '#e0eaff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2563eb',
    },
    interestTags: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '12px',
    },
    tag: {
      background: '#f0f0f0',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '14px',
    },
    activityGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginTop: '16px',
    },
    activityThumb: {
      width: '100%',
      height: '100px',
      borderRadius: '8px',
      objectFit: 'cover' as const,
    },
    bottomNav: {
      position: 'fixed' as const,
      bottom: '0',
      width: '100%',
      maxWidth: '480px',
      left: '50%',
      transform: 'translateX(-50%)',
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
    // 添加选项卡相关样式
    tabContainer: {
      display: 'flex',
      justifyContent: 'space-around',
      borderBottom: '1px solid #eee',
      marginBottom: '16px',
      background: 'white'
    },
    tab: {
      padding: '12px 0',
      flex: 1,
      textAlign: 'center',
      color: '#666',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    },
    activeTab: {
      color: '#2563eb',
      borderBottom: '2px solid #2563eb'
    }
  };

  // 处理选项卡切换
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // 渲染个人资料选项卡内容
  const renderProfileTab = () => (
    <>
      {/* 基本信息卡片 */}
      <div style={styles.infoCard}>
        <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>基本信息</h3>
        
        <div style={styles.infoItem}>
          <div style={styles.iconBox}>
            <span className="material-icons">person</span>
          </div>
          <div>
            <div style={{color: '#666', fontSize: '14px'}}>昵称</div>
            <div style={{marginTop: '4px'}}>{user?.full_name || '未设置'}</div>
          </div>
        </div>
        
        <div style={styles.infoItem}>
          <div style={styles.iconBox}>
            <CakeIcon />
          </div>
          <div>
            <div style={{color: '#666', fontSize: '14px'}}>生日</div>
            <div style={{marginTop: '4px'}}>{user?.birthday ? formatDate(user.birthday) : '未设置'}</div>
          </div>
        </div>
        
        <div style={styles.infoItem}>
          <div style={styles.iconBox}>
            <StarIcon />
          </div>
          <div>
            <div style={{color: '#666', fontSize: '14px'}}>星座</div>
            <div style={{marginTop: '4px'}}>{user?.birthday ? birthdayToZodiac(user.birthday) : '未设置'}</div>
          </div>
        </div>
        
        <div style={styles.infoItem}>
          <div style={styles.iconBox}>
            <LocationIcon />
          </div>
          <div>
            <div style={{color: '#666', fontSize: '14px'}}>城市</div>
            <div style={{marginTop: '4px'}}>{user?.location || '未设置'}</div>
          </div>
        </div>
        
        <div style={{...styles.infoItem, borderBottom: 'none'}}>
          <div style={styles.iconBox}>
            <DescriptionIcon />
          </div>
          <div>
            <div style={{color: '#666', fontSize: '14px'}}>个人简介</div>
            <div style={{marginTop: '4px'}}>{user?.bio || '未设置'}</div>
          </div>
        </div>
      </div>
      
      {/* 兴趣标签卡片 */}
      <div style={styles.infoCard}>
        <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>兴趣标签</h3>
        <div style={styles.interestTags}>
          {user?.hobbies && user.hobbies.length > 0 ? 
            user.hobbies.map((hobby, index) => (
              <span key={index} style={styles.tag}>{hobby}</span>
            )) : 
            <p>未添加兴趣标签</p>
          }
        </div>
      </div>
    </>
  );

  // 渲染参与活动选项卡内容
  const renderActivitiesTab = () => (
    <div style={styles.infoCard}>
      {/* 添加子标签页导航 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #eee',
        marginBottom: '16px'
      }}>
        <div 
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '8px 0',
            color: activeSubTab === 'created' ? '#2563eb' : '#666',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'created' ? '2px solid #2563eb' : 'none'
          }}
          onClick={() => setActiveSubTab('created')}
        >
          我创建的活动
        </div>
        <div 
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '8px 0',
            color: activeSubTab === 'participated' ? '#2563eb' : '#666',
            cursor: 'pointer',
            borderBottom: activeSubTab === 'participated' ? '2px solid #2563eb' : 'none'
          }}
          onClick={() => setActiveSubTab('participated')}
        >
          我参与的活动
        </div>
      </div>

      {/* 根据子标签页显示不同内容 */}
      {activeSubTab === 'created' ? (
        <>
          <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>我创建的活动</h3>
          {userActivities && userActivities.filter(activity => activity.is_creator).length > 0 ? (
            <div style={styles.activityGrid}>
              {userActivities
                .filter(activity => activity.is_creator)
                .map((activity) => (
                  <Link href={`/activities/${activity.id}`} key={activity.id}>
                    <img
                      src={activity.image_url || 'https://via.placeholder.com/150?text=活动'}
                      alt={activity.title}
                      style={styles.activityThumb}
                    />
                  </Link>
                ))}
            </div>
          ) : (
            <p>暂无创建的活动</p>
          )}
        </>
      ) : (
        <>
          <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>我参与的活动</h3>
          {userActivities && userActivities.filter(activity => !activity.is_creator).length > 0 ? (
            <div style={styles.activityGrid}>
              {userActivities
                .filter(activity => !activity.is_creator)
                .map((activity) => (
                  <Link href={`/activities/${activity.id}`} key={activity.id}>
                    <img
                      src={activity.image_url || 'https://via.placeholder.com/150?text=活动'}
                      alt={activity.title}
                      style={styles.activityThumb}
                    />
                  </Link>
                ))}
            </div>
          ) : (
            <p>暂无参与的活动</p>
          )}
        </>
      )}
    </div>
  );

  // 渲染收藏活动选项卡内容
  const renderFavoritesTab = () => (
    <div style={styles.infoCard}>
      <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '12px'}}>我收藏的活动</h3>
      {userFavorites && userFavorites.length > 0 ? (
        <div style={{marginTop: '16px'}}>
          {userFavorites.map((activity) => (
            <Link href={`/activities/${activity.id}`} key={activity.id} style={{textDecoration: 'none', color: 'inherit'}}>
              <div style={{
                display: 'flex',
                marginBottom: '16px',
                background: '#f9f9f9',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <img
                  src={activity.image_url || 'https://via.placeholder.com/150?text=收藏'}
                  alt={activity.title}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{padding: '10px', flex: 1}}>
                  <h4 style={{margin: '0 0 4px 0', fontSize: '16px'}}>{activity.title}</h4>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: '#666',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {activity.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p>暂无收藏活动</p>
      )}
    </div>
  );

  // 替换原来的"我的"区域为头像上传和背景图片功能
  const renderAvatarUpload = () => (
    <div 
      style={{
        position: 'relative',
        color: 'white',
        overflow: 'hidden',
        height: '220px',
      }}
    >
      {/* 背景图片 - 确保这个区域可以点击 */}
      <div 
        id="background-clickable-area"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 1, // 让背景图层处于底层
          cursor: 'pointer', // 添加指针样式提示可点击
        }}
        onClick={() => {
          console.log("背景被点击");
          document.getElementById('background-upload')?.click();
        }}
      >
        {bgImagePreview ? (
          <img 
            src={bgImagePreview} 
            alt="背景预览" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9, // 90%透明度
            }}
          />
        ) : user?.background_image_url ? (
          <img 
            src={user.background_image_url} 
            alt="背景图片" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9, // 90%透明度
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #4080ff, #2563eb)',
            opacity: 0.9,
          }} />
        )}
      </div>

      {/* 半透明覆盖层 - 当没有点击头像和按钮区域时，点击会触发背景上传 */}
      <div 
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          background: 'transparent',
          zIndex: 2,
          cursor: 'pointer',
        }}
        onClick={(e) => {
          // 只有点击到这个层而不是其子元素时，才触发背景上传
          if (e.target === e.currentTarget) {
            console.log("透明层被点击");
            document.getElementById('background-upload')?.click();
          }
        }}
      />

      {/* 背景图片上传输入框 */}
      <input
        id="background-upload"
        type="file"
        accept="image/*"
        style={{display: 'none'}}
        onChange={handleBgImageChange}
        disabled={isBgUploading}
      />

      {/* 主要内容区域 */}
      <div style={{
        position: 'relative',
        zIndex: 3, // 内容在透明层上方
        padding: '20px',
        paddingBottom: '40px', // 增加底部间距，让按钮更靠下
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end', // 将内容推到底部
        pointerEvents: 'none', // 让整个区域默认不接收点击事件
      }}>
        {/* 底部：头像、用户名和编辑按钮 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between', // 头像在左，编辑按钮在右
          width: '100%',
          pointerEvents: 'auto', // 恢复点击事件
        }}>
          {/* 左侧：头像和用户名 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
          }}>
            {/* 左侧头像 */}
            <div 
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                border: '3px solid white',
                cursor: 'pointer',
              }}
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                document.getElementById('avatar-upload')?.click();
              }}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="头像预览" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt="用户头像" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : user?.avatar_url_small ? (
                <img 
                  src={user.avatar_url_small} 
                  alt="用户头像" 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#4285f4'
                }}>
                  {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                </div>
              )}
            </div>

            {/* 用户名显示 */}
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}>
              {user?.username || ''}
            </div>
          </div>
          
          {/* 右侧编辑按钮 - 通过设置自身高度和对齐方式使其底部与头像底部对齐 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end', // 底部对齐
            height: '80px', // 与头像高度一致
          }}>
            <button 
              style={{
                padding: '8px 16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                router.push('/profile/edit');
              }}
            >
              <EditIcon />
              编辑
            </button>
          </div>
        </div>

        {/* 头像上传输入框 */}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          style={{display: 'none'}}
          onChange={handleImageChange}
          disabled={isUploading}
        />

        {/* 头像上传确认按钮 - 仅在选择了新头像时显示 */}
        {imagePreview && imagePreview !== user?.avatar_url && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            gap: '10px',
            pointerEvents: 'auto', // 恢复点击事件
          }}>
            <button onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              saveAvatar();
            }} style={{
              padding: '8px 16px',
              background: 'white',
              color: '#4caf50',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }} disabled={isUploading}>
              {isUploading ? '保存中...' : '保存头像'}
            </button>
            
            <button onClick={(e) => {
              e.stopPropagation(); // 阻止事件冒泡
              cancelUpload();
            }} style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }} disabled={isUploading}>
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <LoginChecker>
      <div style={styles.container}>
        {/* 顶部导航 */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>个人主页</div>
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span className="material-icons" style={{fontSize: '18px'}}>logout</span>
            退出登录
          </button>
        </div>
        {/* 如果未登录或正在加载，显示加载中状态 */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}>
            <p>加载个人资料...</p>
          </div>
        ) : !user ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '0 20px',
            textAlign: 'center'
          }}>
            <p style={{ marginBottom: '20px' }}>未找到用户资料，请尝试重新登录</p>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              返回登录页
            </button>
          </div>
        ) : (
          <>
            {/* 用户头像上传区域 */}
            {renderAvatarUpload()}
            
            {/* 选项卡导航 */}
            <div style={styles.tabContainer}>
              <div 
                style={{
                  ...styles.tab, 
                  ...(activeTab === 'profile' ? styles.activeTab : {})
                }}
                onClick={() => handleTabChange('profile')}
              >
                <PersonIcon />
                <span>个人资料</span>
              </div>
              <div 
                style={{
                  ...styles.tab, 
                  ...(activeTab === 'activities' ? styles.activeTab : {})
                }}
                onClick={() => handleTabChange('activities')}
              >
                <EventIcon />
                <span>我的活动</span>
              </div>
              <div 
                style={{
                  ...styles.tab, 
                  ...(activeTab === 'favorites' ? styles.activeTab : {})
                }}
                onClick={() => handleTabChange('favorites')}
              >
                <FavoriteIcon />
                <span>我的收藏</span>
              </div>
            </div>
            
            {/* 根据选项卡显示不同内容 */}
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'activities' && renderActivitiesTab()}
            {activeTab === 'favorites' && renderFavoritesTab()}
          </>
        )}
        
        {/* 底部导航 */}
        <div style={styles.bottomNav}>
          <Link href="/activities" style={styles.navItem}>
            <ExploreIcon />
            <span style={{fontSize: '12px'}}>发现</span>
          </Link>
          <Link href="/profile" style={styles.navItemActive}>
            <PersonIcon />
            <span style={{fontSize: '12px'}}>我的</span>
          </Link>
        </div>
      </div>
    </LoginChecker>
  );
} 