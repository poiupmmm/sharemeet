// 配置文件

// 腾讯地图配置
export const TENCENT_MAP_KEY = process.env.NEXT_PUBLIC_TENCENT_MAP_KEY || 'OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77';

// 微信小程序配置
export const WECHAT_APP_ID = process.env.NEXT_PUBLIC_WECHAT_APP_ID || '';
export const WECHAT_APP_SECRET = process.env.NEXT_PUBLIC_WECHAT_APP_SECRET || '';

// 应用配置
export const APP_CONFIG = {
  name: 'ShareMeet',
  description: '活动分享和社交平台',
  version: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  isMiniProgram: process.env.NEXT_PUBLIC_IS_MINI_PROGRAM === 'true' || false,
};

// 媒体查询断点
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
};

// 活动类别
export const ACTIVITY_CATEGORIES = [
  '户外运动',
  '文艺演出',
  '美食聚会',
  '技术沙龙',
  '读书会',
  '游戏竞技',
  '旅游出行',
  '社交聚会',
  '健身活动',
  '其他',
];

// 支持的城市列表
export const SUPPORTED_CITIES = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '南京',
  '成都',
  '武汉',
  '西安',
  '重庆',
  '苏州',
  '天津',
  '长沙',
  '郑州',
  '青岛',
  '厦门',
  '大连',
  '宁波',
  '合肥',
];

export default {
  TENCENT_MAP_KEY,
  WECHAT_APP_ID,
  WECHAT_APP_SECRET,
  APP_CONFIG,
  BREAKPOINTS,
  ACTIVITY_CATEGORIES,
  SUPPORTED_CITIES,
}; 