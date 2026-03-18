#!/usr/bin/env node

const { spawn } = require('child_process');
const { killAllPorts } = require('./kill-ports');
const { PORTS, URLS } = require('../config/ports');

console.log('🚀 Amazon Seller Central 项目启动脚本');
console.log('');

// 启动服务的函数
function startService(name, command, args, cwd, port) {
  return new Promise((resolve, reject) => {
    console.log(`📦 启动 ${name}...`);
    
    const childProcess = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
      detached: true, // 让子进程独立运行
      windowsHide: true // Windows上隐藏窗口
    });

    let started = false;
    
    childProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[${name}] ${output.trim()}`);
      
      // 检查服务是否已启动
      if (!started && (
        output.includes('Local:') || 
        output.includes('running on') ||
        output.includes('Server running') ||
        output.includes('listening on')
      )) {
        started = true;
        console.log(`✅ ${name} 启动成功 - ${URLS[name.toUpperCase().replace(' ', '_')] || `http://localhost:${port}`}`);
        
        // 分离子进程，让它独立运行
        childProcess.unref();
        resolve();
      }
    });

    childProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Warning') && !output.includes('deprecated')) {
        console.error(`[${name} ERROR] ${output.trim()}`);
      }
    });

    childProcess.on('close', (code) => {
      if (code !== 0 && !started) {
        console.error(`❌ ${name} 启动失败，退出码: ${code}`);
        reject(new Error(`${name} failed to start`));
      }
    });

    // 超时检查
    setTimeout(() => {
      if (!started) {
        console.log(`⏳ ${name} 启动中...`);
        // 如果超时，也认为启动成功并分离进程
        started = true;
        childProcess.unref();
        resolve();
      }
    }, 5000); // 减少超时时间到5秒
  });
}

async function startAllServices() {
  try {
    // 1. 清理端口
    console.log('🔄 第一步: 清理端口占用');
    await killAllPorts();
    console.log('');

    // 2. 启动后端服务
    console.log('🔄 第二步: 启动后端API服务');
    await startService('Backend', 'npm', ['run', 'dev'], './backend', PORTS.BACKEND);
    
    // 等待后端完全启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('');

    // 3. 并行启动前端和管理后台
    console.log('🔄 第三步: 启动前端应用和管理后台');
    
    const frontendPromise = startService('Frontend', 'npm', ['run', 'dev'], './frontend', PORTS.FRONTEND);
    const adminPromise = startService('Admin', 'npm', ['run', 'dev'], './backend-admin', PORTS.ADMIN);
    
    await Promise.all([frontendPromise, adminPromise]);
    
    console.log('');
    console.log('🎉 所有服务启动完成！');
    console.log('');
    console.log('📋 服务地址:');
    console.log(`   前端应用: ${URLS.FRONTEND}`);
    console.log(`   后端API:  ${URLS.BACKEND}`);
    console.log(`   管理后台: ${URLS.ADMIN}`);
    console.log('');
    console.log('💡 提示:');
    console.log('   - 所有服务已在后台运行');
    console.log('   - 使用 node scripts/kill-ports.js 停止所有服务');
    console.log('   - 后端API健康检查: ' + URLS.BACKEND + '/api/health');
    console.log('');
    
    // 脚本完成，退出
    process.exit(0);

  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    console.log('');
    console.log('🔧 故障排除:');
    console.log('   1. 检查 Node.js 和 npm 是否已安装');
    console.log('   2. 运行 npm install 安装依赖');
    console.log('   3. 检查端口是否被其他程序占用');
    console.log('   4. 手动运行 node scripts/kill-ports.js 清理端口');
    process.exit(1);
  }
}

// 处理 Ctrl+C
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 正在停止所有服务...');
  process.exit(0);
});

// 如果直接运行此脚本
if (require.main === module) {
  startAllServices();
}

module.exports = { startAllServices };