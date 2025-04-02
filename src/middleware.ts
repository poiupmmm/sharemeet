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
  '/profile'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 检查当前路径是否为公开路径
  const isPublicPath = publicPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`)
  )
  
  // 检查当前路径是否需要保护
  const isProtectedPath = protectedPaths.some(
    path => pathname === path || pathname.startsWith(`${path}/`) 
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
    const url = new URL('/auth', request.url)
    return NextResponse.redirect(url)
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