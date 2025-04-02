# ShareMeet - 活动分享平台

## 项目介绍

ShareMeet是一个活动分享和社交平台，用户可以发现、创建和参与各种活动，认识志同道合的朋友。

### 主要功能

- **活动浏览**：浏览、筛选和搜索各类活动
- **活动创建**：用户可以创建自己的活动并进行管理
- **活动参与**：用户可以参与感兴趣的活动
- **活动收藏**：将喜欢的活动加入收藏夹
- **活动分享**：支持将活动分享给好友或社交媒体（微信、微博、QQ等）
- **用户资料**：管理个人资料和活动参与历史

## 开发环境设置

### 安装依赖

```bash
npm install
```

### 配置Supabase数据库

本项目使用Supabase作为后端数据库。请按照以下步骤配置：

1. 访问 [Supabase](https://supabase.com/) 并创建一个新项目
2. 获取项目URL和匿名密钥（Anon Key）
3. 配置数据库表格：
   - 使用项目根目录中的`supabase_unified_setup.sql`文件在Supabase SQL编辑器中运行创建表结构
   - 数据库包含以下主要表格：
     - users：用户数据
     - profiles：用户个人资料
     - activities：活动信息
     - activity_participants：活动参与者
     - activity_favorites：活动收藏

4. 将Supabase URL和密钥添加到项目中：
   - 打开`src/lib/supabase.ts`文件
   - 更新`supabaseUrl`和`supabaseAnonKey`变量为您自己的值

### 启动开发服务器

在开发过程中，请使用以下命令启动开发服务器：

```bash
npm run dev
```

这将启动Next.js开发服务器，并启用热重载功能。这意味着您对代码的更改会自动反映在浏览器中，无需手动刷新或重新构建。

### 生产环境构建

当您准备部署项目时，请使用以下命令构建生产版本：

```bash
npm run build
```

构建完成后，使用以下命令运行生产服务器：

```bash
npm start
```

## 常见问题

### 问题：注册失败报错"注册失败，请稍后重试"

**解决方案**：
1. 检查Supabase连接配置是否正确
2. 确认数据库表是否已正确创建
3. 在开发环境中使用调试工具（点击"检查数据库"按钮）
4. 查看控制台错误信息获取更多详情

如果表格不存在，请使用`supabase_unified_setup.sql`文件在Supabase中创建所需表格。

### 问题：SQL脚本执行报错"there is no unique or exclusion constraint matching the ON CONFLICT specification"

**解决方案**：
这个错误通常是因为在profiles表中使用了`ON CONFLICT (user_id) DO NOTHING`，但user_id列没有唯一约束。
我们已经在最新的SQL脚本中修复了这个问题，通过在user_id字段上添加UNIQUE约束：
```sql
user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE
```

### 问题：更改代码后没有生效

**解决方案**：确保您正在使用`npm run dev`而不是`npm start`。开发模式支持热重载，而生产模式需要重新构建才能看到更改。

### 问题：登录/注册失败

**解决方案**：
1. 检查控制台是否有错误信息
2. 确保Supabase服务正常运行
3. 验证API路由是否正确配置
4. 使用开发环境中的"检查数据库"按钮诊断问题

### 问题：服务器抛出"TypeError: fetch failed"

**解决方案**：
1. 这通常是由于服务器端无法连接到外部API (Supabase) 导致的
2. 确保您的网络连接正常
3. 检查Supabase的凭据是否正确

## 数据库架构说明

最新版本的数据库架构已经移除了评论功能，并针对profiles表进行了优化，具体变更包括：

1. 移除了comments表及相关的RLS策略和索引
2. 在profiles表的user_id列上添加了UNIQUE约束，确保ON CONFLICT语句能正常工作
3. 应用程序API已调整为即使profiles表不可用，也可以完成用户注册流程

## 项目结构

- `/src/app` - Next.js应用页面和布局
- `/src/app/api` - API路由（处理与Supabase的连接）
- `/src/components` - 可复用的React组件
- `/src/lib` - 工具库和服务
- `/public` - 静态资源
- `supabase_unified_setup.sql` - 数据库表结构定义

## API架构

为了避免在客户端直接连接数据库的安全隐患，本项目使用Next.js API路由作为中间层：

1. 客户端代码调用API路由
2. API路由处理验证和业务逻辑
3. API路由连接Supabase数据库
4. 数据通过API路由返回给客户端

这种架构使我们能够：
- 保护数据库凭据
- 集中处理错误和验证
- 提高安全性
- 简化客户端代码
