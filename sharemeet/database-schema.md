# ShareMeet 数据库结构

本文档记录ShareMeet应用的Supabase数据库结构，包括表设计和行级安全策略。

## 数据表

### 用户资料表 (profiles)

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'normal', -- 'normal' 或 'creator'
  avatar_url TEXT,
  bio TEXT,
  birthday DATE,
  hobbies TEXT[],
  location TEXT,
  created_activities_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键，关联auth.users |
| username | TEXT | 用户名，唯一 |
| role | TEXT | 用户角色: normal(普通用户)或creator(创建者) |
| avatar_url | TEXT | 头像URL |
| bio | TEXT | 个人简介 |
| birthday | DATE | 生日 |
| hobbies | TEXT[] | 兴趣爱好，字符串数组 |
| location | TEXT | 所在地 |
| created_activities_count | INTEGER | 已创建活动数量 |
| created_at | TIMESTAMP | 记录创建时间 |

### 活动表 (activities)

```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  category TEXT[] NOT NULL,
  max_participants INTEGER,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| title | TEXT | 活动标题 |
| description | TEXT | 活动描述 |
| location | TEXT | 活动地点 |
| start_time | TIMESTAMP | 开始时间 |
| end_time | TIMESTAMP | 结束时间 |
| image_url | TEXT | 活动图片URL |
| category | TEXT[] | 活动分类，字符串数组 |
| max_participants | INTEGER | 参与人数上限(可选) |
| creator_id | UUID | 创建者ID，关联profiles表 |
| participants_count | INTEGER | 当前参与人数 |
| created_at | TIMESTAMP | 记录创建时间 |

### 活动参与者表 (activity_participants)

```sql
CREATE TABLE activity_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id)
);
```

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| activity_id | UUID | 活动ID，关联activities表 |
| user_id | UUID | 用户ID，关联profiles表 |
| created_at | TIMESTAMP | 记录创建时间 |

该表包含唯一约束(activity_id, user_id)，确保用户不能重复参加同一活动。

### 活动收藏表 (activity_favorites)

```sql
CREATE TABLE activity_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id)
);
```

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| activity_id | UUID | 活动ID，关联activities表 |
| user_id | UUID | 用户ID，关联profiles表 |
| created_at | TIMESTAMP | 记录创建时间 |

该表包含唯一约束(activity_id, user_id)，确保用户不能重复收藏同一活动。

## 行级安全策略 (RLS)

### profiles表策略

```sql
-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看所有人的资料，但只能修改自己的资料
CREATE POLICY "允许所有人查看资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "允许用户修改自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### activities表策略

```sql
-- 启用RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- 所有人可查看活动，创建者可以修改和删除自己的活动
CREATE POLICY "允许所有人查看活动" ON activities FOR SELECT USING (true);
CREATE POLICY "允许创建者修改活动" ON activities FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "允许创建者删除活动" ON activities FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "允许用户创建活动" ON activities FOR INSERT WITH CHECK (auth.uid() = creator_id);
```

### activity_participants表策略

```sql
-- 启用RLS
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;

-- 可以查看活动参与情况，用户可以添加/删除自己的参与记录
CREATE POLICY "允许查看活动参与情况" ON activity_participants FOR SELECT USING (true);
CREATE POLICY "允许用户参与活动" ON activity_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户取消参与" ON activity_participants FOR DELETE USING (auth.uid() = user_id);
```

### activity_favorites表策略

```sql
-- 启用RLS
ALTER TABLE activity_favorites ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的收藏，添加/删除自己的收藏
CREATE POLICY "允许查看自己的收藏" ON activity_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "允许用户收藏活动" ON activity_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户取消收藏" ON activity_favorites FOR DELETE USING (auth.uid() = user_id);
```

## 完整SQL脚本

```sql
-- 先删除现有表（如果存在）
DROP TABLE IF EXISTS activity_favorites;
DROP TABLE IF EXISTS activity_participants;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS participants; -- 删除之前存在的participants表
DROP TABLE IF EXISTS profiles;

-- 启用UUID扩展（如果尚未启用）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户资料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'normal', -- 'normal' 或 'creator'
  avatar_url TEXT,
  bio TEXT,
  birthday DATE,
  hobbies TEXT[],
  location TEXT,
  created_activities_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建活动表
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  category TEXT[] NOT NULL,
  max_participants INTEGER,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  participants_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建活动参与者表
CREATE TABLE activity_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id)
);

-- 创建活动收藏表
CREATE TABLE activity_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(activity_id, user_id)
);

-- 设置行级安全策略(RLS)
-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_favorites ENABLE ROW LEVEL SECURITY;

-- profiles表策略：用户只能查看所有人的资料，但只能修改自己的资料
CREATE POLICY "允许所有人查看资料" ON profiles FOR SELECT USING (true);
CREATE POLICY "允许用户修改自己的资料" ON profiles FOR UPDATE USING (auth.uid() = id);

-- activities表策略：所有人可查看活动，创建者可以修改和删除自己的活动
CREATE POLICY "允许所有人查看活动" ON activities FOR SELECT USING (true);
CREATE POLICY "允许创建者修改活动" ON activities FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "允许创建者删除活动" ON activities FOR DELETE USING (auth.uid() = creator_id);
CREATE POLICY "允许用户创建活动" ON activities FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- activity_participants表策略：可以查看活动参与情况，用户可以添加/删除自己的参与记录
CREATE POLICY "允许查看活动参与情况" ON activity_participants FOR SELECT USING (true);
CREATE POLICY "允许用户参与活动" ON activity_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户取消参与" ON activity_participants FOR DELETE USING (auth.uid() = user_id);

-- activity_favorites表策略：用户可以查看自己的收藏，添加/删除自己的收藏
CREATE POLICY "允许查看自己的收藏" ON activity_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "允许用户收藏活动" ON activity_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "允许用户取消收藏" ON activity_favorites FOR DELETE USING (auth.uid() = user_id);
``` 