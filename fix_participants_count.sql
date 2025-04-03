-- 修复活动参与人数字段和函数

-- 1. 添加participants_count字段（如果不存在）
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'activities' 
    AND column_name = 'participants_count'
  ) THEN
    ALTER TABLE public.activities ADD COLUMN participants_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. 创建增加活动参与人数的函数
CREATE OR REPLACE FUNCTION public.increment_participants_count(
  activity_id_param UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- 更新活动参与人数 (+1)
  UPDATE public.activities
  SET participants_count = COALESCE(participants_count, 0) + 1
  WHERE id = activity_id_param;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '更新参与人数失败: %', SQLERRM;
END;
$$;

-- 3. 为用户授予执行此函数的权限
GRANT EXECUTE ON FUNCTION public.increment_participants_count TO anon;
GRANT EXECUTE ON FUNCTION public.increment_participants_count TO authenticated;

-- 4. 先删除现有函数，然后再创建新函数
DROP FUNCTION IF EXISTS public.update_activity_participant_count(uuid);

-- 创建更新活动参与人数的函数
CREATE OR REPLACE FUNCTION public.update_activity_participant_count(
  activity_id_param UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  participant_count INT;
BEGIN
  -- 计算参与者数量
  SELECT COUNT(*) INTO participant_count
  FROM public.activity_participants
  WHERE activity_participants.activity_id = activity_id_param;
  
  -- 更新活动参与人数
  UPDATE public.activities
  SET participants_count = participant_count
  WHERE id = activity_id_param;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- 先删除现有函数，然后再创建新函数
DROP FUNCTION IF EXISTS public.update_all_activity_participants_count();

-- 创建更新所有活动参与人数的函数
CREATE OR REPLACE FUNCTION public.update_all_activity_participants_count()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  activity_record RECORD;
BEGIN
  FOR activity_record IN SELECT id FROM public.activities
  LOOP
    PERFORM public.update_activity_participant_count(activity_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- 5. 执行更新所有活动参与人数统计
SELECT public.update_all_activity_participants_count(); 