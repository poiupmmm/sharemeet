// 工具函数

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDateTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  
  return `${year}年${month}月${day}日 ${weekday} ${hour}:${minute}`;
};

/**
 * 格式化日期（不包括时间）
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的日期字符串
 */
export const formatDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
  
  return `${year}年${month}月${day}日 ${weekday}`;
};

/**
 * 格式化时间（不包括日期）
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const hour = d.getHours().toString().padStart(2, '0');
  const minute = d.getMinutes().toString().padStart(2, '0');
  
  return `${hour}:${minute}`;
};

/**
 * 格式化相对时间（例如：刚刚、5分钟前、1小时前等）
 * @param {string|Date} date - 日期对象或日期字符串
 * @returns {string} - 格式化后的相对时间字符串
 */
export const formatRelativeTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 12 * month;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`;
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`;
  } else {
    return `${Math.floor(diff / year)}年前`;
  }
};

/**
 * 将度分秒格式的经纬度转换为小数格式
 * @param {string} dms - 度分秒格式的经纬度
 * @returns {number} - 小数格式的经纬度
 */
export const dmsToDecimal = (dms) => {
  if (!dms) return 0;
  
  // 处理格式如 "40°26'46\"N" 的字符串
  const parts = dms.match(/(\d+)°(\d+)'(\d+)"([NSEW])/);
  if (parts) {
    const [_, degrees, minutes, seconds, direction] = parts;
    let decimal = parseFloat(degrees) + parseFloat(minutes) / 60 + parseFloat(seconds) / 3600;
    
    if (direction === 'S' || direction === 'W') {
      decimal *= -1;
    }
    
    return decimal;
  }
  
  // 如果已经是数字，直接返回
  return parseFloat(dms);
};

/**
 * 将两个坐标点之间的距离（单位：米）
 * @param {number} lat1 - 第一个坐标的纬度
 * @param {number} lng1 - 第一个坐标的经度
 * @param {number} lat2 - 第二个坐标的纬度
 * @param {number} lng2 - 第二个坐标的经度
 * @returns {number} - 两点之间的距离（米）
 */
export const getDistance = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371000; // 地球半径，单位米
  
  // 转换为弧度
  const toRadians = (deg) => deg * Math.PI / 180;
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return earthRadius * c;
};

/**
 * 格式化距离显示
 * @param {number} meters - 距离，单位米
 * @returns {string} - 格式化后的距离字符串
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}米`;
  } else {
    return `${(meters / 1000).toFixed(1)}千米`;
  }
};

/**
 * 从API响应中提取错误信息
 * @param {Object} error - API错误响应
 * @returns {string} - 格式化后的错误信息
 */
export const getErrorMessage = (error) => {
  if (!error) return '发生未知错误';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.error) return error.error;
  
  if (error.data && error.data.message) return error.data.message;
  
  return '请求失败，请稍后重试';
};

export default {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime,
  dmsToDecimal,
  getDistance,
  formatDistance,
  getErrorMessage
}; 