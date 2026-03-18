# Amazon Seller Central Clone

高保真度的Amazon Seller Central克隆应用，用于教育和作品展示目的。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动所有服务
npm run start:all
```

访问地址:
- 前端: http://localhost:3000
- 后端API: http://localhost:3001
- 管理后台: http://localhost:3002

## 📋 核心特性

- ✅ 多步骤认证流程
- ✅ 多市场支持(美国、日本、英国、德国)
- ✅ 中英文国际化
- ✅ 响应式设计
- ✅ 实时数据管理
- ✅ 管理后台配置

## 🛠 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Node.js + Express + TypeScript
- **管理**: React + Ant Design
- **状态**: Zustand + TanStack Query

## 📁 项目结构

```
├── frontend/           # 主应用 (3000)
├── backend/           # API服务 (3001)  
├── backend-admin/     # 管理后台 (3002)
├── config/           # 配置文件
└── scripts/          # 启动脚本
```

## 🔧 开发命令

```bash
# 分别启动服务
npm run dev:frontend   # 前端开发服务器
npm run dev:backend    # 后端API服务器  
npm run dev:admin      # 管理后台

# 其他命令
npm run build         # 构建所有项目
npm run seed          # 生成测试数据
```

## 📖 文档

详细文档请查看 `.kiro/steering/` 目录:
- `project-overview.md` - 项目概览
- `development-guide.md` - 开发指南
- `features.md` - 功能详情
- `conventions.md` - 代码规范

## ⚠️ 免责声明

此项目仅用于教育和演示目的，不与Amazon关联，不应用于实际商业运营。# amazon-seller-central
