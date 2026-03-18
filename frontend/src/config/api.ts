// API配置文件 - 统一管理所有API端点
// 注意：由于config/ports.js是CommonJS模块，我们需要动态导入或使用硬编码的URL
// 为了避免模块系统冲突，这里使用硬编码的URL配置

const BACKEND_URL = 'http://localhost:3001';

export const API_CONFIG = {
  // 后端API基础URL
  BASE_URL: BACKEND_URL,
  
  // API端点
  ENDPOINTS: {
    // 认证相关
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      VERIFY_OTP: '/api/auth/verify-otp',
    },
    
    // 店铺相关
    STORES: {
      LIST: '/api/stores',
      DETAIL: (id: string) => `/api/stores/${id}`,
      CREATE: '/api/stores',
      UPDATE: (id: string) => `/api/stores/${id}`,
      DELETE: (id: string) => `/api/stores/${id}`,
    },
    
    // Dashboard相关
    DASHBOARD: {
      SNAPSHOT: (storeId: string) => `/api/dashboard/snapshot/${storeId}`,
      ACTIONS: (storeId: string) => `/api/dashboard/actions/${storeId}`,
    },
    
    // 产品相关
    PRODUCTS: {
      LIST: '/api/products',
      DETAIL: (id: string) => `/api/products/${id}`,
      CREATE: '/api/products',
      UPDATE: (id: string) => `/api/products/${id}`,
      DELETE: (id: string) => `/api/products/${id}`,
      BY_STORE: (storeId: string) => `/api/products?store_id=${storeId}`,
    },
    
    // 销售数据相关
    SALES: {
      LIST: '/api/sales',
      BY_STORE: (storeId: string) => `/api/sales?store_id=${storeId}`,
      DAILY: (storeId: string) => `/api/sales/daily/${storeId}`,
    },
    
    // Communications相关
    COMMUNICATIONS: {
      BY_STORE: (storeId: string) => `/api/communications/${storeId}`,
      FORUMS: (storeId: string) => `/api/communications/${storeId}/forums`,
      NEWS: (storeId: string) => `/api/communications/${storeId}/news`,
      LIKE_FORUM: (storeId: string, forumId: string) => `/api/communications/${storeId}/forums/${forumId}/like`,
      LIKE_NEWS: (storeId: string, newsId: string) => `/api/communications/${storeId}/news/${newsId}/like`,
    },
    
    // VOC相关
    VOC: {
      BY_STORE: (storeId: string) => `/api/voc/${storeId}`,
      CX_HEALTH: (storeId: string) => `/api/voc/cx-health/${storeId}`,
    },
    
    // 用户相关
    USERS: {
      LIST: '/api/users',
      DETAIL: (id: string) => `/api/users/${id}`,
      CREATE: '/api/users',
      UPDATE: (id: string) => `/api/users/${id}`,
      DELETE: (id: string) => `/api/users/${id}`,
      REFRESH_OTP: (id: string) => `/api/users/${id}/refresh-otp`,
      REFRESH_PASSWORD: (id: string) => `/api/users/${id}/refresh-password`,
    },
  }
};

// API请求工具函数
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// GET请求
export const apiGet = (endpoint: string) => {
  return apiRequest(endpoint, { method: 'GET' });
};

// POST请求
export const apiPost = (endpoint: string, data?: any) => {
  return apiRequest(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// PUT请求
export const apiPut = (endpoint: string, data?: any) => {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// DELETE请求
export const apiDelete = (endpoint: string) => {
  return apiRequest(endpoint, { method: 'DELETE' });
};