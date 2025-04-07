import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 将生日日期转换为星座
export function birthdayToZodiac(birthday: string): string {
  const date = new Date(birthday);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return "白羊座";
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return "金牛座";
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) {
    return "双子座";
  } else if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) {
    return "巨蟹座";
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return "狮子座";
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return "处女座";
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) {
    return "天秤座";
  } else if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) {
    return "天蝎座";
  } else if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) {
    return "射手座";
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return "摩羯座";
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return "水瓶座";
  } else {
    return "双鱼座";
  }
}

/**
 * 格式化日期时间为友好显示格式，完全避免使用Date对象，防止时区问题
 */
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '时间待定';
  
  try {
    // 使用正则表达式直接从字符串解析日期和时间
    // 匹配 YYYY-MM-DDThh:mm:ss 格式
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    
    if (dateMatch && dateMatch.length >= 6) {
      // 提取日期和时间的各部分
      const [_, year, month, day, hours, minutes] = dateMatch;
      
      // 转换为人类可读格式，去掉月份和日期前导零
      return `${parseInt(month)}月${parseInt(day)}日 ${hours}:${minutes}`;
    }
    
    // 如果上面的格式不匹配，尝试其他常见格式
    // 匹配 YYYY/MM/DD hh:mm 格式
    const altDateMatch = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})/);
    if (altDateMatch && altDateMatch.length >= 6) {
      const [_, year, month, day, hours, minutes] = altDateMatch;
      return `${parseInt(month)}月${parseInt(day)}日 ${hours}:${minutes}`;
    }
    
    // 如果所有正则表达式都不匹配，则作为最后的手段使用Date对象
    console.warn('无法通过正则表达式解析日期:', dateStr);
    const date = new Date(dateStr);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '时间待定';
    }
    
    // 格式化为 "月日 时:分" 格式
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}月${day}日 ${hours}:${minutes}`;
  } catch (error) {
    console.error('日期格式化错误:', error, dateStr);
    return '时间待定';
  }
}

// 格式化日期
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// 检查用户名是否可用
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error("检查用户名出错:", error);
    return false;
  }
}