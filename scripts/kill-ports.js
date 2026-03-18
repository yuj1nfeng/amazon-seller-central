#!/usr/bin/env node

const { exec } = require('child_process');
const { PORTS } = require('../config/ports');

// 要清理的端口列表
const portsToKill = [
  PORTS.FRONTEND,  // 3000
  PORTS.BACKEND,   // 3001
  PORTS.ADMIN,     // 3002
  PORTS.WEBSOCKET  // 3003
];

console.log('🔄 正在清理端口占用...');

// Windows系统的端口清理函数
function killPortWindows(port) {
  return new Promise((resolve, reject) => {
    // 查找占用端口的进程
    exec(`netstat -ano | findstr :${port}`, (error, stdout, stderr) => {
      if (error || !stdout) {
        console.log(`✅ 端口 ${port} 未被占用`);
        resolve();
        return;
      }

      // 提取PID
      const lines = stdout.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') {
            pids.add(pid);
          }
        }
      });

      if (pids.size === 0) {
        console.log(`✅ 端口 ${port} 未被占用`);
        resolve();
        return;
      }

      // 杀死所有相关进程
      let killedCount = 0;
      const totalPids = pids.size;

      pids.forEach(pid => {
        exec(`taskkill /PID ${pid} /F`, (killError, killStdout, killStderr) => {
          killedCount++;
          
          if (killError) {
            console.log(`⚠️  无法杀死进程 ${pid} (端口 ${port}): ${killError.message}`);
          } else {
            console.log(`✅ 已杀死进程 ${pid} (端口 ${port})`);
          }

          if (killedCount === totalPids) {
            resolve();
          }
        });
      });
    });
  });
}

// Unix/Linux/Mac系统的端口清理函数
function killPortUnix(port) {
  return new Promise((resolve, reject) => {
    exec(`lsof -ti:${port}`, (error, stdout, stderr) => {
      if (error || !stdout) {
        console.log(`✅ 端口 ${port} 未被占用`);
        resolve();
        return;
      }

      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        console.log(`✅ 端口 ${port} 未被占用`);
        resolve();
        return;
      }

      // 杀死所有相关进程
      let killedCount = 0;
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killError) => {
          killedCount++;
          
          if (killError) {
            console.log(`⚠️  无法杀死进程 ${pid} (端口 ${port}): ${killError.message}`);
          } else {
            console.log(`✅ 已杀死进程 ${pid} (端口 ${port})`);
          }

          if (killedCount === pids.length) {
            resolve();
          }
        });
      });
    });
  });
}

// 检测操作系统并选择合适的清理函数
const isWindows = process.platform === 'win32';
const killPort = isWindows ? killPortWindows : killPortUnix;

// 清理所有端口
async function killAllPorts() {
  console.log(`🎯 清理端口: ${portsToKill.join(', ')}`);
  console.log(`💻 操作系统: ${isWindows ? 'Windows' : 'Unix/Linux/Mac'}`);
  
  try {
    for (const port of portsToKill) {
      await killPort(port);
    }
    
    console.log('');
    console.log('🎉 端口清理完成！');
    console.log('');
    console.log('📋 端口分配:');
    console.log(`   前端应用: http://localhost:${PORTS.FRONTEND}`);
    console.log(`   后端API:  http://localhost:${PORTS.BACKEND}`);
    console.log(`   管理后台: http://localhost:${PORTS.ADMIN}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ 端口清理失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  killAllPorts();
}

module.exports = { killAllPorts, killPort };