// 活动详情页面
import { getActivity, joinActivity, leaveActivity, getActivityParticipants } from '../../utils/api';
import { formatDateTime } from '../../utils/util';

Page({
  data: {
    activity: null,
    loading: true,
    joining: false,
    leaving: false,
    hasJoined: false,
    participants: [],
    errorMessage: null,
    isCreator: false,
    creatorInfo: null,
    isLoggedIn: false,
    userId: null,
    isFavorited: false,
    favoriting: false,
    // 地图相关
    showMap: false,
    latitude: 0,
    longitude: 0,
    markers: []
  },

  onLoad: function(options) {
    const activityId = options.id;
    if (!activityId) {
      wx.showToast({
        title: '未找到活动ID',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      activityId
    });

    // 检查登录状态
    this.checkLoginStatus();
    
    // 获取活动详情
    this.fetchActivityDetails();
  },

  // 检查用户登录状态
  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.id) {
      this.setData({
        isLoggedIn: true,
        userId: userInfo.id
      });
    }
  },

  // 获取活动详情
  fetchActivityDetails: async function() {
    try {
      const activityData = await getActivity(this.data.activityId);
      
      if (!activityData) {
        this.setData({
          loading: false,
          errorMessage: '未找到活动'
        });
        return;
      }
      
      // 格式化日期
      const formattedDate = formatDateTime(activityData.start_time);
      
      // 设置活动数据
      const activity = {
        ...activityData,
        imageUrl: activityData.image_url && activityData.image_url.trim() !== '' 
          ? activityData.image_url 
          : null,
        date: formattedDate,
        price: typeof activityData.price !== 'undefined' && activityData.price !== null
          ? (String(activityData.price) === '0' ? '0' : String(activityData.price))
          : '免费',
        category: Array.isArray(activityData.category) ? activityData.category[0] : activityData.category,
        organizer: activityData.organizer_name || '活动组织者', 
        organizerInfo: activityData.description || '', 
        requirements: activityData.requirements || '参与要求信息'
      };

      // 获取创建者ID
      const creatorId = activityData.creator_id || activityData.user_id;
      
      // 判断当前用户是否是创建者
      let isCreator = false;
      if (this.data.isLoggedIn && this.data.userId === creatorId) {
        isCreator = true;
      }
      
      // 查询参与者
      const participants = await getActivityParticipants(this.data.activityId);
      
      // 判断用户是否已参加
      let hasJoined = false;
      if (this.data.isLoggedIn && participants) {
        hasJoined = participants.some(p => p.user_id === this.data.userId);
      }
      
      // 获取地理坐标
      this.getLocationCoordinates(activity.city || '', activity.location);
      
      this.setData({
        activity,
        loading: false,
        isCreator,
        hasJoined,
        participants: participants || []
      });
    } catch (error) {
      console.error('获取活动详情失败:', error);
      this.setData({
        loading: false,
        errorMessage: '加载活动失败，请稍后重试'
      });
    }
  },

  // 处理参加活动
  handleJoin: async function() {
    if (!this.data.isLoggedIn) {
      wx.navigateTo({
        url: '/pages/auth/login'
      });
      return;
    }
    
    try {
      this.setData({
        joining: true,
        errorMessage: null
      });
      
      // 调用参加活动API
      const result = await joinActivity(this.data.activityId, this.data.userId);
      
      if (result.success) {
        wx.showToast({
          title: '报名成功！',
          icon: 'success'
        });
        
        // 刷新活动详情和参与者列表
        await this.fetchActivityDetails();
      } else {
        this.setData({
          errorMessage: result.message || '报名失败，请稍后重试'
        });
      }
    } catch (error) {
      console.error('参加活动失败:', error);
      this.setData({
        errorMessage: '报名失败，请稍后重试'
      });
    } finally {
      this.setData({
        joining: false
      });
    }
  },

  // 处理退出活动
  handleLeave: async function() {
    if (!this.data.isLoggedIn) {
      return;
    }
    
    // 显示确认对话框
    wx.showModal({
      title: '确认退出',
      content: '确定要退出这个活动吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({
              leaving: true,
              errorMessage: null
            });
            
            // 调用退出活动API
            await leaveActivity(this.data.activityId, this.data.userId);
            
            wx.showToast({
              title: '已成功退出活动',
              icon: 'success'
            });
            
            // 刷新活动详情
            await this.fetchActivityDetails();
          } catch (error) {
            console.error('退出活动失败:', error);
            this.setData({
              errorMessage: '退出活动失败，请稍后重试'
            });
          } finally {
            this.setData({
              leaving: false
            });
          }
        }
      }
    });
  },

  // 处理分享
  onShareAppMessage: function() {
    const activity = this.data.activity;
    if (!activity) return {};
    
    return {
      title: activity.title,
      path: `/pages/activities/detail?id=${this.data.activityId}`,
      imageUrl: activity.imageUrl || ''
    };
  },

  // 显示地图
  showMap: function() {
    this.setData({
      showMap: true
    });
  },

  // 隐藏地图
  hideMap: function() {
    this.setData({
      showMap: false
    });
  },

  // 获取位置坐标
  getLocationCoordinates: function(city, location) {
    // 使用腾讯地图插件进行地址解析
    const mapContext = wx.createMapContext('activityMap');
    
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        address: `${city} ${location}`,
        key: 'YOUR_TENCENT_MAP_KEY' // 替换为你的腾讯地图Key
      },
      success: (res) => {
        if (res.data && res.data.status === 0) {
          const result = res.data.result;
          this.setData({
            latitude: result.location.lat,
            longitude: result.location.lng,
            markers: [{
              id: 1,
              latitude: result.location.lat,
              longitude: result.location.lng,
              title: this.data.activity.title
            }]
          });
        }
      },
      fail: (err) => {
        console.error('地址解析失败:', err);
      }
    });
  },

  // 处理返回
  handleBack: function() {
    wx.navigateBack();
  },

  // 导航到地点
  navigateToLocation: function() {
    if (this.data.latitude && this.data.longitude) {
      wx.openLocation({
        latitude: this.data.latitude,
        longitude: this.data.longitude,
        name: this.data.activity.title,
        address: this.data.activity.city ? 
          `${this.data.activity.city} ${this.data.activity.location}` : 
          this.data.activity.location
      });
    }
  }
}); 