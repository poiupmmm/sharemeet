"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getActivity, createActivity, updateActivity, getUserInfo } from "@/lib/activities";

// 图标组件
const BackIcon = () => (
  <span className="material-icons">arrow_back</span>
);

const ImageIcon = () => (
  <span className="material-icons">photo_camera</span>
);

const ExploreIcon = () => (
  <span className="material-icons">explore</span>
);

const PersonIcon = () => (
  <span className="material-icons">person</span>
);

// 活动类别
const categories = [
  { id: 'outdoor', name: '户外' },
  { id: 'sports', name: '运动' },
  { id: 'music', name: '音乐' },
  { id: 'food', name: '美食' },
  { id: 'art', name: '艺术' },
  { id: 'tech', name: '科技' },
  { id: 'learning', name: '学习' },
  { id: 'social', name: '社交' },
];

// 城市选项
const cities = [
  { id: 'beijing', name: '北京' },
  { id: 'shanghai', name: '上海' },
  { id: 'guangzhou', name: '广州' },
  { id: 'shenzhen', name: '深圳' },
  { id: 'hangzhou', name: '杭州' },
  { id: 'chengdu', name: '成都' },
];

// 表单类型
interface FormData {
  title: string;
  category: string;
  date: string;
  time: string;
  endDate: string;  // 新增结束日期
  endTime: string;  // 新增结束时间
  location: string;
  city: string;
  price: string;
  maxParticipants: string;
  description: string;
  requirements: string;
  imageUrl: string;
  organizer: string;  // 添加组织者字段
}

export default function CreateActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams ? searchParams.get('edit') === 'true' : false; 
  const activityId = searchParams ? searchParams.get('id') : null;
  
  const [step, setStep] = useState(1); // 1: 基本信息, 2: 详细信息, 3: 预览
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // 添加状态表示正在检查登录
  const [isLoadingActivity, setIsLoadingActivity] = useState(isEditMode); // 如果是编辑模式，则需要加载活动数据
  
  // 表单状态
  const [form, setForm] = useState<FormData>({
    title: '',
    category: '',
    date: '',
    time: '',
    endDate: '',  // 初始化结束日期
    endTime: '',  // 初始化结束时间
    location: '',
    city: '',
    price: '',
    maxParticipants: '',
    description: '',
    requirements: '',
    imageUrl: '',
    organizer: '',  // 初始化组织者字段
  });

  // 添加用户名状态
  const [username, setUsername] = useState<string>('');

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
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      background: '#2563eb',
      color: 'white',
    },
    backButton: {
      background: 'transparent',
      border: 'none',
      color: 'white',
      marginRight: '12px',
      padding: '4px',
      cursor: 'pointer',
      display: 'flex',
    },
    headerTitle: {
      fontSize: '18px',
      fontWeight: '600',
    },
    content: {
      padding: '20px',
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '24px',
    },
    stepItem: {
      flex: 1,
      height: '4px',
      backgroundColor: '#e0e0e0',
      marginRight: '4px',
    },
    stepActive: {
      backgroundColor: '#2563eb',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#333',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      appearance: 'none' as const,
      background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23333' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat`,
      backgroundPosition: 'calc(100% - 12px) center',
    },
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      minHeight: '120px',
      resize: 'vertical' as const,
    },
    button: {
      width: '100%',
      padding: '14px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
    },
    rowGroup: {
      display: 'flex',
      gap: '12px',
      marginBottom: '20px',
    },
    imageUpload: {
      width: '100%',
      height: '200px',
      border: '2px dashed #ddd',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer',
      marginBottom: '20px',
      overflow: 'hidden',
      position: 'relative' as const,
    },
    uploadLabel: {
      color: '#666',
      textAlign: 'center' as const,
    },
    uploadInput: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity: 0,
      cursor: 'pointer',
    },
    imagePreview: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    navButtons: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '30px',
    },
    nextBtn: {
      flex: 1,
      padding: '14px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      maxWidth: '48%',
    },
    backBtn: {
      flex: 1,
      padding: '14px',
      background: 'white',
      color: '#2563eb',
      border: '1px solid #2563eb',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      maxWidth: '48%',
    },
    previewBlock: {
      marginBottom: '24px',
    },
    previewImage: {
      width: '100%',
      height: '200px',
      borderRadius: '8px',
      objectFit: 'cover' as const,
      marginBottom: '16px',
    },
    previewTitle: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
    },
    detailItem: {
      marginBottom: '16px',
    },
    detailLabel: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '4px',
    },
    detailValue: {
      fontSize: '16px',
      color: '#333',
    },
    detailDescription: {
      fontSize: '16px',
      color: '#333',
      lineHeight: '1.5',
      whiteSpace: 'pre-line' as const,
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
    centeredContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centeredContent: {
      textAlign: 'center' as const,
    },
  };
  
  // 检查用户登录状态 - 页面加载时立即检查
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 从cookie获取登录状态和用户ID
        const cookies = document.cookie.split(';');
        const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
        const userIdCookie = cookies.find(cookie => cookie.trim().startsWith('userId='));
        
        const isUserLoggedIn = isLoggedInCookie?.includes('true') || false;
        const userIdValue = userIdCookie ? decodeURIComponent(userIdCookie.split('=')[1].trim()) : null;
        
        console.log('登录状态检查:', { isUserLoggedIn, userIdValue });
        
        setIsLoggedIn(isUserLoggedIn);
        setUserId(userIdValue);
        
        // 如果用户未登录，立即重定向到登录页面
        if (!isUserLoggedIn || !userIdValue) {
          console.log('用户未登录或无用户ID，重定向到登录页面');
          router.push('/auth');
          // 不设置isCheckingAuth为false，保持加载状态直到重定向完成
        } else {
          setIsCheckingAuth(false); // 已登录，检查完成
          
          // 获取用户信息，包括用户名
          try {
            const userInfo = await getUserInfo(userIdValue);
            if (userInfo && userInfo.username) {
              setUsername(userInfo.username);
              // 设置组织者为用户名
              setForm(prev => ({
                ...prev,
                organizer: userInfo.username
              }));
            }
          } catch (userInfoError) {
            console.error('获取用户信息失败:', userInfoError);
            // 设置一个默认的组织者名称
            setForm(prev => ({
              ...prev,
              organizer: '活动组织者'
            }));
          }
        }
      } catch (error) {
        console.error('检查登录状态时出错:', error);
        router.push('/auth');
      }
    };
    
    // 立即执行登录检查
    checkLoginStatus();
  }, [router]);
  
  // 如果是编辑模式，加载活动数据
  useEffect(() => {
    const fetchActivityData = async () => {
      if (isEditMode && activityId) {
        try {
          setIsLoadingActivity(true);
          const activityData = await getActivity(activityId);
          
          if (activityData) {
            // 格式化日期和时间
            const startDate = new Date(activityData.start_time);
            const endDate = activityData.end_time ? new Date(activityData.end_time) : new Date(activityData.start_time);
            
            // 获取日期部分 (YYYY-MM-DD)
            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];
            
            // 获取时间部分 (HH:MM)
            const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
            const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
            
            // 准备类别数据 (从数组转为单个值)
            const category = Array.isArray(activityData.category) ? activityData.category[0] : activityData.category;
            
            // 设置图片预览
            if (activityData.image_url) {
              setPreviewImage(activityData.image_url);
            }
            
            // 更新表单数据
            setForm({
              title: activityData.title || '',
              category: category || '',
              date: startDateStr,
              time: startTimeStr,
              endDate: endDateStr,
              endTime: endTimeStr,
              location: activityData.location || '',
              city: activityData.city || '',
              price: activityData.price?.toString() || '0',
              maxParticipants: activityData.max_participants?.toString() || '',
              description: activityData.description || '',
              requirements: activityData.requirements || '',
              imageUrl: activityData.image_url || '',
              organizer: activityData.organizer || '',
            });
          } else {
            alert('找不到活动数据');
            router.push('/activities');
          }
        } catch (error) {
          console.error('加载活动数据失败:', error);
          alert('加载活动数据失败，请返回重试');
        } finally {
          setIsLoadingActivity(false);
        }
      }
    };
    
    fetchActivityData();
  }, [isEditMode, activityId, router]);
  
  // 处理表单输入变化
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理图片上传
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setForm(prev => ({
          ...prev,
          imageUrl: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 处理表单提交
  const handleSubmitForm = () => {
    // 表单验证
    if (!form.title || !form.category || !form.date || !form.time || 
        !form.endDate || !form.endTime || !form.location || !form.city) {  // 不再需要验证组织者字段
      alert('请填写所有必填字段');
      return;
    }

    // 检查结束时间是否晚于开始时间
    const startDateTime = new Date(`${form.date}T${form.time}`);
    const endDateTime = new Date(`${form.endDate}T${form.endTime}`);
    
    if (endDateTime <= startDateTime) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    // 提交表单
    setLoading(true);
    
    try {
      // 确保用户已登录并有userId
      if (!isLoggedIn || !userId) {
        console.error('创建/编辑活动失败：用户未登录或无用户ID', { isLoggedIn, userId });
        setLoading(false);
        router.push('/auth');
        return;
      }
      
      // 构建活动数据
      const activityData = {
        title: form.title,
        description: form.description || '',
        location: form.location,
        city: form.city || '', // 确保城市字段不为null或undefined
        start_time: `${form.date}T${form.time}:00Z`, // 格式化开始时间
        end_time: `${form.endDate}T${form.endTime}:00Z`, // 格式化结束时间
        image_url: form.imageUrl || '',
        category: [form.category], // 类别是数组
        max_participants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
        creator_id: userId,
        organizer: form.organizer,  // 添加组织者字段
        is_creator: true, // 添加is_creator属性，创建活动时设为true
        price: form.price ? Number(form.price) : 0, // 将字符串价格转换为数字
      };
      
      // 确保城市字段有值
      console.log(`城市字段值: "${form.city}"`);
      if (!form.city || form.city.trim() === '') {
        alert('请输入活动所在城市');
        setLoading(false);
        return;
      }
      
      console.log(`准备${isEditMode ? '更新' : '创建'}活动，数据:`, activityData);
      
      // 调用API创建或更新活动
      const submitActivity = async () => {
        try {
          if (isEditMode && activityId) {
            // 更新活动
            try {
              console.log('开始更新活动，数据:', { ...activityData, id: activityId });
              
              const updatedActivity = await updateActivity(
                activityId,
                userId,
                activityData
              );
              
              console.log('活动更新成功:', updatedActivity);
              router.push(`/activities/${activityId}`);
              alert('活动更新成功！');
            } catch (updateError: any) {
              console.error('更新活动失败，详细错误:', updateError);
              
              // 处理各种可能的错误类型
              let errorMessage = '更新活动失败';
              
              if (updateError instanceof Error) {
                errorMessage = updateError.message;
              } else if (typeof updateError === 'object' && updateError !== null) {
                // 尝试从空错误对象中提取更多信息
                if (Object.keys(updateError).length === 0) {
                  errorMessage = '更新活动失败，可能是网络连接问题，请检查网络并重试';
                } else if (updateError.message) {
                  errorMessage = updateError.message;
                } else if (updateError.error) {
                  errorMessage = updateError.error;
                } else if (updateError.details) {
                  errorMessage = updateError.details;
                }
              }
              
              alert(`更新活动失败: ${errorMessage}`);
              setLoading(false);
              throw updateError; // 重新抛出错误以终止执行
            }
          } else {
            // 创建新活动
            console.log('开始创建活动，数据:', activityData);
            
            const newActivity = await createActivity(activityData);
            
            console.log('活动创建成功:', newActivity);
            router.push('/activities');
            alert('活动创建成功！');
          }
        } catch (error) {
          console.error(`${isEditMode ? '更新' : '创建'}活动失败，详细错误:`, error);
          let errorMessage = `${isEditMode ? '更新' : '创建'}活动失败`;
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // 尝试从错误对象中提取更多信息
            const errorObj = error as any;
            if (Object.keys(errorObj).length === 0) {
              errorMessage = '操作失败，可能是网络连接问题，请检查网络并重试';
            } else if (errorObj.message) {
              errorMessage = errorObj.message;
            } else if (errorObj.error) {
              errorMessage = errorObj.error;
            } else if (errorObj.details) {
              errorMessage = errorObj.details;
            }
          }
          
          if (!errorMessage || errorMessage === `${isEditMode ? '更新' : '创建'}活动失败`) {
            errorMessage += '，请检查网络连接并重试';
          }
          
          alert(`${isEditMode ? '更新' : '创建'}活动失败: ${errorMessage}`);
          setLoading(false);
        }
      };
      
      // 执行异步函数
      submitActivity();
      
    } catch (error) {
      console.error('准备活动数据失败:', error);
      let errorMessage = '准备活动数据失败';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      
      alert(`${isEditMode ? '更新' : '创建'}活动失败: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  // 渲染步骤1：基本信息
  const renderStep1 = () => (
    <div>
      <div style={styles.formGroup}>
        <label htmlFor="title" style={styles.label}>活动标题 *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="请输入活动标题"
          style={styles.input}
          required
        />
      </div>
          
      <div style={styles.formGroup}>
        <label htmlFor="organizer" style={styles.label}>活动组织者</label>
        <div style={{
          padding: '12px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '16px',
          backgroundColor: '#f9f9f9',
        }}>
          {form.organizer || username || '加载中...'}
        </div>
      </div>
          
      <div style={styles.formGroup}>
        <label htmlFor="category" style={styles.label}>活动类别 *</label>
        <select
          id="category"
          name="category"
          value={form.category}
          onChange={handleChange}
          style={styles.select}
          required
        >
          <option value="">请选择类别</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>活动开始时间 *</label>
        <div style={styles.rowGroup}>
          <div style={{flex: 1}}>
            <label htmlFor="date" style={{...styles.label, fontSize: '14px'}}>日期</label>
            <input
              type="date"
              id="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          
          <div style={{flex: 1}}>
            <label htmlFor="time" style={{...styles.label, fontSize: '14px'}}>时间</label>
            <input
              type="time"
              id="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
        </div>
      </div>
      
      <div style={styles.formGroup}>
        <label style={styles.label}>活动结束时间 *</label>
        <div style={styles.rowGroup}>
          <div style={{flex: 1}}>
            <label htmlFor="endDate" style={{...styles.label, fontSize: '14px'}}>日期</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
          
          <div style={{flex: 1}}>
            <label htmlFor="endTime" style={{...styles.label, fontSize: '14px'}}>时间</label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={form.endTime}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>
        </div>
      </div>
      
      <div style={styles.formGroup}>
        <label htmlFor="city" style={styles.label}>城市 *</label>
        <input
          type="text"
          id="city"
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="请输入城市名称"
          style={styles.input}
          required
        />
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginTop: '10px' 
        }}>
          {cities.map(city => (
            <button
              key={city.id}
              type="button"
              onClick={() => {
                setForm(prev => ({ ...prev, city: city.name }));
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '16px',
                border: '1px solid #ddd',
                background: form.city === city.name ? '#e0f2fe' : 'white',
                color: form.city === city.name ? '#0369a1' : '#666',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {city.name}
            </button>
          ))}
        </div>
      </div>
      
      <div style={styles.formGroup}>
        <label htmlFor="location" style={styles.label}>具体地点 *</label>
        <input
          type="text"
          id="location"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="请输入具体地点"
          style={styles.input}
          required
        />
      </div>
    </div>
  );
  
  // 渲染步骤2：详细信息
  const renderStep2 = () => (
    <div>
      <div style={styles.formGroup}>
        <label htmlFor="imageUrl" style={styles.label}>活动封面</label>
        <div style={styles.imageUpload}>
          {previewImage ? (
            <img src={previewImage} alt="预览图" style={styles.imagePreview} />
          ) : (
            <>
              <ImageIcon />
              <p style={styles.uploadLabel}>点击上传封面图片</p>
            </>
          )}
          <input
            type="file"
            id="imageUpload"
            accept="image/*"
            onChange={handleImageUpload}
            style={styles.uploadInput}
          />
        </div>
      </div>
          
      <div style={styles.rowGroup}>
        <div style={{flex: 1}}>
          <label htmlFor="price" style={styles.label}>价格</label>
          <input
            type="number"
            id="price"
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="0为免费"
            style={styles.input}
            min="0"
          />
        </div>
          
        <div style={{flex: 1}}>
          <label htmlFor="maxParticipants" style={styles.label}>人数上限</label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={form.maxParticipants}
            onChange={handleChange}
            placeholder="无上限请留空"
            style={styles.input}
            min="1"
          />
        </div>
      </div>
      
      <div style={styles.formGroup}>
        <label htmlFor="description" style={styles.label}>活动描述 *</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="详细介绍你的活动内容"
          style={styles.textarea}
          required
        />
      </div>
          
      {/* 隐藏参与要求字段，但保留在表单中的值 */}
      <input
        type="hidden"
        id="requirements"
        name="requirements"
        value={form.requirements}
      />
    </div>
  );

  // 渲染步骤3：预览
  const renderStep3 = () => {
    const selectedCategory = categories.find(c => c.id === form.category)?.name || '';
    const selectedCity = form.city; // 直接使用输入的城市名称
    
    return (
      <div style={styles.previewBlock}>
        {previewImage && (
          <img src={previewImage} alt="活动图片" style={styles.previewImage} />
        )}
        
        <h2 style={styles.previewTitle}>{form.title}</h2>
        
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>类别</div>
          <div style={styles.detailValue}>{selectedCategory}</div>
        </div>
        
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>开始时间</div>
          <div style={styles.detailValue}>{form.date} {form.time}</div>
        </div>
        
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>结束时间</div>
          <div style={styles.detailValue}>{form.endDate} {form.endTime}</div>
        </div>
        
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>地点</div>
          <div style={styles.detailValue}>{selectedCity} {form.location}</div>
        </div>
        
        {form.price && (
          <div style={styles.detailItem}>
            <div style={styles.detailLabel}>价格</div>
            <div style={styles.detailValue}>
              {form.price === '0' || form.price === '0.0' || Number(form.price) === 0 ? 
                '¥0' : 
                form.price === '' ? '免费' : `¥${form.price}`}
            </div>
          </div>
        )}
        
        {form.maxParticipants && (
          <div style={styles.detailItem}>
            <div style={styles.detailLabel}>人数上限</div>
            <div style={styles.detailValue}>{form.maxParticipants}人</div>
          </div>
        )}
        
        <div style={styles.detailItem}>
          <div style={styles.detailLabel}>活动描述</div>
          <div style={styles.detailDescription}>{form.description}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* 检查登录状态时显示加载中 */}
      {isCheckingAuth ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <p>检查登录状态...</p>
        </div>
      ) : !isLoggedIn ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <p>您需要登录才能创建活动，正在跳转到登录页面...</p>
        </div>
      ) : (
        <>
          {/* 顶部导航 */}
          <div style={styles.header}>
            <button 
              onClick={handleBack}
              style={styles.backButton}
              aria-label="返回"
            >
              <BackIcon />
            </button>
            <div style={styles.headerTitle}>
              {isEditMode ? '编辑活动' : '创建活动'}
              {!isEditMode && step === 1 && ' - 基本信息'}
              {!isEditMode && step === 2 && ' - 详细信息'}
              {!isEditMode && step === 3 && ' - 预览'}
            </div>
          </div>
          
          {/* 步骤指示器 */}
          <div style={styles.stepIndicator}>
            <div style={{...styles.stepItem, ...(step >= 1 ? styles.stepActive : {})}}></div>
            <div style={{...styles.stepItem, ...(step >= 2 ? styles.stepActive : {})}}></div>
            <div style={{...styles.stepItem, ...(step >= 3 ? styles.stepActive : {})}}></div>
          </div>
          
          {/* 表单内容 */}
          <div style={styles.content}>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (step === 3) {
                handleSubmitForm();
              } else {
                setStep(step + 1);
              }
            }}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              
              <div style={styles.navButtons}>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    style={styles.backBtn}
                  >
                    上一步
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    style={styles.backBtn}
                  >
                    取消
                  </button>
                )}
                
                <button
                  type="submit"
                  style={loading ? {...styles.nextBtn, opacity: 0.7} : styles.nextBtn}
                  disabled={loading}
                >
                  {step < 3 ? '下一步' : (loading ? (isEditMode ? '更新中...' : '创建中...') : (isEditMode ? '更新活动' : '创建活动'))}
                </button>
              </div>
            </form>
          </div>
          
          {/* 底部导航 */}
          <div style={styles.bottomNav}>
            <Link href="/activities" style={styles.navItem}>
              <ExploreIcon />
              <span style={{fontSize: '12px'}}>发现</span>
            </Link>
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