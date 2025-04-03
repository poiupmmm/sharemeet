"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/user-store";
import { useActivityStore } from "@/store/activity-store";
import { getActivity, updateActivity, Activity } from "@/lib/activities";

// 活动分类选项
const CATEGORY_OPTIONS = [
  "户外运动", "聚餐", "文化艺术", "游戏", "学习", "音乐", "旅行", "电影", "技术交流", "其他"
];

// 城市选项
const CITY_OPTIONS = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "南京", "武汉", "西安", "重庆",
  "苏州", "天津", "郑州", "青岛", "大连", "宁波", "厦门", "长沙", "福州", "哈尔滨",
  "济南", "沈阳", "昆明", "贵阳", "南宁", "合肥", "南昌", "太原", "兰州"
];

// 添加动态配置，防止在构建时预渲染
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

export default function EditActivityPage() {
  const router = useRouter();
  const { id } = useParams();
  const activityId = Array.isArray(id) ? id[0] : id || '';
  
  const user = useUserStore((state) => state.user);
  const fetchUser = useUserStore((state) => state.fetchUser);
  
  const activity = useActivityStore((state) => state.currentActivity);
  const fetchActivity = useActivityStore((state) => state.fetchActivity);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customCategory, setCustomCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // 获取活动详情和用户信息
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchUser();
      
      if (activityId) {
        await fetchActivity(activityId);
      }
      
      setIsLoading(false);
    };
    
    init();
  }, [activityId, fetchActivity, fetchUser]);

  // 填充表单数据
  useEffect(() => {
    if (activity) {
      reset({
        title: activity.title,
        description: activity.description,
        location: activity.location,
        startTime: activity.start_time.substring(0, 16), // 格式化为HTML datetime-local格式
        endTime: activity.end_time?.substring(0, 16) || "",
        maxParticipants: activity.max_participants || "",
        price: activity.price || "",
        requirements: activity.requirements || "",
      });
      
      setSelectedCategories(activity.category || []);
      setSelectedCity(activity.city || "");
      
      if (activity.image_url) {
        setImagePreview(activity.image_url);
      }
    }
  }, [activity, reset]);

  // 检查用户是否已登录和权限
  useEffect(() => {
    if (user === null) {
      // 只有当user确定是null时才重定向（不是undefined或正在加载）
      router.push("/auth");
    } else if (activity && user) {
      // @ts-ignore - 忽略类型检查，因为我们知道activity可能有creator_id属性
      const creatorId = activity.creator_id || (activity as any).user_id;
      if (user.id !== creatorId) {
        // 如果用户不是活动创建者，则重定向回活动详情页
        router.push(`/activities/${activityId}`);
      }
    }
  }, [user, activity, activityId, router]);

  // 处理分类选择
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // 添加自定义分类
  const addCustomCategory = () => {
    if (customCategory && !selectedCategories.includes(customCategory)) {
      setSelectedCategories([...selectedCategories, customCategory]);
      setCustomCategory("");
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
    if (!activity) return;
    
    if (selectedCategories.length === 0) {
      alert("请至少选择一个活动分类");
      return;
    }

    if (!selectedCity) {
      alert("请选择活动城市");
      return;
    }

    // @ts-ignore - 忽略类型检查，因为我们知道user和activity可能有id和creator_id属性
    if (!user || user.id !== activity.creator_id) {
      alert("您没有权限编辑此活动");
      return;
    }

    setIsSubmitting(true);

    try {
      // 这里应该先上传图片到存储服务，获取URL
      // 简化版本，假设已获取URL
      const imageUrl = imagePreview || undefined; // 将null转换为undefined
      
      // 价格处理：确保价格正确传递
      let priceValue = data.price;
      // 如果输入为空字符串，设为"免费"；如果是数字，转为字符串
      if (priceValue === "" || priceValue === undefined || priceValue === null) {
        priceValue = "免费";
      } else {
        // 确保价格是字符串类型
        priceValue = String(priceValue);
      }
      
      const updatedActivity = {
        title: data.title,
        description: data.description,
        location: data.location,
        city: selectedCity,
        start_time: data.startTime,
        end_time: data.endTime || data.startTime,
        image_url: imageUrl,
        category: selectedCategories,
        max_participants: data.maxParticipants ? parseInt(data.maxParticipants) : undefined,
        price: priceValue, // 使用处理过的价格值
        requirements: data.requirements || "",
      };

      console.log("提交更新的活动数据:", updatedActivity);

      // @ts-ignore - 忽略类型检查，因为user.id可能为undefined
      await updateActivity(activityId, user.id, updatedActivity);
      
      alert("活动更新成功！");
      router.push(`/activities/${activityId}`);
    } catch (error: any) {
      console.error("更新活动失败:", error);
      alert(`更新活动失败: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !activity || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <div className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold">编辑活动</h1>
          </div>
        </div>
      </div>
      
      {/* 表单 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 活动标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              活动标题 <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              {...register("title", { required: "请输入活动标题" })}
              error={errors.title?.message as string}
              placeholder="输入活动标题"
            />
          </div>
          
          {/* 活动分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活动分类 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCategories.includes(category)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex mt-2">
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="添加自定义分类"
                className="mr-2"
              />
              <Button 
                type="button" 
                variant="outline"
                onClick={addCustomCategory}
                disabled={!customCategory}
              >
                添加
              </Button>
            </div>
            {selectedCategories.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-500">已选分类:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
                    >
                      {category}
                      <button
                        type="button"
                        className="ml-1 text-blue-500 hover:text-blue-700"
                        onClick={() => toggleCategory(category)}
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 活动城市 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活动城市 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {CITY_OPTIONS.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedCity === city
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCity(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
          
          {/* 活动描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              活动描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              {...register("description", { required: "请输入活动描述" })}
              rows={5}
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="详细描述活动内容"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>
            )}
          </div>
          
          {/* 详细地点 */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              详细地点 <span className="text-red-500">*</span>
            </label>
            <Input
              id="location"
              {...register("location", { required: "请输入活动地点" })}
              error={errors.location?.message as string}
              placeholder="输入详细地点"
            />
          </div>
          
          {/* 活动时间 */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              开始时间 <span className="text-red-500">*</span>
            </label>
            <Input
              id="startTime"
              type="datetime-local"
              {...register("startTime", { required: "请选择开始时间" })}
              error={errors.startTime?.message as string}
            />
          </div>
          
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              结束时间
            </label>
            <Input
              id="endTime"
              type="datetime-local"
              {...register("endTime")}
            />
          </div>
          
          {/* 参与人数上限 */}
          <div>
            <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-1">
              参与人数上限
            </label>
            <Input
              id="maxParticipants"
              type="number"
              min={1}
              {...register("maxParticipants")}
              placeholder="不填则无上限"
            />
          </div>
          
          {/* 价格 */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              价格
            </label>
            <Input
              id="price"
              type="number"
              {...register("price")}
              placeholder="输入价格"
            />
          </div>
          
          {/* 参与要求 */}
          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
              参与要求
            </label>
            <textarea
              id="requirements"
              {...register("requirements")}
              rows={3}
              className={`w-full rounded-md border px-3 py-2 text-sm ${
                errors.requirements ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="输入参与要求"
            />
            {errors.requirements && (
              <p className="text-red-500 text-sm mt-1">{errors.requirements.message as string}</p>
            )}
          </div>
          
          {/* 上传图片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              活动图片
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imagePreview ? (
                  <div>
                    <img 
                      src={imagePreview} 
                      alt="预览" 
                      className="mx-auto h-32 w-auto object-cover" 
                    />
                    <button
                      type="button"
                      className="mt-2 text-sm text-red-500"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                    >
                      移除图片
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400" />
                    <p className="text-xs text-gray-500 mt-2">
                      点击上传或拖拽图片到此处
                    </p>
                  </div>
                )}
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  className={!imagePreview ? "sr-only" : "hidden"}
                  onChange={handleImageChange}
                />
                {!imagePreview && (
                  <label
                    htmlFor="image"
                    className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>上传图片</span>
                  </label>
                )}
              </div>
            </div>
          </div>
          
          {/* 提交按钮 */}
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push(`/activities/${activityId}`)}
              className="mr-4"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
              ) : (
                "保存更改"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 