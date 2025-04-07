/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com', 'vercel.com'],
  },
  eslint: {
    // 忽略构建时的ESLint错误
    ignoreDuringBuilds: false,
  },
  typescript: {
    // 忽略构建时的TS错误
    ignoreBuildErrors: true,
  },
  // 外部包配置和其他实验性功能
  experimental: {
    // 移除serverActions配置，因为它现在是默认启用的
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // 添加一些安全响应头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // 在编译时跳过预渲染特定路径
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? {
          exclude: ['error', 'warn'],
        }
      : false,
  },
  // 自定义webpack配置，以适配微信小程序需求
  webpack: (config, { isServer, dev }) => {
    // 支持.wxss和.wxml文件
    if (!isServer) {
      config.module.rules.push({
        test: /\.wxss$/,
        use: ['style-loader', 'css-loader'],
      });
      
      config.module.rules.push({
        test: /\.wxml$/,
        use: ['raw-loader'],
      });
    }
    
    // 添加模块解析别名
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    };
    
    return config;
  },
  env: {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    NEXT_PUBLIC_IS_MINI_PROGRAM: process.env.NEXT_PUBLIC_IS_MINI_PROGRAM || 'false',
  },
};

module.exports = nextConfig; 