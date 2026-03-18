// 统一端口配置文件
// 所有服务的端口配置都在这里管理

const PORTS = {
  // 前端应用端口
  FRONTEND: 3000,
  
  // 后端API端口  
  BACKEND: 3001,
  
  // 管理后台端口
  ADMIN: 3002,
  
  // WebSocket端口 (如果需要)
  WEBSOCKET: 3003
};

const HOSTS = {
  // 本地开发主机
  LOCAL: 'localhost',
  
  // 开发环境主机
  DEV: '127.0.0.1'
};

// 生成完整的URL
const URLS = {
  FRONTEND: `http://${HOSTS.LOCAL}:${PORTS.FRONTEND}`,
  BACKEND: `http://${HOSTS.LOCAL}:${PORTS.BACKEND}`,
  ADMIN: `http://${HOSTS.LOCAL}:${PORTS.ADMIN}`,
  WEBSOCKET: `ws://${HOSTS.LOCAL}:${PORTS.WEBSOCKET}`
};

// CORS允许的源
const CORS_ORIGINS = [
  URLS.FRONTEND,
  URLS.BACKEND,
  URLS.ADMIN,
  // 添加一些常用的开发端口以防万一
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:3003'
];

module.exports = {
  PORTS,
  HOSTS,
  URLS,
  CORS_ORIGINS
};