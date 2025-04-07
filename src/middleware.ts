import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 这些路径不需要登录
const publicPaths = [
  '/auth', 
  '/api/auth',
  '/about'
]

// 这些路径需要登录保护
const protectedPaths = [
  '/',
  '/activities',
  '/activities/create',
  '/profile',
  '/activities/[id]'  // 添加活动详情页路径
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查当前路径是否为公开路径
  const isPublicPath = publicPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // 检查当前路径是否需要保护
  const isProtectedPath = protectedPaths.some(
    path => {
      // 特殊处理动态路由，例如/activities/[id]应该匹配所有/activities/数字 的路径
      if (path.includes('[id]')) {
        const basePath = path.split('/[id]')[0];
        const pathSegments = pathname.split('/');
        if (pathSegments.length >= 3 && pathSegments[1] === 'activities') {
          return true; // 匹配所有/activities/{任何id}的路径
        }
        return false;
      }
      // 常规路径匹配
      return pathname === path || pathname.startsWith(`${path}/`);
    }
  )
  
  // 从Cookie获取登录状态
  const isLoggedIn = request.cookies.get('isLoggedIn')?.value === 'true'
  
  // 如果是登录页且用户已登录，重定向到首页
  if (pathname === '/auth' && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // 如果是公开路径，直接访问
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // 如果需要保护的路径但未登录，重定向到登录页
  if (isProtectedPath && !isLoggedIn) {
    // 设置重定向cookie，登录后返回当前页面
    const response = NextResponse.redirect(new URL('/auth', request.url))
    response.cookies.set('redirectAfterLogin', pathname, { 
      path: '/',
      maxAge: 3600,
      httpOnly: false
    })
    return response
  }
  
  // 其他情况允许访问
  return NextResponse.next()
}

// 配置中间件应用于哪些路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * 1. /api/auth (认证API路由)
     * 2. 静态文件路由（如/_next/static、/favicon.ico等）
     */
    '/((?!api/auth|_next/static|_next/image|_next/data|favicon.ico).*)',
  ],
}