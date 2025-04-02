"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/user-store";
import { updateUserProfile } from "@/lib/auth";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase";

// 图标组件
const BackIcon = () => (
  <span className="material-icons">arrow_back</span>
);

const AddIcon = () => (
  <span className="material-icons">add</span>
);

const CloseIcon = () => (
  <span className="material-icons">close</span>
);

const ExploreIcon = () => (
  <span className="material-icons">explore</span>
);

const PersonIcon = () => (
  <span className="material-icons">person</span>
);

// 兴趣选项
const HOBBY_OPTIONS = [
  "阅读", "音乐", "电影", "游戏", "运动", "旅行", "美食", "摄影", "编程", "艺术", "舞蹈", "烹饪", "瑜伽", "书法", "园艺"
];

export default function EditProfilePage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUser);
  const setUser = useUserStore((state) => state.setUser);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [customHobby, setCustomHobby] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

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
    textarea: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      minHeight: '120px',
      resize: 'vertical' as const,
    },
    submitButton: {
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
    avatarContainer: {
      marginBottom: '24px',
    },
    avatarPreview: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      overflow: 'hidden',
      position: 'relative' as const,
      marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '4px solid white',
    },
    avatarPlaceholder: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: '#e0eaff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#2563eb',
      fontSize: '48px',
      fontWeight: 'bold',
      border: '4px solid white',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    uploadButton: {
      display: 'inline-block',
      padding: '10px 20px',
      background: '#e0eaff',
      color: '#2563eb',
      borderRadius: '20px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
    },
    cancelButton: {
      marginLeft: '12px',
      padding: '10px 20px',
      background: '#fff',
      color: '#f56565',
      border: '1px solid #f56565',
      borderRadius: '20px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '14px',
    },
    hobbyContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '12px',
    },
    hobbyTag: {
      padding: '8px 16px',
      background: '#f0f0f0',
      borderRadius: '20px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
    },
    selectedHobbyTag: {
      padding: '8px 16px',
      background: '#e0eaff',
      color: '#2563eb',
      borderRadius: '20px',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      cursor: 'pointer',
    },
    customHobbyInput: {
      display: 'flex',
      marginTop: '12px',
    },
    customHobbyField: {
      flex: 1,
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '8px 0 0 8px',
      fontSize: '14px',
    },
    addButton: {
      padding: '10px 15px',
      background: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '0 8px 8px 0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
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
    centeredContainer: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centeredContent: {
      textAlign: 'center' as const,
    },
    disabledInput: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      backgroundColor: '#f5f5f5',
      color: '#666',
    },
  };

  // 检查登录状态
  useEffect(() => {
    // 从cookie获取登录状态
    const cookies = document.cookie.split(';');
    const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
    setIsLoggedIn(isLoggedInCookie?.includes('true') || false);
    
    if (!isLoggedInCookie?.includes('true')) {
      router.push('/auth');
    }
  }, [router]);

  // 获取用户信息
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 填充表单数据
  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        fullName: user.full_name || "",
        bio: user.bio || "",
        location: user.location || "",
        birthday: user.birthday ? user.birthday.substring(0, 10) : "", // 格式化为HTML date格式
      });
      
      setSelectedHobbies(user.hobbies || []);
      
      if (user.avatar_url) {
        setImagePreview(user.avatar_url);
      }
    }
  }, [user, reset]);

  // 如果用户未登录，显示提示信息
  if (!isLoggedIn) {
    return <div style={styles.centeredContainer}>
      <div style={styles.centeredContent}>
        <div style={{marginBottom: '16px'}}>请先登录</div>
        <Link href="/auth">
          <Button>前往登录</Button>
        </Link>
      </div>
    </div>;
  }
  
  // 如果已登录但用户数据还未加载完成
  if (!user) {
    return <div style={styles.centeredContainer}>
      <div style={{height: '32px', width: '32px', borderRadius: '50%', border: '4px solid #eeeeee', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite'}}></div>
    </div>;
  }

  // 处理兴趣选择
  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter(h => h !== hobby));
    } else {
      setSelectedHobbies([...selectedHobbies, hobby]);
    }
  };

  // 添加自定义兴趣
  const addCustomHobby = () => {
    if (customHobby && !selectedHobbies.includes(customHobby)) {
      setSelectedHobbies([...selectedHobbies, customHobby]);
      setCustomHobby("");
    }
  };

  // 处理图片上传
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

  // 提交表单
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // 构建更新数据
      const updatedProfile = {
        ...user,
        username: data.username,
        full_name: data.fullName || "",
        bio: data.bio || "",
        location: data.location || "",
        birthday: data.birthday || "",
        hobbies: selectedHobbies,
        avatar_url: imagePreview || undefined,
      };
      
      // 乐观更新：立即更新本地状态
      setUser(updatedProfile);
      localStorage.setItem('userData', JSON.stringify(updatedProfile));
      
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
        localStorage.setItem('userData', JSON.stringify(user));
        throw new Error(result.error || '更新失败');
      }
      
      // 更新成功
      alert('个人资料更新成功!');
      router.push("/profile");
    } catch (error: any) {
      console.error('更新资料失败:', error);
      alert(`更新资料失败: ${error.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 顶部导航 */}
      <div style={styles.header}>
        <button 
          onClick={() => router.back()}
          style={styles.backButton}
          aria-label="返回"
        >
          <BackIcon />
        </button>
        <div style={styles.headerTitle}>编辑个人资料</div>
      </div>
      
      {/* 表单内容 */}
      <div style={styles.content}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 头像上传 */}
          <div style={styles.avatarContainer}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              {imagePreview ? (
                <div style={styles.avatarPreview}>
                  <img
                    src={imagePreview}
                    alt="头像预览"
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                  />
                </div>
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div style={{marginTop: '12px'}}>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  style={{display: 'none'}}
                  onChange={handleImageChange}
                  disabled={isSubmitting}
                />
                <label 
                  htmlFor="avatar" 
                  style={{
                    ...styles.uploadButton,
                    opacity: isSubmitting ? 0.5 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  上传新头像
                </label>
                
                {imagePreview && imagePreview !== user.avatar_url && (
                  <button
                    type="button"
                    style={{
                      ...styles.cancelButton,
                      opacity: isSubmitting ? 0.5 : 1,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                    onClick={() => {
                      setImagePreview(user.avatar_url || null);
                      setImageFile(null);
                    }}
                    disabled={isSubmitting}
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* 用户名 */}
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>
              用户名 <span style={{color: '#e53e3e'}}>*</span>
            </label>
            <input
              id="username"
              {...register("username", { required: "请输入用户名" })}
              style={styles.disabledInput}
              disabled // 禁止修改用户名
            />
            {errors.username && (
              <p style={{color: '#e53e3e', fontSize: '14px', marginTop: '4px'}}>
                {errors.username.message as string}
              </p>
            )}
          </div>
          
          {/* 昵称 */}
          <div style={styles.formGroup}>
            <label htmlFor="fullName" style={styles.label}>
              昵称
            </label>
            <input
              id="fullName"
              {...register("fullName")}
              style={styles.input}
              placeholder="填写您的昵称"
              disabled={isSubmitting}
            />
          </div>
          
          {/* 个人简介 */}
          <div style={styles.formGroup}>
            <label htmlFor="bio" style={styles.label}>
              个人简介
            </label>
            <textarea
              id="bio"
              {...register("bio")}
              style={styles.textarea}
              placeholder="介绍一下自己吧..."
              disabled={isSubmitting}
            />
          </div>
          
          {/* 所在地 */}
          <div style={styles.formGroup}>
            <label htmlFor="location" style={styles.label}>
              所在地
            </label>
            <input
              id="location"
              {...register("location")}
              style={styles.input}
              placeholder="填写您的所在城市"
            />
          </div>
          
          {/* 生日 */}
          <div style={styles.formGroup}>
            <label htmlFor="birthday" style={styles.label}>
              生日
            </label>
            <input
              id="birthday"
              type="date"
              {...register("birthday")}
              style={styles.input}
            />
          </div>
          
          {/* 兴趣爱好 */}
          <div style={styles.formGroup}>
            <label style={styles.label}>兴趣爱好</label>
            <div style={styles.hobbyContainer}>
              {HOBBY_OPTIONS.map((hobby) => (
                <div
                  key={hobby}
                  style={selectedHobbies.includes(hobby) ? styles.selectedHobbyTag : styles.hobbyTag}
                  onClick={() => toggleHobby(hobby)}
                >
                  {hobby}
                </div>
              ))}
            </div>
            
            {/* 自定义兴趣 */}
            <div style={styles.customHobbyInput}>
              <input
                type="text"
                value={customHobby}
                onChange={(e) => setCustomHobby(e.target.value)}
                placeholder="添加自定义兴趣"
                style={styles.customHobbyField}
              />
              <button
                type="button"
                onClick={addCustomHobby}
                style={styles.addButton}
                disabled={!customHobby}
              >
                <AddIcon />
              </button>
            </div>
            
            {/* 已选择的兴趣展示 */}
            {selectedHobbies.length > 0 && (
              <div style={{marginTop: '16px'}}>
                <label style={styles.label}>已选择的兴趣：</label>
                <div style={styles.hobbyContainer}>
                  {selectedHobbies.map((hobby) => (
                    <div key={hobby} style={{
                      ...styles.selectedHobbyTag,
                      background: '#2563eb',
                      color: 'white',
                    }}>
                      {hobby}
                      <span 
                        style={{fontSize: '16px', cursor: 'pointer'}}
                        onClick={() => toggleHobby(hobby)}
                      >
                        <CloseIcon />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 提交按钮 */}
          <div style={{marginTop: '24px', paddingBottom: '80px'}}>
            <button
              type="submit"
              style={{
                ...styles.submitButton,
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存修改'}
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
        <Link href="/profile" style={styles.navItemActive}>
          <PersonIcon />
          <span style={{fontSize: '12px'}}>我的</span>
        </Link>
      </div>
    </div>
  );
} 