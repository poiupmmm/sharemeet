# ShareMeet 技术文档

## 技术栈

### 前端技术
- **核心框架**: Next.js 14.1.0 (React 18.2.0)
- **CSS框架**: Tailwind CSS 3.3.0
- **状态管理**: Zustand 4.5.0
- **认证**: Supabase Auth (@supabase/auth-helpers-nextjs 0.8.7)
- **数据库客户端**: Supabase JS Client (@supabase/supabase-js 2.39.8)
- **动画**: Framer Motion 11.0.8
- **表单处理**: React Hook Form 7.50.0
- **UI工具**: 
  - class-variance-authority 0.7.0
  - clsx 2.1.0
  - tailwind-merge 2.0.0
  - lucide-react 0.300.0 (图标库)
- **主题切换**: next-themes 0.2.1
- **HTTP客户端**: node-fetch 2.7.0

### 后端技术
- **服务端框架**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **认证服务**: Supabase Auth
- **存储服务**: Supabase Storage

### 小程序技术
- **框架**: 原生微信小程序
- **UI库**: WeUI (weui 2.6.0, weui-miniprogram 1.3.1)
- **地图服务**: 腾讯位置服务

### 开发工具
- **语言**: TypeScript 5.3.3
- **构建工具**: Next.js 内置构建工具
- **代码规范**: ESLint 8.56.0 (eslint-config-next)
- **包管理**: npm
- **IDE**: Cursor
- **版本控制**: Git

## 项目架构

ShareMeet 采用现代化的前端架构，基于Next.js框架构建，结合Supabase提供的后端服务。项目遵循以下架构原则：

### 1. 前端架构

#### 页面结构 (App Router)
```
src/app/
├── layout.tsx           # 根布局
├── page.tsx             # 首页
├── auth/                # 认证相关页面
│   ├── login/           # 登录页面
│   └── register/        # 注册页面
├── profile/             # 用户资料
│   └── [id]/            # 动态路由，用户详情页
├── activities/          # 活动相关页面
│   ├── page.tsx         # 活动列表页
│   ├── create/          # 创建活动页面
│   └── [id]/            # 动态路由，活动详情页
└── api/                 # API路由
    ├── auth/            # 认证相关API
    ├── activities/      # 活动相关API
    └── users/           # 用户相关API
```

#### 组件结构
```
src/components/
├── ui/                  # 基础UI组件
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
├── forms/               # 表单组件
│   ├── login-form.tsx
│   └── activity-form.tsx
├── activities/          # 活动相关组件
│   ├── activity-card.tsx
│   └── activity-list.tsx
├── layout/              # 布局组件
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
└── shared/              # 共享业务组件
    ├── map-view.tsx
    └── user-avatar.tsx
```

#### 数据流架构
1. **客户端状态**: 使用Zustand进行客户端状态管理
2. **服务端状态**: 使用Next.js Server Components和API Routes
3. **API通信**: 通过API Routes与Supabase数据库交互

### 2. 后端架构

#### API路由
项目使用Next.js API Routes作为中间层，避免直接在前端暴露数据库凭据：

```
src/app/api/
├── auth/
│   ├── login/route.ts
│   └── register/route.ts
├── activities/
│   ├── route.ts
│   └── [id]/route.ts
└── users/
    ├── route.ts
    └── [id]/route.ts
```

#### 数据库架构
Supabase PostgreSQL数据库包含以下主要表：

1. **users**: 用户账户信息
2. **profiles**: 用户个人资料
3. **activities**: 活动信息
4. **activity_participants**: 活动参与者关系
5. **activity_favorites**: 活动收藏关系

### 3. 微信小程序架构

小程序遵循微信官方的MVC架构，使用WeUI组件库构建界面：

```
miniprogram/
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── pages/              # 页面文件夹
│   ├── index/          # 首页
│   ├── activities/     # 活动页面
│   └── profile/        # 个人资料页面
├── utils/              # 工具函数
│   └── api.js          # API接口封装
└── project.config.json # 项目配置
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

## 部署架构

ShareMeet 采用以下部署架构：

### Web应用部署
- **推荐平台**: Vercel
- **部署方式**: 通过Vercel CI/CD流程自动部署
- **构建命令**: `npm run build:vercel`
- **环境变量配置**:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_TENCENT_MAP_KEY

### 微信小程序部署
- **平台**: 微信小程序平台
- **部署方式**: 微信开发者工具上传发布
- **环境配置**: 小程序后台服务配置

## 性能优化

1. 使用Next.js内置图片优化
2. 组件懒加载
3. 静态页面生成 (SSG) 用于不常变化的页面
4. API路由缓存策略
5. 代码分割
6. 使用Supabase边缘函数减少数据库请求延迟

## 开发环境配置

1. 安装依赖：
```bash
npm install
```

2. 环境变量设置(.env.local)：
```
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
NEXT_PUBLIC_TENCENT_MAP_KEY=你的腾讯地图API密钥
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

3. Vercel部署：
```bash
npm run build:vercel
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