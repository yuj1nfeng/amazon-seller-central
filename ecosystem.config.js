module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'npm',
      args: 'start',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'frontend',
      script: 'serve',
      args: '-s frontend/dist -p 3000',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: 'admin',
      script: 'serve',
      args: '-s backend-admin/dist -p 3002',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
