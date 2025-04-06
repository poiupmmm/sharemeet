'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TENCENT_MAP_KEY, APP_CONFIG } from '@/lib/config';

// 腾讯地图组件接口
interface TencentMapProps {
  location: string;
  city?: string;
  width?: string | number;
  height?: string | number;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  showInMiniprogram?: boolean;
}

// 腾讯地图组件
export const TencentMap: React.FC<TencentMapProps> = ({
  location,
  city = '北京',
  width = '100%',
  height = 200,
  zoom = 15,
  className = '',
  style = {},
  showInMiniprogram = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWechat, setIsWechat] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>(''); // 添加调试信息状态

  // 检测是否在微信小程序环境中
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      setIsWechat(userAgent.indexOf('micromessenger') !== -1);
      
      // 检测是否在小程序环境
      if (typeof window !== 'undefined' && typeof (window as any).__wxjs_environment !== 'undefined') {
        setIsWechat((window as any).__wxjs_environment === 'miniprogram');
      }
    }
  }, []);

  // 加载腾讯地图SDK
  useEffect(() => {
    if (!mapRef.current) return;
    
    setDebugInfo(`开始加载地图，使用的密钥: ${TENCENT_MAP_KEY.substring(0, 5)}...`);
    
    // 如果是小程序环境但不需要显示地图
    if (isWechat && !showInMiniprogram) {
      return;
    }

    // 如果是微信小程序环境，使用小程序的地图组件
    if (isWechat && showInMiniprogram) {
      setIsLoaded(true);
      return;
    }

    // 显示静态地图
    renderStaticMap();
    
  }, [location, city, zoom, isWechat, showInMiniprogram]);
  
  // 渲染静态地图
  const renderStaticMap = () => {
    if (!mapRef.current || !location) return;
    
    try {
      // 创建简易地图
      const mapContainer = mapRef.current;
      const encodedAddress = encodeURIComponent(`${city} ${location}`);
      
      // 使用腾讯地图静态图API
      mapContainer.innerHTML = `
        <div style="width:100%; height:100%; background:#f5f5f5; position:relative; overflow:hidden;">
          <div style="width:100%; height:100%; background-size:cover; background-position:center; background-image:url('https://apis.map.qq.com/ws/staticmap/v2/?center=${encodedAddress}&zoom=${zoom}&size=500*300&maptype=roadmap&markers=size:large|color:0xDB4437|${encodedAddress}&key=${TENCENT_MAP_KEY}');">
          </div>
          <div style="position:absolute; bottom:0; left:0; right:0; padding:8px 12px; background:rgba(255,255,255,0.8);">
            <div style="font-weight:bold; margin-bottom:4px; font-size:14px;">活动地点</div>
            <div style="font-size:12px;">${city} ${location}</div>
          </div>
        </div>
      `;
      
      setIsLoaded(true);
      setDebugInfo('静态地图加载完成');
    } catch (err) {
      console.error('创建静态地图失败:', err);
      setError('无法显示地图，请检查地址信息');
    }
  };

  // 处理小程序环境下的地图渲染
  if (isWechat && showInMiniprogram) {
    return (
      <div 
        className={className}
        style={{
          width,
          height,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f5f5',
          ...style
        }}
        data-location={location}
        data-city={city}
        data-zoom={zoom}
        data-type="tencent-map"
      >
        {/* 小程序会识别这个占位元素并使用小程序的地图组件替换它 */}
        <div id="miniprogram-map" style={{width: '100%', height: '100%'}} />
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        width,
        height,
        ...style
      }}
    >
      {error ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f5f5',
          color: '#ff4d4f',
          padding: '10px'
        }}>
          <div>{error}</div>
          {process.env.NODE_ENV !== 'production' && (
            <div style={{
              marginTop: '10px',
              fontSize: '12px',
              color: '#999',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {debugInfo}
            </div>
          )}
          <button
            onClick={renderStaticMap}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重试加载
          </button>
        </div>
      ) : !isLoaded ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f5f5'
        }}>
          <div style={{ marginBottom: '10px' }}>加载地图中...</div>
          {process.env.NODE_ENV !== 'production' && (
            <div style={{
              fontSize: '12px',
              color: '#999',
              maxWidth: '100%',
              padding: '0 10px',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {debugInfo || '正在连接腾讯地图服务...'}
            </div>
          )}
        </div>
      ) : null}
      <div 
        ref={mapRef} 
        style={{
          width: '100%',
          height: '100%',
          display: isLoaded && !error ? 'block' : 'none'
        }}
      />
    </div>
  );
};

// 为window对象添加qq地图类型声明
declare global {
  interface Window {
    qq: {
      maps: any
    }
  }
}

export default TencentMap; 