'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getActivities, Activity } from '@/lib/activities';

// 图标组件
const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
  </svg>
);

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
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

const AddIcon = () => (
  <span className="material-icons">add</span>
);

const AccountIcon = () => (
  <span className="material-icons">account_circle</span>
);

// 活动类别
const categories = [
  { id: 'all', name: '全部' },
  { id: 'outdoor', name: '户外' },
  { id: 'sports', name: '运动' },
  { id: 'music', name: '音乐' },
  { id: 'food', name: '美食' },
  { id: 'art', name: '艺术' },
  { id: 'tech', name: '科技' },
  { id: 'learning', name: '学习' },
  { id: 'social', name: '社交' },
];

// 排序选项
const sortOptions = [
  { id: 'newest', name: '最新发布' },
  { id: 'popular', name: '最受欢迎' },
  { id: 'date_asc', name: '日期从近到远' },
  { id: 'date_desc', name: '日期从远到近' },
];

// 城市选项
const cities = [
  { id: 'all', name: '全部城市' },
  { id: 'beijing', name: '北京' },
  { id: 'shanghai', name: '上海' },
  { id: 'guangzhou', name: '广州' },
  { id: 'shenzhen', name: '深圳' },
  { id: 'hangzhou', name: '杭州' },
  { id: 'chengdu', name: '成都' },
];

// 模拟活动数据
const mockActivities = [
  {
    id: 1,
    title: '周末登山俱乐部🏔️',
    organizer: '自然探险俱乐部',
    date: '本周六 09:00',
    location: '白云山风景区东门',
    imageUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.0.3',
    category: '户外运动',
    attendees: [
      'https://i.pravatar.cc/24?img=1',
      'https://i.pravatar.cc/24?img=2', 
      'https://i.pravatar.cc/24?img=3'
    ],
    price: '免费',
  },
  {
    id: 2,
    title: '《人类简史》读书分享📚',
    organizer: '城市读书会',
    date: '本周日 15:00',
    location: '城市书房咖啡厅',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=1969&auto=format&fit=crop&ixlib=rb-4.0.3',
    category: '读书会',
    attendees: [
      'https://i.pravatar.cc/24?img=4',
      'https://i.pravatar.cc/24?img=5'
    ],
    price: '¥150',
  },
  {
    id: 3,
    title: '人工智能前沿讲座',
    organizer: '科技前沿研究所',
    date: '下周三 19:00',
    location: '深圳市南山区科技园',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
    category: '科技',
    attendees: [
      'https://i.pravatar.cc/24?img=6',
      'https://i.pravatar.cc/24?img=7',
      'https://i.pravatar.cc/24?img=8'
    ],
    price: '¥200',
  },
  {
    id: 4,
    title: '城市摄影工作坊',
    organizer: '视觉艺术协会',
    date: '下周六 10:00',
    location: '广州市天河区美术馆',
    imageUrl: 'https://images.unsplash.com/photo-1542528180-a1208c5169a5?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3',
    category: '艺术',
    attendees: [
      'https://i.pravatar.cc/24?img=9',
      'https://i.pravatar.cc/24?img=10'
    ],
    price: '¥280',
  },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'category' | 'city' | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // 筛选条
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  
  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 检查登录状态并获取用户数据
  useEffect(() => {
    // 从cookie获取登录状态
    const cookies = document.cookie.split(';');
    const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
    const isUserLoggedIn = isLoggedInCookie?.includes('true') || false;
    setIsLoggedIn(isUserLoggedIn);
    
    // 获取用户数据
    if (isUserLoggedIn) {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
        } catch (e) {
          console.error('解析用户数据失败:', e);
        }
      }
    }
    
    // 如果用户未登录，重定向到登录页面
    if (!isUserLoggedIn) {
      router.push('/auth');
    }
  }, [router]);
  
  // 获取活动数据
  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await getActivities();
        setActivities(data);
        setFilteredActivities(data);
      } catch (error) {
        console.error('获取活动失败:', error);
        // 获取失败时使用本地模拟数据
        setActivities(mockActivities as unknown as Activity[]);
        setFilteredActivities(mockActivities as unknown as Activity[]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  // 监听筛选条件变化，更新活动列表
  useEffect(() => {
    setLoading(true);
    
    setTimeout(() => {
      let filtered = [...activities];
      
      // 搜索筛选
      if (searchQuery) {
        filtered = filtered.filter(activity => 
          activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // 类别筛选
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(activity => 
          activity.category.includes(selectedCategory)
        );
      }
      
      // 城市筛选- 通过location字段模糊匹配
      if (selectedCity !== 'all') {
        const cityName = cities.find(c => c.id === selectedCity)?.name || '';
        filtered = filtered.filter(activity => 
          activity.location.includes(cityName)
        );
      }
      
      // 排序
      switch (selectedSort) {
        case 'newest':
          filtered.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
          break;
        case 'popular':
          filtered.sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0));
          break;
        case 'date_asc':
          filtered.sort((a, b) => {
            const dateA = a.start_time ? new Date(a.start_time).getTime() : 0;
            const dateB = b.start_time ? new Date(b.start_time).getTime() : 0;
            return dateA - dateB;
          });
          break;
        case 'date_desc':
          filtered.sort((a, b) => {
            const dateA = a.start_time ? new Date(a.start_time).getTime() : 0;
            const dateB = b.start_time ? new Date(b.start_time).getTime() : 0;
            return dateB - dateA;
          });
          break;
      }
      
      setFilteredActivities(filtered);
      setLoading(false);
    }, 500);
  }, [searchQuery, selectedCategory, selectedCity, selectedSort, activities]);
  
  // 重置筛选条
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedSort('newest');
  };

  // 自定义CSS样式
  const styles = {
    container: {
      maxWidth: '100%',
      margin: '0 auto',
      background: '#f5f7fa',
      minHeight: '100vh',
      position: 'relative' as const,
      paddingBottom: '60px', // 为底部导航预留空间
    },
    headerFixed: {
      position: 'fixed' as const,
      top: 0,
      width: '100%',
      maxWidth: '100%',
      zIndex: 1000,
      background: 'white',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    },
    navBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      background: '#2563eb',
      color: 'white',
    },
    navIcons: {
      display: 'flex',
      alignItems: 'center',
    },
    searchBarContainer: {
      padding: '12px 16px',
      background: 'white',
    },
    searchBar: {
      position: 'relative' as const,
      display: 'flex',
    },
    searchInput: {
      flex: 1,
      border: '1px solid #ddd',
      borderRadius: '20px',
      padding: '8px 16px 8px 40px',
      fontSize: '14px',
      outline: 'none',
    },
    searchIcon: {
      position: 'absolute' as const,
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#666',
    },
    filterSection: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 16px',
      background: 'white',
      borderTop: '1px solid #eee',
    },
    filterButton: {
      backgroundColor: '#f0f4ff',
      border: '1px solid #e0e7ff',
      borderRadius: '16px',
      padding: '8px 16px',
      fontSize: '14px',
      color: '#4f6ef7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    filterDropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      zIndex: 1000,
      borderTop: '1px solid #eee',
    },
    filterOption: {
      padding: '12px 16px',
      fontSize: '14px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
    },
    filterOptionSelected: {
      padding: '12px 16px',
      fontSize: '14px',
      borderBottom: '1px solid #eee',
      background: '#f0f4ff',
      color: '#4f6ef7',
      cursor: 'pointer',
    },
    filterPanel: {
      padding: '12px 16px',
      background: 'white',
      borderTop: '1px solid #eee',
    },
    filterRow: {
      marginBottom: '16px',
    },
    filterLabel: {
      fontWeight: '600',
      marginBottom: '8px',
      fontSize: '14px',
      color: '#444',
      display: 'block',
    },
    filterSelect: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      fontSize: '14px',
      background: 'white',
      color: '#333',
      appearance: 'menulist' as const,
    },
    filterActions: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '12px',
      marginTop: '20px',
    },
    resetButton: {
      flex: '1',
      background: 'white',
      color: '#666',
      border: '1px solid #ddd',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    },
    applyButton: {
      flex: '1',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '600',
    },
    mainContent: {
      padding: '16px',
      marginTop: '180px', // 为固定的筛选栏预留空间
    },
    activityCard: {
      display: 'flex',
      flexDirection: 'column' as const,
      background: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '16px',
      textDecoration: 'none',
      color: '#333',
    },
    activityImage: {
      height: '160px',
      width: '100%',
      overflow: 'hidden',
    },
    activityContent: {
      padding: '12px',
    },
    activityTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '8px',
      color: '#222',
    },
    activityDetail: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '4px',
    },
    activityDetailText: {
      fontSize: '14px',
      color: '#666',
      marginLeft: '4px',
    },
    activityMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
    },
    activityAttendees: {
      display: 'flex',
      alignItems: 'center',
    },
    activityAttendeesCount: {
      fontSize: '12px',
      color: '#666',
    },
    activityPrice: {
      fontSize: '12px',
      color: '#666',
      fontWeight: '500',
    },
    bottomNav: {
      position: 'fixed' as const,
      bottom: '0',
      width: '100%',
      maxWidth: '100%',
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
    createBtn: {
      position: 'fixed' as const,
      bottom: '70px',
      right: '20px',
      background: '#2563eb',
      color: 'white',
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
      zIndex: 10,
    },
    interactiveBar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '16px',
    },
    participants: {
      display: 'flex',
      alignItems: 'center',
    },
    avatarGroup: {
      display: 'flex',
      marginLeft: '8px',
    },
    avatar: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      marginLeft: '-8px',
      border: '2px solid white',
    },
    joinButton: {
      background: '#2563eb',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '20px',
      cursor: 'pointer',
    },
  };

  // 动态调整内容区域边距的函数
  useEffect(() => {
    const headerElement = document.querySelector('[data-header-fixed]');
    const mainContent = document.querySelector('[data-main-content]');
    
    // 当滚动页面时确保headerFixed仍然固定在顶部
    const handleScroll = () => {
      if (headerElement) {
        // 强制设置为固定在顶部
        (headerElement as HTMLElement).style.position = 'fixed';
        (headerElement as HTMLElement).style.top = '0';
      }
    };
    
    // 添加滚动监听
    window.addEventListener('scroll', handleScroll);
    
    // 初始化时执行一次
    handleScroll();
    
    // 确保在筛选面板显示隐藏时更新内容区域的顶部边距
    const updateContentMargin = () => {
      if (headerElement && mainContent) {
        const headerHeight = headerElement.getBoundingClientRect().height;
        console.log('Header height:', headerHeight);
        (mainContent as HTMLElement).style.marginTop = `${headerHeight + 16}px`;
      }
    };
    
    // 初始时延迟执行以确保DOM已更新
    setTimeout(updateContentMargin, 100);
    
    // 每当showFilters变化时也要更新
    updateContentMargin();
    
    // 窗口大小改变时也要更新
    window.addEventListener('resize', updateContentMargin);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateContentMargin);
    };
  }, [showFilters]);

  // 渲染活动卡片
  const renderActivityCard = (activity: Activity) => {
    // 从日期中提取月日和时间信息
    const startDate = new Date(activity.start_time);
    const formattedDate = `${startDate.getMonth() + 1}月${startDate.getDate()}日${startDate.getHours()}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    
    return (
      <Link href={`/activities/${activity.id}`} key={activity.id} style={styles.activityCard}>
        {activity.image_url && (
          <div style={styles.activityImage}>
            <img 
              src={activity.image_url} 
              alt={activity.title} 
              style={{width: '100%', height: '100%', objectFit: 'cover'}} 
            />
          </div>
        )}
        
        <div style={styles.activityContent}>
          <h3 style={styles.activityTitle}>{activity.title}</h3>
          
          <div style={styles.activityDetail}>
            <CalendarIcon />
            <span style={styles.activityDetailText}>{formattedDate}</span>
          </div>
          
          <div style={styles.activityDetail}>
            <LocationIcon />
            <span style={styles.activityDetailText}>{activity.location}</span>
          </div>
          
          <div style={styles.activityMeta}>
            <div style={styles.activityAttendees}>
              {/* 这里可以添加参与者头像*/}
              <span style={styles.activityAttendeesCount}>{activity.participants_count}人参加</span>
            </div>
            
            <div style={styles.activityPrice}>
              {activity.max_participants ? `最多${activity.max_participants}人` : ''}
            </div>
          </div>
        </div>
      </Link>
    );
  };

  // 添加一个函数来重新获取活动
  const refreshActivities = () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const data = await getActivities();
        setActivities(data);
        setFilteredActivities(data);
        
        // 重置筛选条
        resetFilters();
        
        // 滚动到顶部
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('刷新活动失败:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // 关闭筛选下拉框
  const closeFilters = () => {
    setShowFilters(false);
    setFilterType(null);
  };

  // 选择筛选类型
  const handleFilterTypeSelect = (type: 'category' | 'city') => {
    setFilterType(type);
  };

  // 选择筛选选项
  const handleFilterSelect = (value: string) => {
    if (filterType === 'category') {
      setSelectedCategory(value);
    } else if (filterType === 'city') {
      setSelectedCity(value);
    }
    closeFilters();
  };

  return (
    <div style={styles.container}>
      {/* 如果未登录，显示加载中状态，等待重定向*/}
      {!isLoggedIn ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <p>检查登录状态..</p>
        </div>
      ) : (
        <>
          {/* 固定在顶部的导航、搜索栏和筛选栏 */}
          <div style={styles.headerFixed} data-header-fixed>
            {/* 顶部导航 */}
            <div style={styles.navBar}>
              <h1>ShareMeet</h1>
              <div style={styles.navIcons}>
                <Link href="/profile">
                  {userData && userData.avatar_url ? (
                    <img 
                      src={userData.avatar_url} 
                      alt="用户头像" 
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <AccountIcon />
                  )}
                </Link>
              </div>
            </div>

            {/* 搜索栏*/}
            <div style={styles.searchBarContainer}>
              <div style={styles.searchBar}>
                <input 
                  type="text" 
                  placeholder="搜索活动名称、地点.." 
                  style={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div style={styles.searchIcon}>
                  <SearchIcon />
                </div>
              </div>
            </div>
              
            {/* 筛选下拉框 - 替换原来的三个按钮*/}
            <div style={{position: 'relative' as const}}>
              <div style={styles.filterButton} onClick={() => setShowFilters(!showFilters)}>
                筛选选项
                <FilterIcon />
              </div>
              
              {/* 筛选主选项下拉框*/}
              {showFilters && !filterType && (
                <div style={styles.filterDropdown}>
                  <div 
                    style={styles.filterOption}
                    onClick={() => handleFilterTypeSelect('category')}
                  >
                    分类筛选（当前：{categories.find(c => c.id === selectedCategory)?.name || '全部'}）
                  </div>
                  <div 
                    style={styles.filterOption}
                    onClick={() => handleFilterTypeSelect('city')}
                  >
                    城市筛选（当前：{cities.find(c => c.id === selectedCity)?.name || '全部城市'}）
                  </div>
                  <div 
                    style={styles.filterOption}
                    onClick={() => {
                      resetFilters();
                      closeFilters();
                    }}
                  >
                    重置全部筛选
                  </div>
                </div>
              )}
              
              {/* 分类选项下拉框*/}
              {showFilters && filterType === 'category' && (
                <div style={styles.filterDropdown}>
                  {categories.map(category => (
                    <div 
                      key={category.id}
                      style={selectedCategory === category.id ? styles.filterOptionSelected : styles.filterOption}
                      onClick={() => handleFilterSelect(category.id)}
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              )}
              
              {/* 城市选项下拉框*/}
              {showFilters && filterType === 'city' && (
                <div style={styles.filterDropdown}>
                  {cities.map(city => (
                    <div 
                      key={city.id}
                      style={selectedCity === city.id ? styles.filterOptionSelected : styles.filterOption}
                      onClick={() => handleFilterSelect(city.id)}
                    >
                      {city.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 主页内容 */}
          <div style={styles.mainContent} data-main-content>
            {loading ? (
              <div style={{padding: '16px', textAlign: 'center'}}>
                加载中..
              </div>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map(renderActivityCard)
            ) : null}
          </div>

          {/* 创建按钮 */}
          <Link href="/activities/create" style={styles.createBtn}>
            <AddIcon />
          </Link>

          {/* 底部导航 */}
          <div style={styles.bottomNav}>
            <div 
              onClick={refreshActivities} 
              style={{...styles.navItemActive, cursor: 'pointer'}}
            >
              <ExploreIcon />
              <span style={{fontSize: '12px'}}>发现</span>
            </div>
            <Link href="/profile" style={styles.navItem}>
              <PersonIcon />
              <span style={{fontSize: '12px'}}>我的</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 

