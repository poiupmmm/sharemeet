-- 为活动表添加城市字段
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- 更新索引以改善城市搜索性能
CREATE INDEX IF NOT EXISTS activities_city_idx ON public.activities(city);

-- 更新没有城市信息的现有活动记录
-- 可以根据location字段中的信息提取城市，或者设置为默认值
UPDATE public.activities SET city = '未知城市' WHERE city IS NULL; 