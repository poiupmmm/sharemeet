-- 统一的数据库初始化脚本
-- 包含完整的表结构、索引、RLS策略和测试数据

-- 删除旧表（如果存在）以避免冲突
DROP TABLE IF EXISTS public.activity_favorites CASCADE; 
DROP TABLE IF EXISTS public.activity_participants CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  role VARCHAR(50) DEFAULT 'user'
);

-- 创建用户资料表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE, -- 添加UNIQUE约束
  username VARCHAR(255) NOT NULL,
  full_name VARCHAR,
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(255),
  birthday DATE,
  hobbies TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建活动表
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- 创建者ID
  organizer_name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL, -- 开始时间
  end_date TIMESTAMP WITH TIME ZONE, -- 结束时间
  location VARCHAR(255) NOT NULL,
  image_url TEXT, -- 封面图片
  category VARCHAR(255) NOT NULL,
  price VARCHAR(255),
  attendees_limit INTEGER, -- 参与者上限
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建活动参与者表
CREATE TABLE IF NOT EXISTS public.activity_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'registered', -- 'registered', 'attended', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- 创建活动收藏表
CREATE TABLE IF NOT EXISTS public.activity_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- 启用行级安全
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_favorites ENABLE ROW LEVEL SECURITY;

-- 公开表策略
CREATE POLICY "允许查看所有活动" ON public.activities FOR SELECT USING (true);
CREATE POLICY "允许查看活动参与者" ON public.activity_participants FOR SELECT USING (true);
CREATE POLICY "允许查看用户资料" ON public.profiles FOR SELECT USING (true);

-- 添加新的策略：允许任何已登录用户参加活动
CREATE POLICY "允许已登录用户参加活动" ON public.activity_participants
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 添加新的策略：允许用户更新活动参与人数
CREATE POLICY "允许更新活动参与人数" ON public.activities
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 用户管理自己的数据策略
CREATE POLICY "用户管理自己的活动" ON public.activities 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户管理自己的参与信息" ON public.activity_participants 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户管理自己的收藏" ON public.activity_favorites 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户管理自己的资料" ON public.profiles 
  FOR ALL USING (auth.uid() = user_id);

-- 索引优化
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS activities_category_idx ON public.activities(category);
CREATE INDEX IF NOT EXISTS activity_participants_activity_id_idx ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS activity_participants_user_id_idx ON public.activity_participants(user_id);
CREATE INDEX IF NOT EXISTS activity_favorites_activity_id_idx ON public.activity_favorites(activity_id);
CREATE INDEX IF NOT EXISTS activity_favorites_user_id_idx ON public.activity_favorites(user_id);
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON public.profiles(user_id);

-- 创建一个测试用户（初始化用）
INSERT INTO users (email, username, password)
VALUES ('test@example.com', 'testuser', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92') -- 密码是'123456'的SHA-256哈希
ON CONFLICT (email) DO NOTHING;

-- 为测试用户创建个人资料
INSERT INTO profiles (user_id, username)
SELECT id, username FROM users WHERE email = 'test@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- 创建直接插入活动参与者的函数（绕过RLS）
CREATE OR REPLACE FUNCTION public.direct_insert_participant(
  activity_id UUID,
  user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER -- 使用SECURITY DEFINER使其以拥有者权限运行
AS $$
DECLARE
  existing_record INT;
  max_participants INT;
  current_count INT;
BEGIN
  -- 检查用户是否已经参加活动
  SELECT COUNT(*) INTO existing_record
  FROM public.activity_participants
  WHERE activity_id = direct_insert_participant.activity_id
  AND user_id = direct_insert_participant.user_id;
  
  IF existing_record > 0 THEN
    RAISE EXCEPTION '用户已参加该活动';
  END IF;
  
  -- 检查活动人数上限
  SELECT attendees_limit, COALESCE(participants_count, 0)
  INTO max_participants, current_count
  FROM public.activities
  WHERE id = direct_insert_participant.activity_id;
  
  IF max_participants IS NOT NULL AND current_count >= max_participants THEN
    RAISE EXCEPTION '活动参与人数已达上限';
  END IF;
  
  -- 插入参与记录
  INSERT INTO public.activity_participants (
    activity_id,
    user_id,
    status,
    created_at
  ) VALUES (
    direct_insert_participant.activity_id,
    direct_insert_participant.user_id,
    'registered',
    now()
  );
  
  -- 更新活动参与人数
  UPDATE public.activities
  SET participants_count = COALESCE(participants_count, 0) + 1
  WHERE id = direct_insert_participant.activity_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 创建更新活动参与人数的函数
CREATE OR REPLACE FUNCTION public.update_activity_participant_count(
  activity_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  participant_count INT;
BEGIN
  -- 计算参与者数量
  SELECT COUNT(*) INTO participant_count
  FROM public.activity_participants
  WHERE activity_id = update_activity_participant_count.activity_id;
  
  -- 更新活动参与人数
  UPDATE public.activities
  SET participants_count = participant_count
  WHERE id = update_activity_participant_count.activity_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 为匿名用户授予执行这些函数的权限
GRANT EXECUTE ON FUNCTION public.direct_insert_participant TO anon;
GRANT EXECUTE ON FUNCTION public.update_activity_participant_count TO anon;
GRANT EXECUTE ON FUNCTION public.direct_insert_participant TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_activity_participant_count TO authenticated;

-- 创建执行SQL语句的函数（仅用于紧急情况）
CREATE OR REPLACE FUNCTION public.execute_sql(
  sql_query TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- 执行SQL查询
  EXECUTE sql_query;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '执行SQL失败: %', SQLERRM;
END;
$$;

-- 为用户授予执行此函数的权限
GRANT EXECUTE ON FUNCTION public.execute_sql TO anon;
GRANT EXECUTE ON FUNCTION public.execute_sql TO authenticated; 