/**
 * 完整域名服务器 - 按用户要求配置
 * Complete Domain Server - User Requirements
 * 
 * 域名配置要求：
 * - 前端: 必须 HTTPS (https://sellercentral.amazon.com)
 * - 管理后台: HTTP + HTTPS (http://admin.sellercentral.amazon.com + https://admin.sellercentral.amazon.com)
 * - 后端: 保持 localhost:3001 (不配置域名)
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

const moduleSearchPaths = [
  process.cwd(),
  path.join(process.cwd(), 'node_modules'),
  path.join(process.cwd(), 'backend', 'node_modules'),
  path.join(process.cwd(), 'backend-admin', 'node_modules'),
  path.join(process.cwd(), 'frontend', 'node_modules'),
  path.join(process.cwd(), 'tools', 'node_modules'),
  path.join(process.cwd(), 'app', 'node_modules'),
  path.join(process.cwd(), 'app', 'backend', 'node_modules'),
  path.join(process.cwd(), 'app', 'backend-admin', 'node_modules'),
  path.join(process.cwd(), 'app', 'frontend', 'node_modules'),
];

const safeRequire = (name) => {
  try {
    return require(name);
  } catch (err) {
    for (const base of moduleSearchPaths) {
      try {
        const candidate = path.join(base, name);
        return require(candidate);
      } catch (e) {
        // continue
      }
    }
    return null;
  }
};

const INSTALL_MAP = {
  express: '^4.18.2',
  'http-proxy-middleware': '^3.0.5',
  'node-forge': '^1.3.3',
};

const attemptedInstalls = new Set();

const canRunNpm = () => {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCmd, ['--version'], { stdio: 'ignore' });
  return result.status === 0;
};

const installPackages = (packages) => {
  if (!packages.length) return true;
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  console.log(`[INFO] Installing missing packages: ${packages.join(', ')}`);
  const result = spawnSync(
    npmCmd,
    ['install', '--no-audit', '--no-fund', ...packages],
    { stdio: 'inherit', cwd: process.cwd() }
  );
  return result.status === 0;
};

const ensureModule = (name) => {
  let mod = safeRequire(name);
  if (mod) return mod;
  if (attemptedInstalls.has(name)) return null;
  attemptedInstalls.add(name);
  if (!canRunNpm()) {
    console.log(`[WARN] npm not available, skip auto-install for ${name}`);
    return null;
  }
  const pkg = INSTALL_MAP[name] ? `${name}@${INSTALL_MAP[name]}` : name;
  const ok = installPackages([pkg]);
  if (!ok) {
    console.log(`[WARN] Failed to install ${name}`);
    return null;
  }
  return safeRequire(name);
};

const express = ensureModule('express');

const createFallbackProxy = (options) => {
  const target = new URL(options.target);
  return (req, res, next) => {
    const requestUrl = new URL(req.originalUrl || req.url || '/', options.target);
    const isHttps = requestUrl.protocol === 'https:';
    const proxy = isHttps ? https : http;
    const headers = { ...req.headers };
    if (options.changeOrigin) {
      headers.host = requestUrl.host;
    }
    const requestOptions = {
      protocol: requestUrl.protocol,
      hostname: requestUrl.hostname,
      port: requestUrl.port || (isHttps ? 443 : 80),
      method: req.method,
      path: requestUrl.pathname + requestUrl.search,
      headers,
    };
    const proxyReq = proxy.request(requestOptions, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', (err) => {
      if (typeof options.onError === 'function') {
        options.onError(err, req, res);
        return;
      }
      res.statusCode = 500;
      res.end(`Proxy error: ${err.message}`);
    });
    if (req.readable) {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
  };
};

class CompleteDomainServer {
  constructor() {
    this.backendProcess = null;
    this.domainHttpServer = null;
    this.domainHttpsServer = null;
    this.isRunning = false;
  }

  // 生成SSL证书
  async generateSSLCertificate() {
    console.log('🔐 生成SSL证书...');
    
    try {
      const forge = ensureModule('node-forge');
      if (!forge) {
        throw new Error('node-forge module not found');
      }
      const pki = forge.pki;

      // 生成密钥对
      const keys = pki.rsa.generateKeyPair(2048);
      
      // 创建证书
      const cert = pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

      const attrs = [{
        name: 'commonName',
        value: 'sellercentral.amazon.com'
      }, {
        name: 'countryName',
        value: 'US'
      }, {
        shortName: 'ST',
        value: 'California'
      }, {
        name: 'localityName',
        value: 'San Francisco'
      }, {
        name: 'organizationName',
        value: 'Amazon Seller Central Clone'
      }, {
        shortName: 'OU',
        value: 'Development'
      }];

      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      
      // 添加扩展
      cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
      }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
      }, {
        name: 'subjectAltName',
        altNames: [{
          type: 2, // DNS
          value: 'sellercentral.amazon.com'
        }, {
          type: 2, // DNS
          value: 'admin.sellercentral.amazon.com'
        }, {
          type: 2, // DNS
          value: 'api.sellercentral.amazon.com'
        }]
      }]);

      // 签名证书
      cert.sign(keys.privateKey);

      // 转换为PEM格式
      const certPem = pki.certificateToPem(cert);
      const keyPem = pki.privateKeyToPem(keys.privateKey);

      // 确保certs目录存在
      const certsDir = path.join(process.cwd(), 'certs');
      if (!fs.existsSync(certsDir)) {
        fs.mkdirSync(certsDir, { recursive: true });
      }

      // 保存证书文件
      fs.writeFileSync(path.join(certsDir, 'cert.pem'), certPem);
      fs.writeFileSync(path.join(certsDir, 'key.pem'), keyPem);

      console.log('✅ SSL证书生成完成');
      
      return {
        cert: certPem,
        key: keyPem
      };
    } catch (error) {
      console.error('❌ SSL证书生成失败:', error.message);
      throw error;
    }
  }

  // 启动后端API服务 (3001端口 - 保持localhost)
  async startBackendAPI() {
    console.log('🚀 启动后端API服务 (端口3001)...');
    
    const backendPath = fs.existsSync('./app/backend') ? './app/backend' : './backend';
    
    this.backendProcess = spawn('npm', ['start'], {
      cwd: backendPath,
      stdio: 'inherit',
      shell: true
    });

    // 等待后端启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ 后端API服务启动完成 (localhost:3001)');
  }

  // 启动HTTP域名服务 (80端口) - 管理后台HTTP + 前端重定向到HTTPS
  async startHTTPDomainService() {
    console.log('🚀 启动HTTP域名服务 (端口80)...');
    
    try {
      if (!express) {
        throw new Error('express module not found');
      }
      const app = express();
      const proxyLib = ensureModule('http-proxy-middleware');
      const createProxyMiddleware = proxyLib?.createProxyMiddleware || createFallbackProxy;
      
      const adminPath = fs.existsSync('./app/backend-admin/dist') ? './app/backend-admin/dist' :
                       fs.existsSync('./app/backend-admin') ? './app/backend-admin' :
                       fs.existsSync('./backend-admin/dist') ? './backend-admin/dist' : './backend-admin';

      console.log(`📁 管理后台路径: ${adminPath}`);

      // 检查路径是否存在
      if (!fs.existsSync(adminPath)) {
        throw new Error(`管理后台路径不存在: ${adminPath}`);
      }

      // API代理中间件 - 将/api请求转发到后端服务器 (localhost:3001)
      const apiProxy = createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.error('API代理错误:', err.message);
          res.status(500).json({ error: 'API代理错误', message: err.message });
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[API代理] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
        }
      });

      // 管理后台域名的API代理 (admin.sellercentral.amazon.com) - 必须在静态文件之前
      app.use('/api', (req, res, next) => {
        if (req.get('host') === 'admin.sellercentral.amazon.com') {
          console.log(`处理管理后台HTTP API请求: ${req.method} ${req.url}`);
          apiProxy(req, res, next);
        } else {
          next();
        }
      });

      // 前端域名 - 重定向到HTTPS
      app.use((req, res, next) => {
        if (req.get('host') === 'sellercentral.amazon.com') {
          console.log(`前端HTTP请求重定向到HTTPS: ${req.method} ${req.url}`);
          return res.redirect(301, `https://sellercentral.amazon.com${req.url}`);
        } else {
          next();
        }
      });

      // 管理后台域名路由 (admin.sellercentral.amazon.com) - 支持HTTP访问
      app.use((req, res, next) => {
        if (req.get('host') === 'admin.sellercentral.amazon.com') {
          console.log(`处理管理后台HTTP请求: ${req.method} ${req.url}`);
          // 管理后台静态文件服务
          express.static(adminPath)(req, res, next);
        } else {
          next();
        }
      });

      // 管理后台SPA路由支持
      app.get('*', (req, res, next) => {
        if (req.get('host') === 'admin.sellercentral.amazon.com') {
          console.log(`管理后台HTTP SPA路由: ${req.url}`);
          res.sendFile(path.join(process.cwd(), adminPath, 'index.html'));
        } else {
          res.status(404).send('Not Found');
        }
      });

      console.log('⚠️  注意：端口80需要管理员权限');
      
      return new Promise((resolve, reject) => {
        this.domainHttpServer = app.listen(80, (err) => {
          if (err) {
            console.error('❌ HTTP域名服务启动失败:', err.message);
            if (err.code === 'EACCES') {
              console.error('❌ 权限不足：端口80需要管理员权限');
            } else if (err.code === 'EADDRINUSE') {
              console.error('❌ 端口80已被占用');
            }
            reject(err);
          } else {
            console.log('✅ HTTP域名服务启动完成');
            console.log('🌐 管理后台HTTP: http://admin.sellercentral.amazon.com');
            console.log('🔄 前端HTTP重定向: http://sellercentral.amazon.com -> https://sellercentral.amazon.com');
            resolve();
          }
        });
      });
      
    } catch (error) {
      console.error('❌ HTTP域名服务启动失败:', error.message);
      throw error;
    }
  }

  // 启动HTTPS域名服务 (443端口) - 前端HTTPS + 管理后台HTTPS
  async startHTTPSDomainService() {
    console.log('🚀 启动HTTPS域名服务 (端口443)...');
    
    try {
      // 检查或生成SSL证书
      const certsDir = path.join(process.cwd(), 'certs');
      const certPath = path.join(certsDir, 'cert.pem');
      const keyPath = path.join(certsDir, 'key.pem');
      
      let cert, key;
      
      if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        console.log('📜 使用现有SSL证书...');
        cert = fs.readFileSync(certPath);
        key = fs.readFileSync(keyPath);
      } else {
        console.log('📜 生成新的SSL证书...');
        const sslCert = await this.generateSSLCertificate();
        cert = sslCert.cert;
        key = sslCert.key;
      }

      if (!express) {
        throw new Error('express module not found');
      }
      const app = express();
      const proxyLib = ensureModule('http-proxy-middleware');
      const createProxyMiddleware = proxyLib?.createProxyMiddleware || createFallbackProxy;
      
      const frontendPath = fs.existsSync('./app/frontend/dist') ? './app/frontend/dist' :
                          fs.existsSync('./app/frontend') ? './app/frontend' :
                          fs.existsSync('./frontend/dist') ? './frontend/dist' : './frontend';
      
      const adminPath = fs.existsSync('./app/backend-admin/dist') ? './app/backend-admin/dist' :
                       fs.existsSync('./app/backend-admin') ? './app/backend-admin' :
                       fs.existsSync('./backend-admin/dist') ? './backend-admin/dist' : './backend-admin';

      console.log(`📁 前端路径: ${frontendPath}`);
      console.log(`📁 管理后台路径: ${adminPath}`);

      // 检查路径是否存在
      if (!fs.existsSync(frontendPath)) {
        throw new Error(`前端路径不存在: ${frontendPath}`);
      }
      if (!fs.existsSync(adminPath)) {
        throw new Error(`管理后台路径不存在: ${adminPath}`);
      }

      // API代理中间件 - 将/api请求转发到后端服务器 (localhost:3001)
      const apiProxy = createProxyMiddleware({
        target: 'http://localhost:3001',
        changeOrigin: true,
        logLevel: 'debug',
        onError: (err, req, res) => {
          console.error('API代理错误:', err.message);
          res.status(500).json({ error: 'API代理错误', message: err.message });
        },
        onProxyReq: (proxyReq, req, res) => {
          console.log(`[API代理] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
        }
      });

      // 前端域名的API代理 (sellercentral.amazon.com) - 必须在静态文件之前
      app.use('/api', (req, res, next) => {
        if (req.get('host') === 'sellercentral.amazon.com') {
          console.log(`处理前端HTTPS API请求: ${req.method} ${req.url}`);
          apiProxy(req, res, next);
        } else {
          next();
        }
      });

      // 管理后台域名的API代理 (admin.sellercentral.amazon.com) - 必须在静态文件之前
      app.use('/api', (req, res, next) => {
        if (req.get('host') === 'admin.sellercentral.amazon.com') {
          console.log(`处理管理后台HTTPS API请求: ${req.method} ${req.url}`);
          apiProxy(req, res, next);
        } else {
          next();
        }
      });

      // 管理后台域名路由 (admin.sellercentral.amazon.com) - HTTPS访问
      app.use((req, res, next) => {
        if (req.get('host') === 'admin.sellercentral.amazon.com') {
          console.log(`处理管理后台HTTPS请求: ${req.method} ${req.url}`);
          // 管理后台静态文件服务
          express.static(adminPath)(req, res, next);
        } else {
          next();
        }
      });

      // 管理后台SPA路由支持
      app.get('*', (req, res, next) => {
        if (req.get('host') === 'admin.sellercentral.amazon.com') {
          console.log(`管理后台HTTPS SPA路由: ${req.url}`);
          res.sendFile(path.join(process.cwd(), adminPath, 'index.html'));
        } else {
          next();
        }
      });

      // 前端域名路由 (sellercentral.amazon.com) - HTTPS静态文件服务
      app.use((req, res, next) => {
        if (req.get('host') === 'sellercentral.amazon.com') {
          console.log(`处理前端HTTPS请求: ${req.method} ${req.url}`);
          express.static(frontendPath)(req, res, next);
        } else {
          next();
        }
      });
      
      // 前端SPA路由支持
      app.get('*', (req, res) => {
        if (req.get('host') === 'sellercentral.amazon.com') {
          console.log(`前端HTTPS SPA路由: ${req.url}`);
          res.sendFile(path.join(process.cwd(), frontendPath, 'index.html'));
        } else {
          res.status(404).send('Not Found');
        }
      });

      const httpsOptions = { key, cert };
      
      console.log('⚠️  注意：端口443需要管理员权限');
      
      this.domainHttpsServer = https.createServer(httpsOptions, app).listen(443, () => {
        console.log('✅ HTTPS域名服务启动完成');
        console.log('🔒 前端HTTPS: https://sellercentral.amazon.com');
        console.log('🔒 管理后台HTTPS: https://admin.sellercentral.amazon.com');
        console.log('🔗 后端API: localhost:3001 (无域名)');
        console.log('');
        console.log('💡 HTTPS证书提示:');
        console.log('   - 浏览器会显示"不安全"警告，这是正常的');
        console.log('   - 点击"高级" -> "继续访问"即可');
        console.log('   - 这是自签名证书，仅用于开发测试');
      });
      
    } catch (error) {
      console.error('❌ HTTPS域名服务启动失败:', error.message);
      console.log('💡 将跳过HTTPS模式');
    }
  }

  // 启动所有服务
  async startAll() {
    try {
      console.log('🚀 Amazon Seller Central - 域名服务器 (用户要求版本)');
      console.log('='.repeat(60));
      console.log('');
      console.log('📋 域名配置:');
      console.log('   前端: 必须 HTTPS (https://sellercentral.amazon.com)');
      console.log('   管理后台: HTTP + HTTPS (http/https://admin.sellercentral.amazon.com)');
      console.log('   后端: localhost:3001 (无域名)');
      console.log('');
      console.log('='.repeat(60));
      console.log('');

      // 1. 启动后端API (3001) - 保持localhost
      console.log('📍 步骤 1/3: 启动后端API服务...');
      await this.startBackendAPI();
      
      // 2. 启动HTTP域名服务 (80端口) - 管理后台HTTP + 前端重定向
      console.log('📍 步骤 2/3: 启动HTTP域名服务...');
      try {
        await this.startHTTPDomainService();
      } catch (error) {
        console.error('❌ HTTP域名服务启动失败:', error.message);
        console.log('💡 将继续尝试HTTPS服务');
      }
      
      // 3. 启动HTTPS域名服务 (443端口) - 前端HTTPS + 管理后台HTTPS
      console.log('📍 步骤 3/3: 启动HTTPS域名服务...');
      try {
        await this.startHTTPSDomainService();
      } catch (error) {
        console.error('❌ HTTPS域名服务启动失败:', error.message);
        console.log('💡 将跳过HTTPS模式');
      }
      
      this.isRunning = true;
      
      console.log('');
      console.log('🎉 域名服务器启动完成！');
      console.log('='.repeat(60));
      console.log('');
      console.log('┌────────────────────────────────────────┐');
      console.log('│                                        │');
      console.log('│   Amazon Seller Central 已启动!       │');
      console.log('│                                        │');
      console.log('│   🖥️  前端应用 (必须HTTPS):            │');
      if (this.domainHttpsServer) {
        console.log('│   - HTTPS:    https://sellercentral.amazon.com │');
      }
      console.log('│   - HTTP重定向到HTTPS                   │');
      console.log('│                                        │');
      console.log('│   👨‍💼 管理后台 (HTTP + HTTPS):         │');
      if (this.domainHttpServer) {
        console.log('│   - HTTP:     http://admin.sellercentral.amazon.com │');
      }
      if (this.domainHttpsServer) {
        console.log('│   - HTTPS:    https://admin.sellercentral.amazon.com │');
      }
      console.log('│                                        │');
      console.log('│   🔧 后端API (无域名):                  │');
      console.log('│   - Local:    http://localhost:3001/api │');
      console.log('│                                        │');
      console.log('└────────────────────────────────────────┘');
      console.log('');
      console.log('🔑 默认登录信息:');
      console.log('   前端: admin@example.com / password123 / 123456');
      console.log('   管理后台: admin / admin123');
      console.log('');

      // 自动打开浏览器 - 前端使用HTTPS，管理后台使用HTTP
      setTimeout(() => {
        console.log('🌐 域名服务器启动完成');
        console.log('📝 浏览器将由启动脚本打开');
        // 注释掉自动打开浏览器功能，由启动脚本统一处理
        /*
        const { spawn } = require('child_process');
        if (this.domainHttpsServer) {
          // 前端必须使用HTTPS
          spawn('start', ['https://sellercentral.amazon.com'], { shell: true });
          setTimeout(() => {
            // 管理后台可以使用HTTP
            if (this.domainHttpServer) {
              spawn('start', ['http://admin.sellercentral.amazon.com'], { shell: true });
            } else if (this.domainHttpsServer) {
              spawn('start', ['https://admin.sellercentral.amazon.com'], { shell: true });
            }
          }, 2000);
        } else {
          // 如果HTTPS服务器没启动，使用localhost
          spawn('start', ['http://localhost:3000'], { shell: true });
          setTimeout(() => {
            spawn('start', ['http://localhost:3002'], { shell: true });
          }, 2000);
        }
        */
      }, 1000);

    } catch (error) {
      console.error('❌ 域名服务器启动失败:', error.message);
      console.error('❌ 错误详情:', error.stack);
      await this.stop();
      process.exit(1);
    }
  }

  // 停止所有服务
  async stop() {
    console.log('🛑 正在停止所有服务...');
    
    if (this.domainHttpsServer) {
      this.domainHttpsServer.close();
      this.domainHttpsServer = null;
    }
    
    if (this.domainHttpServer) {
      this.domainHttpServer.close();
      this.domainHttpServer = null;
    }
    
    if (this.backendProcess) {
      this.backendProcess.kill();
      this.backendProcess = null;
    }
    
    this.isRunning = false;
    console.log('✅ 所有服务已停止');
  }
}

// 创建并启动服务器
const server = new CompleteDomainServer();

// 优雅退出处理
process.on('SIGINT', async () => {
  console.log('\n🛑 接收到退出信号...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});

// 启动服务器
if (require.main === module) {
  server.startAll().catch(error => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  });
}

module.exports = CompleteDomainServer;
