import { supabase } from './supabase';

/**
 * 检查并创建应用所需的数据库表
 */
export const createTablesIfNotExist = async () => {
  console.log('检查并创建应用所需的数据库表...');
  const results = {
    usersTable: false,
    profilesTable: false
  };

  try {
    // 检查users表是否存在
    const { error: usersCheckError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });
    
    // 如果表不存在，创建users表
    if (usersCheckError && usersCheckError.message?.includes('does not exist')) {
      console.log('users表不存在，正在创建...');
      
      // 使用SQL创建users表
      const { error: createUsersError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) NOT NULL UNIQUE,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE,
            role VARCHAR(50) DEFAULT 'user'
          );
        `
      });
      
      if (createUsersError) {
        console.error('创建users表失败:', createUsersError);
      } else {
        console.log('users表创建成功');
        results.usersTable = true;
      }
    } else {
      console.log('users表已存在');
      results.usersTable = true;
    }
    
    // 检查profiles表是否存在
    const { error: profilesCheckError } = await supabase
      .from('profiles')
      .select('count(*)', { count: 'exact', head: true });
    
    // 如果表不存在，创建profiles表
    if (profilesCheckError && profilesCheckError.message?.includes('does not exist')) {
      console.log('profiles表不存在，正在创建...');
      
      // 使用SQL创建profiles表
      const { error: createProfilesError } = await supabase.rpc('exec_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
            username VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            bio TEXT,
            avatar_url TEXT,
            location VARCHAR(255),
            birthday DATE,
            hobbies TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createProfilesError) {
        console.error('创建profiles表失败:', createProfilesError);
      } else {
        console.log('profiles表创建成功');
        results.profilesTable = true;
      }
    } else {
      console.log('profiles表已存在');
      results.profilesTable = true;
    }
    
    return {
      success: results.usersTable && results.profilesTable,
      results
    };
  } catch (error) {
    console.error('检查和创建表时发生错误:', error);
    return {
      success: false,
      error
    };
  }
}; 