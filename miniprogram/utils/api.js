// API工具函数

// 基础API地址
const BASE_URL = 'https://your-api.example.com/api';

// 通用请求函数
const request = (url, method = 'GET', data = {}, showLoading = true) => {
  if (showLoading) {
    wx.showLoading({
      title: '加载中',
      mask: true
    });
  }

  return new Promise((resolve, reject) => {
    // 获取存储的token
    const token = wx.getStorageSync('token');
    
    wx.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，清除登录状态并重定向到登录页
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          });
          
          setTimeout(() => {
            wx.navigateTo({
              url: '/pages/auth/login'
            });
          }, 1000);
          
          reject(new Error('登录已过期'));
        } else {
          reject(res.data || new Error('请求失败'));
        }
      },
      fail: (err) => {
        reject(err);
      },
      complete: () => {
        if (showLoading) {
          wx.hideLoading();
        }
      }
    });
  });
};

// 活动相关API

/**
 * 获取活动列表
 * @param {Object} params - 筛选参数
 * @returns {Promise}
 */
export const getActivities = (params = {}) => {
  return request('/activities', 'GET', params);
};

/**
 * 获取单个活动
 * @param {string} id - 活动ID
 * @returns {Promise}
 */
export const getActivity = (id) => {
  return request(`/activities/${id}`, 'GET');
};

/**
 * 创建活动
 * @param {Object} activityData - 活动数据
 * @returns {Promise}
 */
export const createActivity = (activityData) => {
  return request('/activities', 'POST', activityData);
};

/**
 * 更新活动
 * @param {string} id - 活动ID
 * @param {Object} activityData - 活动数据
 * @returns {Promise}
 */
export const updateActivity = (id, activityData) => {
  return request(`/activities/${id}`, 'PUT', activityData);
};

/**
 * 删除活动
 * @param {string} id - 活动ID
 * @returns {Promise}
 */
export const deleteActivity = (id) => {
  return request(`/activities/${id}`, 'DELETE');
};

/**
 * 参加活动
 * @param {string} activityId - 活动ID
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const joinActivity = (activityId, userId) => {
  return request('/activities/join', 'POST', { activityId, userId });
};

/**
 * 退出活动
 * @param {string} activityId - 活动ID
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const leaveActivity = (activityId, userId) => {
  return request('/activities/leave', 'POST', { activityId, userId });
};

/**
 * 获取活动参与者
 * @param {string} activityId - 活动ID
 * @returns {Promise}
 */
export const getActivityParticipants = (activityId) => {
  return request(`/activities/${activityId}/participants`, 'GET');
};

/**
 * 收藏活动
 * @param {string} activityId - 活动ID
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const favoriteActivity = (activityId, userId) => {
  return request('/activities/favorite', 'POST', { activityId, userId });
};

/**
 * 取消收藏活动
 * @param {string} activityId - 活动ID
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const unfavoriteActivity = (activityId, userId) => {
  return request('/activities/unfavorite', 'POST', { activityId, userId });
};

// 用户相关API

/**
 * 用户登录
 * @param {Object} credentials - 登录凭证
 * @returns {Promise}
 */
export const login = (credentials) => {
  return request('/auth/login', 'POST', credentials);
};

/**
 * 用户注册
 * @param {Object} userData - 用户数据
 * @returns {Promise}
 */
export const register = (userData) => {
  return request('/auth/register', 'POST', userData);
};

/**
 * 获取用户资料
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const getUserProfile = (userId) => {
  return request(`/users/${userId}/profile`, 'GET');
};

/**
 * 更新用户资料
 * @param {string} userId - 用户ID
 * @param {Object} profileData - 资料数据
 * @returns {Promise}
 */
export const updateUserProfile = (userId, profileData) => {
  return request(`/users/${userId}/profile`, 'PUT', profileData);
};

/**
 * 获取用户参与的活动
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const getUserActivities = (userId) => {
  return request(`/users/${userId}/activities`, 'GET');
};

/**
 * 获取用户创建的活动
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const getUserCreatedActivities = (userId) => {
  return request(`/users/${userId}/created-activities`, 'GET');
};

/**
 * 获取用户收藏的活动
 * @param {string} userId - 用户ID
 * @returns {Promise}
 */
export const getUserFavoriteActivities = (userId) => {
  return request(`/users/${userId}/favorite-activities`, 'GET');
};

export default {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  joinActivity,
  leaveActivity,
  getActivityParticipants,
  favoriteActivity,
  unfavoriteActivity,
  login,
  register,
  getUserProfile,
  updateUserProfile,
  getUserActivities,
  getUserCreatedActivities,
  getUserFavoriteActivities
}; 