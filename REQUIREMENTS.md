# ShareMeet社交活动平台需求文档

## 1. 项目概述

### 1.1 项目简介
ShareMeet是一个社交活动平台，旨在帮助用户发现精彩活动，结识志同道合的朋友。平台提供活动发布、参与、收藏和互动功能，涵盖户外运动、文化沙龙和专业交流等多种类型活动。

### 1.2 项目目标
- 为用户提供发现和参与各类社交活动的平台
- 帮助活动组织者有效宣传和管理活动

## 2. 功能需求

### 2.1 用户管理
- **用户注册**：支持邮箱注册，要求用户名、邮箱和密码
- **用户登录**：支持邮箱+密码登录
- **用户认证**：使用自定义Users表管理用户数据，而非Supabase自带认证
- **用户资料**：支持个人资料设置，包括头像、个人简介等

### 2.2 活动功能
- **活动浏览**：支持按类别、城市筛选活动
- **活动详情**：展示活动标题、描述、时间、地点、组织者等信息
- **活动参与**：用户可报名参加活动
- **活动收藏**：用户可收藏感兴趣的活动
- **活动评论**：用户可对活动发表评论

### 2.3 社交功能
- **活动组织**：用户可创建并管理自己的活动
- **参与者管理**：活动创建者可查看和管理报名用户
- **活动推荐**：基于用户兴趣推荐相关活动

### 2.4 平台功能
- **首页展示**：推荐活动、热门活动展示
- **城市筛选**：支持按城市查看活动
- **类别导航**：支持按活动类别筛选

## 3. 技术要求

### 3.1 前端技术
- **框架**：Next.js (React框架)
- **样式**：CSS-in-JS + 全局CSS
- **路由**：Next.js内置路由 + 中间件控制
- **状态管理**：React Hooks
- **图片加载**：支持Next.js Image组件，配置允许Unsplash图片

### 3.2 后端技术
- **数据库**：Supabase (PostgreSQL)
- **认证**：自定义认证系统，不使用Supabase Auth
- **API**：通过Supabase客户端直接连接数据库
- **安全**：使用Row Level Security (RLS)保护数据

### 3.3 部署需求
- **环境变量**：NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- **图片配置**：配置Next.js允许外部图片域名
- **Cookie管理**：使用Cookie存储登录状态

## 4. 数据库设计

### 4.1 表结构
- **users表**：存储用户基本信息
  - id, email, username, password, created_at, last_login

- **profiles表**：存储用户详细信息
  - id, user_id, username, full_name, avatar_url, bio, location, created_at, updated_at

- **activities表**：存储活动信息
  - id, title, description, user_id, organizer_name, date, end_date, location, image_url, category, price, attendees_limit, created_at, updated_at

- **activity_participants表**：记录用户参与活动的关系
  - id, activity_id, user_id, status, created_at

- **activity_favorites表**：记录用户收藏的活动
  - id, activity_id, user_id, created_at

### 4.2 数据关系
- 用户与资料：一对一关系
- 用户与活动：一对多关系（组织者）
- 用户与活动参与：多对多关系
- 用户与活动收藏：多对多关系

## 5. 页面流程

### 5.1 用户路径
- **初始访问**：登录页面(如未登录)
- **登录后**：首页/活动列表
- **活动详情**：查看 -> 报名/收藏
- **创建活动**：填写信息 -> 发布 -> 管理

### 5.2 关键页面
- **登录/注册页**：用户认证入口
- **首页**：活动推荐、类别导航、城市选择
- **活动列表页**：按类别、城市筛选活动
- **活动详情页**：查看活动信息和参与者
- **个人中心**：管理个人资料和活动
- **创建活动页**：发布新活动

## 6. 安全要求

### 6.1 数据安全
- 使用SHA-256加密存储用户密码
- 实施RLS策略保护数据库表
- 限制用户只能访问和修改自己的数据

### 6.2 访问控制
- 非登录用户只能访问登录页面
- 已登录用户不能访问登录页面（自动重定向到首页）
- 用户只能管理自己创建的活动

## 7. 文件结构

### 7.1 前端文件结构
```
src/
├── app/                    # 主应用目录
│   ├── auth/               # 认证相关页面
│   │   ├── layout.tsx      # 认证页面布局
│   │   ├── page.tsx        # 登录/注册页面
│   ├── activities/         # 活动相关页面
│   │   ├── [id]/           # 活动详情页
│   │   ├── create/         # 创建活动页
│   │   ├── page.tsx        # 活动列表页
│   ├── profile/            # 用户个人中心
│   │   ├── page.tsx        # 个人资料页面
│   ├── globals.css         # 全局样式
│   ├── layout.jsx          # 全局布局
│   ├── page.tsx            # 首页
├── components/             # UI组件
│   ├── shared/             # 共享组件
│   │   ├── Header.tsx      # 顶部导航栏
├── lib/                    # 工具库
│   ├── activities.ts       # 活动相关函数
│   ├── auth.ts             # 认证相关函数
│   ├── supabase.ts         # Supabase客户端
│   ├── utils.ts            # 通用工具函数
├── middleware.ts           # 中间件(路由保护)
```

### 7.2 数据库脚本
- `supabase_setup.sql`: 数据库表和权限创建脚本

## 8. 未来功能规划

### 8.1 近期计划
- 完善用户个人中心
- 优化登录页面的布局和交互
- 增加活动搜索功能

### 8.2 中长期规划
- 活动推荐算法优化
- 社交关系网络建设
- 活动分享和邀请功能
- 活动提醒和日历集成
- 移动应用开发

## 9. 已知问题和解决方案

### 9.1 当前问题
- 自定义认证与前端路由协调问题
- 首页内容设计与期望不一致
- 图片加载配置需优化

### 9.2 解决方案
- 重构RootLayout组件，强化登录检查
- 优化前端组件结构与样式
- 改进中间件逻辑，确保路由安全

### 9.3 已解决问题
- ✅ 活动列表页面筛选功能不完整：活动页面缺少分类筛选选项
  - 解决方案：在活动列表页面添加了分类筛选下拉框，现在用户可以同时通过时间、分类和城市三种方式筛选活动

## 10. 测试要求

### 10.1 功能测试
- 用户注册、登录流程
- 活动创建和管理
- 活动参与和互动
- 数据安全和权限控制

### 10.2 性能测试
- 页面加载速度
- 数据库查询性能
- 图片加载优化

## 11. 项目里程碑

### 11.1 第一阶段
- ✅ 用户认证系统构建
- ✅ 数据库表设计和实现
- ✅ 基本页面框架搭建

### 11.2 第二阶段
- 🔄 首页和活动列表页优化
- 🔄 活动详情和互动功能
- 🔄 个人中心完善

### 11.3 第三阶段
- 📝 高级搜索和推荐
- 📝 社交功能扩展
- 📝 移动端适配优化 