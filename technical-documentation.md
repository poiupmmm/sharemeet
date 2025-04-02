# ShareMeet 技术文档

## 技术栈

- **前端框架**: Next.js 15.2.4 (React 19)
- **CSS框架**: Tailwind CSS 4
- **状态管理**: Zustand 5.0.3
- **认证**: Supabase Auth
- **数据库**: Supabase
- **动画**: Framer Motion
- **表单处理**: React Hook Form
- **UI工具**: 
  - class-variance-authority
  - clsx
  - tailwind-merge
  - tailwindcss-animate
  - lucide-react (图标)
- **主题**: next-themes

## 项目结构

```
sharemeet/
├── .next/                # Next.js构建输出
├── .cursor/              # Cursor IDE配置
├── node_modules/         # 依赖包
├── public/               # 静态资源
├── src/                  # 源代码
│   ├── app/              # Next.js App Router页面
│   │   ├── auth/         # 认证相关页面
│   │   ├── profile/      # 用户资料页面
│   │   ├── activities/   # 活动相关页面
│   │   ├── page.tsx      # 主页
│   │   └── layout.jsx    # 根布局
│   ├── components/       # React组件
│   │   ├── shared/       # 共享组件
│   │   └── ui/           # UI组件
│   ├── lib/              # 工具函数和库
│   ├── store/            # Zustand状态管理
│   └── middleware.ts     # Next.js中间件
├── .env.local            # 环境变量
├── technical-documentation.md  # 技术文档
├── project-documentation.md    # 项目文档
└── 配置文件              # 各种配置文件
```

## 技术实现细节

### 1. 认证系统

项目使用Cookie实现简单的认证机制，通过中间件保护需要认证的路由：

```typescript
// middleware.ts 中的认证逻辑
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查当前路径是否为公开路径
  const isPublicPath = publicPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // 从Cookie获取登录状态
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true'
  
  // 如果是公开路径，直接访问
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // 如果未登录且不是公开路径，重定向到登录页
  if (!isLoggedIn) {
    const url = new URL('/auth', request.url)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}
```

登录成功后，通过设置Cookie记录用户认证状态：

```typescript
// 设置认证Cookie
document.cookie = "isLoggedIn=true; path=/; max-age=86400";
```

### 2. 状态管理

使用Zustand进行全局状态管理，比Redux更轻量且易于使用：

```typescript
// 示例Zustand store
import { create } from 'zustand'

type UserState = {
  user: User | null
  setUser: (user: User | null) => void
}

const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

### 3. UI组件系统

采用组件化设计，使用Tailwind CSS构建响应式UI：

- `/components/ui/` - 基础UI组件
- `/components/shared/` - 业务共享组件
- Tailwind配置使用了表单插件和排版插件增强功能

### 4. 路由结构

采用Next.js App Router，页面组织如下：

- `/app/page.tsx` - 首页，展示推荐活动和平台介绍
- `/app/auth/` - 用户登录注册
- `/app/profile/` - 用户资料
- `/app/activities/` - 活动列表和详情

### 5. API通信

使用Supabase客户端处理数据操作：

```typescript
// 示例Supabase查询
const { data, error } = await supabase
  .from('activities')
  .select('*')
  .order('created_at', { ascending: false })
```

## 数据库结构

项目使用Supabase数据库，主要表结构如下：

### 1. users 表
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  role VARCHAR(50) DEFAULT 'user'
);
```

### 2. profiles 表
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
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
```

### 3. activities 表
```sql
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organizer_name VARCHAR(255) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL, -- 开始时间
  end_date TIMESTAMP WITH TIME ZONE, -- 结束时间
  location VARCHAR(255) NOT NULL,
  image_url TEXT,
  category VARCHAR(255) NOT NULL,
  price VARCHAR(255),
  attendees_limit INTEGER,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. activity_participants 表
```sql
CREATE TABLE public.activity_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);
```

### 5. activity_favorites 表
```sql
CREATE TABLE public.activity_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);
```

## 开发环境配置

1. 安装依赖：
```bash
npm install
```

2. 环境变量设置(.env.local)：
```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

3. 启动开发服务器：
```bash
npm run dev
```

## 构建与部署

1. 构建生产版本：
```bash
npm run build
```

2. 启动生产服务器：
```bash
npm run start
```

3. 推荐部署平台：Vercel

## 性能优化

1. 使用Next.js内置图片优化
2. 组件懒加载
3. 静态生成与服务器端渲染结合使用
4. Tailwind CSS自动清除未使用的CSS 

## 最近更新

### 1. 活动筛选功能增强 (更新日期：当前日期)

在`src/app/activities/page.tsx`页面中，增加了活动分类筛选功能。现在用户可以通过以下三种方式筛选活动：

- **时间筛选**：按照活动开始时间进行筛选，包括"今天"、"明天"、"本周"、"下周"和"本月"等选项
- **分类筛选**：按照活动类别进行筛选，包括"户外"、"运动"、"音乐"、"美食"、"艺术"、"科技"、"学习"和"社交"等选项
- **城市筛选**：按照活动所在城市进行筛选

此更新解决了之前用户无法通过分类筛选活动的问题，使筛选功能更加完善。

```typescript
// 分类筛选下拉框代码示例
<select 
  value={selectedCategory}
  onChange={(e) => handleCategorySelect(e.target.value)}
>
  {categories.map((category) => (
    <option key={category.id} value={category.id}>
      {category.name}
    </option>
  ))}
</select>
``` 