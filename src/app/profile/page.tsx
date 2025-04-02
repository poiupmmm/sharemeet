"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/user-store";
import { useActivityStore } from "@/store/activity-store";
import { birthdayToZodiac, formatDate } from "@/lib/utils";
import { getCurrentUser, checkUserLoggedIn, signOut } from "@/lib/auth";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { User } from "@/lib/auth";

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

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await checkUserLoggedIn();
      setIsLoggedIn(loggedIn);
      return loggedIn;
    };

    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // 首先从localStorage获取数据
        const localData = localStorage.getItem('userData');
        let userData = localData ? JSON.parse(localData) : null;
        
        if (userData) {
          console.log('从localStorage获取到用户数据:', userData);
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

    checkLoginStatus().then(loggedIn => {
      if (loggedIn) {
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
      } else {
        router.push('/auth');
      }
    });
  }, [router, fetchUserActivities, fetchUserFavorites]);

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

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>个人主页</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          {dataSource === 'local' && (
            <div style={{fontSize: '12px', color: '#ff9900', display: 'flex', alignItems: 'center'}}>
              <span className="material-icons" style={{fontSize: '16px', marginRight: '4px'}}>
                warning
              </span>
              仅本地数据
              <button 
                onClick={refreshUserData} 
                style={{marginLeft: '8px', background: 'transparent', border: 'none', color: '#2563eb', fontSize: '12px', cursor: 'pointer'}}
                disabled={isLoading}
              >
                {isLoading ? '同步中...' : '同步'}
              </button>
            </div>
          )}
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
      </div>
      {/* 如果未登录，显示加载中状态，等待重定向 */}
      {!isLoggedIn ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <p>检查登录状态...</p>
        </div>
      ) : !user ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <div style={{height: '32px', width: '32px', border: '4px solid #f0f0f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        </div>
      ) : (
        <>
          {/* 个人信息头部 */}
          <div style={styles.profileHeader}>
            <div>
              <h2 style={{fontSize: '20px', fontWeight: '600'}}>我的</h2>
            </div>
            <div style={styles.avatarWrapper}>
              <img
                src={user.avatar_url || 'https://via.placeholder.com/150'}
                alt={user.username}
                style={styles.avatar}
              />
            </div>
          </div>
          
          {/* 个人信息内容 */}
          <div style={styles.profileContent}>
            <div style={styles.profileMeta}>
              <h1 style={styles.userName}>{user.username || '未设置用户名'}</h1>
              <Link href="/profile/edit">
                <button style={styles.editBtn}>
                  <EditIcon />
                  <span>编辑</span>
                </button>
              </Link>
            </div>
            
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
          </div>
          
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
        </>
      )}
    </div>
  );
} 