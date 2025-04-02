'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// 用户图标
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z"/>
  </svg>
);

// 活动图标
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 448 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H64C28.7 64 0 92.7 0 128v16 48V448c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V192 144 128c0-35.3-28.7-64-64-64H344V24c0-13.3-10.7-24-24-24s-24 10.7-24 24V64H152V24zM48 192h80v56H48V192zm0 104h80v64H48V296zm128 0h96v64H176V296zm144 0h80v64H320V296zm80-48H320V192h80v56zm0 160v40c0 8.8-7.2 16-16 16H320V408h80zm-128 0v56H176V408h96zm-144 0v56H64c-8.8 0-16-7.2-16-16V408h80zM272 248H176V192h96v56z"/>
  </svg>
);

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    // 检查登录状态
    const checkLoginStatus = () => {
      const cookies = document.cookie.split(';');
      const isLoggedInCookie = cookies.find(cookie => cookie.trim().startsWith('isLoggedIn='));
      setIsLoggedIn(isLoggedInCookie?.includes('true') || false);
    };
    
    checkLoginStatus();
  }, []);
  
  const navItems = [
    { name: '首页', href: '/' },
    { name: '活动', href: '/activities' },
    { name: '创建活动', href: '/activities/create' },
  ];
  
  const handleLogout = () => {
    // 清除登录状态cookie
    document.cookie = "isLoggedIn=false; path=/; max-age=0";
    setIsLoggedIn(false);
    // 如果在个人中心页面，跳转到首页
    if (pathname.includes('/profile')) {
      window.location.href = '/';
    }
  };
  
  return (
    <header style={{
      backgroundColor: 'white',
      borderBottom: '1px solid #eee',
      padding: '1rem 0',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="container flex justify-between items-center">
        {/* Logo */}
        <Link href="/" style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#2563eb'
        }}>
          ShareMeet
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md-flex" style={{gap: '2rem'}}>
          {navItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              style={{
                fontSize: '0.95rem',
                fontWeight: pathname === item.href ? '600' : '500',
                color: pathname === item.href ? '#2563eb' : '#555',
                position: 'relative',
                paddingBottom: '0.25rem'
              }}
            >
              {item.name}
              {pathname === item.href && (
                <span style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  backgroundColor: '#2563eb',
                  borderRadius: '2px'
                }} />
              )}
            </Link>
          ))}
        </nav>
        
        {/* User Menu */}
        <div className="hidden md-flex items-center" style={{gap: '1.5rem'}}>
          {isLoggedIn ? (
            <>
              <Link 
                href="/profile" 
                className="flex items-center"
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: 'white',
                  backgroundColor: '#2563eb',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                <UserIcon />
                <span style={{marginLeft: '0.5rem'}}>个人中心</span>
              </Link>
              <button 
                onClick={handleLogout}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  color: '#555',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                退出登录
              </button>
            </>
          ) : (
            <Link 
              href="/auth" 
              style={{
                fontSize: '0.95rem',
                fontWeight: '500',
                color: 'white',
                backgroundColor: '#2563eb',
                padding: '0.5rem 1.25rem',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              登录/注册
            </Link>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="md-hidden" 
          onClick={() => setIsOpen(!isOpen)}
          style={{
            border: 'none', 
            background: 'none', 
            color: '#555',
            padding: '0.5rem'
          }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isOpen && (
        <div className="md-hidden" style={{
          backgroundColor: 'white',
          borderTop: '1px solid #eee',
          padding: '1rem 0',
          boxShadow: '0 5px 10px rgba(0, 0, 0, 0.05)'
        }}>
          <div className="container flex flex-col" style={{gap: '0.75rem'}}>
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: pathname === item.href ? '#2563eb' : '#555',
                  backgroundColor: pathname === item.href ? '#f7f9fc' : 'transparent',
                  borderRadius: '4px'
                }}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <hr style={{borderColor: '#eee', margin: '0.5rem 0'}} />
            {isLoggedIn ? (
              <>
                <Link 
                  href="/profile" 
                  className="flex items-center"
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#2563eb',
                    borderRadius: '4px',
                    backgroundColor: '#f0f5ff'
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  <UserIcon />
                  <span style={{marginLeft: '0.5rem'}}>个人中心</span>
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#555',
                    borderRadius: '4px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  退出登录
                </button>
              </>
            ) : (
              <Link 
                href="/auth" 
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#2563eb',
                  borderRadius: '4px',
                  backgroundColor: '#f0f5ff'
                }}
                onClick={() => setIsOpen(false)}
              >
                登录/注册
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 