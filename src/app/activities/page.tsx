'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useActivityStore } from '@/store/activity-store';
import { useUserStore } from '@/store/user-store';

// 图标组件
const HomeIcon = () => (
  <span className="material-icons">home</span>
);

const ExploreIcon = () => (
  <span className="material-icons">explore</span>
);

const PersonIcon = () => (
  <span className="material-icons">person</span>
);

const AddIcon = () => (
  <span className="material-icons">add</span>
);

// 活动类别
const categories = [
  { id: 'all', name: '全部分类' },
  { id: 'outdoor', name: '户外' },
  { id: 'sports', name: '运动' },
  { id: 'music', name: '音乐' },
  { id: 'food', name: '美食' },
  { id: 'art', name: '艺术' },
  { id: 'tech', name: '科技' },
  { id: 'learning', name: '学习' },
  { id: 'social', name: '社交' },
  { id: 'other', name: '其他' },
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
  { id: 'nanjing', name: '南京' },
  { id: 'wuhan', name: '武汉' },
  { id: 'xian', name: '西安' },
  { id: 'chongqing', name: '重庆' },
  { id: 'suzhou', name: '苏州' },
  { id: 'tianjin', name: '天津' },
  { id: 'zhengzhou', name: '郑州' },
  { id: 'qingdao', name: '青岛' },
  { id: 'dalian', name: '大连' },
  { id: 'ningbo', name: '宁波' },
  { id: 'xiamen', name: '厦门' },
  { id: 'changsha', name: '长沙' },
  { id: 'fuzhou', name: '福州' },
  { id: 'harbin', name: '哈尔滨' },
  { id: 'jinan', name: '济南' },
  { id: 'shenyang', name: '沈阳' },
  { id: 'kunming', name: '昆明' },
  { id: 'guiyang', name: '贵阳' },
  { id: 'nanning', name: '南宁' },
  { id: 'hefei', name: '合肥' },
  { id: 'nanchang', name: '南昌' },
  { id: 'taiyuan', name: '太原' },
  { id: 'lanzhou', name: '兰州' },
  { id: 'yinchuan', name: '银川' },
  { id: 'xining', name: '西宁' },
  { id: 'urumqi', name: '乌鲁木齐' },
  { id: 'lhasa', name: '拉萨' },
];

// 时间筛选选项
const timeFilters = [
  { id: 'all', name: '全部时间' },
  { id: 'today', name: '今天' },
  { id: 'tomorrow', name: '明天' },
  { id: 'thisWeek', name: '本周' },
  { id: 'nextWeek', name: '下周' },
  { id: 'thisMonth', name: '本月' },
  { id: 'custom', name: '自定义' },
];

export default function ActivitiesPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<'category' | 'city' | 'time' | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [participatedActivities, setParticipatedActivities] = useState<string[]>([]);
  
  // 从zustand store获取状态
  const activities = useActivityStore((state) => state.activities);
  const loading = useActivityStore((state) => state.isLoading);
  const fetchActivities = useActivityStore((state) => state.fetchActivities);
  const userActivities = useActivityStore((state) => state.userActivities);
  const fetchUserActivities = useActivityStore((state) => state.fetchUserActivities);
  const user = useUserStore((state) => state.user);
  
  // 筛选条件
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('newest');
  const [filteredActivities, setFilteredActivities] = useState(activities);
  
  // 日期范围选择器状态
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [calendarMode, setCalendarMode] = useState<'start' | 'end'>('start'); // 日历模式：选择开始或结束日期
  
  // 点击外部关闭筛选菜单
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      // 检查点击事件是否在筛选区域外部
      const filterContainer = document.querySelector('[data-filter-container]');
      if (filterContainer && !filterContainer.contains(event.target as Node) && showFilters) {
        setShowFilters(false);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('click', handleOutsideClick);
    
    // 清理函数
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [showFilters]);
  
  // 检查登录状态
  useEffect(() => {
    // 从cookie获取登录状态和用户ID
    const cookies = document.cookie.split(';');
    const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
    const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
    
    const isUserLoggedIn = isLoggedInCookie?.includes('true') || false;
    const userIdValue = userIdCookie ? userIdCookie.split('=')[1].trim() : null;
    
    setIsLoggedIn(isUserLoggedIn);
    setUserId(userIdValue);
    
    // 如果用户未登录，重定向到登录页面
    if (!isUserLoggedIn) {
      console.log('用户未登录，从活动列表页重定向到登录页面');
      // 设置重定向cookie
      document.cookie = "redirectAfterLogin=/activities; path=/; max-age=3600";
      router.push('/auth');
    }
  }, [router]);
  
  // 获取活动数据和用户参与的活动数据
  useEffect(() => {
    if (isLoggedIn) {
      fetchActivities();
      
      if (userId) {
        // 获取用户参与的活动
        fetchUserActivities(userId);
      }
    }
  }, [isLoggedIn, userId, fetchActivities, fetchUserActivities]);
  
  // 更新用户参与的活动ID列表
  useEffect(() => {
    if (userActivities && userActivities.length > 0) {
      // 只包含用户参与的活动（标记为is_joined=true），不包括用户创建的活动
      const participatedIds = userActivities
        .filter(activity => activity.is_joined)
        .map(activity => activity.id);
      setParticipatedActivities(participatedIds);
    }
  }, [userActivities]);
  
  // 监听筛选条件变化，更新活动列表
  useEffect(() => {
    if (!activities || activities.length === 0) return;
    
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
    
    // 时间筛选
    if (selectedTimeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const thisWeekEnd = new Date(today);
      thisWeekEnd.setDate(today.getDate() + (7 - today.getDay()));
      
      const nextWeekStart = new Date(thisWeekEnd);
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      switch(selectedTimeFilter) {
        case 'today':
          filtered = filtered.filter(activity => {
            const activityStartTime = activity.date || activity.start_time;
            if (!activityStartTime) return false;
            const activityDate = new Date(activityStartTime);
            return activityDate >= today && activityDate < tomorrow;
          });
          break;
        case 'tomorrow':
          filtered = filtered.filter(activity => {
            const activityStartTime = activity.date || activity.start_time;
            if (!activityStartTime) return false;
            const activityDate = new Date(activityStartTime);
            return activityDate >= tomorrow && activityDate < nextDay;
          });
          break;
        case 'thisWeek':
          filtered = filtered.filter(activity => {
            const activityStartTime = activity.date || activity.start_time;
            if (!activityStartTime) return false;
            const activityDate = new Date(activityStartTime);
            return activityDate >= today && activityDate <= thisWeekEnd;
          });
          break;
        case 'nextWeek':
          filtered = filtered.filter(activity => {
            const activityStartTime = activity.date || activity.start_time;
            if (!activityStartTime) return false;
            const activityDate = new Date(activityStartTime);
            return activityDate >= nextWeekStart && activityDate <= nextWeekEnd;
          });
          break;
        case 'thisMonth':
          filtered = filtered.filter(activity => {
            const activityStartTime = activity.date || activity.start_time;
            if (!activityStartTime) return false;
            const activityDate = new Date(activityStartTime);
            return activityDate >= today && activityDate <= thisMonthEnd;
          });
          break;
        case 'custom':
          // 处理自定义日期范围筛选
          if (startDate) {
            const customStartDate = new Date(startDate);
            customStartDate.setHours(0, 0, 0, 0); // 设置为当天开始
            
            filtered = filtered.filter(activity => {
              const activityStartTime = activity.date || activity.start_time;
              if (!activityStartTime) return false;
              const activityDate = new Date(activityStartTime);
              return activityDate >= customStartDate;
            });
          }
          
          if (endDate) {
            const customEndDate = new Date(endDate);
            customEndDate.setHours(23, 59, 59, 999); // 设置为当天结束
            
            filtered = filtered.filter(activity => {
              const activityStartTime = activity.date || activity.start_time;
              if (!activityStartTime) return false;
              const activityDate = new Date(activityStartTime);
              return activityDate <= customEndDate;
            });
          }
          break;
      }
    }
    
    // 城市筛选 - 使用city字段
    if (selectedCity !== 'all') {
      const cityName = cities.find(c => c.id === selectedCity)?.name || '';
      filtered = filtered.filter(activity => 
        // 检查city字段是否与所选城市ID匹配或城市名称匹配
        activity.city === selectedCity || 
        activity.city === cityName ||
        // 兼容没有city字段的旧数据，尝试从location中匹配
        ((!activity.city) && activity.location && activity.location.includes(cityName))
      );
    }
    
    // 排序
    switch (selectedSort) {
      case 'newest':
        filtered.sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        });
        break;
      case 'popular':
        filtered.sort((a, b) => b.participants_count - a.participants_count);
        break;
      case 'date_asc':
        filtered.sort((a, b) => {
          const aStartTime = a.date || a.start_time;
          const bStartTime = b.date || b.start_time;
          if (!aStartTime && !bStartTime) return 0;
          if (!aStartTime) return 1;
          if (!bStartTime) return -1;
          return new Date(aStartTime).getTime() - new Date(bStartTime).getTime();
        });
        break;
      case 'date_desc':
        filtered.sort((a, b) => {
          const aStartTime = a.date || a.start_time;
          const bStartTime = b.date || b.start_time;
          if (!aStartTime && !bStartTime) return 0;
          if (!aStartTime) return 1;
          if (!bStartTime) return -1;
          return new Date(bStartTime).getTime() - new Date(aStartTime).getTime();
        });
        break;
    }
    
    setFilteredActivities(filtered);
  }, [searchQuery, selectedCategory, selectedCity, selectedTimeFilter, selectedSort, activities, startDate, endDate]);
  
  // 重置筛选条件
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedTimeFilter('all');
    setSelectedSort('newest');
    setStartDate('');
    setEndDate('');
    setShowFilters(false);
    setFilterType(null);
  };
  
  // 选择筛选类别
  const handleFilterTypeSelect = (type: 'category' | 'city' | 'time') => {
    setFilterType(type);
  };
  
  // 选择类别选项
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowFilters(false);
    setFilterType(null);
  };
  
  // 选择城市选项
  const handleCitySelect = (cityId: string) => {
    setSelectedCity(cityId);
    setShowFilters(false);
    setFilterType(null);
  };
  
  // 选择时间筛选选项
  const handleTimeFilterSelect = (timeFilterId: string) => {
    setSelectedTimeFilter(timeFilterId);
    if (timeFilterId !== 'custom') {
      setStartDate('');
      setEndDate('');
      setShowFilters(false);
      setFilterType(null);
    }
  };
  
  // 处理日期范围变更
  const handleDateRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      setStartDate(value);
      // 如果还没选择时间筛选类型或不是custom，设为custom
      if (selectedTimeFilter !== 'custom') {
        setSelectedTimeFilter('custom');
      }
    } else if (name === 'endDate') {
      setEndDate(value);
      // 如果还没选择时间筛选类型或不是custom，设为custom
      if (selectedTimeFilter !== 'custom') {
        setSelectedTimeFilter('custom');
      }
    }
  };
  
  // 处理日历日期选择
  const handleCalendarDateSelect = (dateStr: string) => {
    if (calendarMode === 'start') {
      setStartDate(dateStr);
      // 自动切换到结束日期选择
      setCalendarMode('end');
    } else {
      // 如果选择的结束日期早于开始日期，交换两个日期
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(dateStr);
      
      if (endDateObj < startDateObj) {
        setEndDate(startDate);
        setStartDate(dateStr);
      } else {
        setEndDate(dateStr);
      }
      
      // 选完结束日期后确认自定义时间
      if (selectedTimeFilter !== 'custom') {
        setSelectedTimeFilter('custom');
      }
    }
  };
  
  // 应用自定义日期筛选
  const applyCustomDateFilter = () => {
    if (startDate || endDate) {
      setSelectedTimeFilter('custom');
    }
    setShowFilters(false);
    setCalendarMode('start'); // 重置为开始日期选择模式
  };
  
  // 生成日历日期
  const generateCalendarDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // 设置为当月1号
    const firstDay = new Date(currentYear, currentMonth, 1);
    // 获取当月天数
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 获取当月1号是星期几（0-6，0表示星期日）
    const firstDayOfWeek = firstDay.getDay();
    
    const dates = [];
    
    // 前面的空白天
    for (let i = 0; i < firstDayOfWeek; i++) {
      dates.push(null);
    }
    
    // 添加当月所有天
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      dates.push({
        day: i,
        dateStr: date.toISOString().split('T')[0],
        isToday: i === today.getDate()
      });
    }
    
    return dates;
  };
  
  // 样式定义
  const styles = {
    container: {
      maxWidth: '480px',
      margin: '0 auto',
      background: 'white',
      minHeight: '100vh',
      paddingBottom: '60px', // 为底部导航预留空间
    },
    header: {
      position: 'relative' as const,
      height: '180px',
      background: 'linear-gradient(135deg, #4080ff, #2563eb)',
      padding: '24px',
      color: 'white',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center' as const,
    },
    headerContent: {
      width: '100%',
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: '600',
      marginBottom: '20px',
      textAlign: 'center' as const,
    },
    searchBarContainer: {
      marginTop: '16px',
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: 'white',
      borderRadius: '24px',
      padding: '8px 16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    searchInput: {
      flex: 1,
      border: 'none',
      padding: '8px 12px',
      fontSize: '14px',
      outline: 'none',
    },
    filterContainer: {
      marginTop: '16px',
      display: 'flex',
      justifyContent: 'space-between',
    },
    filterButton: {
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '20px',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: 'white',
      fontSize: '14px',
      cursor: 'pointer',
    },
    mainContent: {
      padding: '20px',
    },
    filterDropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      zIndex: 10,
      marginTop: '8px',
      maxHeight: '300px',
      overflowY: 'auto' as const,
    },
    filterOption: {
      padding: '12px 16px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#333',
    },
    filterOptionActive: {
      padding: '12px 16px',
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#2563eb',
      fontWeight: 'bold',
      background: '#f0f7ff',
    },
    activityCard: {
      borderRadius: '12px',
      overflow: 'hidden' as const,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '16px',
      background: 'white',
    },
    activityImage: {
      width: '100%',
      height: '180px',
      objectFit: 'cover' as const,
    },
    activityContent: {
      padding: '16px',
    },
    activityTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
    },
    activityInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      marginBottom: '12px',
    },
    activityInfoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      color: '#666',
    },
    activityMeta: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: '1px solid #f0f0f0',
      paddingTop: '12px',
      marginTop: '8px',
    },
    activityAttendees: {
      display: 'flex',
      alignItems: 'center',
    },
    activityAttendeesCount: {
      fontSize: '14px',
      color: '#666',
      marginLeft: '8px',
    },
    activityPrice: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#2563eb',
    },
    attendeeAvatar: {
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      marginLeft: '-8px',
      border: '2px solid white',
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
    navText: {
      fontSize: '12px',
      marginTop: '4px',
    },
    createButton: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      background: '#2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      boxShadow: '0 4px 8px rgba(37, 99, 235, 0.5)',
      marginTop: '-20px',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center' as const,
    },
    emptyStateImage: {
      width: '120px',
      height: '120px',
      marginBottom: '16px',
      opacity: 0.7,
    },
    emptyStateText: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '200px',
    },
    loadingSpinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    participatedBadge: {
      background: '#2563eb',
      color: 'white',
      padding: '2px 4px',
      borderRadius: '4px',
      fontSize: '12px',
      marginLeft: '8px',
    },
    createdBadge: {
      background: '#10b981',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      marginLeft: '8px',
      fontWeight: 'bold',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
    maxParticipantsBadge: {
      background: '#ffedcc',
      color: '#f59e0b',
      padding: '2px 4px',
      borderRadius: '4px',
      fontSize: '12px',
      marginLeft: '4px',
      fontWeight: 'bold',
    },
  };
  
  // 渲染活动卡片
  const renderActivityCard = (activity: any) => {
    // 调试日志：检查max_participants是否存在
    console.log('活动人数上限信息:', {
      id: activity.id, 
      title: activity.title,
      max_participants: activity.max_participants,
      attendees_limit: activity.attendees_limit
    });
    
    // 获取人员上限信息 - 可能在max_participants或attendees_limit字段
    const participantsLimit = activity.max_participants || activity.attendees_limit;
    
    // 处理开始和结束时间
    let displayTime = "时间待定";
    try {
      // 兼容两种可能的字段名称
      const startTimeField = activity.date || activity.start_time;
      const endTimeField = activity.end_date || activity.end_time;
      
      // 打印原始时间数据
      console.log('活动原始时间:', {
        id: activity.id,
        title: activity.title,
        startTimeField,
        endTimeField
      });
      
      // 使用纯正则表达式处理，避免时区问题
      if (startTimeField) {
        // 匹配 YYYY-MM-DDThh:mm:ss 格式
        const startMatch = startTimeField.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        
        if (startMatch && startMatch.length >= 6) {
          // 提取日期时间各部分
          const [_, startYear, startMonth, startDay, startHour, startMinute] = startMatch;
          const formattedStartDate = `${parseInt(startMonth)}月${parseInt(startDay)}日 ${startHour}:${startMinute}`;
          
          // 默认只有开始时间
          displayTime = formattedStartDate;
          
          // 处理结束时间
          if (endTimeField) {
            const endMatch = endTimeField.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
            
            if (endMatch && endMatch.length >= 6) {
              const [_, endYear, endMonth, endDay, endHour, endMinute] = endMatch;
              
              // 判断是否同一天
              if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
                // 同一天，只显示结束时间（不重复日期）
                displayTime = `${formattedStartDate} - ${endHour}:${endMinute}`;
              } else {
                // 不同天，完整显示
                const formattedEndDate = `${parseInt(endMonth)}月${parseInt(endDay)}日 ${endHour}:${endMinute}`;
                displayTime = `${formattedStartDate} - ${formattedEndDate}`;
              }
            }
          }
        }
      }
      
      // 调试日志
      console.log('格式化后的时间:', {
        id: activity.id,
        title: activity.title,
        displayTime
      });
    } catch (error) {
      console.error("时间处理错误:", error, activity);
      displayTime = "时间待定";
    }
    
    // 检查用户是否已参加此活动
    const isParticipated = participatedActivities.includes(activity.id);
    
    // 检查用户是否是活动创建者
    const isCreated = (activity.creator_id === userId || activity.user_id === userId || activity.is_creator);
    
    // 调试日志：检查活动创建者信息
    console.log('活动创建者信息:', {
      id: activity.id,
      title: activity.title,
      creator_id: activity.creator_id,
      user_id: activity.user_id,
      is_creator: activity.is_creator,
      userId: userId,
      isCreated: isCreated
    });
    
    return (
      <Link href={`/activities/${activity.id}`} key={activity.id}>
        <div style={styles.activityCard}>
          <img 
            src={activity.image_url || 'https://source.unsplash.com/random/400x300/?event'} 
            alt={activity.title}
            style={styles.activityImage} 
          />
          <div style={styles.activityContent}>
            <h3 style={styles.activityTitle}>
              {activity.title}
              {isParticipated && (
                <span style={styles.participatedBadge}>已参加</span>
              )}
              {isCreated && (
                <span style={styles.createdBadge}>已创建</span>
              )}
            </h3>
            <div style={styles.activityInfo}>
              <div style={styles.activityInfoItem}>
                <span className="material-icons" style={{fontSize: '16px'}}>schedule</span>
                <span>{displayTime}</span>
              </div>
              <div style={styles.activityInfoItem}>
                <span className="material-icons" style={{fontSize: '16px'}}>location_on</span>
                <span>
                  {activity.city ? `${activity.city} · ` : ''}
                  {activity.location}
                </span>
              </div>
              <div style={styles.activityInfoItem}>
                <span className="material-icons" style={{fontSize: '16px'}}>payments</span>
                <span>
                  {!activity.price || activity.price === 0 || activity.price === '0' || activity.price === '免费' ? 
                    '免费' : `¥${activity.price}`}
                </span>
              </div>
            </div>
            <div style={styles.activityMeta}>
              <div style={styles.activityAttendees}>
                <span style={styles.activityAttendeesCount}>
                  {(activity.participants_count && activity.participants_count > 0) ? 
                    activity.participants_count : 1}人参加
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  };
  
  return (
    <div style={styles.container}>
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
      ) : (
        <>
          {/* 头部区域 */}
          <div style={styles.header}>
            <div style={styles.headerContent}>
              <h2 style={styles.headerTitle}>活动大厅</h2>
              
              {/* 搜索栏 */}
              <div style={styles.searchBarContainer}>
                <div style={styles.searchBar}>
                  <input 
                    type="text" 
                    placeholder="搜索活动名称、地点..." 
                    style={styles.searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
                
              {/* 筛选下拉框 */}
              <div style={{position: 'relative' as const}} data-filter-container>
                <div style={styles.filterContainer}>
                  <div 
                    style={{
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '14px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => {setFilterType('time'); setShowFilters(!showFilters)}}
                  >
                    <span>{timeFilters.find(t => t.id === selectedTimeFilter)?.name}</span>
                    <span className="material-icons" style={{fontSize: '16px', marginLeft: '4px'}}>
                      arrow_drop_down
                    </span>
                  </div>

                  <div 
                    style={{
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '14px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => {setFilterType('category'); setShowFilters(!showFilters)}}
                  >
                    <span>{categories.find(c => c.id === selectedCategory)?.name}</span>
                    <span className="material-icons" style={{fontSize: '16px', marginLeft: '4px'}}>
                      arrow_drop_down
                    </span>
                  </div>
                  
                  <div 
                    style={{
                      padding: '8px 12px',
                      borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => {setFilterType('city'); setShowFilters(!showFilters)}}
                  >
                    <span>{cities.find(c => c.id === selectedCity)?.name}</span>
                    <span className="material-icons" style={{fontSize: '16px', marginLeft: '4px'}}>
                      arrow_drop_down
                    </span>
                  </div>
                </div>
                
                {/* 时间筛选选项下拉菜单 */}
                {showFilters && filterType === 'time' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0px',
                    minWidth: '180px',
                    width: 'auto',
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '12px',
                    marginTop: '8px',
                    zIndex: 1000,
                    fontSize: '13px'
                  }}>
                    {/* 日历选择器 */}
                    <div style={{
                      padding: '10px 10px',
                      borderBottom: '1px solid #f0f0f0',
                    }}>
                      <div style={{
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '6px'
                      }}>
                        <div style={{fontWeight: 'bold', fontSize: '13px'}}>
                          选择日期范围
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '6px'
                        }}>
                          <div 
                            onClick={() => setCalendarMode('start')}
                            style={{
                              padding: '3px 6px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              backgroundColor: calendarMode === 'start' ? '#2563eb' : '#f0f0f0',
                              color: calendarMode === 'start' ? 'white' : '#666',
                            }}
                          >
                            开始日期
                          </div>
                          <div 
                            onClick={() => setCalendarMode('end')}
                            style={{
                              padding: '3px 6px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              backgroundColor: calendarMode === 'end' ? '#2563eb' : '#f0f0f0',
                              color: calendarMode === 'end' ? 'white' : '#666',
                            }}
                          >
                            结束日期
                          </div>
                        </div>
                      </div>
                      
                      {/* 选中的日期范围显示 */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px',
                        backgroundColor: '#f0f7ff',
                        borderRadius: '6px',
                        marginBottom: '8px',
                        fontSize: '12px'
                      }}>
                        <div>
                          <span style={{color: '#4080ff'}}>开始: </span>
                          <span style={{fontWeight: 'bold', color: '#2563eb'}}>{startDate ? new Date(startDate).toLocaleDateString('zh-CN') : '未选择'}</span>
                        </div>
                        <div>
                          <span style={{color: '#4080ff'}}>结束: </span>
                          <span style={{fontWeight: 'bold', color: '#2563eb'}}>{endDate ? new Date(endDate).toLocaleDateString('zh-CN') : '未选择'}</span>
                        </div>
                      </div>
                      
                      {/* 日历表头 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        textAlign: 'center',
                        fontSize: '11px',
                        color: '#666',
                        marginBottom: '4px'
                      }}>
                        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                          <div key={day} style={{padding: '2px'}}>{day}</div>
                        ))}
                      </div>
                      
                      {/* 日历主体 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '2px',
                        textAlign: 'center',
                      }}>
                        {generateCalendarDates().map((date, index) => {
                          if (!date) {
                            return <div key={`empty-${index}`} style={{padding: '4px'}}></div>;
                          }
                          
                          const isSelected = 
                            (startDate === date.dateStr) || 
                            (endDate === date.dateStr) || 
                            (startDate && endDate && new Date(date.dateStr) > new Date(startDate) && new Date(date.dateStr) < new Date(endDate));
                          
                          return (
                            <div 
                              key={date.dateStr}
                              onClick={() => handleCalendarDateSelect(date.dateStr)}
                              style={{
                                padding: '5px 0',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontWeight: date.isToday || isSelected ? 'bold' : 'normal',
                                backgroundColor: isSelected ? '#2563eb' : date.isToday ? '#f0f7ff' : 'transparent',
                                color: isSelected ? 'white' : date.isToday ? '#2563eb' : '#333',
                                position: 'relative',
                                fontSize: '12px',
                              }}
                            >
                              {date.day}
                              {date.isToday && !isSelected && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '1px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '3px',
                                  height: '3px',
                                  borderRadius: '50%',
                                  backgroundColor: '#2563eb'
                                }}></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* 确认按钮 */}
                      <button
                        onClick={applyCustomDateFilter}
                        style={{
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          marginTop: '8px',
                          width: '100%',
                          fontWeight: 'bold',
                          fontSize: '13px'
                        }}
                      >
                        确认
                      </button>
                    </div>
                    
                    {/* 快捷选项以标签样式显示 */}
                    <div style={{
                      padding: '10px 10px',
                      borderBottom: '1px solid #f0f0f0',
                    }}>
                      <div style={{marginBottom: '6px', fontWeight: 'bold', fontSize: '13px'}}>
                        快捷选择
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}>
                        {/* 全部时间选项 */}
                        <div 
                          onClick={() => {
                            handleTimeFilterSelect('all');
                            setShowFilters(false);
                          }}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            border: '1px solid #eaeaea',
                            backgroundColor: selectedTimeFilter === 'all' ? '#2563eb' : '#f5f5f5',
                            color: selectedTimeFilter === 'all' ? 'white' : '#666',
                            fontWeight: selectedTimeFilter === 'all' ? 'bold' : 'normal',
                          }}
                        >
                          全部时间
                        </div>
                        
                        {/* 其他快捷选项 */}
                        {timeFilters.filter(item => item.id !== 'all' && item.id !== 'custom').map(item => (
                          <div 
                            key={item.id}
                            onClick={() => {
                              handleTimeFilterSelect(item.id);
                              setShowFilters(false);
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              border: '1px solid #eaeaea',
                              backgroundColor: selectedTimeFilter === item.id ? '#2563eb' : '#f5f5f5',
                              color: selectedTimeFilter === item.id ? 'white' : '#666',
                              fontWeight: selectedTimeFilter === item.id ? 'bold' : 'normal',
                            }}
                          >
                            {item.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 分类筛选选项下拉菜单 */}
                {showFilters && filterType === 'category' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '12px',
                    marginTop: '8px',
                    zIndex: 1000,
                  }}>
                    {categories.map(item => (
                      <div 
                        key={item.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f0f0f0',
                          color: selectedCategory === item.id ? '#2563eb' : '#333',
                          backgroundColor: selectedCategory === item.id ? '#f0f7ff' : 'white',
                          fontWeight: selectedCategory === item.id ? 'bold' : 'normal',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          handleCategorySelect(item.id);
                          setShowFilters(false);
                        }}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 城市筛选选项下拉菜单 */}
                {showFilters && filterType === 'city' && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '12px',
                    marginTop: '8px',
                    zIndex: 1000,
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}>
                    {cities.map(item => (
                      <div 
                        key={item.id}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #f0f0f0',
                          color: selectedCity === item.id ? '#2563eb' : '#333',
                          backgroundColor: selectedCity === item.id ? '#f0f7ff' : 'white',
                          fontWeight: selectedCity === item.id ? 'bold' : 'normal',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          handleCitySelect(item.id);
                          setShowFilters(false);
                        }}
                      >
                        {item.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* 主内容区域 */}
          <div style={styles.mainContent} data-main-content>
            {/* 活动列表 */}
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.loadingSpinner}></div>
              </div>
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => renderActivityCard(activity))
            ) : (
              <div style={styles.emptyState}>
                <img 
                  src="https://cdn-icons-png.flaticon.com/512/5445/5445197.png" 
                  alt="没有活动"
                  style={styles.emptyStateImage}
                />
                <p style={styles.emptyStateText}>没有找到符合条件的活动</p>
                <button 
                  onClick={resetFilters}
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  清除筛选条件
                </button>
              </div>
            )}
          </div>
          
          {/* 底部导航 */}
          <div style={styles.bottomNav}>
            <Link href="/activities" style={styles.navItemActive}>
              <ExploreIcon />
              <span style={styles.navText}>发现</span>
            </Link>
            <Link href="/activities/create" style={styles.createButton}>
              <AddIcon />
            </Link>
            <Link href="/profile" style={styles.navItem}>
              <PersonIcon />
              <span style={styles.navText}>我的</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 

